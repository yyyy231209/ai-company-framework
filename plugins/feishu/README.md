# 飞书桥插件（可选）

这个插件把 Harness 中的老板或指定 Agent 接到飞书。用户可以在手机上发任务、查进度、接收交付，也可以为某个子 Agent 创建独立机器人，让消息直接进入该成员的持久会话。

> 状态：老板/员工 P2P 链路已完成 `dsh-feishu-bridge 0.3.1` 验证；单个老板机器人内的多岗位虚拟路由和离线补投属于 `dsh-feishu-bridge 0.4.0` staging。飞书桥版本与本项目版本分别管理。

## 能力

| 能力 | 说明 | 状态 |
|------|------|------|
| 官方一键创建 | 通过 `registerApp()` 创建应用和机器人，配置权限、事件与 WebSocket | 已验证 |
| 老板机器人 | 从飞书远程下任务、查进度并接收完整回复 | bridge `0.3.1` 已验证 |
| 员工机器人 | 通过 `staffMemberId` 绑定指定 Agent，独立收发消息 | bridge `0.3.1` 已验证 |
| 群消息 | 机器人入群后处理群内 @ 消息 | 已验证，入群需人工操作 |
| 多岗位虚拟路由 | 在一个老板机器人中使用 `/成员名 正文` 或 `/岗位名 正文` | bridge `0.4.0 staging` |
| 离线补投 | 老板会话暂时不可用时保存消息，上线后继续处理 | bridge `0.4.0 staging` |
| 里程碑镜像 | 把完成通知、验收请求和预算告警发到群 | 需人工配置 webhook |

## 一键创建机器人

老板机器人：

```text
feishu_onboard(
  action="start",
  kind="boss",
  displayName="<公司名> · 老板助手",
  allowGroup=true
)
```

员工机器人：

```text
feishu_onboard(
  action="start",
  kind="staff",
  staffMemberId="<AgentTeams member.id>",
  displayName="<公司名> · <岗位>助手",
  allowGroup=true
)
```

工具会返回飞书官方的一次性确认链接。用户打开链接并确认后，下面这些步骤自动完成：

1. 创建企业自建应用和机器人；
2. 申请单聊、群聊和机器人发消息权限；
3. 订阅 `im.message.receive_v1`；
4. 建立 WebSocket 长连接，不需要公网回调地址；
5. 使用 Windows DPAPI 加密 App Secret；
6. 将机器人绑定到当前公司或指定 AgentTeams 成员。

## 与子 Agent 独立对话

员工机器人不是把消息转给老板再分发。它通过 `staffMemberId` 直接绑定某个 AgentTeams 成员：

- 发给客服机器人的消息进入客服自己的持久会话；
- 发给其他岗位机器人的消息进入对应成员会话；
- 成员可以读取自己的 Skill 和历史上下文，并从同一个机器人原路回复；
- 在 Harness 员工侧边栏中进行的模型改配和 Skill 调整会继续作用于这个成员。

如果不希望为每个岗位创建机器人，可以使用一个老板机器人。`dsh-feishu-bridge 0.4.0` 支持通过精确的 `/成员名 正文` 或 `/岗位名 正文` 进行虚拟路由，但这一模式目前仍按 staging 管理。

## 使用方式

- 给老板机器人发消息：远程创建任务、查询状态或修改需求；
- 给员工机器人发消息：与指定子 Agent 直接对话；
- 在群里 @ 机器人：处理群聊指令（机器人必须先由群主/管理员手动加入群）；
- 配置镜像 webhook：把里程碑推送到群。

## 边界与人工操作

1. `allowGroup=true` 会申请群 @ 权限，但不会自动把机器人加入群；入群仍由群主/管理员在飞书客户端操作。
2. 已经 connected 的机器人不要再次执行 onboarding。重复授权会创建另一套机器人，导致路由分叉。
3. 如果确实需要重建，先清理 bridge 注册表中的旧机器人记录、旧凭据和用户端旧会话，再创建新机器人。
4. 员工成员被移除并重建后，需要同步更新注册表中的 `staffMemberId`。
5. 镜像群 webhook 来自飞书自定义群机器人，需要手动创建；URL 不进入日志、聊天或仓库。
6. App Secret、Token、Cookie、open_id 和 chat_id 不进入公开仓库。
7. 多岗位虚拟路由和离线补投仍在 staging；生产使用前应完成自己的端到端验收。

## 验收

机器人显示 connected 还不算完成。至少验证一次真实链路：

```text
飞书发消息 → bridge 收到 → 正确老板/成员会话被唤醒 → Agent 回复 → 飞书收到回复
```

## 卸载

- 在 Harness 中停用或删除对应机器人；
- 移除 `plugins/feishu/`；
- 运行 `scripts\verify.ps1` 确认核心技能仍可独立工作。

## 进一步阅读

- `core/feishu-onboarding-sop.md`
- `docs/FAQ.md`（Q8–Q11）
- `docs/TROUBLESHOOTING.md`（第 4 节）
