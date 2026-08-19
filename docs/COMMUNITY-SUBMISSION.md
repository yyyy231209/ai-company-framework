# Community Submission Kit

This document lists every asset, draft, and link needed to publish AI Company Framework to DeepSeek Harness community channels. Everything below is written to be copy-paste ready; links only point to repositories, not to private resources.

## Channels

| Channel | Type | Purpose |
|---|---|---|
| `deepseek-ai/deepseek-harness` Discussions → Show and tell | Open Discussion | Main visibility entry for Harness users |
| `dataelement/dsh-desktop` Discussions → Show and tell | Open Discussion | Reach the desktop client community |
| `awesome-deepseek-harness` GitHub list | PR | Long-tail discovery through search and curated lists |
| Dev.to / Hashnode / Medium | Long-form post | English-language showcase with screenshots |

## Pre-flight checklist

1. `git status` is clean.
2. `tests/smoke.ps1`, `scripts/validate-manifest.ps1`, and `scripts/security-scan.ps1` all pass.
3. The latest release tag is pushed (`git ls-remote --tags origin | grep v0.1.1`).
4. Screenshots in `assets/screenshots/` are redacted (no Windows taskbar, local paths, session IDs, or app IDs).
5. `README.md` and `README.zh-CN.md` mention DSH Desktop as the install entry.

## Asset map

| Asset | Path |
|---|---|
| English README | `README.md` |
| Chinese README | `README.zh-CN.md` |
| Architecture doc | `docs/ARCHITECTURE.md` |
| Plugin guide | `plugins/feishu/README.md` |
| Marketplace doc | `docs/DSHMARKET-SUBMISSION.md` |
| Screenshots | `assets/screenshots/*.png` |
| Architecture diagram | `assets/architecture.svg` |
| Release notes | `RELEASE_NOTES.md` |
| Changelog | `CHANGELOG.md` |

## English Discussion post (Harness Show & Tell)

Title:

```text
[Show & Tell] AI Company Framework v0.1.1 — a multi-agent starter kit on DeepSeek Harness
```

Body:

```markdown
Hi everyone 👋

I just released **AI Company Framework v0.1.1** — a starter kit that turns one sentence into a multi-agent team running on top of DeepSeek Harness / DSH Desktop.

**TL;DR**

- One sentence → a working AI company or workflow inside Harness.
- Built on the public Harness APIs (AgentTeams, employee sidebar, model list, Skill loader).
- Open source under MIT: <https://github.com/yyyy231209/ai-company-framework>
- v0.1.1 ships 14 Skills (3 framework + 11 roles), 7 templates, an optional Feishu plugin, and a `plugin-manifest/v1` for marketplace submission.

**What's inside**

- `core/skills/company-boss.md` — the orchestrator that reads your goal, asks up to 1–2 key questions, then designs the team, routes models, creates AgentTeams, dispatches tasks, runs QA, and packages delivery.
- `core/skills/role-*.md` — eleven prebuilt roles (writer, customer-service, qa, researcher, editor, finance, hr, ops, coder, data, translator). New roles can be created from `company-role-template`.
- Model routing rules that read `list_available_models` and pick the right model per role (vision → image-capable, planning → strong reasoning, batch work → fast+cheap).
- AgentTeams activity + task dependency graph + per-member conversation and model switching through the sidebar.
- An optional `plugins/feishu/` that uses the official `registerApp()` flow to bind bots to the boss and to specific staff members.

**What it is and what it isn't**

It is a Skills starter kit: orchestration rules live in markdown, and execution runs on Harness. It is **not** an independent runtime; it does not replace DSH Desktop. Things like a declarative `company.yaml`, a code-level model router, an automatic plugin loader, and an end-to-end executor are not included in v0.1.1 — the README is explicit about this.

**Try it**

```powershell
git clone https://github.com/yyyy231209/ai-company-framework
cd ai-company-framework
.\scripts\install.ps1
.\scripts\verify.ps1
```

Then start a new DSH Desktop session and say one sentence — for example:

> "I want to start an e-commerce company selling specialty coffee beans, with the first deliverables being a Xiaohongshu post and a customer-service playbook."

**Screenshots**

- A fresh company after one sentence: `https://github.com/yyyy231209/ai-company-framework/blob/main/assets/screenshots/company-created.png`
- AgentTeams members + task dependency graph: `https://github.com/yyyy231209/ai-company-framework/blob/main/assets/screenshots/agentteams-activity.png`
- Employee sidebar with model routing and direct messaging: `https://github.com/yyyy231209/ai-company-framework/blob/main/assets/screenshots/employee-sidebar.png`

**Compatibility**

- DSH Desktop users: run `install.ps1`.
- Marketplace users (`dshmarket >= 1.9.0`): the root `manifest.json` is already valid.
- Anyone running Harness headless: same `install.ps1` works; install into `<harness>/skills/` directly.

**Feedback I'd love**

- Does this cover a workflow you actually run? Which role is missing?
- Anything you'd like to see promoted from Skill rule to runtime (company.yaml compiler, model router, plugin loader, end-to-end executor)?
- Plugin authors: would you want to ship roles through the framework `plugin-manifest/v1`?

Happy to iterate on PRs and issues. Thanks for reading!
```

## English long-form blog post (Dev.to / Medium / Hashnode)

Title:

```text
Spinning up an AI company with one sentence on DeepSeek Harness
```

Outline:

1. The pain: lots of LLM tools, few that act like a real team.
2. What DSH Desktop gives you (sessions, AgentTeams, sidebar, model list).
3. What the framework adds on top (boss Skill, role Skills, model routing, QA, delivery, Feishu).
4. Three real screenshots, captioned.
5. Honest section: it is Skills-driven, not a runtime; v0.1.1 limitations.
6. Try it: clone, `install.ps1`, one sentence.
7. Roadmap: company.yaml, plugin loader, end-to-end executor — when contributions are welcome.

## Chinese community post (掘金 / 知乎 / 即刻 / V2EX)

Title options:

- `在 DeepSeek Harness 上搭一个“AI 公司”：一句话开团、自动派活、单独调教员工`
- `DSH Desktop 上跑多 Agent 公司框架的踩坑与思路`
- `v0.1.1：把 DSH Harness 升级成可以“开公司”的能力扩展包`

Outline:

1. 项目背景：DSH Desktop 能做什么，本项目补什么。
2. v0.1.1 真实运行截图三张。
3. 老板 + 流水线 + 11 个岗位的工作方式。
4. 飞书插件如何让手机也能管公司和员工。
5. 哪些是真正运行的能力，哪些是 Skill 规则（诚实说明）。
6. 安装与下一步。

## Awesome list PR

Fork `awesome-deepseek-harness` (or create it if it does not exist) and add an entry under "Starter kits and frameworks":

```markdown
- [AI Company Framework](https://github.com/yyyy231209/ai-company-framework) — multi-agent company and workflow starter kit for DeepSeek Harness with 11 role Skills, model routing rules, QA loop, Feishu plugin, and `plugin-manifest/v1`.
```

## Submission order

1. Publish the GitHub release (already done).
2. Open the Harness Show & Tell Discussion.
3. Open the DSH Desktop Show & Tell Discussion.
4. Submit the PR to the awesome list.
5. Publish the Dev.to / Medium post.
6. Publish the Chinese long-form post on 掘金 / 知乎 / V2EX.

## Tracking

After publishing, capture:

- Discussion URLs (paste them into the top of this file).
- awesome list PR URL.
- Dev.to / Medium URL.
- Chinese post URLs.

Then update `README.md` "Docs" section if any of these become canonical links.