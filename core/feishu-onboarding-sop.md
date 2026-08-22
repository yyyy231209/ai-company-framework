# 飞书机器人快速接入 SOP（官方 registerApp + PTC）

## 目标

把传统“开发者后台逐页点击、复制 Secret、手写 registry”的流程，收敛为：

1. 老板调用一次 `feishu_onboard(action=start)`；
2. 用户打开飞书官方确认链接并确认一次；
3. SDK 自动创建应用、配置权限/事件/WebSocket，DSH 自动加密凭据并绑定公司；
4. 老板查询一次状态并做收发探针。

默认不使用 Chrome。官方能力来源：`@larksuiteoapi/node-sdk >= 1.61.1` 的 `registerApp()`（OAuth 2.0 Device Authorization Grant）。

## 前置条件

- 已用 `agent_teams_create` 创建公司团队；
- 员工机器人已存在对应 AgentTeams 成员，能取得其 `member.id`；
- `dsh-feishu-bridge >= 0.3.0`；使用单 App P2P 多岗位虚拟路由时需 `>= 0.4.0`；
- 飞书用户属于目标企业，并能确认创建企业自建应用。

## 标准路径

### 老板机器人

```text
feishu_onboard(
  action="start",
  kind="boss",
  displayName="<公司名> · 老板助手",
  allowGroup=true
)
```

工具返回 `runId` 和飞书官方一次性确认链接。把链接直接交给用户打开，不代替用户确认。

### 员工机器人

```text
feishu_onboard(
  action="start",
  kind="staff",
  staffMemberId="<AgentTeams member.id>",
  displayName="<公司名> · <岗位>助手",
  allowGroup=true
)
```

`kind=staff` 与 `staffMemberId` 缺一不可。岗位名不是 `kind`；不要写 `customer-service`、`ops` 等自定义 kind。

### 查询结果

```text
feishu_onboard(action="status", runId="<runId>")
feishu_status()
```

成功标准：状态为 `connected`，注册表中老板为 `kind=boss`，员工为 `kind=staff` 且绑定正确 `staffMemberId`。

## 自动完成的事项

- 创建企业自建应用与机器人能力；
- P2P 最小权限：
  - `im:message.p2p_msg:readonly`
  - `im:message:send_as_bot`
- 事件：`im.message.receive_v1`；
- 事件订阅方式：WebSocket 长连接（免公网回调）；
- App Secret 经 Windows DPAPI CurrentUser 加密写入 `<dshHome>/feishu-credentials.json`；
- 非敏感路由写入 UTF-8 `<dshHome>/feishu-registry.json`；
- 创建 transport 并绑定 AgentTeams 公司/员工。

`allowGroup=true` 时申请 `im:message.group_at_msg:readonly`（**默认开启**，避免二次授权新建机器人造成同公司多套机器人）。**它只申请权限，不会自动把 App 加入任何群。** 群 @ 验收前，群主须在飞书桌面端或移动端进入「群设置 → 群机器人 → 添加」，把应用机器人加入目标群；自定义 webhook 机器人按飞书规则只能在桌面端添加。官方说明：https://www.feishu.cn/hc/zh-CN/articles/360024984973

### 禁止重复授权（防止多套机器人）

- 同公司同一岗位机器人**只授权一次**；已 connected 的机器人绝不重复 `feishu_onboard(action=start)`。
- 若用户已确认但需要改权限，**不要重新 start**（会新建机器人）；先评估是否必须，必要时删干净旧的（注册表 + 凭据 + 用户飞书端旧会话）再重建。
- 重建后必须核对：注册表只有一套老板 + 一套每岗位员工机器人；`bossBotId` 与 `staffMemberId` 指向**当前**机器人；旧 botId 的凭据已删除。
- 用户侧旧会话残留：机器人改名/重建后，用户飞书里会同时存在新旧会话，需引导用户删除旧会话，只对新机器人发消息。

## 安全铁律

- App Secret 不进入模型消息、日志、经验库、交付文档或截图；
- 工具只返回 App ID、botId、状态和一次性确认链接；
- registry 只存非敏感路由；Secret 只存 DPAPI blob；
- 用户确认链接过期后重新 start，不复用旧链接；
- 不抓取或长期保存飞书浏览器 Cookie，不依赖私有开发者后台接口。

## 老板回传通道（单聊诊断要点）

- 老板（主会话）单聊收到的客户/用户消息以「📱 飞书消息」文本进入；**回传必须用日志中的真实 sender open_id**（`feishu-logs/<company>/<chat>.jsonl` 中 `rx` 事件的 `senderOpenId`），禁止用客服会话里其他客户 open_id 尝试回传（会 400）。
- 若 `feishu_status` 显示「收到 N / 发出 M / 暂存 K」，K>0 说明消息在桥暂存队列（老板离线/不可唤醒），此时用户侧只看到自动占位回复「✅ 已收到，老板开工中…」；桥重启后暂存会补投，老板收到后须用真实 sender id 回传完整回复。
- 老板回复优先走 `feishu_notify`（平台镜像通道）；需要指定机器人时用 `feishu_send(botId=入站bot, receiveId=真实sender, receiveIdType=open_id)`。
- 机器人重建/改名后，用户飞书端旧会话可能仍指向旧机器人：引导用户在飞书删除旧会话，只对新机器人发消息。

## 客服岗重建联动（staffMemberId 同步）

- 客服成员会话连败被移除重建后，**必须同步更新 `feishu-registry.json` 中该客服机器人的 `staffMemberId`** 为新的 member.id，否则客户消息仍路由到已移除成员。
- 流程：`agent_teams_remove_member` → `agent_teams_add_member` → 读 registry → `edit` 更新 `staffMemberId` → `feishu_status` 验证 connected → 客户发探针验证 `wake result=ok` 且 sessionId 等于新成员 id。
- 重建后旧成员的 `feishu-registry` 条目与旧凭据（如有独立 App）一并清理，防止路由分叉。

## PTC / Code Presentation 用法

基础设施接入优先使用 DSH PTC 模式：`@deepseek-ai/dsh-agent-tool-presentation` 配置 `mode: code`。一段 TypeScript 程序可完成 start → 输出确认链接 → status → `feishu_status`，减少多轮工具 schema 与往返。

PTC 只改变工具呈现与编排，不绕过用户确认、飞书权限或管理员审核。日常老板会话可保持 Native；飞书接入工程师使用 PTC。

## 单 App 与多 App 策略

- 默认：一家公司一个老板 App（桥 `>=0.4.0`）。P2P 使用唯一精确 `/成员名 正文` 或 `/岗位名 正文` 路由员工；未知、岗位重名、正文为空、全角斜杠或前缀扩展均 fail-closed，不交老板也不交任意员工。
- 员工消息的系统回复通道携带原入站 `botId + receiveId + receiveIdType`；`feishu_send` 必须原样传入，指定 bot 不可用时禁止换 bot。不要维护 `staff→lastBot` 全局状态，防多机器人并发串线。
- 群聊：App 真正入群后，可通过显式 `chat_id` 绑定不同员工；未 @bot 的消息不处理。
- 独立 App：只有需要不同头像/名称、独立对客身份、跨租户或隔离限流时才为岗位新增 App。
- OpenClaw 飞书插件可作为消息通道设计参考；其快速创建本质也依赖飞书官方一键创建能力，不需要用 OpenClaw 替换 DSH AgentTeams。

## 发布与可用范围

一键创建后，创建者可先完成测试。需要让更大范围员工/客户使用时，再设置可用范围并发布版本/管理员审核；这属于生产上线步骤，不阻塞首次连通性验收。

### 服务外部联系人（对外共享配置，人工在飞书后台完成）

客服机器人对接**外部客户**（企业外的飞书联系人，如客户/供应商）时必须开启对外共享：

1. 开发者后台（open.feishu.cn）→ 应用列表 → 对应机器人（客服助手 `cli_aa022a…`）→ **版本管理与发布 → 创建版本**。
2. 版本详情配置 **对外共享能力**：
   - 企业未认证 → 对外共享置灰不可用：企业超管完成**企业认证**，或成员完成**个人实名认证**后可用。
   - 企业已认证 → 可直接使用。
3. 勾选「**允许机器人被添加到外部群中使用**」+「**允许外部用户与机器人单聊**」；首次开启单聊时应用所有者会在飞书「开发者小助手机器人」收到审批消息，需通过。
4. 提交版本 → 管理员审核发布。
5. 验证：外部用户（企业外）在飞书搜到机器人并成功单聊；外部群可添加机器人。
6. 配置完成后，桥无需任何改动：外部用户按 `open_id`（单聊）/ `chat_id`（群聊）与内部用户同样路由、同样入客户记忆库。

> 注意：外部单聊/外部群是飞书平台级开关，插件无法代开；未配置前外部用户搜不到机器人属正常。

## 端到端验收

### 老板链路

1. 用户私聊老板机器人发送唯一探针；
2. DSH `feishu-logs/<company>/<chat>.jsonl` 出现 `rx via=boss-p2p`；
3. 老板主会话收到消息并回复；
4. `feishu_status` 收到/发出计数各增加 1。

### 员工链路

1. 用户私聊员工机器人发送唯一探针；
2. 日志出现 `rx via=staff-p2p`；
3. `wake result=ok`，`sessionId` 等于正确 `staffMemberId`；
4. 客服会话被唤醒并用 `feishu_send` 回复；
5. 飞书收到业务回复，计数各增加 1。

“开放平台事件日志 SUCCESS”只证明飞书已投递到 SDK，不等于 DSH 路由成功；必须同时满足员工 wake 与回复。

### 单 App P2P 虚拟岗位链路（桥 >=0.4.0）

1. 在老板机器人私聊发送 `/唯一岗位名 唯一探针`；日志应为 `via=boss-p2p-virtual-staff`；
2. 员工 wake 的消息正文应剥掉路由前缀，并在客户正文之前包含系统回复通道 JSON；
3. 员工调用 `feishu_send(botId=原入站bot, receiveId=原open_id, receiveIdType=open_id, ...)`，回复必须出现在同一个老板机器人会话；
4. 负例 `/不存在 正文`、重名岗位、`/岗位` 空正文、`/岗位A` 前缀扩展必须只收到格式错误，不得产生员工 wake；
5. 跨公司/disabled/未知 `botId` 必须显式失败且不回退，旧调用未传 botId 仍回归通过。

### 群聊链路

1. start 时显式传 `allowGroup=true`，确认页应列出群 @ 读权限；
2. 用飞书桌面端或移动端把**应用机器人**加入隔离验收群；只在聊天框搜索到“会话外机器人”不算入群；
3. 在群里真实 @机器人发唯一探针，日志应出现 `chatType=group`，且回复目标为 `chat_id`；
4. 绑定不同岗位时以显式 `registry.groups[chatId]` 为准；未 @ 的群消息必须丢弃。

### 里程碑镜像

`feishu_notify` 使用的是**自定义群机器人 webhook**，不是应用机器人 token。飞书官方要求自定义机器人在桌面端添加；得到 webhook 后只写入公司配置，禁止发进模型消息、日志或报告。未配置时必须返回显式失败，不能假报推送成功。

## 故障定位

| 症状 | 优先检查 |
|---|---|
| bot connected，但客户消息不进 DSH | registry 是否为 `kind=staff`，是否有正确 `staffMemberId` |
| 日志有 `rx`，wake failed 且出现 `throwIfAborted` | `ctx.subagents.followup()` 必须传 `signal: new AbortController().signal` |
| 一键创建链接生成失败 | SDK 版本、网络、链接是否过期；重新 start |
| 创建成功但他人搜不到 | 可用范围/版本发布/管理员审核 |
| 收到事件但不能回复 | 是否有 `im:message:send_as_bot` |
| 群聊收不到 | 先确认 `allowGroup=true`；再确认应用机器人已由桌面端/移动端真正加入群，而不是仅作为“会话外的人”被搜索到；最后确认消息实际 @bot |
| Web 群机器人页无“添加” | 飞书 Web 端新增动作可能依赖原生客户端；改用飞书桌面端或移动端按官方流程添加应用机器人 |
| `feishu_notify` 提示未配置 webhook | 在飞书桌面端为目标群添加自定义机器人，把 webhook 写入公司配置；不要把 URL 发进对话 |

## 备用路径

仅以下情况使用“绑定已有机器人”：历史 App 已存在、需要保留既有身份，或官方一键创建暂不可用。通过 Web 向导填 App ID/App Secret；桥会校验凭据并立即 DPAPI 加密。仍禁止把 Secret 发进对话。
