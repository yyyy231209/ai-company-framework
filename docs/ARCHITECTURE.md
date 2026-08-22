# 架构说明

AI Company Framework `0.3.0` 是安装到 DeepSeek Harness profile 的**单下载满血聚合 Bundle**：一次 `dsh plugin add <tgz>` 获得 14 个 Skill、7 个模板、AgentTeams 运行时与活动面板、员工侧边栏（host+UI）、飞书桥（host+UI）。模型、会话、工具、沙盒与 Skill registry 由 Harness / DSH Desktop 提供。

当前已验证基线为 `@deepseek-ai/dsh 0.1.0-rc.8`、`@deepseek-ai/dsh-skill-filesystem 0.1.0-rc.8`、`@nanmicoder/dsh-agent-teams 0.1.10`（精确 pin）。

## 1. 分层

| 层 | 负责内容 |
|---|---|
| DeepSeek Harness | 模型、工具、持久会话、Skill registry、沙盒、web 服务器、客户端模块系统 |
| DSH Desktop | 桌面 GUI（原生目录桥等宿主界面服务） |
| AI Company Framework Bundle | Skills/模板 provider + 员工侧栏 host + 飞书桥 host + 复合 client bundle（侧栏/飞书栏 UI） |
| 依赖组件 | `@nanmicoder/dsh-agent-teams`（AgentTeams 运行时 + 活动面板 client，独立 Cordis row） |
| 人工闸门 | 模型 provider API Key、飞书官方授权（扫码/管理员审批/入群）、工作区选择——本 Bundle 不自动化 |

## 2. 真实 Bundle 结构

```text
ai-company-framework/
├─ package.json             # npm 元数据 + dsh.bundle.patch + dsh.client + dependencies
├─ cordis.patch.yml         # 双 row：ai-company-framework + agent-teams
├─ index.js                 # ESM 入口：Skills provider + 侧栏 host + 飞书桥 host
├─ client.js                # 复合 client bundle（员工侧栏 + 飞书栏，单 loader entry）
├─ core/
│  ├─ skills/               # 14 个一层 flat Markdown Skill
│  ├─ templates/            # 7 个按需读取的模板
│  └─ feishu-onboarding-sop.md
├─ plugins/sidebar/lib/     # 员工侧栏 host（去 Manju 化，见 NOTICE.md）
├─ plugins/feishu/lib/      # 飞书桥 host（更名 ai-company-framework-feishu，见 NOTICE.md）
├─ NOTICE.md                # 收编来源与授权、供应链边界
├─ docs/
└─ assets/
```

`package.json` 的 DSH 声明：

```json
{
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web", "inject": [ "@deepseek-ai/dsh-client-connection", "@deepseek-ai/dsh-client-runtime", "@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-settings", "@deepseek-ai/dsh-client-ui-settings-plugins" ] }
  },
  "dependencies": {
    "@nanmicoder/dsh-agent-teams": "0.1.10",
    "@larksuiteoapi/node-sdk": "^1.65.0"
  }
}
```

`cordis.patch.yml` 插入两个稳定 row：

```yaml
- insert:
    - id: ai-company-framework
      name: 'ai-company-framework'
    - id: agent-teams
      name: '@nanmicoder/dsh-agent-teams'
      config:
        stateDir: .agent-teams
        memberProvider: spawn
```

### 2.1 为什么聚合 patch 要自己插 `agent-teams` row

`dsh plugin add` 只把**被直接 add 的包**调和进 profile 的 `dsh.profile.bundles`；传递依赖（这里是 `@nanmicoder/dsh-agent-teams`）不会自动成为 layer，其自带 patch 不会被应用。因此聚合包在自己的 patch 里插入该 row：

- host 侧：Loader 从 profile 根解析该包并装载（工具/usage 段进入系统提示）；
- client 侧：`dsh-client-modules` 扫描 **loader entries**（非依赖表），该 row 使 agent-teams 的 `dsh.client` 与 `exports["./client"]` 被发现的，活动面板注入 Web UI。

新 profile 默认 `nodeLinker: hoisted`，注册表传递依赖提升到 `profile/node_modules` 顶层，保证上述解析成立。

## 3. Skill 与资源数据流

```text
profile 启动
  → 应用 ai-company-framework 的 cordis.patch.yml（双 row）
  → Loader 导入 index.js（+ agent-teams）
  → index.js：注入宿主 skills 服务 + 侧栏 host + 飞书桥 host
  → @deepseek-ai/dsh-skill-filesystem：bundledSkillDir = <已安装包>/core/skills
  → 14 个 Skill 进入宿主 Skill catalog
```

实现只复用官方文件系统 provider：

- `includeDefaultRoots: false`：只观察本包资源，不重复扫描项目或用户 Skill 根；
- `bundledSkillDir` 由 `import.meta.url` 解析，安装位置变化不会破坏路径；
- `watch: false`：已安装包内容在当前进程内视为不可变，升级后重启 profile；
- 没有把 Skill 复制到 `$DSH_HOME/skills`，因此不会覆盖用户同名文件。

### 3.1 资源基准

每个 flat Skill 位于 `core/skills/<name>.md`。文件系统 provider 把其资源基准设为 `core/skills/`：

- 模板：`../templates/<file>.md`
- 飞书 SOP：`../feishu-onboarding-sop.md`

7 个模板和 SOP 是按需读取资源，不是额外的 Skill catalog 条目。验收数字是 **14 个 Skill**。

### 3.2 为什么不覆盖 base `skill-filesystem` row

web profile 会禁用 base 的 host `skill-filesystem`。本 Bundle 改为插入独立 host provider row，宿主 `skills` registry 会合并，不修改 base 配置。

## 4. 客户端双面协议（v0.3.0 新增）

- 包声明 `dsh.client`（platform: web + inject 服务集）并导出 `exports["./client"] = "./client.js"`；
- `dsh-client-modules`（宿主）扫描 loader entries，把每个活跃 row 包名的 `./client` 编译进 `window.__DSH_BOOT__` 模块图，经 `/plugins/<id>/client.js` 提供；
- 本包 `client.js` 是**复合单 bundle**：员工侧栏 + 飞书栏合并为一个 `ai-company-framework` 模块（一个 loader entry 只暴露一个 `./client`）；
- agent-teams 的 client（活动面板）由该包自带，经聚合 patch 的 row 被同一机制发现；
- 诚实状态：所有 UI 状态来自宿主路由（`/ai-company/sidebar/state`、`/ai-company/feishu/state`），未授权/未安装/离线如实展示并给引导。

## 5. 宿主路由（v0.3.0 新增）

| 路由 | 提供者 | 说明 |
|---|---|---|
| `GET /ai-company/sidebar/state` | 侧栏 host | 团队名单 + 模型目录 + 路由覆盖 + 能力探测 |
| `POST /ai-company/sidebar/reconfigure` | 侧栏 host | `{childSessionId, provider, model?}` 设置覆盖；仅 `{childSessionId}` = 重置 |
| `GET /ai-company/feishu/state` | 飞书桥 host | 脱敏注册表 + 会话公司作用域 + 计数；无 sessionId 时 fail-closed 空视图 |
| `/ai-company/feishu/wizard/*`、`/company/bind`、`/group/*` | 飞书桥 host | onboarding/绑定/群管理（均需人工官方授权后可用） |

旧 `/feishu/*` 别名仅在检测不到独立旧桥 row 时注册，避免重复注册冲突。

## 6. 公司工作流边界

### 6.1 本 Bundle 提供

- `company-boss`、`company-pipeline`、`company-role-template` 与 11 个 `role-*`；
- 任务、质检、返工、交付等 7 个模板；会话即公司、任务依赖、验收与去敏经验规则；
- AgentTeams row 装配（依赖组件）；员工侧栏 host+UI；飞书桥 host+UI 与 `feishu_*` 工具。

### 6.2 宿主提供

- 模型、会话、工具、沙盒、Skill registry、web 服务器与客户端模块系统；
- 原生目录选择桥、设置界面等桌面宿主服务。

### 6.3 人工闸门（本 Bundle 不实现）

- 模型 provider API Key 配置；
- 飞书官方授权（registerApp 扫码、管理员审批、机器人入群、群镜像）；
- 工作区选择。

## 7. 安装、升级与卸载

真实 CLI 语法要求 `--profile` 写在 `plugin` 子命令之后：

```text
dsh plugin --profile web add <package-or-tarball>
dsh plugin --profile web update ai-company-framework
dsh plugin --profile web remove ai-company-framework
```

- `dsh plugin` 转发 pnpm；成功后按已安装依赖是否声明 `dsh.bundle.patch` 调和 `dsh.profile.bundles`（只调和顶层依赖）。
- 重复 `add` 幂等；升级后重启 profile 使新依赖生效；失败安装被拒绝且 profile manifest 不变（回滚无残留）。
- 卸载：pnpm 删除 profile dependency 与孤儿传递依赖，CLI 移除 Bundle layer；本包从不写用户 Skill 根，无需清理用户 Skills；公司数据与飞书凭据按设计保留。
- **安装必须使用打包 `.tgz` 或 registry spec**；`add <目录>`（`link:`）不会安装被链接包的依赖树。

## 8. 兼容与版本

- 本包版本 `0.3.0`；DSH 兼容经 `peerDependencies` 表达（cordis ^4.0.1 + 5×dsh rc.8）；
- 依赖精确 pin `@nanmicoder/dsh-agent-teams@0.1.10`（P4 实测版本，MIT 公开包）；
- 当前实际验证基线 DSH `0.1.0-rc.8`；更高版本须重跑真实隔离安装测试，不能仅凭 semver 推断；
- DSH 不读取项目自定义 `manifest.json` 中的 `minFrameworkVersion`、hooks 或 skills 清单；不得用这些字段承诺兼容性。

## 9. 安全设计

| 风险 | 约束 |
|---|---|
| 覆盖用户 Skill | 包内 provider，不复制到用户根 |
| 卸载残留 | 代码/资源留在 npm package 目录，随 remove 清除；用户数据刻意保留 |
| 跨公司数据 | 路由/状态按会话公司作用域 fail-closed；实际权限由宿主沙盒执行 |
| 凭据泄漏 | 授权前不产生凭据文件；App Secret 仅 DPAPI（CurrentUser）本地加密；仓库/包内无带值密钥（security-scan 实测 PASS） |
| 外部能力冒领 | connected 仅当 WebSocket 真实建立；未授权只显示 onboarding 引导 |
| 供应链 | 依赖精确 pin + `pnpm audit` 无漏洞；不依赖 unscoped `dsh-feishu-bridge`（同名异源包）；闭包 0 缺失许可；收编来源见 NOTICE.md |
| 数据外传 | 无 RAG、无遥测实现、无本包独立网络服务（飞书桥仅连飞书官方 API） |
| 安装后门 | 无自定义 postinstall hook；`dsh plugin` 生命周期唯一入口 |

## 10. 验证

静态验证：

```powershell
node tests/bundle-check.mjs
node tests/client-feishu-check.mjs
powershell -File tests/smoke.ps1
powershell -File scripts/security-scan.ps1
npm pack --dry-run
```

隔离生命周期验证：

```powershell
powershell -File tests/install-bundle.ps1 -DshBin <path-to-@deepseek-ai/dsh/lib/bin.js>
powershell -File scripts/lifecycle-fullstack.ps1          # P3：17 项生命周期全绿
powershell -File scripts/qa-p4-fullstack.ps1               # P4：确定性段 17 项
powershell -File scripts/qa-p4-web.ps1                     # P4：web 真实启动段 22 项（__DSH_BOOT__ 双 bundle、侧栏/飞书路由、卸载回滚）
```

全部在临时 `DSH_HOME` 中执行，不触碰生产环境。
