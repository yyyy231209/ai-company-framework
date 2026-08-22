/**
 * ai-company-framework — employee sidebar host half（收编自权利人授权的本地侧栏包，
 * 已按 P1 收编改造：移除专用自动化工具、路由/持久化文件/日志更名，保留无损改配核心机制）。
 *
 * Routes:
 *   GET  /ai-company/sidebar/state        团队名单 + 模型目录 + 路由覆盖 + 能力探测
 *                                         ?sessionId=<当前会话> — 会话公司隔离：只返回该会话
 *                                         captain 的团队；无 sessionId 时 fail-closed 空视图。
 *   POST /ai-company/sidebar/reconfigure  { sessionId, childSessionId, provider, model? } — 设置覆盖
 *                                         { sessionId, childSessionId } 单独提交 = 重置为描述符路由
 *                                         sessionId 必填；childSessionId 必须属于该会话团队，
 *                                         否则 403（跨会话/跨公司改配一律拒绝）。
 *
 * 无损改配机制（与普通 session.model 切换一致）：
 *   1. `registerContinuableSetup` 在每个 continuable 子 Agent 激活时（新建+冷唤醒）
 *      安装 `installModelSelection`，使每个成员拥有普通会话同样的逐 Agent 模型选择层。
 *   2. 选择层 getter 读取本插件持久化覆盖文件（<dshHome>/ai-company-routes.json，
 *      兼容迁移旧 manju-studio-routes.json）；无覆盖 => 透传描述符路由。
 *   3. 对 LIVE 子 Agent 同时改写 agent.options.provider/model，下一次请求即生效。
 *   历史不动：同一 session id、同一 transcript，只换路由。
 */
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { installModelSelection } from '@deepseek-ai/dsh-agent';
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths';

export const name = 'ai-company-framework-sidebar';
export const inject = ['tools'];

/** Web-server service key candidates, newest first (same convention as dsh-agent-teams). */
const WEB_SERVER_KEYS = ['webServer', 'httpServer'];
/** Workspace registry service key candidates, newest first. */
const WORKSPACE_KEYS = ['workspaceRegistry', 'workspace'];

/** childSessionId -> { provider, model, reasoningEffort?, previous?, updatedAt } */
const overrides = new Map();
const childSelections = new WeakMap();
let storePath = null;
let storeMigrated = false;

const requireFromHere = createRequire(import.meta.url);

/**
 * 持久化文件：<dshHome>/ai-company-routes.json（主）。
 * 兼容迁移：旧 manju-studio-routes.json 存在且新文件不存在时，拷贝内容后删除旧文件。
 */
async function storeFile() {
  if (storePath !== null) return storePath;
  const home = resolveDshHome();
  const next = join(home, 'ai-company-routes.json');
  if (!storeMigrated) {
    storeMigrated = true;
    const legacy = join(home, 'manju-studio-routes.json');
    try {
      await readFile(next, 'utf8');
    } catch {
      try {
        const old = await readFile(legacy, 'utf8');
        await mkdir(home, { recursive: true });
        await writeFile(next, old, 'utf8');
        await unlink(legacy).catch(() => {});
      } catch {
        /* no legacy file */
      }
    }
  }
  storePath = next;
  return storePath;
}

async function loadOverrides() {
  try {
    const text = await readFile(await storeFile(), 'utf8');
    const parsed = JSON.parse(text);
    overrides.clear();
    for (const [id, value] of Object.entries(parsed)) {
      if (value && typeof value === 'object' && typeof value.provider === 'string' && typeof value.model === 'string') {
        overrides.set(id, value);
      }
    }
  } catch {
    /* first run / no file yet */
  }
}

async function saveOverrides() {
  const file = await storeFile();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(Object.fromEntries(overrides), null, 2), 'utf8');
  await rename(tmp, file);
}

/** The per-child model selection layer installed on every activation. */
function selectionForChild(childCtx) {
  let selection = childSelections.get(childCtx);
  if (selection !== undefined) return selection;
  selection = {
    get current() {
      const id = childCtx.agent?.id;
      if (id === undefined) return undefined;
      const override = overrides.get(id);
      if (override === undefined) return undefined;
      return {
        provider: override.provider,
        model: override.model,
        ...(override.reasoningEffort === undefined ? {} : { reasoningEffort: override.reasoningEffort }),
      };
    },
    set current(_next) { /* writes go through the reconfigure route */ },
    assembled: undefined,
  };
  childSelections.set(childCtx, selection);
  return selection;
}

/** One team state file may not exist while a team is mid-creation; treat as absent. */
async function tryReadTeam(teamFile) {
  try {
    const text = await readFile(teamFile, 'utf8');
    const data = JSON.parse(text);
    return data && typeof data === 'object' && data.id ? data : null;
  } catch {
    return null;
  }
}

/**
 * 能力探测：AgentTeams（团队活动栏）是公开依赖、独立 Cordis row。
 * 单下载后若其未解析，这里如实报告缺失与版本，客户端据此引导/降级，绝不冒充已内置。
 */
function probeAgentTeams() {
  try {
    const pkgPath = requireFromHere.resolve('@nanmicoder/dsh-agent-teams/package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return { present: true, version: pkg.version ?? 'unknown' };
  } catch {
    return { present: false, version: null };
  }
}

/** Best-effort scan of every workspace's .agent-teams directory. */
async function collectSidebarState(ctx) {
  const workspaceRegistry = (ctx.get(WORKSPACE_KEYS[0]) ?? ctx.get(WORKSPACE_KEYS[1]));
  const roots = workspaceRegistry?.list?.().map((workspace) => join(workspace.path, '.agent-teams')) ?? [];
  const teams = [];
  for (const root of roots) {
    let dirs;
    try {
      dirs = await readdir(root, { withFileTypes: true });
    } catch {
      continue; // no .agent-teams in this workspace yet
    }
    for (const entry of dirs) {
      if (!entry.isDirectory()) continue;
      const team = await tryReadTeam(join(root, entry.name, 'team.json'));
      if (team === null) continue;
      teams.push({
        id: team.id ?? entry.name,
        name: team.name ?? entry.name,
        captainSessionId: team.captainSessionId ?? null,
        members: Array.isArray(team.members)
          ? team.members.map((member) => {
              const override = overrides.get(member.id);
              return {
                id: member.id,
                name: member.name,
                role: member.role,
                provider: override?.provider ?? member.provider ?? null,
                model: override?.model ?? member.model ?? null,
                reasoningEffort: member.reasoningEffort ?? null,
                status: member.status ?? null,
                routeOverride: override !== undefined,
              };
            })
          : [],
        tasks: Array.isArray(team.tasks) ? team.tasks.length : 0,
      });
    }
  }
  return teams;
}

/** Best-effort model catalog for the reconfigure selector (host-side, no RPC). */
async function modelCatalog(ctx) {
  try {
    const llm = ctx.get('llm');
    if (llm === undefined) return { groups: [], failures: [{ id: 'llm', message: 'llm service unavailable' }] };
    const groups = [];
    const failures = [];
    for (const provider of llm.listProviders()) {
      try {
        const models = await llm.listModels(provider.id);
        const entries = (Array.isArray(models) ? models : []).map((m) => ({ id: m.id, name: m.name ?? '' }));
        if (entries.length > 0) {
          groups.push({ id: provider.id, name: provider.name ?? provider.id, models: entries });
        }
      } catch (error) {
        failures.push({ id: provider.id, message: String(error?.message ?? error) });
      }
    }
    return { groups, failures };
  } catch (error) {
    return { groups: [], failures: [{ id: 'all', message: String(error?.message ?? error) }] };
  }
}

/** Read one request body (the webServer handler gets a raw IncomingMessage). */
async function readBody(req) {
  let text = '';
  for await (const chunk of req) text += chunk;
  return text === '' ? {} : JSON.parse(text);
}

function sendJson(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
}

export function apply(ctx) {
  // Overrides load asynchronously; every consumer tolerates a briefly-empty map.
  void loadOverrides();

  let webRegistered = false;
  let childSetupRegistered = false;
  const registerChildSetup = () => {
    if (childSetupRegistered) return;
    const subagents = ctx.get('subagents');
    if (subagents === undefined) return;
    childSetupRegistered = true;
    subagents.registerContinuableSetup((childCtx) => installModelSelection(childCtx, selectionForChild(childCtx)));
    ctx.logger.info('ai-company-framework-sidebar: continuable model-selection layer installed');
  };
  const registerWebSurface = () => {
    if (webRegistered) return;
    const webServer = (ctx.get(WEB_SERVER_KEYS[0]) ?? ctx.get(WEB_SERVER_KEYS[1]));
    if (webServer === undefined) return;
    webRegistered = true;
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: '/ai-company/sidebar/state',
      handler: async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          const sessionId = url.searchParams.get('sessionId') || undefined;
          const [allTeams, models] = await Promise.all([collectSidebarState(ctx), modelCatalog(ctx)]);
          // 会话公司隔离（对齐 feishu/state）：只返回当前会话 captain 的团队；
          // 无 sessionId 时 fail-closed 空视图，绝不跨会话/跨工作区泄露团队与成员路由。
          const teams = sessionId ? allTeams.filter((t) => t.captainSessionId === sessionId) : [];
          sendJson(res, 200, {
            teams,
            models,
            sessionId: sessionId ?? null,
            capabilities: { agentTeams: probeAgentTeams(), sidebar: 'builtin' },
          });
        } catch (error) {
          ctx.logger.warn(`ai-company-framework-sidebar: state failed: ${String(error)}`);
          sendJson(res, 500, { error: 'state unavailable' });
        }
      },
    }), 'ai-company-framework-sidebar: state route');
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: '/ai-company/sidebar/reconfigure',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'method not allowed' });
          return;
        }
        try {
          const payload = await readBody(req);
          const sessionId = payload.sessionId;
          const childSessionId = payload.childSessionId;
          if (typeof sessionId !== 'string' || sessionId === '') {
            sendJson(res, 400, { error: 'sessionId required' });
            return;
          }
          if (typeof childSessionId !== 'string' || childSessionId === '') {
            sendJson(res, 400, { error: 'childSessionId required' });
            return;
          }
          // 会话公司隔离：childSessionId 必须属于 sessionId 会话 captain 的团队，
          // 否则拒绝 —— 跨会话/跨公司改配（含 reset 清除他人覆盖）一律 403。
          const allTeams = await collectSidebarState(ctx);
          const owned = allTeams.some((t) =>
            t.captainSessionId === sessionId &&
            Array.isArray(t.members) &&
            t.members.some((m) => m.id === childSessionId)
          );
          if (!owned) {
            sendJson(res, 403, { error: 'childSessionId does not belong to the current session team' });
            return;
          }
          const llm = ctx.get('llm');
          // reset branch: no provider/model clears the override
          if (payload.provider === undefined && payload.model === undefined) {
            const removed = overrides.get(childSessionId);
            overrides.delete(childSessionId);
            await saveOverrides();
            const agent = ctx.get('agents')?.get(childSessionId);
            if (agent !== undefined && removed?.previous !== undefined) {
              agent.options.provider = removed.previous.provider;
              agent.options.model = removed.previous.model;
              if (removed.previous.reasoningEffort !== undefined) agent.options.reasoningEffort = removed.previous.reasoningEffort;
              else delete agent.options.reasoningEffort;
            }
            sendJson(res, 200, { reset: true });
            return;
          }
          if (typeof payload.provider !== 'string' || typeof payload.model !== 'string') {
            sendJson(res, 400, { error: 'provider and model required together' });
            return;
          }
          if (llm === undefined) {
            sendJson(res, 500, { error: 'llm service unavailable' });
            return;
          }
          const resolved = await llm.resolveCallConfig({ provider: payload.provider, model: payload.model });
          const previous = overrides.get(childSessionId)?.previous;
          const agent = ctx.get('agents')?.get(childSessionId);
          const live = agent !== undefined
            ? { provider: agent.options.provider, model: agent.options.model, reasoningEffort: agent.options.reasoningEffort }
            : undefined;
          overrides.set(childSessionId, {
            provider: resolved.provider,
            model: resolved.model,
            ...(resolved.reasoningEffort === undefined ? {} : { reasoningEffort: resolved.reasoningEffort }),
            previous: previous ?? live,
            updatedAt: Date.now(),
          });
          await saveOverrides();
          // LIVE child: rewrite options so the next request already uses the new route.
          if (agent !== undefined) {
            agent.options.provider = resolved.provider;
            agent.options.model = resolved.model;
            if (resolved.reasoningEffort !== undefined) agent.options.reasoningEffort = resolved.reasoningEffort;
            else delete agent.options.reasoningEffort;
          }
          sendJson(res, 200, {
            ok: true,
            live: agent !== undefined,
            provider: resolved.provider,
            model: resolved.model,
            ...(resolved.reasoningEffort === undefined ? {} : { reasoningEffort: resolved.reasoningEffort }),
          });
        } catch (error) {
          ctx.logger.warn(`ai-company-framework-sidebar: reconfigure failed: ${String(error)}`);
          sendJson(res, 500, { error: String(error?.message ?? error) });
        }
      },
    }), 'ai-company-framework-sidebar: reconfigure route');
  };
  registerChildSetup();
  registerWebSurface();
  ctx.on('internal/service', (serviceName) => {
    if (serviceName === 'subagents') registerChildSetup();
    if (WEB_SERVER_KEYS.includes(serviceName)) registerWebSurface();
  });
}
