# 发布与冷启动计划（拿 Star 行动手册）

> 目标：发布后 30 天内获得第一批真实 star、issue 与贡献者。
> star 是结果不是目标——目标是让「小白 5 分钟开 AI 公司」的价值被看见、被验证、被传播。

## 1. 发布前检查（候选材料已就绪，外部动作待人工确认）

- [x] 中英文 README 已按原生 Bundle `0.3.0` 更新（单下载满血聚合口径）
- [x] MIT 许可证 + CONTRIBUTING + CODE_OF_CONDUCT
- [x] Bundle/smoke/security/metadata/隔离安装与卸载测试通过
- [x] 14 Skills、7 模板与发布包资源核对通过
- [x] 截图、文本路径、凭据与 Session 标识安全复核通过
- [ ] npm 发布、GitHub tag/Release、push 与外部 PR（必须由仓库所有人明确确认后执行）

## 2. 冷启动三件套（发布后立刻做）

### 2.1 Demo 视频/GIF（30 秒）

- 录屏：新会话 → 说一句话 → 自动建司 → 员工入职 → 首单交付
- 放仓库顶部 README（GitHub 原生支持 mp4/GIF 预览）
- 这是转化率最高的素材，**没有 demo 的仓库 star 转化率低一个数量级**

### 2.2 截图证据包

- 建司成功的团队面板截图
- 首单交付物截图（种草笔记/话术包）
- 飞书手机遥控截图
- 放入 `assets/demo/` 或文档

### 2.3 发布帖文案（中英文各一份）

- 标题模板：
  - 中文：`一句话开一家 AI 公司？这个开源框架让小白 5 分钟拥有自己的多 Agent 团队`
  - English: `Spin up an AI company with one sentence — an open-source multi-agent orchestration framework for non-developers`
- 正文：5 大卖点 + 1 个 demo + 仓库链接 + 求 star 求反馈

## 3. 发布渠道（按优先级）

| 渠道 | 内容形式 | 时间 |
|------|----------|------|
| GitHub 自身 | Release 发布 + Topics 优化 | 今天 |
| 掘金 | 中文长文教程（5 分钟开公司实录） | 第 1 周 |
| 知乎 | 回答「普通人能用 AI 做副业吗」类问题 | 第 1 周 |
| B站 | 录屏 demo 视频 | 第 1 周 |
| V2EX | 中文技术社区帖 | 第 1–2 周 |
| 即刻/微博 | 短图文 | 第 1 周 |
| Hacker News | English: Show HN | 第 2 周 |
| Reddit | r/MachineLearning / r/selfhosted / r/ArtificialIntelligence | 第 2 周 |
| Product Hunt | 正式 Product 页 | 第 3–4 周 |

> HN/Reddit 有"Show HN"文化：诚实描述 + 求反馈，不要硬推。

## 4. 冷启动细节

- 发布当天在 GitHub 提 2–3 个高质量 issue（如「插件市场规划」「示例公司征集」），让仓库看起来活跃；
- 找 3–5 个朋友各提一个 issue/PR（真实性优先，不刷 star）；
- 每个 issue/PR 24 小时内回复（回应速度 = 社区口碑）；
- 每周一个 release note 更新（哪怕小修）；
- README 顶部 badge 已就绪，增加 stars/forks badge 增强社会证明。

## 5. 数据目标（30 天）

| 指标 | 保守 | 理想 |
|------|------|------|
| star | 30 | 100+ |
| fork | 5 | 20 |
| issue/PR | 5 | 15 |
| 每周活跃 | 1 更新 | 2 更新 |

## 6. 社区运营红线

- 不刷 star、不买流量、不做虚假 commit 数量；
- 不用「AI 生成」水评论；
- 涉及真实用户数据（公司/客户/订单）一律不上传；
- 飞书 0.4.0 标注 staging，不夸大生产可用性；
- demo 诚实：展示真实跑通的流程，不演示未实现功能。

## 7. 后续候选方向（0.3.0 已交付 AgentTeams/员工侧栏/飞书桥；以下为后续候选）

- 更多示例公司（餐饮 / 教育 / 游戏 / 咨询）
- 宿主侧新会话引导体验（需与 DSH Desktop 单独协作）
- 示例数据与可复现 demo
- 贡献者指南完善 + good-first-issue 标签
- 经人工确认后向 `awesome-dsh-plugin/awesome-dsh-plugin` 提交目录条目
