/**
 * ai-company-framework — append-only two-way conversation log
 * (收编自 dsh-feishu-bridge@0.3.1).
 *
 * Layout: <dshHome>/feishu-logs/<companyKey>/<chatId>.jsonl, one JSON object
 * per line, rotated at 5 MB. Stores routing/workflow facts only — never
 * App Secrets or credential blobs.
 */
import { appendFile, mkdir, rename, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const MAX_BYTES = 5 * 1024 * 1024;

function segment(value) {
  const s = String(value ?? '')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .slice(0, 128);
  return s === '' ? 'default' : s;
}

async function rotateIfNeeded(file) {
  let size = 0;
  try {
    size = (await stat(file)).size;
  } catch {
    /* not present yet */
  }
  if (size < MAX_BYTES) return;
  try {
    await rename(file, `${file}.1`);
  } catch {
    /* rotation is best effort */
  }
}

export async function appendLog(logsDir, companyKey, chatId, entry) {
  const file = join(logsDir, segment(companyKey), `${segment(chatId)}.jsonl`);
  await mkdir(dirname(file), { recursive: true });
  await rotateIfNeeded(file);
  const line = JSON.stringify({ ...entry, ts: entry.ts ?? Date.now() });
  await appendFile(file, `${line}\n`, 'utf8');
}
