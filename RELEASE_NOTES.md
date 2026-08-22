# RELEASE NOTES

## v0.3.9 — 飞书全覆盖权限集 + 可扩展

### 11. 机器人权限从"最小"升级为"功能全覆盖 + 可扩展"
- 默认权限集（新授权生效）：私聊收发 `im:message.p2p_msg:readonly` / `im:message:send_as_bot` + 群管理 `im:chat:readonly` / `im:chat.members:read` / `im:chat:create`（群列表/群成员/建群）+ allowGroup 时群@读。
- **`feishu_onboard` 新增 `extraScopes` 参数**（工具 + web 向导均支持）：高级用户可自定义追加权限（如群消息全读、通讯录基础等）。
- 说明：不默认开放通讯录等敏感权限（安全 + 审核）；已授权机器人需重建或后台补权限。

## v0.3.8 — 跨群客户身份归并（Cross-group Customer Merge）

### 10. 同一客户跨群/跨私聊自动对应
- `customer-memory.mjs`：`customers` 表新增 `group_ids`（客户所在群列表，老库自动迁移）；`log` 支持第 5 参 `openId`——群消息自动归并到客户主档案（open_id），带「来自群 xx」标记；`read` 显示所在群。
- `bridge.js`：群聊消息给客服时附 `【归并】群内发言者 open_id`。
- 技能 `company-customer-memory`：新增「群聊归并」纪律。
- 效果：同一客户在群 A / 群 B / 私聊，客服读到的都是同一份客户档案（历史合并），群视图独立保留。

## v0.3.7 — 通用客户记忆技能（三层记忆通用化）

### 9. 三层记忆从客服抽离为通用能力
- 新增通用技能 **`company-customer-memory`**：客户档案 SQLite 数据库 + 公司记忆 + 通用记忆 + 先读·对症·分类写纪律 + 隔离铁律 + 脚本用法。
- **适用任何对客岗位**：客服/销售/商务/客户经理——建司时老板为对客岗位默认配本技能；`customer-memory.mjs` 与 `.dsh/memory/` 目录本就是公司级共享。
- `role-customer-service` 改为引用通用技能（不再重复维护）；`company-boss` 岗位模板库注明对客岗位通用配三层记忆。
- 技能总数 14 → **15**（3 框架 + 1 通用记忆 + 11 岗位）。

## v0.3.6 — 服务外部联系人（SOP 指引）

### 8b. 飞书 SOP 增加「服务外部联系人」配置指引（对外共享/创建版本/企业认证/允许外部单聊与外部群）

## v0.3.5 — 飞书群管理修复

### 8. 修复 `group/list` 500 + 补齐群权限
- **根因**：机器人权限只含消息类（`im:message:*`），调 `im.chat.list` 缺 `im:chat` 权限 → API 报错 → 路由 500。
- **修复**：onboarding scopes 补 `im:chat:readonly` + `im:chat:create`（新授权生效）；`group/list` 失败时返回友好错误并提示重新授权（不再裸 500）。
- 说明：已授权机器人需删除重建（`feishu_onboard` 一键创建）才能获得新权限。

## v0.3.4 — 重大决策人工闸门（Human Decision Gate）

### 7. 重大决策必须真人（用户）拍板
- **重大决策清单**：定价特批 / 折扣承诺 / 退款 / 特殊优惠 / 法律舆情 / 超范围承诺 / 合同条款 / 大额支出。
- **流程**：员工/客服升级 → 老板 agent 只整理信息与建议（**不自决**）→ **主动 `feishu_send` 推送征询到用户手机**（决策内容 + A/B/C 选项）→ 用户飞书回复拍板 → 才授权执行。
- 用户未回复前：决策挂起待决，绝不擅自落地；用户不在电脑前也能通过手机飞书决策。
- 写入：`company-boss`（八、重大决策人工闸门）、`role-customer-service`（升级=上报真人拍板，未授权不报价不承诺）。

## v0.3.3 — 自主判断推送协议（Autonomous Push）

### 6. Agent 自主判断推送（不做定时轮询）
- 客服/老板每次处理完消息或任务输出后**自问三连**：①这个结果要发给对方吗？②之前承诺过要回复吗？③完成了吗？
- **完成且该发 → 主动 `feishu_send` 推送**（可一回合连发多条：进度→结果→下一步），**不等对方追问**；没完成 → 记待办进客户档案，下一次输出再判断。
- 推送时机由 **agent 读取输出自主判断**，非定时器、非回合制等待。
- 写入：`role-customer-service`（自主判断推送纪律 + 验收项）、`company-boss`（飞书协议第 3 条自主判断推送铁律）。

## v0.3.2 — 客户记忆库（Customer Memory）

### 5. 客户档案数据库 + 三层记忆（客服满血版）
- **客户记忆库**：`core/scripts/customer-memory.mjs`（node 内置 SQLite，零依赖）——`<公司根>/.dsh/memory/customers.db`，`customers` 表（档案/备注）+ `messages` 表（逐条会话），按客户 id（open_id/chat_id）隔离。
- **三层记忆**：客服每次回复前读「公司记忆 `company.md` + 通用记忆 `general.md` + 该客户档案（数据库）」，回复后**分类写**——会话进库留痕、客户偏好进该客户档案、公司/通用信息进对应 md。
- **老板可注入**：公司记忆/通用记忆是 md，直接编辑即给客服注入新近况；`list` 命令一次拉取全部客户对话。
- **升级**：`role-customer-service` 技能加入「三层记忆纪律」（先读·对症·分类写·隔离铁律），验收标准含记忆读写与隔离检查。
- 命令：`node customer-memory.mjs <init|read|log|update|list|stats> <companyRoot> [...]`

## v0.3.1 — 修复与增强

> 基于 0.3.0 的修复与增强版。安装方式不变：`dsh plugin --profile web add <tgz>`。

## 修复（本次新增）

### 1. 员工侧边栏 · 会话公司隔离（安全修复）
- `GET /ai-company/sidebar/state`：新增 `?sessionId=` 会话过滤，只返回该会话 captain 的团队；无 sessionId 时 **fail-closed 空视图**（修复前会暴露所有工作区/所有会话的团队与成员路由）。
- `POST /ai-company/sidebar/reconfigure`：`sessionId` 必填 + `childSessionId` **归属校验**（必须属于该会话团队，否则 403）——堵住跨会话改配与"reset 清除他人覆盖"。
- client 侧 state/reconfigure 请求携带当前会话 id。

### 2. 公司模式开关（默认不触发公司流程）
- 新增 `/company`（开启）与 `/no-company`（关闭）宿主命令（dsh-commands 服务，命令不经过模型）。
- 新增 `company_mode` 只读工具：agent 执行任何公司操作前查询会话开关。
- 14 个 Skills 全部加**门控铁律**：模式未开启时禁止建司/建员工/派任务/质检，按普通对话处理——**日常对话完全不受插件影响**，只有用户显式 `/company` 后才进入多 Agent 公司模式。
- 开关为**会话级**持久化（`<dshHome>/ai-company-mode.json`）。

### 3. 飞书桥 · 老板回复自动回传（缺陷修复）
- 修复收编桥**未实现**的老板回复回传：`turn/end` 现在把老板最终回复真实发回飞书（原仅有「已收到，老板开工中…」占位）。
- 回传计入发送计数并写入双向留痕日志。

### 4. 员工侧边栏 · UI 调整
- 关闭按钮从右上角移到头部左侧（「← 收起」），避免与宿主详情列 × 重叠误触。
- 新增「📊 活动面板」恢复入口（会话头部）：重启后 AgentTeams 活动面板默认折叠，点此按钮派发 `agent-teams:open-panel` 事件一键找回团队栏。

## 已知边界（如实声明）
- 员工侧边栏头部「← 收起」按钮在当前宿主 UI 中点击事件可能被 details 列覆盖层拦截（点不动）；关闭面板请使用右上角宿主 ×（行为一致：关闭详情列）。已加诊断条便于排查。
- 飞书桥端到端已在 Windows 实测通过（老板收发 + 客服员工机器人 + 多长连接）。

## 安装
```powershell
dsh plugin --profile web add .\ai-company-framework-0.3.1.tgz
# 重启 DSH Desktop 后新建会话生效
```

## 卸载
```powershell
dsh plugin --profile web remove ai-company-framework
```

## 使用速览
1. 日常对话：照常（公司流程默认关闭）。
2. 输入 `/company` 开启公司模式 → 描述业务 → 老板建司（岗位/模型路由/任务/质检/交付）。
3. 输入 `/no-company` 关闭。
4. 飞书：设置 → 飞书机器人 → 扫码一键创建老板/客服机器人。
