# 故障排查

提 issue 时请附 DSH 版本、Bundle 版本、目标 profile、复现命令和脱敏后的完整报错。

## 1. 安装与卸载

### 1.1 找不到 `dsh`

- **现象**：PowerShell 报 `dsh` 不是命令。
- **原因**：DSH Desktop 的内置 CLI 不一定加入系统 PATH。
- **解决**：找到当前安装所带的 `@deepseek-ai/dsh/lib/bin.js`，用 Node 调用：

```powershell
node <path-to-@deepseek-ai/dsh/lib/bin.js> --version
node <path-to-@deepseek-ai/dsh/lib/bin.js> plugin --profile web add <package-or-tgz>
```

必须使用正在运行的 DSH 安装对应的 CLI，避免混用不同版本。

### 1.2 `pnpm not found on PATH`

`dsh plugin` 是 pnpm 薄转发器。安装 pnpm 或把 DSH Desktop 随附的 pnpm shim 加入 PATH 后重试。不要改 profile manifest 来绕过失败的安装。

### 1.3 命令提示缺少 `--profile`

正确顺序：

```text
dsh plugin --profile web add <package>
```

`dsh --profile web plugin ...` 和 `dsh plugin add ...` 都不是当前 CLI 契约。

### 1.4 安装后 row 不出现 / AgentTeams 工具缺失

依次检查：

1. pnpm 命令是否 exit 0；
2. `$DSH_HOME/profiles/web/package.json` 的 dependencies 是否含 `ai-company-framework`；
3. `dsh.profile.bundles` 是否含 `ai-company-framework`；
4. `dsh --profile web --dump-config` 是否出现 **两个 row**：`ai-company-framework` 与 `agent-teams`（`name: '@nanmicoder/dsh-agent-teams'`）；
5. 是否从**打包 `.tgz`/registry** 安装——`add <源码目录>`（`link:`）不会安装 AgentTeams 等依赖；
6. 安装包是否实际包含 `package.json`、`cordis.patch.yml`、`index.js`、`client.js`。

安装失败时不要手工把包名塞进 `dsh.profile.bundles`；先修复 dependency 或 package manifest。

### 1.5 安装后看不到 14 个 Skill

- 重启目标 profile；Bundle patch 与 profile manifest 不会在当前进程内热重载；
- 确认使用的是安装 Bundle 的同一个 profile；
- 检查 `--dump-config` 有 row；
- 检查 package 目录下 `core/skills` 恰好有 14 个 `.md`；
- 运行 `node tests/bundle-check.mjs`；
- 在隔离环境运行 `tests/install-bundle.ps1`，确认 provider 能 list/get 14 个 bundled Skill。

模板和 SOP 不会出现在 catalog；它们是 Skill 引用的按需资源。

### 1.6 卸载后仍在当前会话看到 Skill / UI 栏

```powershell
dsh plugin --profile web remove ai-company-framework
```

结束并重启相应 profile，再新建/恢复会话。旧会话历史中已经加载过的 Skill 正文不会被倒写删除；应以新 catalog 和 profile dependency/layer 为卸载判断依据。

原生 Bundle 从未复制用户 Skill。若此前运行过 legacy `scripts/install.ps1`，其复制文件不属于 pnpm dependency，需按当时输出的清单单独处理；不要让卸载脚本盲删可能已由用户修改的同名文件。

卸载**不会删除你的数据**：公司团队、飞书凭据/注册表、日志按设计保留（配置回滚 ≠ 数据清除）。如需清除飞书凭据，在 DSH_HOME 删除 `ai-company-feishu-credentials.json` 等文件（自行确认无其它备份）。

### 1.7 安装期 pnpm 报 "peers missing"

预期行为，不是安装失败：DSH profile 以 `autoInstallPeers:false` 运行，`@deepseek-ai/cordis` 与各 `@deepseek-ai/dsh-*` peer 由宿主闭包在运行时解析。不要在 profile 里开启 `autoInstallPeers` 或把 peer 改成普通 dependency。

## 2. Bundle 解析

### 2.1 patch 文件报错

`cordis.patch.yml` 必须：

- 存在于 npm 产物；
- 是顶层 YAML 数组；
- 每个 patch entry 是 mapping；
- 插入 row 至少有可解析的 `name`。

空层写 `[]`，不要使用空文件或只有注释的文件。

### 2.2 peer dependency 冲突 / 依赖版本

本包 peer 为 `@deepseek-ai/cordis ^4.0.1` + 5×dsh `^0.1.0-rc.8`，依赖精确 pin `@nanmicoder/dsh-agent-teams@0.1.10`、`@larksuiteoapi/node-sdk ^1.65.0`。更高 DSH 版本出现 peer/Loader 错误时，先在临时 `DSH_HOME` 重跑安装测试；不要把官方 peer 改成普通 dependency 来强装第二份运行时。

## 3. AgentTeams 与 UI 栏

AgentTeams 运行时与活动面板由本 Bundle 的依赖 `@nanmicoder/dsh-agent-teams` 提供；员工侧栏与飞书栏由本 Bundle 的 host/client 提供。

### 3.1 Skill 已加载但没有自动建司

- 确认当前 catalog 有 `company-boss`；
- 明确要求加载/使用 `company-boss`；
- 回答影响架构的必要问题；
- 确认已配置模型 provider（未配置时会话无法运行 Agent）；
- 确认 `--dump-config` 有 `agent-teams` row；没有则按 §1.4 检查。

### 3.2 活动面板/员工侧栏/飞书栏不显示

- 重启 web profile 并**新建会话**（三栏挂载在会话界面）；
- 检查浏览器 console 无插件加载错误；
- 检查 `dsh --profile web --dump-config` 有 `ai-company-framework` 与 `agent-teams` 两个 row；
- 用 P4 验收脚本复跑：`scripts/qa-p4-web.ps1` 会断言 `__DSH_BOOT__` 双 client bundle 与侧栏/飞书路由。

### 3.3 员工或任务卡住

通过 AgentTeams 活动面板/工具检查成员状态、依赖与 attempt。员工侧栏的模型改配走 `/ai-company/sidebar/reconfigure`；改配无效时检查 `ai-company-routes.json` 内容与 llm 服务可用性。

### 3.4 会话已经绑定另一家公司

一个顶层会话按框架规程只绑定一家公司。查看当前 company root 的 `.dsh/company.json`；要开新公司请新建会话，不要覆盖旧绑定。

## 4. 飞书

飞书桥 host 与「飞书机器人」栏 UI 由本 Bundle 提供（收编自获授权本地 bridge，见 `NOTICE.md`）；首次使用**必须完成人工官方授权**。

### 4.1 找不到 `feishu_onboard` / `feishu_status`

- 检查 `--dump-config` 有 `ai-company-framework` row（host 在 apply 时同步注册 4 个 `feishu_*` 工具）；
- 重启 profile 并新建会话；
- 若仍缺失，用 `scripts/qa-p4-fullstack.ps1` 复跑工具注册断言。

### 4.2 已安装但显示未授权 / onboarding

未授权状态只显示官方 `registerApp` 确认链接与引导，这是**诚实状态**，不是故障：

- 用 `feishu_onboard(action=start, ...)` 拿到一次性确认链接，在飞书官方页面扫码/确认；
- 管理员审批、机器人入群、群镜像按飞书平台规则完成；
- 确认后 `feishu_onboard(action=status, runId=...)` 查询结果；
- `connected` 只在 WebSocket 长连接真实建立后出现；离线/未授权绝不显示 connected。

### 4.3 已授权但消息失败

- `feishu_status` 查看各机器人长连接状态与最近错误；
- 检查机器人权限、接收方 id（open_id/chat_id）、群绑定（`/ai-company/feishu/group/bind`）与凭据有效性；
- 检查 DSH_HOME 下 `ai-company-feishu-registry.json` / `ai-company-feishu-credentials.json`（旧名 `feishu-*` 会自动迁移）。

### 4.4 凭据安全

App Secret 仅经 Windows DPAPI（CurrentUser 作用域）加密保存在本机 `ai-company-feishu-credentials.json`。不要在 issue、日志、回复或仓库中粘贴 App Secret、Token、Cookie、webhook 或用户标识。本包与仓库不内置任何凭据（security-scan 实测 PASS）。

## 5. 开发验证

静态检查：

```powershell
node tests/bundle-check.mjs
node tests/client-feishu-check.mjs
powershell -File tests/smoke.ps1
powershell -File scripts/security-scan.ps1
npm pack --dry-run
```

隔离生命周期检查：

```powershell
powershell -File tests/install-bundle.ps1 -DshBin <path-to-@deepseek-ai/dsh/lib/bin.js>
powershell -File scripts/lifecycle-fullstack.ps1
powershell -File scripts/qa-p4-fullstack.ps1
powershell -File scripts/qa-p4-web.ps1
```

这些脚本用临时 `DSH_HOME`；失败时加 `-KeepTemp` 保留现场。禁止把生产 `$DSH_HOME` 作为测试 `WorkRoot`。
