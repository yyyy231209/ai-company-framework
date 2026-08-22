/**
 * ai-company-framework — persistent multi-company Feishu registry
 * (收编自 dsh-feishu-bridge@0.3.1).
 *
 * v2 schema, one file at <dshHome>/ai-company-feishu-registry.json:
 *   {
 *     "schemaVersion": 2, "updatedAt": <ms>,
 *     "bots":      { "<botId>": BotEntry },
 *     "companies": { "<teamId>": CompanyConfig },   // optional escalation config
 *     "groups":    { "<chatId>": GroupBinding }
 *   }
 *
 * A "company" is the AgentTeams team (teamId == companyKey). Captain/member
 * session ids are resolved live from `<workspace>/.agent-teams/<teamId>/team.json`;
 * the registry only stores bindings (bots ↔ teamId ↔ group targets) and any
 * per-company escalation config. Secrets live in the separate credential vault.
 */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const SCHEMA_VERSION = 2;

export function emptyRegistry() {
  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt: Date.now(),
    bots: {},
    companies: {},
    groups: {},
  };
}

export function newBotId() {
  return `bot_${randomUUID()}`;
}

export async function loadRegistry(path) {
  try {
    const data = JSON.parse(await readFile(path, 'utf8'));
    if (!data || typeof data !== 'object') throw new Error('registry root must be an object');
    return {
      schemaVersion: data.schemaVersion ?? 1,
      updatedAt: data.updatedAt ?? Date.now(),
      bots: data.bots ?? {},
      companies: data.companies ?? {},
      groups: data.groups ?? {},
    };
  } catch (error) {
    if (error && error.code === 'ENOENT') return emptyRegistry();
    throw error;
  }
}

export async function saveRegistry(path, registry) {
  registry.updatedAt = Date.now();
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(registry, null, 2), 'utf8');
  await rename(tmp, path);
}

export function upsertBot(registry, bot) {
  const prev = registry.bots[bot.id] ?? {};
  registry.bots[bot.id] = {
    ...prev,
    ...bot,
    createdAt: prev.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  return registry.bots[bot.id];
}

export function removeBot(registry, botId) {
  delete registry.bots[botId];
  for (const company of Object.values(registry.companies)) {
    if (company.bossBotId === botId) company.bossBotId = null;
    if (Array.isArray(company.staffBotIds)) {
      company.staffBotIds = company.staffBotIds.filter((id) => id !== botId);
    }
  }
  for (const [chatId, group] of Object.entries(registry.groups)) {
    if (group.botId === botId) delete registry.groups[chatId];
  }
}

export function upsertCompanyConfig(registry, company) {
  const prev = registry.companies[company.key] ?? {};
  registry.companies[company.key] = {
    ...prev,
    ...company,
    createdAt: prev.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  return registry.companies[company.key];
}

export function bindGroup(registry, binding) {
  const prev = registry.groups[binding.chatId] ?? {};
  registry.groups[binding.chatId] = { ...prev, ...binding, createdAt: prev.createdAt ?? Date.now() };
}

export function activeBots(registry) {
  return Object.values(registry.bots).filter((bot) => bot.status !== 'disabled');
}

export function botById(registry, id) {
  return registry.bots[id] ?? null;
}

/**
 * Redacted registry summary for the web surface — no secret material, no
 * credential blobs, just ids/names/status/routing targets.
 */
export function redactRegistry(registry, transportsState = {}) {
  return {
    schemaVersion: registry.schemaVersion,
    updatedAt: registry.updatedAt,
    bots: Object.fromEntries(
      Object.entries(registry.bots).map(([id, bot]) => [
        id,
        {
          id: bot.id,
          kind: bot.kind,
          appId: bot.appId,
          displayName: bot.displayName,
          companyKey: bot.companyKey,
          staffMemberId: bot.staffMemberId ?? null,
          status: bot.status,
          mirrorConfigured: Boolean(bot.mirrorWebhook),
          transport: transportsState[id] ?? null,
        },
      ]),
    ),
    companies: registry.companies,
    groups: registry.groups,
  };
}
