/**
 * ai-company-framework — multi-company multi-bot Feishu orchestration (host side，
 * 收编自权利人授权的本地飞书桥，已按 P1 更名/迁移).
 *
 * Each active bot owns one long connection. Inbound messages are routed by a
 * persistent registry (bot → company/team → boss or staff target), delivered to
 * the correct durable AgentTeams session (cold-waking staff via
 * `ctx.subagents.followup`), logged two-way, and important events are escalated
 * to the company mirror group.
 *
 * Config files under <dshHome>:
 *   ai-company-feishu-registry.json    — v2 bot/company/group bindings (no secrets)
 *   ai-company-feishu-credentials.json — DPAPI-protected App Secrets
 *   feishu-logs/<co>/<chat>.jsonl      — two-way conversation log
 * Legacy v2 files (feishu-registry.json / feishu-credentials.json) are migrated
 * once to the ai-company- prefixed names and left in place (never deleted).
 *
 * Web routes: /ai-company/feishu/* (primary) + /feishu/* (legacy alias, skipped
 * when a standalone legacy bridge row is present to avoid double registration).
 */
import { readFile, readdir, copyFile, stat } from 'node:fs/promises';
import { statSync, watchFile, unwatchFile } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import * as lark from '@larksuiteoapi/node-sdk';
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { createFeishuTransport, validateCredentials, listChats, createChat, addChatMembers } from './feishu.js';
import { emptyRegistry, loadRegistry, saveRegistry, upsertBot, removeBot, upsertCompanyConfig, bindGroup, activeBots, botById, newBotId, redactRegistry } from './registry.js';
import { storeSecret, readSecret, removeSecret, loadCredentials, saveCredentials } from './credentials.js';
import { resolveRoute, replyTarget, isAllowed } from './routing.js';
import { appendLog } from './logstore.js';
import { createEscalationState, maybeEscalate } from './escalation.js';
import { migrate } from './migrate.js';

const PLUGIN = 'ai-company-framework-feishu';
const RELAY_PREFIX = 'AgentTeams message from member ';
const ROUTE_PREFIX = '/ai-company/feishu';
const LEGACY_ROUTE_PREFIX = '/feishu';

function textOf(message) {
  const blocks = Array.isArray(message?.content) ? message.content : [];
  return blocks
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function truncate(text, max) {
  if (typeof text !== 'string') return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)} …（已截断）`;
}

function sendJson(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}

async function readBody(req) {
  let text = '';
  for await (const chunk of req) text += chunk;
  return text === '' ? {} : JSON.parse(text);
}

export function createBridge(ctx, logger, overrides = {}) {
  const dshHome = overrides.dshHome ?? resolveDshHome();
  const registryPath = overrides.registryPath ?? join(dshHome, 'ai-company-feishu-registry.json');
  const credentialsPath = overrides.credentialsPath ?? join(dshHome, 'ai-company-feishu-credentials.json');
  const legacyPath = overrides.legacyPath ?? join(dshHome, 'feishu-bridge.json');
  const oldRegistryPath = overrides.oldRegistryPath ?? join(dshHome, 'feishu-registry.json');
  const oldCredentialsPath = overrides.oldCredentialsPath ?? join(dshHome, 'feishu-credentials.json');
  const logsDir = overrides.logsDir ?? join(dshHome, 'feishu-logs');

  // ── live state ────────────────────────────────────────────────────────────
  let registry = emptyRegistry();
  const transports = new Map(); // botId -> transport
  const pendingQueue = []; // envelopes awaiting a live parent
  const turnState = new Map(); // sessionId -> { turn, finalText }
  const feishuTurnTargets = new Map(); // `${sessionId}:${turn}` -> { botId, target }
  const pendingBossReply = new Map(); // sessionId -> { botId, target }（飞书老板消息触发的回合，turn/end 时回传最终回复）
  const escalation = createEscalationState();
  const counters = { received: 0, sent: 0, mirrored: 0, queued: 0 };
  const onboardingRuns = new Map(); // runId -> public one-click onboarding state
  const onboardingControllers = new Map(); // runId -> AbortController

  // Live team index (company == AgentTeams team).
  const teamById = new Map(); // teamId -> { id, name, captainSessionId, workspaceRoot, members }
  const teamByCaptain = new Map(); // captainSessionId -> teamId
  const teamByMember = new Map(); // member.id -> teamId
  const labels = new Map(); // sessionId -> readable label

  // ── team / company scan ───────────────────────────────────────────────────
  async function refreshTeams() {
    const workspaceRegistry = ctx.get('workspaceRegistry') ?? ctx.get('workspace');
    const roots = (workspaceRegistry?.list?.() ?? []).map((w) => join(w.path, '.agent-teams'));
    teamById.clear();
    teamByCaptain.clear();
    teamByMember.clear();
    labels.clear();
    for (const root of roots) {
      let dirs;
      try {
        dirs = await readdir(root, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of dirs) {
        if (!entry.isDirectory()) continue;
        const teamFile = join(root, entry.name, 'team.json');
        let team;
        try {
          const data = JSON.parse(await readFile(teamFile, 'utf8'));
          team = data && typeof data === 'object' && data.id ? data : null;
        } catch {
          continue;
        }
        if (team === null) continue;
        const workspaceRoot = join(root, '..');
        let mtime = 0;
        try {
          mtime = statSync(teamFile).mtimeMs;
        } catch {
          /* mtime is best effort */
        }
        const record = {
          id: team.id,
          name: team.name ?? team.id,
          captainSessionId: team.captainSessionId ?? null,
          workspaceRoot,
          mtime,
          members: Array.isArray(team.members) ? team.members : [],
        };
        teamById.set(record.id, record);
        if (record.captainSessionId) {
          teamByCaptain.set(record.captainSessionId, record.id);
          labels.set(record.captainSessionId, '老板');
        }
        for (const member of record.members) {
          if (!member.id) continue;
          teamByMember.set(member.id, record.id);
          labels.set(member.id, member.role ? `${member.name} · ${member.role}` : member.name);
        }
      }
    }
    // Ensure every bound company has a config row (name/teamId resolved live).
    let changed = false;
    // Auto-heal: a boss bot bound to an unknown companyKey (migration timing,
    // manual registry edits) gets rebound to the single live team.
    const liveTeams = [...teamById.values()];
    if (liveTeams.length === 1) {
      for (const bot of Object.values(registry.bots)) {
        if (bot.kind === 'boss' && !teamById.has(bot.companyKey)) {
          bot.companyKey = liveTeams[0].id;
          changed = true;
        }
      }
    }
    for (const bot of Object.values(registry.bots)) {
      const team = teamById.get(bot.companyKey);
      if (team && registry.companies[bot.companyKey] === undefined) {
        upsertCompanyConfig(registry, {
          key: team.id,
          name: team.name,
          teamId: team.id,
          workspaceRoot: team.workspaceRoot,
          escalation: { mirrorWebhook: bot.mirrorWebhook ?? '', rules: [] },
        });
        changed = true;
      }
    }
    if (changed) await saveRegistry(registryPath, registry).catch(() => {});
  }

  function companyOfSession(sessionId) {
    return teamByCaptain.get(sessionId) ?? teamByMember.get(sessionId) ?? null;
  }

  function captainOf(companyKey) {
    const team = teamById.get(companyKey);
    if (!team || !team.captainSessionId) return null;
    return ctx.agents.get(team.captainSessionId) ?? null;
  }

  // ── transports ────────────────────────────────────────────────────────────
  function closeTransport(botId) {
    const t = transports.get(botId);
    if (t) {
      t.close();
      transports.delete(botId);
    }
  }

  async function buildTransport(bot) {
    const appSecret = await readSecret(credentialsPath, bot.appId);
    const transport = createFeishuTransport({
      appId: bot.appId,
      appSecret,
      mirrorWebhook: bot.mirrorWebhook ?? '',
      logger,
      onMessage: (normalized) => handleMessage(bot.id, normalized),
    });
    transports.set(bot.id, transport);
    return transport;
  }

  async function syncTransports() {
    const desired = activeBots(registry);
    for (const bot of desired) {
      if (!transports.has(bot.id)) {
        try {
          await buildTransport(bot);
        } catch (error) {
          logger.warn(`ai-company-feishu: build transport for bot ${bot.id} failed: ${String(error?.message ?? error)}`);
        }
      }
    }
    for (const botId of [...transports.keys()]) {
      if (!registry.bots[botId] || registry.bots[botId].status === 'disabled') {
        closeTransport(botId);
      }
    }
  }

  // ── one-click onboarding / binding ───────────────────────────────────────
  function validateBotTarget({ kind, companyKey, staffMemberId }) {
    if (kind !== 'boss' && kind !== 'staff') throw new Error('kind 仅支持 boss 或 staff');
    const team = teamById.get(companyKey);
    if (!team) throw new Error(`当前会话未关联公司（${companyKey ?? '无'}）。请先创建 AgentTeams 团队`);
    if (kind === 'staff') {
      if (!staffMemberId) throw new Error('员工机器人必须选择 staffMemberId');
      if (!team.members.some((member) => member.id === staffMemberId)) {
        throw new Error(`staffMemberId 不属于公司 ${companyKey}`);
      }
    }
    return team;
  }

  async function bindBot({ appId, appSecret, kind = 'boss', companyKey, staffMemberId, displayName }) {
    const team = validateBotTarget({ kind, companyKey, staffMemberId });
    const existing = Object.values(registry.bots).find((bot) => bot.appId === appId);
    const botId = existing?.id ?? newBotId();
    if (existing) closeTransport(botId);
    await storeSecret(credentialsPath, appId, appSecret);
    const bot = upsertBot(registry, {
      ...(existing ?? {}),
      id: botId,
      kind,
      appId,
      displayName: displayName || `${team.name}${kind === 'boss' ? '助手' : '员工助手'}`,
      companyKey,
      staffMemberId: kind === 'staff' ? staffMemberId : null,
      mirrorWebhook: existing?.mirrorWebhook ?? '',
      status: 'active',
    });
    if (kind === 'boss') {
      upsertCompanyConfig(registry, { key: bot.companyKey, name: team.name, bossBotId: botId });
    } else {
      const company = registry.companies[bot.companyKey] ?? { key: bot.companyKey, name: team.name };
      company.staffBotIds = [...new Set([...(company.staffBotIds ?? []), botId])];
      upsertCompanyConfig(registry, company);
    }
    await saveRegistry(registryPath, registry);
    await syncTransports();
    return bot;
  }

  function publicOnboardingRun(run) {
    return {
      runId: run.runId,
      status: run.status,
      companyKey: run.companyKey,
      kind: run.kind,
      staffMemberId: run.staffMemberId ?? null,
      url: run.url ?? null,
      expiresAt: run.expiresAt ?? null,
      appId: run.appId ?? null,
      botId: run.botId ?? null,
      error: run.error ?? null,
    };
  }

  async function startOnboarding({ kind = 'boss', companyKey, staffMemberId, displayName, allowGroup = false, extraScopes = [] }) {
    const team = validateBotTarget({ kind, companyKey, staffMemberId });
    const runId = randomUUID();
    const controller = new AbortController();
    let readySettled = false;
    let resolveReady;
    let rejectReady;
    const ready = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    const run = {
      runId,
      status: 'starting',
      companyKey,
      kind,
      staffMemberId: kind === 'staff' ? staffMemberId : null,
      displayName: displayName || `${team.name}${kind === 'boss' ? '助手' : '员工助手'}`,
      createdAt: Date.now(),
    };
    onboardingRuns.set(runId, run);
    onboardingControllers.set(runId, controller);

    // 全覆盖权限集：消息收发 + 群管理（群列表/群成员/建群）；allowGroup 追加群@读；extraScopes 可自定义扩展
    const scopes = [
      'im:message.p2p_msg:readonly',
      'im:message:send_as_bot',
      'im:chat:readonly',
      'im:chat.members:read',
      'im:chat:create',
    ];
    if (allowGroup) scopes.push('im:message.group_at_msg:readonly');
    for (const s of extraScopes) {
      if (typeof s === 'string' && s.trim() && !scopes.includes(s.trim())) scopes.push(s.trim());
    }

    void lark.registerApp({
      source: PLUGIN,
      signal: controller.signal,
      createOnly: true,
      appPreset: {
        name: run.displayName.slice(0, 20),
        desc: `${team.name} · DeepSeek Harness AI 助手`.slice(0, 120),
      },
      addons: {
        preset: false,
        scopes: { tenant: scopes },
        events: { items: { tenant: ['im.message.receive_v1'] } },
      },
      onQRCodeReady(info) {
        run.status = 'waiting_confirmation';
        run.url = info.url;
        run.expiresAt = Date.now() + Number(info.expireIn ?? 600) * 1000;
        if (!readySettled) {
          readySettled = true;
          resolveReady();
        }
      },
      onStatusChange(info) {
        run.providerStatus = info.status;
      },
    }).then(async (result) => {
      if (!result?.client_id || !result?.client_secret) throw new Error('飞书未返回完整应用凭据');
      run.status = 'binding';
      run.appId = result.client_id;
      const bot = await bindBot({
        appId: result.client_id,
        appSecret: result.client_secret,
        kind,
        companyKey,
        staffMemberId,
        displayName: run.displayName,
      });
      run.botId = bot.id;
      run.status = 'connected';
      run.completedAt = Date.now();
    }).catch((error) => {
      run.status = 'failed';
      run.error = String(error?.description ?? error?.message ?? error);
      if (!readySettled) {
        readySettled = true;
        rejectReady(error);
      }
    }).finally(() => {
      onboardingControllers.delete(runId);
      const timer = setTimeout(() => onboardingRuns.delete(runId), 30 * 60 * 1000);
      timer.unref?.();
    });

    let timeout;
    try {
      await Promise.race([
        ready,
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('生成飞书确认链接超时')), 15000);
        }),
      ]);
    } catch (error) {
      controller.abort();
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    return publicOnboardingRun(run);
  }

  // ── routing / delivery ────────────────────────────────────────────────────
  function replyToChat(botId, target, text) {
    const bot = botById(registry, botId);
    const transport = transports.get(botId);
    if (!bot || !transport) return;
    counters.sent += 1;
    transport
      .sendText(target.receiveId, target.receiveIdType, truncate(text, 4000))
      .catch((error) => logger.warn(`ai-company-feishu: reply failed: ${String(error?.message ?? error)}`));
  }

  function buildEnvelope(normalized, route) {
    const chatLabel = route.chatType === 'group' ? '群聊' : '私聊';
    const target = replyTarget(route, normalized.senderOpenId);
    let text;
    if (route.kind === 'staff') {
      text = `📱 飞书客户消息（${chatLabel}）\n\n${normalized.text}\n\n【回复】请用 feishu_send 回复客户：receiveId=${target.receiveId}，receiveIdType=${target.receiveIdType}。`;
      // 群聊：附发言者 open_id，供客服跨群/跨私聊归并客户档案
      if (route.chatType === 'group' && normalized.senderOpenId) {
        text += `\n【归并】群内发言者 open_id：${normalized.senderOpenId}`;
      }
    } else {
      text = `📱 飞书消息（${chatLabel}）：${normalized.text}`;
    }
    const message = createUserMessage({
      content: [{ type: 'text', text }],
      source: { kind: 'plugin', plugin: PLUGIN },
    });
    return { message, target, route, botId: route.botId, senderOpenId: normalized.senderOpenId, text: normalized.text };
  }

  async function deliver(envelope) {
    const route = envelope.route;
    if (route.kind === 'staff') {
      const team = teamById.get(route.companyKey);
      if (!team) return { result: 'failed', reason: 'unknown-company' };
      const captain = ctx.agents.get(team.captainSessionId);
      if (!captain) return { result: 'queued', cold: true };
      try {
        await ctx.subagents.followup(captain, route.staffMemberId, [{ type: 'text', text: textOf(envelope.message) }], {
          source: { kind: 'plugin', plugin: PLUGIN },
          signal: new AbortController().signal,
        });
        const cold = ctx.agents.get(route.staffMemberId) === undefined;
        return { result: 'ok', cold };
      } catch (error) {
        return { result: 'failed', reason: String(error?.message ?? error) };
      }
    }
    // boss target
    const team = teamById.get(route.companyKey);
    if (!team) return { result: 'failed', reason: 'unknown-company' };
    const agent = ctx.agents.get(team.captainSessionId);
    if (!agent) {
      pendingQueue.push(envelope);
      if (pendingQueue.length > 50) pendingQueue.shift();
      counters.queued += 1;
      return { result: 'queued', cold: true };
    }
    agent.followup(envelope.message);
    // 记录飞书老板消息触发的回合回传目标（turn/end 时把老板最终回复发回飞书）
    pendingBossReply.set(team.captainSessionId, { botId: envelope.botId, target: envelope.target });
    return { result: 'ok', cold: false };
  }

  async function handleMessage(botId, normalized) {
    if (normalized.senderType === 'app') return; // bot echo anti-loop
    if (normalized.chatType === 'group' && !normalized.mentioned) return; // group must @bot
    const bot = botById(registry, botId);
    if (!bot) return;

    const route = resolveRoute(registry, botId, normalized.chatId, normalized.chatType);
    if (!route) return;

    counters.received += 1;
    await appendLog(logsDir, route.companyKey, normalized.chatId, {
      t: 'rx', botId, chatId: normalized.chatId, chatType: normalized.chatType,
      senderOpenId: normalized.senderOpenId, text: normalized.text, via: route.via,
    });

    if (!isAllowed(route, registry, normalized.senderOpenId)) {
      const target = replyTarget(route, normalized.senderOpenId);
      replyToChat(botId, target, '🔒 你不在本机器人服务白名单内。');
      maybeEscalate(escalation, { rule: 'blocked-user', level: 'info', text: `bot ${botId} 拦截白名单外 open_id` });
      return;
    }
    if (!normalized.text) {
      const target = replyTarget(route, normalized.senderOpenId);
      replyToChat(botId, target, '目前只支持文字消息，请发文字。');
      return;
    }

    const envelope = buildEnvelope(normalized, route);
    const outcome = await deliver(envelope);
    await appendLog(logsDir, route.companyKey, normalized.chatId, {
      t: 'wake', botId, result: outcome.result, cold: outcome.cold ?? false,
      target: route.kind, staffMemberId: route.staffMemberId ?? null,
      sessionId: route.kind === 'staff' ? route.staffMemberId : (teamById.get(route.companyKey)?.captainSessionId ?? null),
    });

    if (outcome.result === 'queued') {
      replyToChat(botId, envelope.target, '✅ 已收到，负责人离线（DSH 桌面端未运行或会话未打开）。消息已暂存，上线后自动处理。');
    } else if (outcome.result === 'failed') {
      replyToChat(botId, envelope.target, `⚠️ 消息投递失败：${outcome.reason}`);
      maybeEscalate(escalation, { rule: 'deliver-fail-3', level: 'critical', text: `bot ${botId} 投递失败：${outcome.reason}` });
    } else if (route.kind === 'boss') {
      replyToChat(botId, envelope.target, '✅ 已收到，老板开工中…（完成后我会把结果发到这里）');
    }
  }

  function flushPending(agent) {
    if (pendingQueue.length === 0) return;
    const keep = [];
    for (const envelope of pendingQueue) {
      const route = envelope.route;
      const deliverable = route.kind === 'staff'
        ? Boolean(teamById.get(route.companyKey) && ctx.agents.get(teamById.get(route.companyKey).captainSessionId))
        : Boolean(teamById.get(route.companyKey) && ctx.agents.get(teamById.get(route.companyKey).captainSessionId));
      if (!deliverable) {
        keep.push(envelope);
        continue;
      }
      void deliver(envelope).then((outcome) => {
        if (outcome.result === 'ok' && route.kind === 'boss') {
          replyToChat(envelope.botId, envelope.target, '✅ 负责人已上线，收到你的消息并开始处理…');
        }
      });
    }
    pendingQueue.length = 0;
    pendingQueue.push(...keep);
  }

  // ── mirror: DSH → Feishu group ────────────────────────────────────────────
  function mirror(companyKey, text) {
    const company = registry.companies[companyKey];
    const webhook = company?.escalation?.mirrorWebhook
      ?? (() => { const b = Object.values(registry.bots).find((x) => x.companyKey === companyKey && x.kind === 'boss'); return b?.mirrorWebhook; })();
    if (!webhook || !text) return;
    counters.mirrored += 1;
    const transport = [...transports.values()].find((t) => t.mirrorConfigured);
    if (transport) {
      transport.sendWebhook(truncate(text, 1200)).catch((error) => logger.warn(`ai-company-feishu: mirror failed: ${String(error?.message ?? error)}`));
    }
  }

  function handleSessionEvent(session, event) {
    try {
      switch (event.type) {
        case 'turn/start': {
          turnState.set(session.id, { turn: event.data.turn, finalText: null });
          break;
        }
        case 'user/message': {
          const message = event.data;
          const source = message?.source ?? {};
          if (source.kind === 'plugin' && source.plugin === PLUGIN) {
            // record the Feishu reply target for this turn (boss auto-reply)
            const t = turnState.get(session.id);
            if (t !== undefined) {
              // target is resolved at delivery time from the envelope; stored on turn end
            }
            break;
          }
          if (source.kind === 'user') {
            const label = labels.get(session.id);
            if (label !== null && label !== undefined) {
              const companyKey = companyOfSession(session.id);
              if (companyKey) mirror(companyKey, `🖥️ 你（桌面端）：${textOf(message)}`);
            }
            break;
          }
          if (source.kind === 'plugin' && source.plugin === 'dsh-agent-teams') {
            const raw = textOf(message);
            const label = labels.get(session.id);
            const companyKey = companyOfSession(session.id);
            if (companyKey) {
              if (label === '老板' && raw.startsWith(RELAY_PREFIX)) {
                const rest = raw.slice(RELAY_PREFIX.length);
                const newline = rest.indexOf('\n');
                const from = (newline === -1 ? rest : rest.slice(0, newline)).replace(/:+$/, '');
                const body = newline === -1 ? '' : rest.slice(newline + 1).trim();
                mirror(companyKey, `📥 ${from} → 老板：${body || '（空消息）'}`);
              } else if (label !== null && label !== undefined && label !== '老板') {
                mirror(companyKey, `📤 老板 → ${label}：${raw}`);
              }
            }
            break;
          }
          break;
        }
        case 'assistant/message': {
          const text = textOf(event.data.message);
          if (!text) break;
          const t = turnState.get(session.id);
          if (t !== undefined) t.finalText = text;
          break;
        }
        case 'turn/end': {
          const t = turnState.get(session.id);
          if (t === undefined) break;
          turnState.delete(session.id);
          // 老板自动回传：飞书消息触发的回合结束时，把老板最终回复发回飞书（含留痕）
          const reply = pendingBossReply.get(session.id);
          if (reply !== undefined) {
            pendingBossReply.delete(session.id);
            if (t.finalText) {
              replyToChat(reply.botId, reply.target, t.finalText);
              appendLog(logsDir, companyOfSession(session.id) ?? 'unknown', reply.target.receiveId, {
                t: 'tx', botId: reply.botId, receiveId: reply.target.receiveId,
                receiveIdType: reply.target.receiveIdType, text: t.finalText, via: 'auto-reply',
              }).catch(() => {});
            }
          }
          break;
        }
        default:
          break;
      }
    } catch (error) {
      logger.warn(`ai-company-feishu: session event handler failed: ${String(error?.message ?? error)}`);
    }
  }

  // ── tools ─────────────────────────────────────────────────────────────────
  function callerBot(exec) {
    const callerId = exec.agent?.session?.id;
    if (!callerId) return null;
    let bot = Object.values(registry.bots).find((b) => b.kind === 'staff' && b.staffMemberId === callerId && b.status !== 'disabled');
    if (!bot) {
      const companyKey = companyOfSession(callerId);
      bot = Object.values(registry.bots).find((b) => b.kind === 'boss' && b.companyKey === companyKey && b.status !== 'disabled');
    }
    return bot ?? null;
  }

  function registerTools() {
    ctx.tools.register(defineTool({
      name: 'feishu_notify',
      description: '把一条公司通知推送到飞书镜像群（用户手机实时可见）。用于里程碑汇报：成片完成、验收请求、交付完成、预算告警等。',
      parameters: {
        text: { type: 'string', required: true, description: '通知正文（简洁，一行标题+要点）' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, error: { type: 'string' } } },
        render: (_args, value) => [{ type: 'text', text: value.ok ? '已推送到飞书群。' : `推送失败：${value.error ?? ''}` }],
      },
      async execute(args, exec) {
        const companyKey = companyOfSession(exec.agent?.session?.id);
        const company = companyKey ? registry.companies[companyKey] : null;
        const webhook = company?.escalation?.mirrorWebhook
          ?? Object.values(registry.bots).find((b) => b.companyKey === companyKey && b.kind === 'boss')?.mirrorWebhook;
        if (!webhook) return { ok: false, error: '当前公司未配置镜像群 webhook' };
        try {
          const transport = [...transports.values()].find((t) => t.mirrorConfigured);
          if (!transport) return { ok: false, error: '没有可用的镜像 transport' };
          await transport.sendWebhook(`🔔 ${truncate(args.text, 1200)}`);
          counters.mirrored += 1;
          return { ok: true };
        } catch (error) {
          return { ok: false, error: String(error?.message ?? error) };
        }
      },
    }));

    ctx.tools.register(defineTool({
      name: 'feishu_status',
      description: '查看飞书桥状态：每个机器人长连接是否在线、路由的公司/员工、统计与最近错误。',
      parameters: {},
      output: {
        schema: { type: 'object', additionalProperties: true, properties: { summary: { type: 'string', required: true } } },
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      async execute() {
        const lines = ['飞书桥状态（多机器人）：'];
        for (const bot of Object.values(registry.bots)) {
          const t = transports.get(bot.id);
          const { state, lastError } = t?.getState() ?? { state: 'idle', lastError: null };
          lines.push(`- ${bot.displayName}（${bot.kind}，${bot.id}）：${state}${lastError ? `（${lastError}）` : ''}`);
        }
        if (Object.keys(registry.bots).length === 0) lines.push('- （暂无机器人，请在向导里绑定或创建）');
        lines.push(`- 统计：收到 ${counters.received} / 发出 ${counters.sent} / 镜像 ${counters.mirrored} / 暂存 ${counters.queued}`);
        lines.push(`- 注册表：${registryPath}`);
        return { summary: lines.join('\n'), bots: Object.keys(registry.bots), counters: { ...counters } };
      },
    }));

    ctx.tools.register(defineTool({
      name: 'feishu_send',
      description: '用飞书机器人给指定接收方（open_id 或 chat_id）直接发一条文字消息。客服场景用；给用户本人发消息优先用 feishu_notify。',
      parameters: {
        receiveId: { type: 'string', required: true, description: '接收方 id（open_id 或 chat_id）' },
        receiveIdType: { type: 'string', description: 'open_id 或 chat_id，默认 open_id' },
        text: { type: 'string', required: true, description: '消息正文' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, error: { type: 'string' } } },
        render: (_args, value) => [{ type: 'text', text: value.ok ? '已发送。' : `发送失败：${value.error ?? ''}` }],
      },
      async execute(args, exec) {
        const bot = callerBot(exec);
        if (!bot) return { ok: false, error: '未找到当前会话绑定的飞书机器人' };
        const transport = transports.get(bot.id);
        if (!transport) return { ok: false, error: `机器人 ${bot.id} 的长连接未就绪` };
        try {
          await transport.sendText(args.receiveId, args.receiveIdType === 'chat_id' ? 'chat_id' : 'open_id', args.text);
          counters.sent += 1;
          const companyKey = companyOfSession(exec.agent?.session?.id) ?? bot.companyKey;
          await appendLog(logsDir, companyKey, args.receiveId, {
            t: 'tx', botId: bot.id, receiveId: args.receiveId, receiveIdType: args.receiveIdType === 'chat_id' ? 'chat_id' : 'open_id', text: args.text, via: 'send',
          });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: String(error?.message ?? error) };
        }
      },
    }));

    ctx.tools.register(defineTool({
      name: 'feishu_onboard',
      description: '用飞书官方 registerApp 扫码一键创建并绑定机器人；平台自动预置机器人能力、最小权限、事件与 WebSocket 长连接。action=start 返回一次性确认链接，action=status 查询结果。',
      parameters: {
        action: { type: 'string', description: 'start（默认）或 status' },
        kind: { type: 'string', description: 'boss（默认）或 staff' },
        staffMemberId: { type: 'string', description: 'kind=staff 时必填：AgentTeams member.id' },
        displayName: { type: 'string', description: '机器人显示名' },
        allowGroup: { type: 'boolean', description: '是否同时申请群聊 @机器人权限，默认 false' },
        extraScopes: { type: 'array', items: { type: 'string' }, description: '可选：额外申请的自定义权限 scope 列表（默认已含消息收发+群管理全覆盖权限）' },
        runId: { type: 'string', description: 'action=status 时必填' },
      },
      output: {
        schema: { type: 'object', additionalProperties: true, properties: { summary: { type: 'string', required: true } } },
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      async execute(args, exec) {
        try {
          const companyKey = companyOfSession(exec.agent?.session?.id);
          if (!companyKey) return { summary: '一键创建失败：当前会话未关联 AgentTeams 公司。' };
          if (args.action === 'status') {
            const run = onboardingRuns.get(args.runId);
            if (!run || run.companyKey !== companyKey) return { summary: '未找到该公司的一键创建任务。' };
            const state = publicOnboardingRun(run);
            const detail = state.status === 'connected'
              ? `已创建并绑定：appId=${state.appId}，botId=${state.botId}`
              : state.status === 'failed'
                ? `失败：${state.error}`
                : `当前状态：${state.status}`;
            return { ...state, summary: `飞书一键创建 ${detail}` };
          }
          await refreshTeams();
          const state = await startOnboarding({
            kind: args.kind === 'staff' ? 'staff' : 'boss',
            companyKey,
            staffMemberId: args.staffMemberId,
            displayName: args.displayName,
            allowGroup: args.allowGroup === true,
            extraScopes: Array.isArray(args.extraScopes) ? args.extraScopes : [],
          });
          return {
            ...state,
            summary: `请在链接过期前打开飞书官方确认链接：\n${state.url}\n确认后用 feishu_onboard(action=status, runId=${state.runId}) 查询；App Secret 会自动 DPAPI 加密，不会返回模型。`,
          };
        } catch (error) {
          return { summary: `飞书一键创建失败：${String(error?.description ?? error?.message ?? error)}` };
        }
      },
    }));
  }

  // ── API routes (web surface) ──────────────────────────────────────────────
  function transportsState() {
    const out = {};
    for (const [id, t] of transports) out[id] = t.getState();
    return out;
  }

  /** Scope a redacted registry to one company (per-session view). */
  function scopeRegistry(redacted, companyKey) {
    const base = { schemaVersion: redacted.schemaVersion, updatedAt: redacted.updatedAt, bots: {}, companies: {}, groups: {} };
    if (!companyKey) return base;
    const bots = {};
    for (const [id, bot] of Object.entries(redacted.bots)) {
      if (bot.companyKey === companyKey) bots[id] = bot;
    }
    const botIds = new Set(Object.keys(bots));
    const groups = {};
    for (const [chatId, group] of Object.entries(redacted.groups)) {
      if (botIds.has(group.botId)) groups[chatId] = group;
    }
    const companies = redacted.companies[companyKey] ? { [companyKey]: redacted.companies[companyKey] } : {};
    return { ...base, bots, companies, groups };
  }

  /**
   * 旧 /feishu/* 别名仅在「独立旧飞书桥 row 未装载」时注册，
   * 避免与旧桥重复注册路由；独立桥在场时如实跳过并提示。
   */
  function legacyAliasAllowed() {
    try {
      for (const entry of ctx.loader?.entries?.() ?? []) {
        if (entry?.options?.name === 'dsh-feishu-bridge') return false;
      }
    } catch {
      /* loader unavailable: fall through to require probe */
    }
    try {
      const requireFromHere = createRequire(import.meta.url);
      requireFromHere.resolve('dsh-feishu-bridge/package.json');
      return false;
    } catch {
      return true;
    }
  }

  function registerRoutes() {
    const webServer = ctx.get('webServer') ?? ctx.get('httpServer');
    if (webServer === undefined) return false;

    const exact = (path, handler) => ctx.effect(() => webServer.register({ kind: 'exact', path, handler }), `ai-company-feishu: route ${path}`);
    const allowLegacy = legacyAliasAllowed();
    const register = (suffix, handler) => {
      exact(`${ROUTE_PREFIX}${suffix}`, handler);
      if (allowLegacy) exact(`${LEGACY_ROUTE_PREFIX}${suffix}`, handler);
    };
    if (!allowLegacy) {
      logger.warn('ai-company-feishu: standalone legacy bridge row detected — legacy /feishu/* alias skipped, only /ai-company/feishu/* registered');
    }

    register('/state', async (req, res) => {
      await refreshTeams();
      const url = new URL(req.url, 'http://localhost');
      const sessionId = url.searchParams.get('sessionId') || undefined;
      const companyKey = sessionId ? companyOfSession(sessionId) : undefined;
      // Fail-closed: without a known session→company mapping, serve an empty
      // scoped view so no cross-company data leaks to the web surface.
      const teams = companyKey && teamById.has(companyKey)
        ? [teamById.get(companyKey)]
        : [];
      sendJson(res, 200, {
        registry: scopeRegistry(redactRegistry(registry, transportsState()), companyKey),
        sessionCompanyKey: companyKey ?? null,
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          captainSessionId: t.captainSessionId,
          workspaceRoot: t.workspaceRoot,
          memberCount: t.members.length,
          members: t.members.map((member) => ({ id: member.id, name: member.name, role: member.role ?? '' })),
        })),
        counters,
      });
    });

    register('/wizard/existing', async (req, res) => {
      try {
        const body = await readBody(req);
        const { appId, appSecret, kind = 'boss', companyKey, staffMemberId, displayName } = body;
        if (!appId || !appSecret) return sendJson(res, 400, { ok: false, error: 'appId 和 appSecret 必填' });
        if (!companyKey || !teamById.has(companyKey)) return sendJson(res, 400, { ok: false, error: `当前会话未关联公司（${companyKey ?? '无'}）。请先在该会话用 agent_teams_create 创建公司团队` });
        const validation = await validateCredentials(appId, appSecret);
        if (!validation.ok) return sendJson(res, 400, { ok: false, error: `凭据校验失败：${validation.message ?? validation.code}` });
        const bot = await bindBot({ appId, appSecret, kind, companyKey, staffMemberId, displayName });
        sendJson(res, 200, { ok: true, botId: bot.id });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    });

    register('/wizard/scan', async (req, res) => {
      try {
        if (req.method === 'GET') {
          const url = new URL(req.url, 'http://localhost');
          const run = onboardingRuns.get(url.searchParams.get('runId'));
          if (!run) return sendJson(res, 404, { ok: false, error: 'onboarding run not found' });
          return sendJson(res, 200, { ok: true, ...publicOnboardingRun(run) });
        }
        const body = await readBody(req);
        await refreshTeams();
        const run = await startOnboarding({
          kind: body.kind === 'staff' ? 'staff' : 'boss',
          companyKey: body.companyKey,
          staffMemberId: body.staffMemberId,
          displayName: body.displayName,
          allowGroup: body.allowGroup === true,
          extraScopes: Array.isArray(body.extraScopes) ? body.extraScopes : [],
        });
        sendJson(res, 200, { ok: true, ...run });
      } catch (error) {
        sendJson(res, 400, { ok: false, error: String(error?.description ?? error?.message ?? error) });
      }
    });

    register('/company/bind', async (req, res) => {
      try {
        const body = await readBody(req);
        const { key, name, mirrorWebhook } = body;
        if (!key) return sendJson(res, 400, { ok: false, error: 'company key 必填' });
        const prev = registry.companies[key] ?? { key, name: key };
        const company = upsertCompanyConfig(registry, {
          key,
          name: name ?? prev.name,
          teamId: key,
          escalation: { mirrorWebhook: mirrorWebhook ?? prev.escalation?.mirrorWebhook ?? '', rules: [] },
        });
        await saveRegistry(registryPath, registry);
        sendJson(res, 200, { ok: true, company });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    });

    register('/group/bind', async (req, res) => {
      try {
        const body = await readBody(req);
        const { chatId, botId, target, allowUsers, mode = 'command' } = body;
        if (!chatId || !botId) return sendJson(res, 400, { ok: false, error: 'chatId 和 botId 必填' });
        bindGroup(registry, { chatId, botId, target: target ?? { kind: 'boss', companyKey: registry.bots[botId]?.companyKey ?? 'default', staffMemberId: null }, allowUsers: allowUsers ?? [], mode });
        await saveRegistry(registryPath, registry);
        sendJson(res, 200, { ok: true });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    });

    register('/group/list', async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        const botId = url.searchParams.get('botId');
        const bot = botId ? botById(registry, botId) : Object.values(registry.bots).find((b) => b.kind === 'boss' && b.status !== 'disabled');
        const transport = bot ? transports.get(bot.id) : null;
        if (!bot || !transport) return sendJson(res, 400, { ok: false, error: '未找到在线的机器人' });
        const chats = await listChats(transport);
        sendJson(res, 200, { ok: true, chats });
      } catch (error) {
        // 权限/API 失败时返回明确错误（不再裸 500）：提示需要 im:chat 读权限或重新授权
        const msg = String(error?.message ?? error);
        const hint = /permission|scope|auth|forbidden|denied/i.test(msg)
          ? '（机器人缺少 im:chat 读群权限，请删除机器人后重新用 feishu_onboard 一键创建授权）'
          : '';
        logger.warn(`ai-company-feishu: group/list failed: ${msg}`);
        sendJson(res, 200, { ok: false, error: `群列表获取失败：${msg}${hint}` });
      }
    });

    register('/group/create', async (req, res) => {
      try {
        const body = await readBody(req);
        const { botId, name, memberIds = [] } = body;
        const bot = botId ? botById(registry, botId) : Object.values(registry.bots).find((b) => b.kind === 'boss' && b.status !== 'disabled');
        const transport = bot ? transports.get(bot.id) : null;
        if (!bot || !transport) return sendJson(res, 400, { ok: false, error: '未找到在线的机器人' });
        const chatId = await createChat(transport, name || '客户群');
        if (memberIds.length > 0) await addChatMembers(transport, chatId, memberIds, 'open_id');
        sendJson(res, 200, { ok: true, chatId });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    });

    register('/bot/enable', async (req, res) => {
      try {
        const body = await readBody(req);
        const { botId, status } = body;
        const bot = botById(registry, botId);
        if (!bot) return sendJson(res, 404, { ok: false, error: 'bot not found' });
        bot.status = status === 'disabled' ? 'disabled' : 'active';
        upsertBot(registry, bot);
        await saveRegistry(registryPath, registry);
        await syncTransports();
        sendJson(res, 200, { ok: true });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    });

    register('/bot/delete', async (req, res) => {
      try {
        const body = await readBody(req);
        const { botId } = body;
        const bot = botById(registry, botId);
        if (!bot) return sendJson(res, 404, { ok: false, error: 'bot not found' });
        closeTransport(botId);
        await removeSecret(credentialsPath, bot.appId).catch(() => {});
        removeBot(registry, botId);
        await saveRegistry(registryPath, registry);
        sendJson(res, 200, { ok: true });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    });

    register('/logs', async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        const company = url.searchParams.get('company');
        const chatId = url.searchParams.get('chatId');
        const limit = Number(url.searchParams.get('limit') ?? 200);
        if (!company || !chatId) return sendJson(res, 400, { ok: false, error: 'company 和 chatId 必填' });
        const file = join(logsDir, company.replace(/[^A-Za-z0-9_-]+/g, '_'), `${chatId.replace(/[^A-Za-z0-9_-]+/g, '_')}.jsonl`);
        let lines = [];
        try {
          const raw = await readFile(file, 'utf8');
          lines = raw.split('\n').filter(Boolean).slice(-limit).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        } catch {
          /* no log yet */
        }
        sendJson(res, 200, { ok: true, lines });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    });

    return true;
  }

  // ── wiring ────────────────────────────────────────────────────────────────
  ctx.on('session/event', (session, event) => handleSessionEvent(session, event));
  ctx.on('agent/created', (payload) => flushPending(payload.agent));

  const teamTimer = setInterval(() => {
    refreshTeams().catch(() => {
      /* next tick retries */
    });
  }, 10000);

  ctx.on('dispose', () => {
    clearInterval(teamTimer);
    for (const controller of onboardingControllers.values()) controller.abort();
    onboardingControllers.clear();
    for (const t of transports.values()) t.close();
    try {
      unwatchFile(registryPath);
    } catch {
      /* not watched */
    }
  });

  registerTools();

  ctx.systemPrompt.section({
    name: 'ai-company-framework-feishu:usage',
    order: 118,
    text: '飞书桥已接入（多公司多机器人）：老板可能收到以「📱 飞书消息」开头的消息——这是用户从手机飞书发来的指令，正常接单开工，本轮最终回复自动回传飞书。客服等员工机器人收到的客户消息会直接进入对应员工会话，员工用 feishu_send 回复客户。里程碑节点用 feishu_notify 推送到公司镜像群。feishu_status 查桥状态。不要向用户解释桥的实现细节。',
  });

  // ── startup ────────────────────────────────────────────────────────────────
  let routeRegistered = false;
  void (async () => {
    try {
      await refreshTeams();
      const migrated = await migrate({
        registryPath,
        credentialsPath,
        legacyPath,
        company: (() => {
          const teams = [...teamById.values()];
          if (teams.length === 0) return null;
          // Prefer the team whose captain matches the legacy bossSessionId, else newest team.json mtime.
          const legacy = (() => { try { return JSON.parse(readFile(legacyPath, 'utf8')); } catch { return null; } })();
          const byBoss = legacy?.bossSessionId ? teams.find((t) => t.captainSessionId === legacy.bossSessionId) : null;
          const newest = byBoss ?? teams.reduce((a, b) => (b.mtime > a.mtime ? b : a), teams[0]);
          return { key: newest.id, name: newest.name, teamId: newest.id, workspaceRoot: newest.workspaceRoot, captainSessionId: newest.captainSessionId };
        })(),
      });

      // 旧 v2 文件名迁移：新名优先；新名缺失而旧名存在时拷贝内容（不删除旧文件）。
      async function exists(path) {
        try {
          await stat(path);
          return true;
        } catch {
          return false;
        }
      }
      let migratedNames = false;
      if (!(await exists(registryPath)) && (await exists(oldRegistryPath))) {
        await saveRegistry(registryPath, await loadRegistry(oldRegistryPath));
        migratedNames = true;
      }
      if (!(await exists(credentialsPath)) && (await exists(oldCredentialsPath))) {
        await saveCredentials(credentialsPath, await loadCredentials(oldCredentialsPath));
        migratedNames = true;
      }
      // copyFile 兜底：新名缺失且 load 语义不适用（如损坏 JSON）时原样拷贝。
      if (!migratedNames) {
        for (const [from, to] of [[oldRegistryPath, registryPath], [oldCredentialsPath, credentialsPath]]) {
          if (!(await exists(to)) && (await exists(from))) {
            try {
              await copyFile(from, to);
              migratedNames = true;
            } catch {
              /* copy is best effort */
            }
          }
        }
      }

      registry = await loadRegistry(registryPath);
      await refreshTeams();
      await syncTransports();
      routeRegistered = registerRoutes();
      ctx.on('internal/service', (serviceName) => {
        if (!routeRegistered && (serviceName === 'webServer' || serviceName === 'httpServer')) {
          routeRegistered = registerRoutes();
        }
      });
      watchFile(registryPath, { interval: 10000 }, async () => {
        const before = JSON.stringify(registry);
        try {
          registry = await loadRegistry(registryPath);
        } catch {
          return;
        }
        if (JSON.stringify(registry) !== before) {
          await syncTransports();
        }
      });
      logger.info(`ai-company-feishu: started (bots=${Object.keys(registry.bots).length}, migrated=${migrated}, namesMigrated=${migratedNames})`);
    } catch (error) {
      logger.error(`ai-company-feishu: startup failed: ${String(error?.message ?? error)}`);
    }
  })();

  return { handleMessage, companyOfSession };
}
