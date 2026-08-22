/**
 * ai-company-framework — feishu bridge host entry（收编自权利人授权的本地飞书桥）。
 *
 * 多公司多机器人飞书桥：
 *   - 每公司独占一个老板机器人，可选员工机器人（命名 公司_员工）
 *   - N 个机器人 = N 条独立长连接，同时在线
 *   - 消息按注册表精准路由到绑定公司/员工会话（员工冷唤醒）
 *   - 双向对话留痕 + 重要事件升级到公司镜像群
 *   - 工具：feishu_notify / feishu_status / feishu_send / feishu_onboard
 *   - Web 向导与会话中心（client 半，位于 ai-company-framework/client.js）
 *
 * 配置：<dshHome>/ai-company-feishu-registry.json + ai-company-feishu-credentials.json
 * （兼容迁移旧 feishu-registry.json / feishu-credentials.json，不删除旧文件）。
 */
import { createBridge } from './bridge.js';

export const name = 'ai-company-framework-feishu';
export const inject = ['tools', 'agents', 'systemPrompt', 'subagents'];

export function apply(ctx) {
  createBridge(ctx, ctx.logger);
}
