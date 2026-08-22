# 快速开始（详细版）

本指南使用 DeepSeek Harness 原生 profile Bundle 路径安装 AI Company Framework。当前已验证 DSH `0.1.0-rc.8`，Windows 10/11。

## 0. 前置条件

**自动获得（安装即生效，无需额外步骤）**：

- 14 个公司/岗位 Skills 与 7 个模板；
- AgentTeams 运行时与 Web 活动面板（依赖 `@nanmicoder/dsh-agent-teams@0.1.10`）；
- 员工侧边栏（host + Web UI）；
- 飞书机器人栏（host + Web UI）与官方接入向导。

**需要你人工准备（本 Bundle 不做也不该自动化）**：

- 已安装并登录 DeepSeek Harness / DSH Desktop，目标 profile 可正常启动；
- Node.js 与 pnpm 可供 `dsh plugin` 使用；
- 会话运行前在宿主「设置 → 模型」配置你自己的模型 provider API Key；
- 首次使用飞书时完成官方授权（扫码确认、必要时的管理员审批与机器人入群）；
- 本地源码安装时需要 npm 生成 tgz。

## 1. 安装 Bundle

### 1.1 从源码生成本地包

在仓库根目录执行：

```powershell
npm pack
```

会生成类似 `ai-company-framework-0.3.0.tgz` 的文件。

### 1.2 安装到 web profile

```powershell
dsh plugin --profile web add .\ai-company-framework-0.3.0.tgz
```

语法中的 `--profile web` 必须写在 `plugin` 之后。若系统 PATH 没有 `dsh`，请用当前 DSH 安装所带的 `@deepseek-ai/dsh/lib/bin.js`：

```powershell
node <path-to-@deepseek-ai/dsh/lib/bin.js> plugin --profile web add .\ai-company-framework-0.3.0.tgz
```

注意：**从打包 `.tgz`/registry 安装**，不要 `add <源码目录>`——目录安装记录为 `link:` 依赖，其自身依赖（AgentTeams、飞书 SDK）不会被安装。

不要把旧的 `scripts/install.ps1` 当作 Bundle 安装器。它只是源码 checkout 的 legacy 复制脚本，会写用户 Skill 目录，且不属于 npm 包的原生安装/卸载生命周期。

## 2. 验证安装

先检查组合树：

```powershell
dsh --profile web --dump-config
```

输出应包含 **两个 row**：

- `ai-company-framework`（Skills + 员工侧栏 host + 飞书桥 host）；
- `agent-teams`（`name: '@nanmicoder/dsh-agent-teams'`，AgentTeams 运行时）。

然后重启 web profile 并新建会话；Skill catalog 应能发现：

- 3 个公司框架 Skill：`company-boss`、`company-pipeline`、`company-role-template`；
- 11 个岗位 Skill：`role-*`；
- 合计 14 个 Skill。

7 个模板与飞书 SOP 是 Skill 的按需资源，不会作为独立 catalog 条目出现。

## 3. 新建会话

关键规则：**一个顶层会话只绑定一家公司**。

- 在 Harness 中新建会话（需要先选择工作区并配置模型 provider）；
- 每开一家新公司都使用新会话；
- 不要复用已绑定其它公司的会话。

新建会话后，Web 界面会出现：AgentTeams 团队活动面板、员工侧边栏入口、飞书机器人栏入口。未创建团队/未授权飞书时，它们显示空状态与引导，不会谎报就绪。

## 4. 加载框架并描述目标

在新会话中明确调用 `company-boss`，或提出建司/多 Agent 工作流需求。例如：

> 「请使用 company-boss：我要开一家卖精品咖啡豆的电商公司，首单产出一篇小红书种草笔记和客服话术包，价格带 60–200 元，主要在小红书卖。」

Skill 会指导 Agent：

1. 澄清影响架构的必要信息；
2. 调用宿主模型列表并拟定岗位路由；
3. 使用 AgentTeams 创建团队、成员和任务；
4. 在当前工作区的公司目录写岗位骨架与产出；
5. 组织质检、返工和交付。

AgentTeams 运行时由本 Bundle 的依赖提供；成员会话、活动面板与员工侧边栏的 UI 由本 Bundle 的 client bundle 在宿主 web 界面中挂载。

## 5. 公司目录

工作流约定的公司目录：

```text
<工作区>/companies/<会话ID>/
├─ .dsh/company.json
├─ .dsh/skills/
├─ 交付/
├─ 质检/
└─ 验证/
```

实际文件写入仍受当前 DSH 沙盒和用户授权控制；Skill 规则不能绕过宿主权限。

## 6. 飞书能力（首次使用需人工官方授权）

本 Bundle **自带**飞书桥 host 与「飞书机器人」栏 UI（收编自获授权的本地 bridge，见 `NOTICE.md`）。安装即具备：

- `feishu_onboard / feishu_status / feishu_send / feishu_notify` 工具；
- 官方 `registerApp` 扫码一键创建向导（App Secret 仅经 Windows DPAPI、CurrentUser 作用域本地加密）；
- N 条机器人 WebSocket 长连接与精准路由（需先完成授权与绑定）。

**人工闸门**（Bundle 不替你做）：

- 首次使用需你在官方页面扫码/确认授权；
- 管理员审批、机器人入群、群镜像等按飞书平台规则执行；
- 未授权状态只显示官方 onboarding 引导与空状态，**不会显示 connected**。

## 7. 卸载

```powershell
dsh plugin --profile web remove ai-company-framework
```

然后重启 web profile。原生卸载会移除 profile dependency、Bundle layer 与包目录（含孤儿传递依赖）；包内 provider 和资源随 package 目录消失，不会删除或改写用户自己的 `$DSH_HOME/skills`。你的公司数据与飞书凭据按设计保留（配置回滚 ≠ 数据清除）。

## 8. 开发者自检

```powershell
node tests/bundle-check.mjs
node tests/client-feishu-check.mjs
powershell -File tests/smoke.ps1
powershell -File scripts/security-scan.ps1
npm pack --dry-run
```

真实隔离安装/卸载：

```powershell
powershell -File tests/install-bundle.ps1 -DshBin <path-to-@deepseek-ai/dsh/lib/bin.js>
```

全栈隔离验收（P3/P4/P6 口径，可复用 QA 脚本）：`scripts/qa-p4-fullstack.ps1`（安装/双 row/14 Skills/工具/启动/卸载/哨兵/卫生扫描）与 `scripts/qa-p4-web.ps1`（web profile 真实启动、`__DSH_BOOT__` 双 client bundle、侧栏路由、飞书未授权边界）。测试使用临时 `DSH_HOME`，不触碰生产环境。

常见问题见 [FAQ](FAQ.md) 与 [故障排查](TROUBLESHOOTING.md)。
