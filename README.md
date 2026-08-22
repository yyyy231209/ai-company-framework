# AI Company Framework

> **Company Is a Word.** — Say one sentence, get a working multi-agent company.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v0.3.10-blue)](RELEASE_NOTES.md)
[![Wiki](https://img.shields.io/badge/Wiki-ai--company--framework-8A2BE2)](https://github.com/yyyy231209/ai-company-framework/wiki)

[English](README.md) | [简体中文](README.zh-CN.md)

---

## ✨ What it is — in 30 seconds

A DeepSeek Harness `dsh.bundle` that turns **one sentence** into a **company of role-specialized agents** (writer, editor, developer, QA, sales, customer service…) that designs, schedules, quality-checks and delivers — while **you stay in charge of every major decision**.

```text
你说一句话 → 老板澄清(一次一问) → 实时盘点模型/分岗位路由 → 建团队(AgentTeams)
  → 员工入职自写技能 → 派首单 → 质检闭环 → 交付包(含假设清单) → 你要不要改？一句话定向返工
```

![Architecture](assets/architecture.svg)

## ⚡ 30-second quick start

```powershell
# 1. Install (packed tarball — not a source directory)
dsh plugin --profile web add .\ai-company-framework-0.3.10.tgz
```

```text
# 2. Restart DSH Desktop, open a NEW session, then:
/company
# 3. Say what you want:
#    "I want an ecommerce content company — first order: a Xiaohongshu post + customer-service scripts."
```

That's it. The boss agent takes it from there.

| AgentTeams activity | Employee sidebar | Company created |
|---|---|---|
| ![AgentTeams](assets/screenshots/agentteams-activity.png) | ![Sidebar](assets/screenshots/employee-sidebar.png) | ![Company](assets/screenshots/company-created.png) |

## 🎯 Why it stands out

| Advantage | What you get |
|---|---|
| **Zero impact on daily chat** | Company mode is **off by default** — `/company` to enable, `/no-company` to disable. Your normal conversations are untouched until you opt in. |
| **Customer memory that follows the customer** | SQLite per-customer profiles (id-isolated) + company/general memory. The same customer across private chat and **multiple groups is automatically merged into one profile**, shared by every client-facing role — **nobody asks the customer to repeat themselves**. |
| **Agents push to you — you don't poll** | After "let me check", the agent reads its own output and **proactively sends** the result. No polling, no "did you get it?". |
| **Humans own big decisions** | Pricing exceptions, refunds, commitments, legal/PR → a **human decision gate** pushes the choice to your phone via Feishu; **nothing lands until you approve**. |
| **One bot per employee** | Create a Feishu bot for the boss *and any employee* with one scan (registerApp) — perfect for remote work and client-facing teams. |
| **Hardened conversation isolation** | Sidebar state is session-scoped (fail-closed), model reconfiguration is ownership-checked (403), customer archives are id-isolated. No cross-company leaks. |
| **Open-source safe** | The package ships **zero user data** — databases, logs and credentials (DPAPI-encrypted) are created locally at first use. |
| **Memory mode per role** | `三层` (three-layer, client-facing) or `单层` (single, internal) — declared in each role skeleton. |

## 🏭 Use cases

- **Ecommerce content studio** — research → copywriting → QA → rework → delivery, batched into one deliverable.
- **Game studio** — designer plans, writer writes store copy, QA gates, customer service handles clients with full customer memory.
- **Customer support & sales** — per-customer archives + cross-group merge + autonomous push + human decision gate.
- **Remote team** — every employee can have their own Feishu bot; you steer from your phone.
- **Agency / outsourcing** — one-sentence onboarding per client, isolated companies per session.

## 📦 What's in the box (v0.3.10)

**15 flat Skills** (all gated by `/company`):

| Skill | Role |
|---|---|
| `company-boss` | Boss — architecture, scheduling, QA loop, delivery, wisdom |
| `company-pipeline` | 8-stage automation pipeline (build/feishu/schedule/QC/deliver/hire) |
| `company-role-template` | Role-skeleton template (self-written skills by employees) |
| `company-customer-memory` | Generic three-layer memory for any client-facing role |
| `role-writer / role-editor / role-coder / role-researcher / role-qa / role-ops / role-finance / role-hr / role-data / role-translator / role-customer-service` | Prebuilt role skills |

Plus:
- **7 workflow templates** (`core/templates/`).
- **AgentTeams runtime + web activity panel** (bundled dependency, own Cordis row).
- **Employee sidebar (host + web UI)**: lossless per-member model routing, live session/tool view, messaging, session isolation, activity-panel restore.
- **Feishu bot bridge (host + web UI)**: official registerApp one-scan onboarding, DPAPI credentials, boss + per-employee bots, private/group routing, two-way logs, boss auto-reply, autonomous push, human decision gate, external-contact guide, full-coverage scopes + `extraScopes`.
- **Customer memory**: `core/scripts/customer-memory.mjs` (Node built-in SQLite, zero deps) — per-customer profiles + message log, three-layer memory, cross-group/private merge, one-shot full customer pull.
- **Company mode switch**: `/company` / `/no-company` commands + `company_mode` tool.
- **No RAG, no vector database, no telemetry.**

## 🏗️ Architecture & boundaries

```
DeepSeek Harness (models, tools, sessions, Skills, sandbox, web)
  └─ AI Company Framework bundle
       ├─ 15 Skills provider (package-local, no user-dir copies)
       ├─ AgentTeams runtime + activity panel (bundled dep)
       ├─ Employee sidebar host + UI (session-isolated)
       ├─ Feishu bridge host + UI (multi-bot, DPAPI)
       └─ Customer memory (SQLite, per-customer)
  └─ Human gates: model API key · Feishu authorization · major decisions · workspace
```

- Models/tools/sessions/Skills/Bundle runtime come from DeepSeek Harness; the rest is **implemented by this Bundle** and activates on install.
- Honest-state rule: anything not installed/authorized/online is shown as such with onboarding guidance — never falsely reported ready.

## 🛡️ Security

- Zero user data in the package (verified: no `.db`/`.jsonl` in the tarball).
- Feishu App Secrets: **Windows DPAPI**, CurrentUser scope, local only; `connected` only when a real WebSocket is up.
- Customer archives: per-id isolation; sidebar: per-session fail-closed + 403 ownership checks.
- No postinstall hooks; install/uninstall managed by `dsh plugin`.

## ✅ Verification

Verified on DSH Desktop `@deepseek-ai/dsh 0.1.0-rc.8` (Windows): dual Cordis rows, 15 gated Skills, AgentTeams full lifecycle, sidebar isolation, Feishu end-to-end (boss/staff/group/auto-reply/push/decision gate), customer-memory merge & isolation, release tarball integrity. See [RELEASE_NOTES](RELEASE_NOTES.md) and [Wiki](https://github.com/yyyy231209/ai-company-framework/wiki).

## 📚 Documentation

- [Wiki](https://github.com/yyyy231209/ai-company-framework/wiki) · [Quick start](docs/QUICKSTART.md) · [Architecture](docs/ARCHITECTURE.md) · [Bundle & extension guide](docs/PLUGINS.md)
- [FAQ](docs/FAQ.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) · [Feishu onboarding SOP](core/feishu-onboarding-sop.md)

## 🤝 Contributing

PRs welcome — see [CONTRIBUTING](CONTRIBUTING.md) and [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md).

## Notices

Incorporated components (employee sidebar, Feishu bridge) and the supply-chain boundary are documented in [NOTICE.md](NOTICE.md).

## License

[MIT](LICENSE) © 2026 AI Company Framework contributors
