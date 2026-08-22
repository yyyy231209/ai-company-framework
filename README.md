# AI Company Framework

> **Company Is a Word.**
>
> An installable DeepSeek Harness `dsh.bundle`: **one download, one install** gives you multi-agent company Skills, workflow templates, the AgentTeams runtime with its activity panel, an employee sidebar, and a Feishu bot bridge with an onboarding wizard.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v0.3.10-blue)](RELEASE_NOTES.md)

[English](README.md) | [绠€浣撲腑鏂嘳(README.zh-CN.md)

## What ships in this Bundle (v0.3.0)

- **14 flat Skills**: `company-boss`, `company-pipeline`, `company-role-template`, and 11 role Skills.
- **7 workflow templates** under `core/templates/`.
- **AgentTeams runtime + web activity panel**: bundled dependency `@nanmicoder/dsh-agent-teams@0.1.10` (MIT), mounted as its own Cordis row by this package's patch. Team creation, member sessions, dependency tasks, and the activity tree appear without any extra install.
- **Employee sidebar (host + web UI)**: bundled under `plugins/sidebar/` + the composite `client.js` 鈥?per-member model routing (lossless reconfigure), live session/tool view, messaging. Incorporated from the authorized local sidebar package (see `NOTICE.md`).
- **Feishu bot bridge (host + web UI)**: bundled under `plugins/feishu/lib/` + the composite `client.js` 鈥?official `registerApp` scan onboarding, DPAPI-protected credentials, N long connections, routing, `feishu_*` tools. Incorporated from the authorized local bridge `dsh-feishu-bridge@0.3.1` and renamed `ai-company-framework-feishu` (see `NOTICE.md`).
- A native Bundle entry (`index.js`), composite client bundle (`client.js`), and a dual-row Cordis patch (`cordis.patch.yml`).
- No RAG or vector-search dependency.

The Bundle mounts its own package-relative Skill root through the official `@deepseek-ai/dsh-skill-filesystem` provider. It does not copy files into the user's Skill directory.

## What stays human (no automation, by design)

- **Model provider**: DSH needs your own provider API key configured in the host settings before a session can run.
- **Feishu authorization**: the first Feishu use opens the official `registerApp` confirmation link / QR 鈥?scanning, admin approval, and inviting the bot into groups happen on Feishu's official pages. The bundle never stores your App Secret before authorization (DPAPI, CurrentUser scope, local only) and never reports `connected` unless a real WebSocket is established.
- **Workspace selection**: creating a session needs the DSH Desktop directory picker.
- **Publishing**: this repository does not publish npm packages, create Releases, push branches, or open external PRs without explicit human confirmation.

## Runtime boundaries

- DeepSeek Harness supplies models, tools, sessions, Skills, and the Bundle runtime.
- AgentTeams execution, the activity panel, the employee sidebar, and the Feishu bar are **implemented by this Bundle** (dependency or incorporated code) and activate automatically on install 鈥?no separate plugin to fetch.
- Feishu authorization is a human gate; staging capabilities (bridge 0.4.0 multi-role virtual routing, offline retry) are **not** claimed stable by this package.
- Honest-state rule: any capability that is not installed, not authorized, or offline is displayed as such with onboarding guidance 鈥?never falsely reported as ready or connected.

## Install

Choose the Harness profile you actually use. `web` is shown only as an example.

```powershell
# After the npm package is published
dsh plugin --profile web add ai-company-framework

# Or install a package tarball directly
dsh plugin --profile web add .\ai-company-framework-0.3.0.tgz
```

For a checkout that has not been published:

```powershell
npm pack
dsh plugin --profile web add .\ai-company-framework-0.3.0.tgz
```

> Install from a **packed `.tgz` or a registry spec**, not from a plain source directory: `dsh plugin add <dir>` records a `link:` dependency whose own dependencies are not installed.

Start a **new Harness session** after installation so the session receives the updated Skill catalog and the web UI mounts the activity panel, employee sidebar, and Feishu bar. Then describe the company or workflow you want:

> "Build an ecommerce content workflow: research, writing, QA, targeted rework, and delivery."

## Uninstall

```powershell
dsh plugin --profile web remove ai-company-framework
```

Native removal deletes the profile dependency, the Bundle layer, and the package directory (including its orphaned transitive dependencies). Because the Bundle never copies into user Skill roots, existing user Skills remain untouched. Your own data 鈥?company teams, Feishu credentials/registry, logs 鈥?is deliberately kept (config rollback 鈮?data deletion).

## Verification

The release candidate is verified against the DSH Desktop embedded `@deepseek-ai/dsh 0.1.0-rc.8` baseline. This is a tested baseline, not a custom `minFrameworkVersion` protocol.

```powershell
node tests\bundle-check.mjs
node tests\client-feishu-check.mjs
powershell -ExecutionPolicy Bypass -File tests\smoke.ps1
powershell -ExecutionPolicy Bypass -File scripts\security-scan.ps1

# Real isolated pack/install/load/uninstall check
powershell -ExecutionPolicy Bypass -File tests\install-bundle.ps1 `
  -DshBin '<path-to-@deepseek-ai\dsh\lib\bin.js>'
```

Isolated acceptance (P3/P4/P6, reproducible): fresh temp `DSH_HOME` + new profile + real `.tgz` 鈥?dual-row composition (`ai-company-framework` + `agent-teams`), 14 Skills discovered and loaded through the installed provider, `feishu_*` tools registered, real web-profile boot with both client bundles in `window.__DSH_BOOT__`, sidebar state/reconfigure routes, Feishu un-authorized state (0 bots, 0 connected), uninstall with zero residue and an unchanged user-Skill sentinel. Supply chain: 54-package closure with 0 missing licenses, `pnpm audit --prod` clean, no unscoped `dsh-feishu-bridge` dependency.

> Install-time `pnpm` may print "peers missing" warnings for `@deepseek-ai/cordis` and `@deepseek-ai/dsh-*`: DSH profiles run with `autoInstallPeers:false` and the host closure resolves those peers at runtime. This is expected, not an install failure.

## Package-relative resources

From `core/skills/*.md`, stable bundled resources are located at:

- Templates: `../templates/`
- Feishu SOP: `../feishu-onboarding-sop.md`

The provider resolves the package root with `import.meta.url`; it does not depend on the checkout path, Windows username, or active session ID.

## Legacy manual scripts

`scripts/install.ps1` is retained only for older manual-copy workflows and is not included in the npm package. The supported Bundle path is `dsh plugin --profile <name> add <package-or-source>`.

## Screenshots

![Architecture](assets/architecture.svg)

| AgentTeams activity | Employee sidebar |
|---|---|
| ![AgentTeams activity](assets/screenshots/agentteams-activity.png) | ![Employee sidebar](assets/screenshots/employee-sidebar.png) |

![Company workflow](assets/screenshots/company-created.png)

The screenshots are redacted and show the host UI capabilities this Bundle wires up; they do not imply the UI components live in this package's code.

## Documentation

- [Quick start](docs/QUICKSTART.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Bundle and extension guide](docs/PLUGINS.md)
- [FAQ](docs/FAQ.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [awesome-dsh-plugin submission preparation](docs/DSHMARKET-SUBMISSION.md)

## Notices

- Incorporated components, their provenance, and the supply-chain boundary are documented in [NOTICE.md](NOTICE.md). The two incorporated components came from local `private:true` packages under explicit authorization; the open-source dependency `@nanmicoder/dsh-agent-teams` is not copied, only depended on.
- The package **never** depends on the unrelated unscoped npm package `dsh-feishu-bridge` (a third-party package with no `dsh.bundle` capability).

## License

[MIT](LICENSE) 漏 2026 AI Company Framework contributors
