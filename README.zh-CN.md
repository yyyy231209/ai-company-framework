# AI Company Framework

> **Company Is a Word.** — 一句话，开一家能干活的多 Agent 公司。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v0.3.10-blue)](RELEASE_NOTES.md)
[![Wiki](https://img.shields.io/badge/Wiki-ai--company--framework-8A2BE2)](https://github.com/yyyy231209/ai-company-framework/wiki)

[English](README.md) | [简体中文](README.zh-CN.md)

---

## ✨ 这是什么（30 秒理解）

一个 DeepSeek Harness `dsh.bundle`：**一句话** → 一家由岗位专精 Agent（文案/剪辑/开发/质检/销售/客服……）组成的公司——设计架构、调度任务、质量把关并交付成果，而**每一个重大决策都由你拍板**。

```text
你说一句话 → 老板澄清(一次一问) → 实时盘点模型/分岗位路由 → 建团队(AgentTeams)
  → 员工入职自写技能 → 派首单 → 质检闭环 → 交付包(含假设清单) → 要改？一句话定向返工
```

![架构图](assets/architecture.svg)

## ⚡ 30 秒快速开始

```powershell
# 1. 安装（打包 tgz，不要用源码目录 add）
dsh plugin --profile web add .\ai-company-framework-0.3.10.tgz
```

```text
# 2. 重启 DSH Desktop，新建会话，然后：
/company
# 3. 说出你的需求：
#    "我要开一家电商内容公司，首单产出一篇小红书种草笔记和客服话术包"
```

就这么简单，老板 Agent 接手后面的事。

| AgentTeams 活动面板 | 员工侧边栏 | 建司成功 |
|---|---|---|
| ![活动面板](assets/screenshots/agentteams-activity.png) | ![侧边栏](assets/screenshots/employee-sidebar.png) | ![建司](assets/screenshots/company-created.png) |

## 🎯 核心优势

| 优势 | 你得到什么 |
|---|---|
| **完全不影响日常对话** | 公司模式**默认关闭**——`/company` 开启、`/no-company` 关闭。不开启时普通聊天一点不受影响。 |
| **客户记忆跟着客户走** | SQLite 客户档案（按 id 隔离）+ 公司/通用记忆；同一客户跨私聊+多群**自动归并为一份档案**，所有对客岗位共享——**客户永远不用重复说**。 |
| **Agent 主动推送，不用你追问** | 客服说"我核实一下"后，读完输出、判断完成，**主动推结果**。没有轮询，没有"你收到了吗"。 |
| **重大决策你拍板** | 定价/退款/承诺/法律舆情 → **人工决策闸门**把选项推到你手机，**你批准才落地**。 |
| **每个员工都能有机器人** | 一次扫码（registerApp）给老板和**任意员工**建飞书机器人——远程办公/对客团队利器。 |
| **会话隔离做硬** | 侧边栏按会话 fail-closed、模型改配 403 校验、客户档案按 id 隔离——跨公司零泄漏。 |
| **开源零风险** | 发布包**零用户数据**——数据库/日志/凭据（DPAPI 加密）全部客户本机首次使用时生成。 |
| **岗位记忆模式可选** | `三层`（对客岗）或 `单层`（内部岗）——岗位骨架显式声明。 |

## 🏭 适用场景

- **电商内容工作室**：调研 → 文案 → 质检 → 返工 → 交付，按批次打包汇报。
- **游戏工作室**：策划设计、文案写商店文案、质检把关、客服带全量客户记忆接客。
- **客服与销售**：客户档案 + 跨群归并 + 自主推送 + 人工决策闸门。
- **远程办公团队**：每个员工一个飞书机器人，你在手机上遥控指挥。
- **外包/代理**：每个客户一句话建司，会话级隔离互不干扰。

## 📦 包内包含（v0.3.10）

**15 个扁平 Skills**（全部受 `/company` 门控）：

| 技能 | 岗位 |
|---|---|
| `company-boss` | 老板——架构/调度/质检闭环/交付/经验沉淀 |
| `company-pipeline` | 8 阶段自动化流水线（建司/飞书/调度/质检/交付/扩招） |
| `company-role-template` | 岗位骨架模板（员工自写技能） |
| `company-customer-memory` | 通用三层记忆（任何对客岗位） |
| `role-writer / role-editor / role-coder / role-researcher / role-qa / role-ops / role-finance / role-hr / role-data / role-translator / role-customer-service` | 11 个预封装岗位 |

外加：
- **7 个工作流模板**（`core/templates/`）。
- **AgentTeams 运行时 + Web 活动面板**（内置依赖、独立 Cordis row）。
- **员工侧边栏（host + Web UI）**：单员工无损模型改配、实时会话/工具、发消息、会话隔离、活动面板恢复入口。
- **飞书机器人桥（host + Web UI）**：官方 registerApp 一键扫码、DPAPI 凭据、老板+任意员工机器人、私聊/群聊路由、双向留痕、老板回复自动回传、自主推送、人工决策闸门、外部联系人指引、全覆盖权限 + `extraScopes`。
- **客户记忆库**：`core/scripts/customer-memory.mjs`（Node 内置 SQLite，零依赖）——按客户建档 + 会话流水、三层记忆、跨群/私聊归并、一次拉取全部客户。
- **公司模式开关**：`/company` / `/no-company` 命令 + `company_mode` 工具。
- **不含 RAG、向量库、遥测。**

## 🏗️ 架构与边界

```
DeepSeek Harness（模型/工具/会话/Skills/沙盒/Web）
  └─ AI Company Framework bundle
       ├─ 15 Skills provider（包内资源，不复制用户目录）
       ├─ AgentTeams 运行时 + 活动面板（内置依赖）
       ├─ 员工侧边栏 host + UI（会话隔离）
       ├─ 飞书桥 host + UI（多机器人，DPAPI）
       └─ 客户记忆库（SQLite，按客户隔离）
  └─ 人工闸门：模型 API Key · 飞书授权 · 重大决策 · 工作区选择
```

- 模型/工具/会话/Skills/Bundle 运行时来自 DeepSeek Harness；其余**由本 Bundle 实现**，安装即激活。
- 诚实状态原则：未安装/未授权/离线如实展示并给引导，绝不谎报就绪。

## 🛡️ 安全

- 发布包零用户数据（已验证：tgz 内无 `.db`/`.jsonl`）。
- 飞书 App Secret：**Windows DPAPI**（CurrentUser 作用域）本地加密；只有真实 WebSocket 建立才报 connected。
- 客户档案按 id 隔离；侧边栏按会话 fail-closed + 403 归属校验。
- 无 postinstall hook；安装/卸载由 `dsh plugin` 管理。

## ✅ 验证

已在 DSH Desktop `@deepseek-ai/dsh 0.1.0-rc.8`（Windows）验证：双 Cordis row、15 个门控 Skills、AgentTeams 全生命周期、侧边栏隔离、飞书端到端（老板/员工/群聊/回传/推送/决策闸门）、客户记忆归并与隔离、发布包完整性。详见 [RELEASE_NOTES](RELEASE_NOTES.md) 与 [Wiki](https://github.com/yyyy231209/ai-company-framework/wiki)。

## 📚 文档

- [Wiki](https://github.com/yyyy231209/ai-company-framework/wiki) · [快速开始](docs/QUICKSTART.md) · [架构](docs/ARCHITECTURE.md) · [Bundle 与扩展指南](docs/PLUGINS.md)
- [FAQ](docs/FAQ.md) · [故障排查](docs/TROUBLESHOOTING.md) · [飞书接入 SOP](core/feishu-onboarding-sop.md)

## 🤝 贡献

欢迎 PR——见 [CONTRIBUTING](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md)。

## 声明（NOTICE）

收编组件（员工侧边栏、飞书桥）与供应链边界见 [NOTICE.md](NOTICE.md)。

## 许可证

[MIT](LICENSE) © 2026 AI Company Framework contributors
