# 插件开发指南（给代码爱好者）

框架从设计上就是可插拔的。**你写的插件可以给框架加岗位、加能力、加流程**，而不用改框架本体。本指南带你从零写一个插件。

## 1. 插件是什么

插件 = 一个目录 + 一份 `manifest.json`：

```text
plugins/<plugin-id>/
├─ manifest.json     # 插件声明（必填）
├─ skills/           # 本插件贡献的技能文件（可选）
├─ scripts/          # 钩子脚本，PowerShell 或 Node（可选）
└─ README.md         # 给用户的说明（推荐）
```

## 2. manifest.json 规范（schemaVersion: plugin-manifest/v1）

```json
{
  "schemaVersion": "plugin-manifest/v1",
  "id": "my-plugin",
  "name": "我的插件",
  "version": "0.1.0",
  "description": "一句话说明这个插件做什么",
  "minFrameworkVersion": "2.0",
  "author": "你的名字/GitHub 账号",
  "license": "MIT",
  "skills": [
    { "file": "skills/role-my-role.md", "roleName": "my-role", "kind": "role" },
    { "file": "skills/task-helper.md", "kind": "skill" }
  ],
  "hooks": {
    "afterCompanyCreate": [
      { "type": "ps1", "path": "scripts/setup.ps1" }
    ],
    "beforeFirstTask": [],
    "afterTaskComplete": [],
    "beforeDelivery": []
  },
  "requires": [],
  "conflicts": []
}
```

### 2.1 字段说明

| 字段 | 必填 | 说明 |
|------|:---:|------|
| `schemaVersion` | ✅ | 固定 `plugin-manifest/v1` |
| `id` | ✅ | 插件唯一 ID，小写字母数字+连字符 |
| `name` | ✅ | 展示名 |
| `version` | ✅ | 语义化版本 |
| `description` | ✅ | 给用户的一句话介绍 |
| `minFrameworkVersion` | 否 | 要求的最低框架版本 |
| `author` / `license` | 否 | 署名与许可证 |
| `skills` | 否 | 注入的技能文件（见 3） |
| `hooks` | 否 | 挂载点脚本（见 4） |
| `requires` / `conflicts` | 否 | 依赖/冲突的其他插件 ID |

## 3. 注入技能

### 3.1 注入新岗位（kind: role）

给框架加一个全新岗位（如「配音员」）：

1. 写技能文件 `skills/role-voice.md`，内容参考 `core/skills/role-*.md` 的骨架（职责/工具纪律/验收标准/汇报格式）；
2. 在 manifest 的 `skills` 里声明 `{ "file": "skills/role-voice.md", "roleName": "voice", "kind": "role" }`；
3. 用户建司时，老板就能在岗位模板里选用「voice」岗位。

### 3.2 注入辅助技能（kind: skill）

给已有岗位补充能力（如给客服加「开单」技能），用 `kind: "skill"`，安装时会作为该岗位的补充技能提示注入。

## 4. 挂载点（hooks）

| 挂载点 | 时机 | 传参（环境变量） |
|--------|------|------------------|
| `afterCompanyCreate` | 公司目录+团队创建后 | `DSH_SESSION_ID`、`COMPANY_ROOT`、`TEAM_NAME` |
| `beforeFirstTask` | 首次派任务前 | 同上 |
| `afterTaskComplete` | 单个任务完成后 | 同上 + `TASK_ID`、`TASK_OUTPUT` |
| `beforeDelivery` | 交付打包前 | 同上 |

脚本类型 `ps1`（PowerShell）或 `node`（Node.js）。脚本执行约定：

- **只允许读/写当前 `COMPANY_ROOT` 内**；越界即失败；
- 输出统一 `Write-Output`（PowerShell）或 `console.log`（Node）一行 JSON 结果：`{"ok":true,"note":"..."}`；
- 失败返回非 0 退出码 = 该挂载点失败，老板会看到显式报错，不静默跳过；
- 脚本不得访问凭据文件、不得联网上传数据。

## 5. 安全与隔离红线（插件必须遵守）

1. **公司隔离**：只读写 `COMPANY_ROOT`；禁止扫 `companies/` 父目录、禁止读兄弟公司；
2. **凭据红线**：App Secret / Token / Cookie / webhook 不得进插件代码、日志、或插件文档；需要存凭据必须走平台加密（如 Windows DPAPI）；
3. **去敏**：插件不得把客户数据写进共享经验库或任何公共文件；
4. **确定性**：插件默认不得依赖外部网络服务；需要时在 manifest 声明并在文档说明；
5. **卸载干净**：插件产生的文件应只在公司目录内，卸载时给出清理脚本。

## 6. 完整示例：做一个「配音插件」

```powershell
# 目录
plugins/voice/
├─ manifest.json
├─ skills/role-voice.md
├─ scripts/setup.ps1
└─ README.md
```

`manifest.json`：

```json
{
  "schemaVersion": "plugin-manifest/v1",
  "id": "voice",
  "name": "配音插件",
  "version": "0.1.0",
  "description": "给内容公司加一个配音岗位，自动把文案合成为语音",
  "author": "you",
  "license": "MIT",
  "skills": [
    { "file": "skills/role-voice.md", "roleName": "voice", "kind": "role" }
  ],
  "hooks": {
    "afterCompanyCreate": [{ "type": "ps1", "path": "scripts/setup.ps1" }]
  }
}
```

`skills/role-voice.md`（骨架）：

```markdown
# 岗位：配音员（voice）

- 职责：把文案按语气/节奏合成为语音，输出到公司目录 素材/voice/
- 输入契约：上游文案文件路径
- 输出契约：<companyRoot>/素材/voice/<文件>.mp3
- 模型路由：批处理档

## 验收标准
- [ ] V1 输入读取不越公司目录
- [ ] V2 输出文件与上游契约一致
- [ ] V3 结果可被质检复核
```

`scripts/setup.ps1`：

```powershell
# 建司后创建配音素材目录
$root = $env:COMPANY_ROOT
New-Item -ItemType Directory -Force -Path (Join-Path $root '素材\voice') | Out-Null
Write-Output '{"ok":true,"note":"voice dir ready"}'
```

## 7. 测试你的插件

1. 把插件目录放进 `plugins/`（或你自己的仓库）；
2. 写一个公司用一下：新建会话 → 说「我要开一家做有声书的公司」→ 建司时看老板是否列出「配音员」岗位；
3. 检查 `afterCompanyCreate` 钩子是否创建了目录；
4. 跑冒烟测试：`.\tests\smoke.ps1 -PluginId voice`（在途）。

## 8. 提交插件

- 插件放自己仓库，README 里注明「AI Company Framework 插件」；
- 提供 `manifest.json` 与安装说明；
- 欢迎 PR 到本仓库 `plugins/` 目录（我们会加「插件市场」索引）。

## 9. 插件市场（规划）

- v0.2 提供 `plugins/index.json` 注册表：插件名 / 作者 / 版本 / 描述 / 仓库地址；
- 安装命令（规划）：`.\scripts\install-plugin.ps1 -Id <id>`；
- 一键体验（规划）：示例公司自动加载示例插件。

---

**写插件最酷的部分**：你不懂 Agent 内部细节也能加能力——只需一份 manifest + 一个技能文件。剩下的交给框架。
