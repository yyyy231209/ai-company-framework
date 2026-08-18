# AI Company Framework · Spin Up an AI Company with One Sentence

> 🚀 **Non-developers get their own AI company in 5 minutes**: open a new session, say
> "I want to start an e-commerce company selling specialty coffee beans,"
> and the framework builds your team, assigns roles, dispatches tasks, runs QA,
> and delivers results — you just make the calls.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Release](https://img.shields.io/badge/Release-v0.1.1-blue)](RELEASE_NOTES.md)

[English](README.md) | [简体中文](README.zh-CN.md)

---

## ✨ Why You'll Love It

### 1️⃣ Effortless Setup — It Lives Inside DeepSeek Harness

- **No server, no database, no API-key configuration**
- Just install [DeepSeek Harness](https://github.com/deepseek-ai) (Windows desktop app — logged in means models are ready)
- Run one install script, then 3 steps to a company
- No technical background needed — `install.ps1` does it all

### 2️⃣ Your Own AI Company in Minutes

- One sentence (e.g. "I want an e-commerce company selling specialty coffee") → company created automatically
- The boss asks at most **1–2 key questions** (price range, channel); everything else uses sensible defaults
- Roles auto-assigned, models auto-picked, team auto-created, first task auto-dispatched
- You watch results — no Agent concepts to learn

### 3️⃣ Your Employees, Your Rules — Fine-Tune Every Sub-Agent

- 👥 **Watch them work**: the 👥 button opens the employee sidebar — see what every sub-agent is doing
- 🎛️ **Swap models losslessly**: an employee underperforming? Change its model routing in the sidebar — no session reset, no lost context
- 📨 **Direct commands**: message any employee directly, like pinging a coworker
- 🧠 **They evolve**: every employee writes and maintains its own skill file — your coaching sticks, and they get better over time

### 4️⃣ Fully Extensible — DIY Any Kind of Company

- **11 prebuilt roles**: copywriter, customer service, QA, researcher, video editor, finance, HR, ops, developer, data analyst, translator
- **Industry template library**: e-commerce / short-video / games / consulting / support outsourcing — one sentence maps to the right roles
- **Build your own roles**: follow `company-role-template` to add a role skeleton; the employee fills in the full skill on onboarding
- **Plugin system**: contribute a capability with one `manifest.json` + one skill file (see `docs/PLUGINS.md`)
- Coffee shop, furniture store, game studio, consulting firm — change one sentence, get a different company

### 5️⃣ Unlimited Companies — as Many as You Want

- **One session = one company**, data fully isolated, zero cross-contamination
- Want a second one? **New session, one sentence, done** — a brand-new company
- Each company has its own team, employees, file directory, and Feishu bot
- Run a coffee e-commerce + a furniture store + a short-video studio simultaneously — no interference

---

## Quick Start (3 Steps)

### Prerequisites

- Windows 10/11
- [DeepSeek Harness](https://github.com/deepseek-ai) (desktop) installed and signed in

### Step 1: Install the framework into Harness

```powershell
cd ai-company-framework
.\scripts\install.ps1   # copies core/skills into Harness's skills directory
.\scripts\verify.ps1    # environment self-check
```

### Step 2: Open a new session

Open a **new session** in Harness (never reuse an old one — one session = one company; a new session = a new company).

### Step 3: Say one sentence

> "I want to start an e-commerce company selling specialty coffee beans, with the first deliverables being a Xiaohongshu (Little Red Book) post and a customer-service playbook."

The boss asks at most 1–2 key questions (price range, channel), then handles everything else automatically.

## Capabilities

| Capability | Description |
|------|------|
| 🏢 One-click company | One sentence → industry → roles/routing/team/directories |
| 👥 Multi-agent staff | 11 prebuilt roles, DIY roles, fully steerable |
| 🚦 Auto scheduling | Dependency-graph tasks, parallel execution, event-driven |
| ✅ QA loop | Deliverable → QA gate → targeted rework → recheck → release |
| 📦 Delivery packaging | Deliverables + assumptions list + acceptance points |
| 🧠 Wisdom accumulation | De-identified workflow lessons shared across companies, zero business leakage |
| 🔒 Session isolation | One session = one company; open as many as you like |
| 📱 Feishu plugin | Optional: control your company from your phone / customer service bot |

## Repo Layout

```text
ai-company-framework/
├─ core/                      # Framework core
│  ├─ skills/                 # Boss controller + pipeline + 11 role skills
│  ├─ templates/              # Task/QA/delivery/rework templates
│  └─ feishu-onboarding-sop.md
├─ plugins/                   # Optional plugins (Feishu, ...)
│  └─ feishu/
├─ scripts/                   # Install / verify / security-scan
├─ docs/                      # Guides + plugin developer docs
├─ examples/                  # Sample companies
├─ tests/                     # Smoke tests
└─ LICENSE (MIT)
```

## Plugin System (for Developers)

The framework is pluggable by design. A plugin = a directory + a `manifest.json`:

- **Hooks**: after company create, before onboarding, before task, after QA, before delivery…
- **Skill injection**: plugins can contribute role skills (e.g. Feishu customer service)
- **Script hooks**: custom PowerShell / Node scripts
- **Isolation**: plugins may not read other companies' data; credentials must stay encrypted

See [`docs/PLUGINS.md`](docs/PLUGINS.md). Feishu plugin example: [`plugins/feishu/`](plugins/feishu/README.md).

## Docs

- [Quick start (detailed)](docs/QUICKSTART.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Plugin developer guide](docs/PLUGINS.md)
- [FAQ](docs/FAQ.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Contributing

All contributions welcome — issues, ideas, plugins, docs, PRs.
Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) first.

## Roadmap

- [x] v0.1 core: create company + scheduling + QA + delivery
- [x] 11 prebuilt role skills
- [x] Feishu bridge (P2P verified; 0.4.0 multi-role routing staging)
- [ ] v0.2 plugin marketplace + more sample companies
- [ ] v0.3 guided wizard UI + one-click demo

## License

[MIT](LICENSE) © 2026 AI Company Framework contributors

## Disclaimer

- Content generated by this framework (copy/plans/code) requires human review before use; it is not professional advice.
- Feishu 0.4.0 multi-role virtual routing is staging; evaluate before production deployment.
- Adding bots to groups and mirror webhooks require manual action in the Feishu client.
