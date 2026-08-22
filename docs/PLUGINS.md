# DSH Bundle 扩展指南

本文只描述当前已验证的 DeepSeek Harness profile Bundle 机制。旧的 `plugin-manifest/v1`、`afterCompanyCreate` hook 和 `minFrameworkVersion` 不是 DSH `0.1.0-rc.8` 会读取的协议，不应作为插件安装契约。

## 1. Bundle 是什么

Bundle 是一个可由 pnpm 安装的 npm package。包在 `package.json` 中声明一个 patch 文件，DSH CLI 安装成功后把包名加入目标 profile 的 `dsh.profile.bundles`。

最小结构：

```text
my-dsh-bundle/
├─ package.json
├─ cordis.patch.yml
├─ index.js                 # 只有需要运行时代码时才要
└─ skills/                  # 可选包内资源
```

DSH 特有声明：

```json
{
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"
    }
  }
}
```

`dsh-manifest.json` 不是已证实的强制文件。`package.json.files` 也没有全局固定白名单；每个包只需确保发布产物实际包含 patch、入口和被引用资源。

## 2. Patch 规则

`cordis.patch.yml` 顶层必须是数组。最小插件 row：

```yaml
- insert:
    - id: my-dsh-bundle
      name: 'my-dsh-bundle'
```

规则：

- `id` 应稳定且唯一；
- `name` 必须能从目标 profile 的模块解析路径导入；
- later layer 对命中 row 的 `config` 是整值替换，不是深度合并；
- patch 文件缺失、不可解析或不是顶层数组时，profile 启动失败；
- 只贡献配置时可以没有自有运行时入口；插入本包作为 Cordis 插件时才需要可导入入口。

不要为了加入 Skill 而覆盖 base 的 `skill-filesystem` row：web profile 会禁用该 host row。应插入独立 provider row。

## 3. 包内 Skill provider

AI Company Framework 采用官方 `@deepseek-ai/dsh-skill-filesystem`，没有重写 frontmatter 解析、Skill catalog 或 watcher：

```js
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply as applyFileSystemSkills } from '@deepseek-ai/dsh-skill-filesystem'

export const name = 'my-dsh-bundle'
export const inject = ['skills']

export function apply(ctx) {
  applyFileSystemSkills(ctx, {
    providerName: name,
    includeDefaultRoots: false,
    bundledSkillDir: join(dirname(fileURLToPath(import.meta.url)), 'skills'),
    watch: false,
  })
}
```

对应 package metadata：

```json
{
  "type": "module",
  "main": "./index.js",
  "peerDependencies": {
    "@deepseek-ai/dsh-skill-filesystem": "^0.1.0-rc.8"
  }
}
```

为什么这样做：

- `import.meta.url` 让资源路径随实际安装目录解析；
- `includeDefaultRoots: false` 避免重复扫描用户和项目 Skills；
- `bundledSkillDir` 把候选标为 bundled；
- 宿主 peer 不放进普通 dependencies，避免安装第二份 Harness 运行时；
- 包内资源随 dependency 卸载，无需写用户全局 Skill 目录。

## 4. Skill 与资源格式

文件系统 provider 发现一层：

```text
skills/<name>.md
skills/<name>/SKILL.md
```

不递归发现 `skills/**/SKILL.md`。Frontmatter 至少包含 kebab-case `name` 和字符串 `description`：

```markdown
---
name: role-voice
description: 为内容工作流提供配音岗位规程。
whenToUse: 需要配音岗位时加载。
---

# 配音岗位
...
```

flat Markdown Skill 的资源基准是其所在目录。若 Skill 引用模板：

```text
skills/role-voice.md
resources/voice-checklist.md
```

正文应使用相对路径 `../resources/voice-checklist.md`。资源按需读取，不会自动成为 Skill catalog 条目。

## 5. 安装、升级与卸载

真实命令顺序：

```text
dsh plugin --profile <name> add <package-spec>
dsh plugin --profile <name> update <package-name>
dsh plugin --profile <name> remove <package-name>
```

`plugin` 是 pnpm 薄转发器。成功后，CLI 按当前依赖状态调和 `dsh.profile.bundles`：

- 新安装 dependency 声明 `dsh.bundle.patch` → 加入 layer；
- dependency 被 remove → 移除 layer；
- 升级后新增/删除声明 → 相应激活/停用。

Bundle 变更后重启目标 profile。不要声称自定义 manifest hook 会在安装时运行；当前 CLI 没有这条生命周期。

## 6. 兼容性

- package 版本使用标准 npm `version`；
- 对宿主能力的兼容范围放在 `peerDependencies`；
- README 写明实际测试过的 DSH 版本；
- 不发明 `minFrameworkVersion`、schemaVersion 或 DSH 不读取的兼容字段；
- prerelease 兼容必须用能覆盖目标 rc 的 semver，并以隔离安装实测为准。

当前项目已验证 DSH `0.1.0-rc.8`。更高版本不能仅凭 semver 推断通过，需重跑真实安装测试。

## 7. UI 与外部服务

- 没有浏览器 UI 就不要声明 `dsh.client`；需要 UI 时，客户端双面契约 = `package.json` 声明 `dsh.client`（`platform: "web"` + `inject` 服务集）+ `exports["./client"]` 指向已构建的 `lib/client.js` 类产物。
- 客户端发现机制：`@deepseek-ai/dsh-client-modules` 扫描 **Loader entries（组合后的 Cordis rows）**，不是依赖表——一个包只有作为活跃 row 才会被发现并注入 `window.__DSH_BOOT__`；row 的 `name` 与包名必须一致，包需从 profile 根可解析（新 profile 默认 `nodeLinker: hoisted`，注册表传递依赖可解析）。
- 一个 loader entry 只暴露一个 `./client` bundle：多个 UI 面（如员工侧栏 + 飞书栏）应合并为一个复合 client 模块。
- 飞书、数据库、网络服务等外部能力必须声明实际 provider 和安装步骤；自 v0.3.0 起本包的 `plugins/feishu/lib/` 已收编飞书桥 host（更名 `ai-company-framework-feishu`），`client.js` 提供飞书栏 UI——授权仍是人工闸门（见 `NOTICE.md`）。

## 8. 测试清单

开发者静态检查：

```powershell
node tests/bundle-check.mjs
npm pack --dry-run
```

真实隔离检查：

```powershell
powershell -File tests/install-bundle.ps1 -DshBin <path-to-@deepseek-ai/dsh/lib/bin.js>
```

至少断言：

- profile dependency 与 `dsh.profile.bundles` 含包名；
- `--dump-config` 出现 Bundle row；
- 新 provider 能 list/get 全部预期 Skill；
- remove 后 dependency、layer、package 目录消失；
- 用户 Skill 哨兵未被修改。

## 9. 项目自有 `manifest.json`

仓库仍可能保留用于历史工具或内容清单的 `manifest.json`，但它不是 DSH Bundle manifest。DSH CLI 不读取其中的：

- `schemaVersion: plugin-manifest/v1`；
- `minFrameworkVersion`；
- `skills` 清单；
- `hooks.afterCompanyCreate` 等 hook。

若内部工具继续消费该文件，必须把它称为“项目元数据”，不得写成 Harness 或 marketplace 的安装协议；任何 hook 也只能由明确实现的调用方执行。
