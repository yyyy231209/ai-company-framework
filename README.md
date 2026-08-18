# AI Company Framework

> **Company Is a Word.**
>
> A multi-agent company and workflow starter kit for DeepSeek Harness. Describe an outcome and it creates a team, routes models by role, builds a task graph, runs QA, and delivers the results. Teams remain visible in the AgentTeams panel and can be managed through the employee sidebar or Feishu.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Release](https://img.shields.io/badge/Release-v0.1.1-blue)](RELEASE_NOTES.md)

[English](README.md) | [简体中文](README.zh-CN.md)

## Built on DeepSeek Harness and DSH Desktop

This project does not replace the underlying runtime. It adds a company and workflow orchestration layer on top:

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) provides model access, tool execution, persistent sessions, Skills, and the plugin runtime;
- [DSH Desktop](https://github.com/dataelement/dsh-desktop) packages Harness as a practical desktop application and provides visual interfaces such as the AgentTeams activity panel and employee sidebar;
- AI Company Framework adds role templates, model-routing policy, task dependencies, QA/rework, delivery contracts, Feishu integration, and isolated instances.

If you are new to the stack, install DSH Desktop first, then run this repository's install script.

## Project status

`v0.1.1` is a reusable set of Harness Skills, templates, operating procedures, and install scripts: a **multi-agent starter kit**. It is not a standalone agent runtime and does not replace Harness execution. Orchestration rules are currently Skill-driven; a declarative company spec, code-level model router, automatic plugin loader, and standalone end-to-end executor are not included in this release.

---

![Architecture](assets/architecture.svg)

## Real Screenshots

### One sentence → a working AI company

![A furniture AI company created in DeepSeek Harness](assets/screenshots/company-created.png)

### Live AgentTeams activity and task dependencies

![AgentTeams members and dependency graph](assets/screenshots/agentteams-activity.png)

### Open any employee, inspect its work, message it, or switch its model

![Employee sidebar with model routing and direct messaging](assets/screenshots/employee-sidebar.png)

---

## Core capabilities

### Runs inside Harness

The project does not require a separate server or database. Install [DSH Desktop](https://github.com/dataelement/dsh-desktop), sign in, and run `install.ps1` to copy the skills into Harness. Harness provides models, tools, sessions, and AgentTeams; this project organizes them into teams and workflows.

### Creates a team from one sentence

Describe the business and the intended result. The boss chooses the roles, model routes, working directory, and initial task graph. Tasks can run in parallel and pass through QA, targeted rework, and delivery. Missing business facts are listed as assumptions instead of being invented.

### Routes models by role

Before creating a team, the boss reads the models currently available to the user instead of hard-coding one provider. Vision roles prefer image-capable models; planning, engineering, and review roles use stronger reasoning models; writing, support, and batch work use faster and lower-cost routes; long-running jobs also account for quota and runtime cost. This reserves expensive models for the work that benefits from them and reduces token and account-quota waste. Any member's route can still be changed later from the employee sidebar.

### Shows AgentTeams activity in real time

The AgentTeams panel shows member status, task ownership, and overall progress. Its dependency graph makes parallel branches and blocked tasks visible. The employee sidebar opens any member's own conversation and tool activity.

### Lets you coach each sub-agent separately

Every member has a persistent conversation, mailbox, and Skill file. You can message one member directly or change only that member's model route without recreating the team or discarding its conversation. Members complete their own Skills during onboarding and maintain them as they learn better ways to work; the boss still controls interface contracts.

### Supports remote control through Feishu

The optional Feishu plugin uses the official `registerApp()` flow. After one confirmation link, it creates the app and bot, configures permissions, events, WebSocket transport, and encrypted credentials.

The boss bot accepts remote instructions and returns progress or final results. Staff bots bind to a specific member through `staffMemberId`, allowing direct conversations with customer service or another sub-agent. Milestones can also be mirrored to a Feishu group. Boss/staff P2P is verified; multi-role virtual routing remains staging in `dsh-feishu-bridge 0.4.0` (the bridge is versioned separately from this starter kit).

See [`plugins/feishu/README.md`](plugins/feishu/README.md).

### Companies are a preset; complete workflows are also supported

A role can be treated as a workflow node with defined inputs, outputs, and acceptance criteria. The task graph supports serial work, parallel branches, batch acceptance, and rework loops. The same framework can run content production, research reports, software development, support operations, video production, or data-analysis workflows.

### Extends through Harness and framework plugins

Teams can use models, tools, Skills, and client plugins available in Harness. The framework also defines `plugin-manifest/v1` for contributing roles, skills, scripts, and lifecycle hooks. Eleven common roles are included, and missing roles can be created from `company-role-template`.

### Runs multiple isolated companies or workflows

One top-level session maps to one isolated instance. Start another session to create another company or workflow. Each instance keeps its own team, tasks, skills, files, and optional Feishu bots; business data is not shared between them.

---

## Quick Start (3 Steps)

### Prerequisites

- Windows 10/11
- [DSH Desktop](https://github.com/dataelement/dsh-desktop) installed and signed in (it packages DeepSeek Harness as a desktop app)

### Step 1: Install the framework into Harness

```powershell
cd ai-company-framework
.\scripts\install.ps1   # copies core/skills into Harness's skills directory
.\scripts\verify.ps1    # environment self-check
```

### Step 2: Open a new session

Open a **new session** in Harness (never reuse an old one — one session = one company; a new session = a new company).

### Step 3: Say one sentence

> "I want to start an e-commerce company selling specialty coffee beans, with the first deliverables being a Xiaohongshu post and a customer-service playbook."

Or describe a workflow directly:

> "Build a research-report pipeline: one agent finds sources, one analyzes data, one writes the report, and QA verifies citations before delivery."

The boss fills in the information needed for the architecture, then creates the team and task graph.

## Capabilities

| Capability | Description |
|------|------|
| Native Harness runtime | Reuses Harness models, tools, sessions, Skills, and plugins |
| Team from one sentence | Creates roles, team, directories, and initial tasks from an outcome |
| Automatic model routing | Reads available models and routes by capability, speed, cost, and quota |
| AgentTeams monitoring | Shows member state, task ownership, dependencies, and progress in real time |
| Per-agent coaching | Independent conversation, model route, Skill file, and persistent context |
| Workflow orchestration | Serial/parallel tasks, file contracts, QA, rework, and delivery |
| Feishu remote control | Creates boss/staff bots and routes messages to a specific agent |
| Plugin extension | Adds capabilities through Harness plugins and `plugin-manifest/v1` |
| Isolated instances | One session per instance; run multiple companies or workflows |
| Shared workflow wisdom | Shares de-identified process lessons, not business data |

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

## Plugin interface

`v0.1.1` defines `plugin-manifest/v1` and includes a Feishu example for declaring contributed Skills, scripts, and lifecycle hooks. An automatic plugin loader is not part of this release; today this project's `install.ps1` installs Skills into Harness, which loads and runs them.

- **Hooks**: after company creation, before the first task, after task completion, and before delivery;
- **Skill injection**: plugins can add roles and domain capabilities;
- **Script hooks**: PowerShell or Node scripts;
- **Isolation**: plugins may not read another instance's data, and credentials must not enter the repository.

See [`docs/PLUGINS.md`](docs/PLUGINS.md) and the [`plugins/feishu/`](plugins/feishu/README.md) example.

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

- [x] v0.1.1: Skills starter kit, 11 roles, task/QA/delivery templates, model-routing rules, AgentTeams monitoring, and Feishu P2P integration

## License

[MIT](LICENSE) © 2026 AI Company Framework contributors

## Disclaimer

- Content generated by this framework (copy/plans/code) requires human review before use; it is not professional advice.
- Multi-role virtual routing in `dsh-feishu-bridge 0.4.0` is staging; evaluate it before production deployment.
- Adding bots to groups and mirror webhooks require manual action in the Feishu client.
