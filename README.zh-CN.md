# AI Company Framework

> **Company Is a Word.**
>
> **一句话 → 一家能干活的多 Agent 公司。** 安装这个 DeepSeek Harness `dsh.bundle`，说出你想做什么，一群岗位专精的 Agent（文案/剪辑/开发/质检/销售/客服……）就会设计架构、调度任务、质量把关并交付成果——而你始终掌握每一个重大决策。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v0.3.10-blue)](RELEASE_NOTES.md)

[English](README.md) | [简体中文](README.zh-CN.md)

## AI Company Framework 的核心优势

- **一句话开公司。** 说"开一家电商内容公司"，老板 Agent 逐题澄清 → 设计岗位 → 按能力分配模型路由 → 组建团队 → 派发第一单，全程无需手工配置。
- **完全不影响日常对话。** 公司模式默认关闭；输入 `/company` 开启、`/no-company` 关闭。不开启时，你的普通对话一点不受影响。
- **客户记忆跟着客户走。** SQLite 客户档案数据库（按客户 id 隔离）+ 公司记忆 + 通用记忆；同一客户在私聊和多个群聊的对话**自动归并为同一份档案**，并在所有对客岗位（销售/商务/客服）间共享——客户永远不用重复说。
- **Agent 主动推送，不用你追问。** 自主判断推送：客服说"我核实一下"后，读完自己的输出、判断完成，就主动把结果推给你/客户——没有轮询，没有"你收到了吗"。
- **重大决策你拍板。** 定价特批/退款/承诺/法律舆情——**重大决策人工闸门**通过飞书把决策推到你手机，你回复才落地，未经确认绝不擅自执行。
- **会话隔离，做硬了。** 员工侧边栏状态按会话隔离（fail-closed）、模型改配做归属校验（403）——跨公司数据不泄漏。
- **飞书原生。** 一次扫码（registerApp）给老板**和任意员工**创建机器人；私聊/群聊路由、双向留痕、外部联系人配置指引、全覆盖权限 + `extraScopes` 可扩展。
- **开源零风险。** 包内零用户数据——数据库、日志、凭据（DPAPI 加密）全部在客户本机首次使用时生成。

## 包内包含（v0.3.10）

- **15 个扁平 Skills**：`company-boss`、`company-pipeline`、`company-role-template`、`company-customer-memory`（通用三层记忆，任何对客岗位适用）+ 11 个岗位 Skills——全部受 `/company` 开关门控。
- **7 个工作流模板**（`core/templates/`）。
- **AgentTeams 运行时 + Web 活动面板**（内置依赖、独立 Cordis row）：团队创建、成员会话、依赖任务、活动树、归档团队。
- **员工侧边栏（host + Web UI）**：单员工无损模型改配、实时会话/工具查看、发消息、会话隔离、活动面板恢复入口。
- **飞书机器人桥（host + Web UI）**：官方 registerApp 一键扫码、DPAPI 凭据、老板 + 任意员工机器人、私聊/群聊路由、双向留痕、老板回复自动回传、自主推送、重大决策人工闸门、外部联系人指引、全覆盖权限。
- **客户记忆库**：`core/scripts/customer-memory.mjs`（Node 内置 SQLite，零依赖）——按客户建档 + 会话流水、三层记忆、跨群/私聊归并、一次拉取全部客户。
- **公司模式开关**：`/company` / `/no-company` 宿主命令 + `company_mode` 工具门控全部 Skills。
- **岗位记忆模式可选**：`三层`（对客岗）或 `单层`（内部岗）——岗位骨架中显式声明。
- 不含 RAG、向量库、遥测。

## 必须人工的（设计如此，不自动化）

- **模型提供方**：在宿主设置配置你自己的 API Key。
- **飞书授权**：扫码/确认在飞书官方页面完成（Secret 仅 DPAPI 本地加密；只有真实 WebSocket 建立才报 connected）。
- **重大决策**：定价/退款/承诺——推送到你审批。
- **工作区选择**：DSH Desktop 原生目录选择桥。
- **发布**：本仓库未经明确人工确认不发布/推送/PR。

## 能力边界

- 模型、工具、会话、Skills 与 Bundle 运行时由 DeepSeek Harness 提供。
- AgentTeams 执行、活动面板、员工侧边栏、飞书栏**由本 Bundle 实现**，安装即激活。
- 飞书授权是人工闸门；staging 能力不宣称稳定。
- 诚实状态原则：未安装/未授权/离线如实展示并给引导。

## 安装

```powershell
# 打包 tgz（推荐）或 registry 依赖——不要用源码目录 add
dsh plugin --profile web add .\ai-company-framework-0.3.10.tgz
```

安装后新建会话（Web UI 挂载活动面板/员工侧边栏/飞书栏），然后：

```text
/company    → 开启公司模式，再描述你的业务
/no-company → 回到普通对话
```

## 卸载

```powershell
dsh plugin --profile web remove ai-company-framework
```

原生卸载清除 profile 依赖、Bundle layer 与包目录。你自己的数据——公司团队、客户记忆、飞书凭据/注册表、日志——按设计保留（配置回滚 ≠ 数据清除）。

## 验证

已在 DSH Desktop 内置 `@deepseek-ai/dsh 0.1.0-rc.8`（Windows）验证：

```powershell
node tests\bundle-check.mjs
powershell -File tests\smoke.ps1
powershell -File scripts\security-scan.ps1
powershell -File tests\install-bundle.ps1 -DshBin <@deepseek-ai\dsh\lib\bin.js 路径>
```

隔离验收（全新临时 `DSH_HOME` + 新 profile + 真实 `.tgz`）：双 Cordis row、15 个门控 Skills 经已安装 provider 发现、`feishu_*` 工具注册、web 启动双 client bundle、侧边栏隔离（fail-closed + 403）、飞书未授权诚实状态、卸载零残留、包内零数据文件。

> 安装期 pnpm "peers missing" 告警为预期（profile 以 `autoInstallPeers:false` 运行）。

## 文档

- [快速开始](docs/QUICKSTART.md) · [架构](docs/ARCHITECTURE.md) · [Bundle 与扩展指南](docs/PLUGINS.md)
- [FAQ](docs/FAQ.md) · [故障排查](docs/TROUBLESHOOTING.md)
- [飞书接入 SOP](core/feishu-onboarding-sop.md) · [发布说明](RELEASE_NOTES.md)

## 声明（NOTICE）

收编组件（员工侧边栏、飞书桥）与供应链边界见 [NOTICE.md](NOTICE.md)。本包绝不依赖无关的 unscoped `dsh-feishu-bridge` npm 包。

## 许可证

[MIT](LICENSE) © 2026 AI Company Framework contributors
