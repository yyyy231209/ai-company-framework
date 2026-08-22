# NOTICE — 收编组件来源与授权

本包（ai-company-framework）按 MIT 许可发布。以下两个客户端组件由权利人
授权并入本包（原为 `private: true` 的本地包，无可公开下载制品）：

## 员工侧边栏

- 来源：`dsh-manju-studio-sidebar@0.1.0`（本地 link 包，`private: true`）
- 收编形态：`plugins/sidebar/`（host）+ `client.js` 中的员工侧栏 UI
- 已移除：漫剧自动化工具（manju_image_generate / manju_tts_generate /
  manju_assemble_video / manju_video_generate / 剪映草稿导出）——不属于通用框架
- 已更名：路由 `/ai-company/sidebar/*`、持久化文件 `ai-company-routes.json`
  （自动迁移旧 `manju-studio-routes.json` 后删除）、日志前缀、client 命名空间
- 保留：无损模型改配（installModelSelection + 覆盖文件）、实时会话/工具调用、
  单员工模型路由、发消息

## 飞书桥

- 来源：`dsh-feishu-bridge@0.3.1`（本地 link 包，`private: true`）
- 收编形态：`plugins/feishu/lib/`（host）+ `client.js` 中的飞书机器人栏 UI
- 已更名：host `ai-company-framework-feishu`、路由 `/ai-company/feishu/*`
  （保留 `/feishu/*` 别名，独立旧桥在场时自动跳过避免重复注册）、
  凭据/注册表文件 `ai-company-feishu-credentials.json` /
  `ai-company-feishu-registry.json`（启动时自动迁移旧名，不删除旧文件）
- 保留：官方 registerApp 扫码 onboarding、DPAPI 凭据、N 条 WebSocket 长连接、
  多机器人精准路由、员工冷唤醒、双向留痕、feishu_* 工具、系统提示
- 状态口径：0.3.1 能力 P2P 已验证；0.4.0 多岗位虚拟路由/离线重投属 staging，
  本包不宣称稳定

## 供应链注意

- 公开依赖 `@nanmicoder/dsh-agent-teams`（MIT，团队活动栏/AgentTeams 运行时）——
  本包不复制其源码，仅声明依赖并在 patch 中组合其 Cordis row。
- **不依赖** npm unscoped `dsh-feishu-bridge@1.0.4`（与收编源码完全无关的第三方包，
  无 dsh.bundle 能力），禁止作为依赖解析目标。
- 本包不内置任何用户凭据/机器人 App Secret；App Secret 仅经 Windows DPAPI
  （CurrentUser 作用域）加密存储在本机 DSH_HOME。
