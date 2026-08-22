# 常见问题（FAQ）

## 安装与运行

### Q1：怎么安装？

通过当前 DSH CLI 安装到指定 profile：

```powershell
npm pack
dsh plugin --profile web add .\ai-company-framework-0.3.0.tgz
```

如果 `dsh` 不在 PATH，使用当前 DSH 安装内的 `@deepseek-ai/dsh/lib/bin.js`：

```powershell
node <path-to-bin.js> plugin --profile web add .\ai-company-framework-0.3.0.tgz
```

> 请从打包 `.tgz`/registry 安装；`add <源码目录>`（`link:`）不会安装 AgentTeams 等依赖。

### Q2：仓库能放别的盘吗？

可以。先 `npm pack` 再安装 tgz；Bundle 运行时通过 `import.meta.url` 从实际 package 目录定位 `core/skills`，不依赖源码仓库绝对路径。

### Q3：为什么不再推荐 `scripts/install.ps1`？

它是 legacy 源码复制脚本，会把 Skill 写进用户全局目录，不属于 DSH Bundle 的 dependency/layer 生命周期。原生 `dsh plugin` 安装可由 pnpm remove 干净卸载，不覆盖用户 Skill。

### Q4：怎么卸载？

```powershell
dsh plugin --profile web remove ai-company-framework
```

然后重启 profile。卸载不会删除用户自己的 `$DSH_HOME/skills`。

### Q5：兼容哪些版本？

当前实际验证基线是 DSH `0.1.0-rc.8`；peer 为 `@deepseek-ai/cordis ^4.0.1` + 5×dsh `^0.1.0-rc.8`；依赖精确 pin `@nanmicoder/dsh-agent-teams@0.1.10`、`@larksuiteoapi/node-sdk ^1.65.0`。项目自定义 `manifest.json` 中的 `minFrameworkVersion` 不是 DSH 读取的兼容协议。

> 安装期 pnpm 可能出现 "peers missing" 告警：DSH profile 以 `autoInstallPeers:false` 运行，`@deepseek-ai/cordis` 与各 `@deepseek-ai/dsh-*` peer 由宿主闭包在运行时解析。这是预期行为，不是安装失败，不影响加载与启动。

### Q6：需要 API Key 吗？

本 Bundle 不携带模型或凭据。模型可用性、登录与密钥由 Harness 和用户自己的 provider 配置决定；**会话运行前需在宿主「设置 → 模型」配置你自己的 provider API Key**。飞书 App Secret 属另一回事：仅授权时经 DPAPI 本地加密存储。

## 使用

### Q7：为什么要新建会话？

框架规程是“一会话一家公司”。复用会话会恢复旧公司上下文；开新公司请新建会话。三栏 UI（活动面板/员工侧栏/飞书栏）也挂载在会话界面。

### Q8：为什么 catalog 只有 14 个 Skill？

这是预期结果：3 个框架 Skill + 11 个岗位 Skill。7 个模板和飞书 SOP 是按需读取资源，不是独立 Skill。

### Q9：AgentTeams、员工侧边栏是这个包做的吗？

v0.3.0 起**是**：AgentTeams 运行时与活动面板由本 Bundle 的依赖 `@nanmicoder/dsh-agent-teams@0.1.10` 提供（独立 row 装配）；员工侧边栏与飞书栏由本 Bundle 的 host + 复合 client bundle 实现（收编自获授权本地包，见 `NOTICE.md`）。模型、会话、沙盒与 Skill registry 仍由宿主提供。

### Q10：老板会问很多问题吗？

以当前加载的 `company-boss` / `company-pipeline` 规则为准。它们会优先问影响架构与验收的必要信息，其余可用明确假设推进。

### Q11：产出在哪？

框架约定公司目录为 `<workspace>/companies/<会话ID>/`，其中 `.dsh/` 存绑定与岗位 Skill，`交付/`、`质检/` 和 `验证/` 存业务材料。实际写入受宿主沙盒和用户授权控制。

## 飞书

### Q12：Bundle 自带飞书吗？

v0.3.0 起**自带**：飞书桥 host（`plugins/feishu/lib/`，更名 `ai-company-framework-feishu`）与「飞书机器人」栏 UI（复合 `client.js`）随安装激活，提供 `feishu_*` 工具、官方 registerApp 扫码向导、DPAPI 凭据与 N 条长连接。但**首次使用必须完成人工官方授权**（扫码/管理员审批/入群）；未授权只显示 onboarding 引导，不显示 connected。

### Q13：安装 Bundle 后为什么没有 `feishu_onboard`？

- 检查 `--dump-config` 有 `ai-company-framework` row（host apply 时同步注册 4 个 `feishu_*` 工具）；
- 重启 profile 并新建会话；
- 若仍缺失，用 `scripts/qa-p4-fullstack.ps1` 复跑工具注册断言。

### Q14：机器人会自动进群吗？

不会自动。群权限申请、管理员审批、机器人入群与群镜像都在飞书官方页面由用户操作（向导可申请群权限，但最终确认在官方侧）。未授权/未入群状态如实显示。

## 内容、质量与安全

### Q15：生成内容能直接发布吗？

仍需人工把关，特别是价格、合同、法律、医疗、功效和对外承诺。Skill 的内部质检不能替代责任主体审核。

### Q16：公司之间会不会串数据？

Skills 规定会话、团队和 company root 隔离；真正的文件访问控制由宿主沙盒执行。不要关闭宿主安全边界或让成员越界扫描其它公司目录。

### Q17：有 RAG 或向量库吗？

没有。本 Bundle 不包含 RAG、向量数据库、遥测客户端或独立网络服务。

## 开发与扩展

### Q18：怎么写自己的 DSH Bundle？

见 [PLUGINS.md](PLUGINS.md)。真实最小契约是 npm `package.json.dsh.bundle.patch` + 顶层数组 `cordis.patch.yml`；`plugin-manifest/v1`、`afterCompanyCreate` 和 `dsh-manifest.json` 都不是当前 DSH 的必需契约。

### Q19：可以商用吗？

可以，项目使用 MIT 许可证；请保留许可证和版权声明，并自行核对外部宿主/插件的许可证。
