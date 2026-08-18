# Changelog

本文件记录 AI Company Framework 各版本的显著变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.1] - 2026-08-18

### 修复（来自新会话家具公司实测）

- 飞书权限默认全开：老板/员工机器人建司即 `allowGroup=true`，单聊+群聊一次到位。
- 禁止重复授权：已 connected 的机器人不再重新 start，防止 SDK 新建第二套机器人造成同公司两个同名 bot 与路由分叉。
- 老板单聊回传：SOP 明确必须用日志真实 sender open_id 回传；识别桥暂存队列占位回复现象。
- 客服岗重建联动：`remove_member`+`add_member` 后必须同步 `feishu-registry.json` 的 `staffMemberId`。

## [0.1.0] - 2026-08-18

### 新增

- 核心建司引擎：一句话 → 岗位模板 → 模型路由 → AgentTeams 团队 + 公司目录。
- 11 个预置岗位技能：文案 / 客服 / 质检 / 调研 / 剪辑 / 财务 / 人事 / 运营 / 开发 / 数据分析 / 翻译。
- 自动化流水线 v2.0：P0 需求解析 → P7 经验沉淀，含变更管理、扩招流程、验收编号化。
- 内部质检闭环：打回点名 → 返工复检 → 三次护栏升级。
- 交付打包：交付清单 + 假设清单 + 验收点。
- 会话即公司硬隔离：一个会话 = 一家公司，跨会话零串扰。
- 经验库机制：`company-wisdom/` 去敏共享，允许修订与推翻。
- 飞书桥接入（0.3.1 生产验证 / 0.4.0 staging）：
  - 官方 registerApp 一键创建机器人，App Secret 走 DPAPI 加密。
  - 老板 P2P `/成员名|岗位名 正文` 虚拟路由（staging）。
  - 客服原路回复通道 botId/receiveId/receiveIdType（staging）。
  - 员工离线入队 + 上线冷投递（staging）。
  - 显式失败绝不静默回退。
- 示例公司骨架与冒烟测试。

### 说明

- 本版本不包含 RAG/向量检索，保持最小依赖、确定性优先。
- 群机器人入群与镜像 webhook 属于人工闸门，需在飞书客户端操作。
- 生产飞书插件未随仓库发布，插件包为接入指引与 manifest 示例。

## [Unreleased]

### 文档与定位

- 明确 `v0.1.1` 定位为 DeepSeek Harness 多 Agent Skills Starter Kit，而非独立运行时。
- 补充 DeepSeek Harness / DSH Desktop 的底座分工与官方链接。
- 增加真实脱敏截图，展示 AgentTeams 活动、任务依赖和员工侧边栏。
- 补充按岗位分配模型、子 Agent 独立调教、飞书员工直连和通用工作流说明。
