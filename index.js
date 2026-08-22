import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply as applyFileSystemSkills } from '@deepseek-ai/dsh-skill-filesystem'
import { apply as applySidebarHost } from './plugins/sidebar/lib/index.js'
import { apply as applyFeishuHost } from './plugins/feishu/lib/index.js'
import { apply as applyModeHost } from './plugins/mode/lib/index.js'

export const name = 'ai-company-framework'
export const inject = ['skills', 'tools', 'agents', 'systemPrompt', 'subagents', 'commands']

export function apply(ctx) {
  // 1) Skills provider（已有能力，原样保留）
  applyFileSystemSkills(ctx, {
    providerName: name,
    includeDefaultRoots: false,
    bundledSkillDir: join(dirname(fileURLToPath(import.meta.url)), 'core', 'skills'),
    watch: false,
  })
  // 2) 员工侧边栏 host（收编自权利人授权的本地侧栏包，已按 P1 收编改造）
  applySidebarHost(ctx)
  // 3) 飞书桥 host（收编自权利人授权的本地飞书桥，更名 ai-company-framework-feishu）
  applyFeishuHost(ctx)
  // 4) 公司模式开关 host（/company 开启、/no company 关闭；company_mode 工具门控 Skills）
  applyModeHost(ctx)
}
