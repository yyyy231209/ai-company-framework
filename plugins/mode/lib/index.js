/**
 * ai-company-framework — 公司模式开关（host half）。
 *
 * 默认不触发公司流程：安装插件后日常对话照常，只有用户在会话输入
 * `/company` 才开启公司模式（建司→岗位→任务→质检→交付），输入
 * `/no company` 关闭。侧边栏/飞书栏等 UI 保持常驻，不随模式隐藏。
 *
 * 实现：
 *   - dsh-commands 服务注册两条命令（命令由宿主执行，不经过模型）：
 *       /company      -> 当前会话 mode = on
 *       /no company   -> 当前会话 mode = off（删除记录）
 *   - dsh-tools 注册只读工具 `company_mode`：agent 在执行任何公司流程前
 *     查询当前会话开关，门控 14 个 Skills（未开启时禁止建司/调度/质检）。
 *   - 状态文件：<dshHome>/ai-company-mode.json（{ sessionId: 'on' }，会话级）。
 */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths';
import { defineTool } from '@deepseek-ai/dsh-tools';

export const name = 'ai-company-framework-mode';
export const inject = ['tools', 'commands'];

let storePath = null;
async function storeFile() {
  if (storePath !== null) return storePath;
  storePath = join(resolveDshHome(), 'ai-company-mode.json');
  return storePath;
}
async function readModes() {
  try {
    const text = await readFile(await storeFile(), 'utf8');
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
async function writeModes(modes) {
  const file = await storeFile();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(modes, null, 2), 'utf8');
  await rename(tmp, file);
}

function modeOf(modes, sessionId) {
  const value = modes[sessionId];
  return value === 'on' || value === 'off' ? value : null;
}

function describeMode(mode) {
  if (mode === 'on') {
    return '公司模式：已开启（on）。可按多 Agent 公司框架流程执行：建司→岗位→任务→质检→交付。';
  }
  if (mode === 'off') {
    return '公司模式：已关闭（off）。不得执行建司/创建员工/任务调度/质检等公司流程，按普通对话回复；用户输入 /company 后才会开启。';
  }
  return '公司模式：未设置（默认关闭）。不得执行任何公司流程，按普通对话回复；用户输入 /company 后才会开启。';
}

export function apply(ctx) {
  const commands = ctx.commands;
  const tools = ctx.tools;

  // /company —— 开启公司模式
  commands.register({
    name: 'company',
    description: '开启公司模式：本会话后续按多 Agent 公司框架流程（建司→岗位→任务→质检→交付）执行。输入 /no-company 可关闭。',
    handler: async (invocation) => {
      const sessionId = invocation.agent?.session?.id;
      if (!sessionId) return { kind: 'error', text: '无法确定当前会话，未能开启公司模式。' };
      const modes = await readModes();
      modes[sessionId] = 'on';
      await writeModes(modes);
      return { kind: 'success', text: '✅ 公司模式已开启：本会话将按多 Agent 公司框架流程执行（建司→岗位→任务→质检→交付）。输入 /no-company 可关闭。' };
    },
  });

  // /no-company —— 关闭公司模式（单 token 命令名，宿主规则不允许空格）
  commands.register({
    name: 'no-company',
    description: '关闭公司模式：本会话恢复普通对话模式（不再执行公司流程）。',
    handler: async (invocation) => {
      const sessionId = invocation.agent?.session?.id;
      if (!sessionId) return { kind: 'error', text: '无法确定当前会话，未能关闭公司模式。' };
      const modes = await readModes();
      delete modes[sessionId];
      await writeModes(modes);
      return { kind: 'success', text: '✅ 公司模式已关闭：本会话恢复普通对话模式。输入 /company 可重新开启。' };
    },
  });

  // company_mode —— agent 只读查询（14 个 Skills 的门控依据）
  tools.register(defineTool({
    name: 'company_mode',
    description: '查询当前会话的公司模式开关。on=公司模式已开启（可执行建司/岗位/任务/质检/交付等公司框架流程）；off 或未设置=普通对话（禁止执行任何公司流程，按普通对话回复并提示用户输入 /company 开启）。执行任何公司相关操作前必须调用本工具确认开关状态。',
    parameters: {},
    output: {
      schema: { type: 'object', additionalProperties: true, properties: { mode: { type: 'string', required: true }, summary: { type: 'string', required: true } } },
      render: (_args, value) => [{ type: 'text', text: value.summary }],
    },
    async execute(_args, exec) {
      const sessionId = exec.agent?.session?.id;
      const mode = sessionId ? modeOf(await readModes(), sessionId) : null;
      return { mode: mode ?? 'off', summary: describeMode(mode) };
    },
  }));
}
