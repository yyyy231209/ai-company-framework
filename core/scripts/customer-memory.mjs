#!/usr/bin/env node
/**
 * ai-company-framework — 客户记忆库（customer-memory）
 *
 * 客户档案与客户会话的 SQLite 管理脚本（node 内置 sqlite，无外部依赖）。
 * 数据文件：<companyRoot>/.dsh/memory/customers.db（首次运行自动建库建表）。
 *
 * 设计：
 *   - 客户档案（customers 表）：id = open_id（私聊）或 chat_id（群聊），含 kind、
 *     首见/最近时间、profile（客服工作记忆摘要）、notes（老板可注入备注）。
 *   - 会话流水（messages 表）：逐条记录 in/out 消息，按 customer_id 隔离。
 *   - 所有读写都带 customer_id 条件 —— 客户 A 永远读不到客户 B 的数据。
 *
 * 用法（客服/老板执行）：
 *   node customer-memory.mjs init <companyRoot>                     建库建表（幂等）
 *   node customer-memory.mjs read <companyRoot> <customerId> [limit] 读档案+最近会话（含所在群）
 *   node customer-memory.mjs log <companyRoot> <customerId> <in|out> <text> [openId] 追加会话（群消息可带发言者 openId 归并到客户主档案）
 *   node customer-memory.mjs update <companyRoot> <customerId> <profile>     更新档案摘要
 *   node customer-memory.mjs list <companyRoot>                       拉取全部客户概览
 *   node customer-memory.mjs stats <companyRoot>                      统计（客户数/消息数）
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'p2p',
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  profile TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  group_ids TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  text TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_customer ON messages(customer_id, ts);
`;

/** 兼容迁移：老库 customers 表补 group_ids 列。 */
function ensureColumns(db) {
  const cols = db.prepare("PRAGMA table_info(customers)").all().map((c) => c.name);
  if (!cols.includes('group_ids')) {
    db.exec("ALTER TABLE customers ADD COLUMN group_ids TEXT NOT NULL DEFAULT '[]'");
  }
}

function dbPath(companyRoot) {
  return join(companyRoot, '.dsh', 'memory', 'customers.db');
}

function open(companyRoot) {
  const dir = dirname(dbPath(companyRoot));
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbPath(companyRoot));
  db.exec(SCHEMA);
  ensureColumns(db);
  return db;
}

function seedMemoryFiles(companyRoot) {
  const memDir = join(companyRoot, '.dsh', 'memory');
  mkdirSync(memDir, { recursive: true });
  const company = join(memDir, 'company.md');
  const general = join(memDir, 'general.md');
  if (!existsSync(company)) {
    writeFileSync(company, `# 公司记忆（客服共享 · 老板可编辑注入）\n\n<!-- 记录公司近况/业务状态/项目进度/话术口径。老板或客服按需更新，客服回复前必读。 -->\n\n- 公司：合成游戏工作室（示例，按实际修改）\n- 当前项目：\n- 业务范围：\n- 价格/政策口径：\n`);
  }
  if (!existsSync(general)) {
    writeFileSync(general, `# 通用记忆（客服共享 · 沟通技巧与经验）\n\n<!-- 记录跨客户通用的沟通方法/话术/踩坑。客服任务后沉淀，老板可注入。 -->\n\n- 开场：先共情，再给结论，最后给行动。\n- 不承诺：未经授权不承诺折扣/赔偿/时限/功效。\n- 复杂事项：升级老板，不让客户重复描述。\n`);
  }
}

function cmdInit(root) {
  const db = open(root);
  db.close();
  seedMemoryFiles(root);
  console.log(`✅ 客户记忆库已初始化：${dbPath(root)}`);
  return 0;
}

function cmdRead(root, customerId, limit) {
  const db = open(root);
  const n = Math.max(1, Math.min(50, Number(limit) || 20));
  const cust = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  const msgs = db.prepare(
    'SELECT direction, text, ts FROM messages WHERE customer_id = ? ORDER BY ts DESC LIMIT ?'
  ).all(customerId, n);
  if (!cust) {
    console.log(`【客户 ${customerId}】无档案（首次接触，将自动建档）。`);
  } else {
    console.log(`【客户 ${customerId}】kind=${cust.kind} · 首见 ${fmtTime(cust.first_seen_at)} · 最近 ${fmtTime(cust.last_seen_at)}`);
    if (cust.notes) console.log(`老板备注：${cust.notes}`);
    if (cust.profile) console.log(`档案摘要：${cust.profile}`);
    if (cust.group_ids && cust.group_ids !== '[]') {
      let gids = [];
      try { gids = JSON.parse(cust.group_ids); } catch { gids = []; }
      if (gids.length > 0) console.log(`所在群：${gids.join('、')}`);
    }
  }
  console.log(`--- 最近 ${msgs.length} 条会话 ---`);
  for (const m of msgs.reverse()) {
    console.log(`[${m.direction === 'in' ? '客户→' : '←客服'}] ${fmtTime(m.ts)} ${m.text}`);
  }
  db.close();
  return 0;
}

function cmdLog(root, customerId, direction, text, openId) {
  const dir = (direction === 'in' || direction === 'out') ? direction : 'in';
  const db = open(root);
  const ts = Date.now();
  const kind = customerId.startsWith('oc_') ? 'group' : 'p2p';
  // 群档案（chat_id）：保留群视图
  db.prepare(
    'INSERT INTO customers (id, kind, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?) ' +
    'ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at'
  ).run(customerId, kind, ts, ts);
  db.prepare('INSERT INTO messages (customer_id, direction, text, ts) VALUES (?, ?, ?, ?)')
    .run(customerId, dir, text, ts);
  // 跨群/跨私聊归并：群消息（oc_）+ 群内发言人 openId → 归并到客户主档案（open_id）
  if (kind === 'group' && openId && openId.startsWith('ou_') && openId !== customerId) {
    db.prepare(
      'INSERT INTO customers (id, kind, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at'
    ).run(openId, 'p2p', ts, ts);
    db.prepare('INSERT INTO messages (customer_id, direction, text, ts) VALUES (?, ?, ?, ?)')
      .run(openId, dir, `${text}（来自群 ${customerId}）`, ts);
    // 记录客户出现在哪些群（group_ids）
    const row = db.prepare('SELECT group_ids FROM customers WHERE id = ?').get(openId);
    let gids = [];
    try { gids = JSON.parse(row?.group_ids ?? '[]'); } catch { gids = []; }
    if (!gids.includes(customerId)) {
      gids.push(customerId);
      db.prepare('UPDATE customers SET group_ids = ? WHERE id = ?').run(JSON.stringify(gids), openId);
    }
  }
  db.close();
  console.log(`✅ 已记录 ${customerId} ${dir} 消息（${text.slice(0, 40)}${text.length > 40 ? '…' : ''}）`);
  return 0;
}

function cmdUpdate(root, customerId, profile) {
  const db = open(root);
  const ts = Date.now();
  db.prepare(
    'INSERT INTO customers (id, kind, first_seen_at, last_seen_at, profile) VALUES (?, ?, ?, ?, ?) ' +
    'ON CONFLICT(id) DO UPDATE SET profile = excluded.profile, last_seen_at = excluded.last_seen_at'
  ).run(customerId, 'p2p', ts, ts, profile);
  db.close();
  console.log(`✅ 已更新客户 ${customerId} 档案摘要`);
  return 0;
}

function cmdList(root) {
  const db = open(root);
  const rows = db.prepare(
    `SELECT c.id, c.kind, c.last_seen_at, c.profile,
            (SELECT COUNT(*) FROM messages m WHERE m.customer_id = c.id) AS msg_count
     FROM customers c ORDER BY c.last_seen_at DESC`
  ).all();
  if (rows.length === 0) {
    console.log('（暂无客户档案）');
  } else {
    for (const r of rows) {
      console.log(`${r.id}  [${r.kind}] 消息${r.msg_count}条 · 最近${fmtTime(r.last_seen_at)}${r.profile ? ' · ' + r.profile.slice(0, 60) : ''}`);
    }
  }
  db.close();
  return 0;
}

function cmdStats(root) {
  const db = open(root);
  const c = db.prepare('SELECT COUNT(*) AS n FROM customers').get();
  const m = db.prepare('SELECT COUNT(*) AS n FROM messages').get();
  const inbox = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE direction = 'in'").get();
  const out = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE direction = 'out'").get();
  console.log(`客户数 ${c.n} · 消息 ${m.n}（收 ${inbox.n} / 发 ${out.n}）`);
  db.close();
  return 0;
}

function fmtTime(ts) {
  if (!ts) return '?';
  const d = new Date(ts);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getMonth() + 1}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── CLI ────────────────────────────────────────────────────────────────────
const [cmd, root, ...rest] = process.argv.slice(2);
if (!cmd || !root) {
  console.log('用法：node customer-memory.mjs <init|read|log|update|list|stats> <companyRoot> [...]');
  process.exit(1);
}
try {
  let code = 1;
  switch (cmd) {
    case 'init': code = cmdInit(root); break;
    case 'read': code = cmdRead(root, rest[0], rest[1]); break;
    case 'log': code = cmdLog(root, rest[0], rest[1], rest[2] ?? '', rest[3] ?? ''); break;
    case 'update': code = cmdUpdate(root, rest[0], rest[1] ?? ''); break;
    case 'list': code = cmdList(root); break;
    case 'stats': code = cmdStats(root); break;
    default:
      console.log(`未知命令：${cmd}`);
      code = 1;
  }
  process.exit(code);
} catch (e) {
  console.error(`❌ customer-memory 失败：${String(e?.message ?? e)}`);
  process.exit(1);
}
