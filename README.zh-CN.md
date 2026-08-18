# AI Company Framework

> **Company Is a Word.**
>
> 一套运行在 DeepSeek Harness 中的多 Agent 公司与工作流 Starter Kit。描述目标后，它会创建团队、按岗位分配模型、建立任务依赖、执行质检并整理交付。团队可以在 AgentTeams 面板中实时查看，也可以通过员工侧边栏或飞书分别与成员沟通。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Release](https://img.shields.io/badge/Release-v0.1.1-blue)](RELEASE_NOTES.md)

[English](README.md) | [简体中文](README.zh-CN.md)

## 基于 DeepSeek Harness 与 DSH Desktop

本项目不是替代底层运行时，而是在它们之上增加一层公司与工作流编排：

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供模型接入、工具调用、持久会话、Skills 和插件运行时；
- [DSH Desktop](https://github.com/dataelement/dsh-desktop) 把 Harness 做成可直接使用的桌面应用，并提供 AgentTeams 活动面板、员工侧边栏等可视化交互；
- AI Company Framework 提供岗位模板、模型路由策略、任务依赖、质检返工、交付规范、飞书接入和多实例隔离。

如果你第一次接触这个项目，建议先安装 DSH Desktop，再运行本仓库的安装脚本。

## 当前定位

`v0.1.1` 是一套可复用的 Harness Skills、模板、SOP 和安装脚本，定位是 **multi-agent starter kit**。它不是独立 Agent 运行时，也不替代 Harness 的执行能力。当前编排规则主要由 Skills 驱动；本版本不包含声明式公司编译器、代码化模型路由器、自动插件加载器或独立执行引擎。

---

![架构图](assets/architecture.svg)

## 真实运行截图

### 一句话 → 一家开始运转的 AI 公司

![在 DeepSeek Harness 中创建家具 AI 公司](assets/screenshots/company-created.png)

### AgentTeams 员工活动与任务依赖图

![AgentTeams 员工和任务依赖图](assets/screenshots/agentteams-activity.png)

### 打开任意员工：查看工作、直接发消息或更换模型

![员工侧边栏、模型路由与直接消息](assets/screenshots/employee-sidebar.png)

---

## 核心能力

### 直接装进 Harness

项目不需要额外部署服务器或数据库。安装 [DSH Desktop](https://github.com/dataelement/dsh-desktop) 并登录，运行 `install.ps1`，技能文件就会复制到 Harness 的技能目录。模型、工具、会话和 AgentTeams 由 Harness 提供，本项目负责组织团队和工作流。

### 一句话创建团队

输入业务方向和目标，老板会确定岗位、模型路由、文件目录和第一批任务。任务可以并行执行，并经过质检、返工和最终交付。没有明确的数据时，框架会列出假设，不会编造业务事实。

### 按岗位自动分配模型

创建团队前，老板会读取当前可用的模型列表，而不是写死某个模型。视觉岗位优先使用支持图像输入的模型，策划、研发和复核岗位使用强推理模型，文案、客服和批处理任务使用速度更快、成本更低的模型，长时间任务也会优先考虑配额和运行成本。这样可以把高成本模型留给关键环节，减少 Token 和账号配额的浪费。分配完成后，仍可在员工侧边栏单独调整任意成员的模型。

### 实时查看 AgentTeams

AgentTeams 面板会显示每个成员的状态、任务归属和整体进度。任务依赖图可以看到哪些任务正在并行、哪些在等待上游。通过员工侧边栏，还可以查看任意成员的独立对话和工具执行记录。

### 单独调教每个子 Agent

每个成员都有自己的持久会话、邮箱和 Skill 文件。你可以直接给某个成员发消息，也可以单独修改它的模型路由，不需要重建团队或清空对话。员工入职时会补全自己的 Skill，工作中发现更好的做法也会继续维护；输入输出契约仍由老板把关。

### 通过飞书远程控制

飞书插件是可选组件。它使用官方 `registerApp()` 创建机器人：用户打开一次确认链接后，应用、机器人、权限、事件订阅、WebSocket 和加密凭据会自动配置。

老板机器人用于远程下任务、查进度和接收回复；员工机器人通过 `staffMemberId` 绑定到指定成员，可以直接和客服或其他子 Agent 对话。里程碑也可以推送到飞书群。老板/员工 P2P 已完成验证；单个老板机器人内的多岗位虚拟路由仍属于 `dsh-feishu-bridge 0.4.0` staging（飞书桥与本项目分别版本化）。

详见 [`plugins/feishu/README.md`](plugins/feishu/README.md)。

### 公司只是一个预设，也可以搭完整工作流

岗位可以看作工作流节点。每个节点有明确的输入、输出和验收标准，任务之间用依赖图连接，并支持并行、批次验收和返工。除了公司组织，也可以用它搭内容生产、研究报告、软件开发、客服运营、视频制作或数据分析流程。

### 可以继续加插件和自定义岗位

项目可以组合 Harness 的模型、工具、Skills 和客户端插件。本框架同时提供 `plugin-manifest/v1`，用于增加岗位、技能、脚本和生命周期 Hooks。仓库内置 11 个常用岗位；缺少的岗位可以按 `company-role-template` 创建。

### 可以同时运行多家公司或工作流

一个顶层会话对应一个独立实例。新建会话即可创建下一家公司或工作流，每个实例都有自己的团队、任务、技能、文件目录和可选飞书机器人，彼此不共享业务数据。

---

## 快速开始（3 步）

### 前置条件

- Windows 10/11
- [DSH Desktop](https://github.com/dataelement/dsh-desktop) 已安装并登录（它将 DeepSeek Harness 封装为桌面应用）

### 第 1 步：把框架装进 Harness

```powershell
# 进入仓库目录
cd ai-company-framework
# 一键安装（把 core/skills 复制到 Harness 技能目录）
.\scripts\install.ps1
# 自检环境
.\scripts\verify.ps1
```

### 第 2 步：新建一个会话

在 Harness 里 **新建会话**（不要复用旧会话——一个会话只能开一家公司，新会话 = 新公司）。

### 第 3 步：说一句话

> 「我要开一家卖精品咖啡豆的电商公司，首单产出一篇小红书种草笔记和客服话术包。」

也可以直接描述一条工作流：

> 「搭一条研究报告流水线：调研员找资料，分析员整理数据，撰稿人写报告，质检员核对引用后再交付。」

老板会先确认影响架构的必要信息，然后创建团队和任务图。

## 它能做什么？

| 能力 | 说明 |
|------|------|
| Harness 原生运行 | 复用 Harness 的模型、工具、会话、Skills 和插件 |
| 一句话建团队 | 根据目标创建岗位、团队、目录和首批任务 |
| 模型自动路由 | 读取可用模型列表，按岗位能力、速度、成本和配额分配 |
| AgentTeams 监控 | 实时查看成员状态、任务归属、依赖图和执行进度 |
| 子 Agent 单独调教 | 独立对话、独立换模型、独立 Skill、持久上下文 |
| 工作流编排 | 串行/并行任务、文件契约、质检、返工和交付 |
| 飞书远程控制 | 一键创建老板/员工机器人，并与指定 Agent 对话 |
| 插件扩展 | 通过 Harness 插件和 `plugin-manifest/v1` 增加能力 |
| 多实例隔离 | 一个会话一个实例，可同时运行多家公司或工作流 |
| 经验沉淀 | 只共享去敏流程经验，不共享业务数据 |

## 目录结构

```text
ai-company-framework/
├─ core/                      # 框架本体
│  ├─ skills/                 # 老板总控 + 流水线 + 11 个岗位技能
│  ├─ templates/              # 任务/质检/交付/返工模板
│  └─ feishu-onboarding-sop.md
├─ plugins/                   # 可选插件（飞书等）
│  └─ feishu/
├─ scripts/                   # 安装/自检/安全扫描
├─ docs/                      # 小白文档 + 插件开发指南
├─ examples/                  # 示例公司
├─ tests/                     # 冒烟测试
└─ LICENSE (MIT)
```

## 插件接口

`v0.1.1` 提供 `plugin-manifest/v1` 规范和飞书示例，用于声明插件贡献的 Skills、脚本和生命周期 Hooks。当前由本项目的 `install.ps1` 把 Skills 安装到 Harness 技能目录，再由 Harness 加载和执行；本版本不包含独立的自动插件加载器。

- **挂载点**：建司后、首个任务前、任务完成后、交付前；
- **Skill 注入**：插件可增加岗位和领域能力；
- **脚本 Hooks**：可调用 PowerShell 或 Node 脚本；
- **隔离约束**：插件不得读取其他实例的数据，凭据不得进入仓库。

规范见 [`docs/PLUGINS.md`](docs/PLUGINS.md)，飞书示例见 [`plugins/feishu/`](plugins/feishu/README.md)。

## 文档

- [快速开始（详细版）](docs/QUICKSTART.md)
- [架构说明](docs/ARCHITECTURE.md)
- [插件开发指南](docs/PLUGINS.md)
- [常见问题 FAQ](docs/FAQ.md)
- [故障排查](docs/TROUBLESHOOTING.md)

## 贡献

欢迎任何形式的贡献——问题、想法、插件、文档、PR。
请先读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 路线图

- [x] v0.1.1：Skills Starter Kit、11 个岗位、任务/质检/交付模板、模型路由规则、AgentTeams 监控和飞书 P2P 接入

## 许可证

[MIT](LICENSE) © 2026 AI Company Framework contributors

## 免责声明

- 本框架生成的内容（文案/方案/代码）需人工把关后使用，不构成专业建议。
- `dsh-feishu-bridge 0.4.0` 多岗位虚拟路由为 staging，生产部署前请自行评估。
- 群机器人入群与镜像 webhook 需在飞书客户端手动操作。
