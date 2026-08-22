/**
 * ai-company-framework — v1 (feishu-bridge.json) → v2 (registry + credential vault)
 * 迁移（收编自 dsh-feishu-bridge@0.3.1）。
 *
 * One-time, idempotent: if a v2 registry already exists, nothing happens. If the
 * legacy single-bot config exists, its App Secret is moved into the DPAPI vault,
 * the plaintext file is renamed to `feishu-bridge.json.migrated`, and a boss bot
 * is registered for the provided company.
 */
import { readFile, rename, stat } from 'node:fs/promises';
import { emptyRegistry, newBotId, saveRegistry, upsertBot, upsertCompanyConfig } from './registry.js';
import { storeSecret } from './credentials.js';

/**
 * @param opts - { registryPath, credentialsPath, legacyPath, company }
 *   company - { key, name, teamId, workspaceRoot, captainSessionId }
 * @returns true when a migration ran
 */
export async function migrate(opts) {
  const { registryPath, credentialsPath, legacyPath, company } = opts;

  try {
    await stat(registryPath);
    return false; // already migrated
  } catch {
    /* no registry yet */
  }

  let legacy = null;
  try {
    const raw = JSON.parse(await readFile(legacyPath, 'utf8'));
    legacy = raw && typeof raw === 'object' ? raw : null;
  } catch {
    /* no legacy config */
  }
  if (!legacy || !legacy.appId || !legacy.appSecret) return false;

  const registry = emptyRegistry();
  await storeSecret(credentialsPath, legacy.appId, legacy.appSecret);

  const botId = newBotId();
  upsertBot(registry, {
    id: botId,
    kind: 'boss',
    appId: legacy.appId,
    displayName: legacy.botName || `${company?.name ?? '公司'} · 老板机器人`,
    companyKey: company?.key ?? 'default',
    mirrorWebhook: legacy.mirrorWebhook ?? '',
    status: 'active',
  });

  if (company?.key) {
    upsertCompanyConfig(registry, {
      key: company.key,
      name: company.name,
      teamId: company.teamId,
      workspaceRoot: company.workspaceRoot,
      bossBotId: botId,
      staffBotIds: [],
      escalation: { mirrorWebhook: legacy.mirrorWebhook ?? '', rules: [] },
    });
  }

  await saveRegistry(registryPath, registry);
  try {
    await rename(legacyPath, `${legacyPath}.migrated`);
  } catch {
    /* rename is best effort; the registry is authoritative */
  }
  return true;
}
