# 贡献指南

感谢你有兴趣为 AI Company Framework 做贡献！任何形式的帮助都欢迎：提问、报 bug、写文档、写插件、提 PR。

## 贡献方式

### 1. 提问与讨论

- 使用 [Issues](https://github.com) 提问，标题用「[问题]」前缀；
- 描述你的目标（想开什么公司/想加什么能力），比报错更有用。

### 2. 报 Bug

Issue 模板字段：

```text
- Harness 版本：
- 框架版本（CHANGELOG 顶部）：
- 复现步骤（新会话从哪句话开始）：
- 期望行为：
- 实际行为（含报错原文，不含凭据）：
```

### 3. 写文档

- 中文文档优先，结构参照 `docs/` 现有文件；
- 保持「小白能看懂」：少术语、多步骤、给示例；
- 每个文档不超过 300 行，长内容拆文件。

### 4. 写插件

- 完整规范见 `docs/PLUGINS.md`；
- 插件必须自带 `manifest.json` 与 README；
- 提交到 `plugins/` 目录或自己仓库后提 PR 加入索引。

### 5. 提 PR

```text
1. fork 本仓库
2. 新建分支：feat/xxx 或 fix/xxx
3. 改动后本地验证：
   powershell -ExecutionPolicy Bypass -File tests\smoke.ps1
4. 提交 PR，描述改动与验证结果
```

## 编码与安全约定

- 不向仓库提交：凭据、Token、Cookie、webhook URL、业务数据、截图证据；
- 脚本默认不联网、不读公司目录外数据；
- PowerShell 脚本避免中文硬编码（用英文输出，避免编码坑）；
- 新文件必须通过 `scripts/security-scan.ps1`。

## 行为准则

见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)：尊重、友好、对事不对人。
