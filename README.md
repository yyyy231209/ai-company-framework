# AI Company Framework

> **Company Is a Word.**
>
> **One sentence → a working multi-agent company.** Install this DeepSeek Harness `dsh.bundle`, say what you want to build, and a company of role-specialized agents (writer, editor, developer, QA, sales, customer service…) designs, schedules, quality-checks and delivers — while you stay in charge of every major decision.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v0.3.10-blue)](RELEASE_NOTES.md)

[English](README.md) | [简体中文](README.zh-CN.md)

## Why AI Company Framework stands out

- **One-sentence onboarding.** Say "start an ecommerce content company" and the boss agent clarifies, designs roles, routes models by capability, builds the team and dispatches the first order — no manual setup.
- **Zero impact on daily chat.** Company mode is off by default; type `/company` to enable, `/no-company` to disable. Your normal conversations are untouched until you opt in.
- **Per-customer memory that follows the customer.** A SQLite customer database (id-isolated per customer), plus company/general memory. Same customer across private chat and multiple groups is **automatically merged into one profile** — and shared across every client-facing role (sales, business, customer service), so no one asks the customer to repeat themselves.
- **Agents push to you — you don't poll.** Autonomous push: after "let me check", the agent reads its own output and proactively sends the result. No polling, no "did you get it?".
- **Humans own big decisions.** Pricing exceptions, refunds, commitments, legal/PR — a **human decision gate** pushes the decision to your phone via Feishu; nothing lands until you say so.
- **Conversation isolation, hardened.** Employee sidebar state is session-scoped (fail-closed) and model reconfiguration is ownership-checked (403) — no cross-company data leaks.
- **Feishu-native.** Create a bot for the boss *and any employee* with one scan (registerApp), private/group routing, two-way logs, external-contact onboarding guide, full-coverage scopes + `extraScopes`.
- **Open-source safe.** The package ships zero user data — databases, logs and credentials (DPAPI-encrypted) are created locally at first use.

## What's in the box (v0.3.10)

- **15 flat Skills**: `company-boss`, `company-pipeline`, `company-role-template`, `company-customer-memory` (generic three-layer memory for any client-facing role) + 11 role Skills — all gated by the `/company` switch.
- **7 workflow templates** under `core/templates/`.
- **AgentTeams runtime + web activity panel** (bundled dependency, mounted as its own Cordis row): team creation, member sessions, dependency tasks, activity tree, archived teams.
- **Employee sidebar (host + web UI)**: per-member model routing (lossless reconfigure), live session/tool view, messaging, session isolation, activity-panel restore entry.
- **Feishu bot bridge (host + web UI)**: official `registerApp` one-scan onboarding, DPAPI-protected credentials, boss + per-employee bots, private/group routing, two-way logging, boss auto-reply, autonomous push, human decision gate, external-contact guide, full-coverage scopes.
- **Customer memory**: `core/scripts/customer-memory.mjs` (Node built-in SQLite, zero deps) — per-customer profiles + message log, three-layer memory, cross-group/private merge, one-shot full customer pull.
- **Company mode switch**: `/company` / `/no-company` host commands + `company_mode` tool gating all Skills.
- **Memory mode per role**: `三层` (three-layer, client-facing) or `单层` (single, internal) — declared in the role skeleton.
- No RAG, no vector database, no telemetry.

## What stays human (no automation, by design)

- **Model provider**: configure your own API key in host settings.
- **Feishu authorization**: scan/confirm happens on Feishu official pages (DPAPI-local secrets; `connected` only when a real WebSocket is up).
- **Major decisions**: pricing, refunds, commitments — pushed to you for approval.
- **Workspace selection**: DSH Desktop directory picker.
- **Publishing**: this repo does not publish, release, push or PR without explicit human confirmation.

## Runtime boundaries

- DeepSeek Harness supplies models, tools, sessions, Skills and the Bundle runtime.
- AgentTeams execution, activity panel, employee sidebar and the Feishu bar are **implemented by this Bundle** and activate on install.
- Feishu authorization is a human gate; staging capabilities are not claimed stable.
- Honest-state rule: anything not installed/authorized/online is shown as such with onboarding guidance.

## Install

```powershell
# Packaged tarball (recommended) or registry spec — not a source directory
dsh plugin --profile web add .\ai-company-framework-0.3.10.tgz
```

Start a new Harness session after install (the web UI mounts the activity panel / employee sidebar / Feishu bar), then either:

```text
/company   → enable company mode, then describe your business
/no-company → back to normal chat
```

## Uninstall

```powershell
dsh plugin --profile web remove ai-company-framework
```

Native removal clears the profile dependency, Bundle layer and package directory. Your own data — company teams, customer memory, Feishu credentials/registry, logs — is deliberately kept (config rollback ≠ data deletion).

## Verification

Verified on DSH Desktop embedded `@deepseek-ai/dsh 0.1.0-rc.8` (Windows):

```powershell
node tests\bundle-check.mjs
powershell -File tests\smoke.ps1
powershell -File scripts\security-scan.ps1
powershell -File tests\install-bundle.ps1 -DshBin <path-to-@deepseek-ai\dsh\lib\bin.js>
```

Isolated acceptance (fresh temp `DSH_HOME` + new profile + real `.tgz`): dual Cordis rows, 15 gated Skills discovered through the installed provider, `feishu_*` tools registered, web boot with both client bundles, sidebar isolation (fail-closed + 403), Feishu un-authorized honest state, uninstall with zero residue, zero data files in the package.

> Install-time pnpm "peers missing" warnings are expected (profile runs `autoInstallPeers:false`).

## Documentation

- [Quick start](docs/QUICKSTART.md) · [Architecture](docs/ARCHITECTURE.md) · [Bundle & extension guide](docs/PLUGINS.md)
- [FAQ](docs/FAQ.md) · [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Feishu onboarding SOP](core/feishu-onboarding-sop.md) · [Release notes](RELEASE_NOTES.md)

## Notices

Incorporated components (employee sidebar, Feishu bridge) and the supply-chain boundary are documented in [NOTICE.md](NOTICE.md). The package never depends on the unrelated unscoped `dsh-feishu-bridge` npm package.

## License

[MIT](LICENSE) © 2026 AI Company Framework contributors
