# Community directory submission preparation

> Status: preparation only. Do not publish packages, push tags, modify directory repositories, open PRs, or touch any market registry snapshot as part of local validation.

AI Company Framework is a real DSH profile Bundle because its root `package.json` declares `dsh.bundle.patch` and the referenced `cordis.patch.yml` inserts a loadable plugin row. Directory submission is a separate listing process; it does not define Bundle runtime semantics.

## 1. Runtime facts a listing may claim

Verified on `@deepseek-ai/dsh 0.1.0-rc.8`:

- package: `ai-company-framework 0.3.0`;
- native install shape: `dsh plugin --profile <name> add <package-or-tarball>`;
- pure ESM entry, no TypeScript build chain;
- two Cordis rows: `ai-company-framework` (Skills + sidebar host + Feishu host) and `agent-teams` (`@nanmicoder/dsh-agent-teams`, bundled dependency);
- one composite client bundle (`client.js`) exposing the employee sidebar and the Feishu bar UI;
- 14 bundled Skills;
- 7 templates and one onboarding SOP as on-demand resources;
- native pnpm remove clears dependency, Bundle layer and package directory;
- user Skill sentinel remains unchanged;
- no RAG, vector database, standalone Agent runtime or network client (besides the bundled Feishu bridge talking to Feishu official APIs).

Do not claim that this package implements models, tools, sessions or the DSH Desktop shell itself — those remain host capabilities.

The package DOES ship (v0.3.0): the AgentTeams runtime as a bundled dependency (`@nanmicoder/dsh-agent-teams@0.1.10`, MIT), the employee sidebar host+UI, and the Feishu bridge host+UI (incorporated from the authorized local `dsh-feishu-bridge@0.3.1`, see `NOTICE.md`). Feishu **authorization** (scan/confirm, admin approval, bot invites) remains a human gate on Feishu official pages; un-authorized state shows onboarding guidance only and never reports `connected`.

## 2. Files that make the Bundle installable

| File | Purpose |
|---|---|
| `package.json` | npm metadata, peer compatibility and `dsh.bundle.patch` |
| `cordis.patch.yml` | inserts the `ai-company-framework` Cordis row |
| `index.js` | mounts the official filesystem Skill provider over the package-local root |
| `core/skills/*.md` | 14 bundled Skills |
| `core/templates/*.md` | 7 on-demand workflow resources |
| `core/feishu-onboarding-sop.md` | external bridge onboarding guidance |
| `LICENSE`, `README*`, `docs/`, `assets/` | legal, usage and listing material |

Not required by the verified DSH Bundle contract:

- `dsh-manifest.json`;
- `plugin-manifest/v1`;
- `afterCompanyCreate` or other lifecycle hooks;
- `minFrameworkVersion`;
- fixed `dist/` or `bundles/` directories;
- TypeScript or a build step;
- `private: true`.

The `files` array in any reference package is that package's npm allowlist, not a global DSH whitelist. This project only needs its own tarball to contain every file it imports or references.

## 3. Local release gate

Run from this repository:

```powershell
node tests/bundle-check.mjs
powershell -File tests/smoke.ps1
powershell -File scripts/security-scan.ps1
npm pack --dry-run
powershell -File tests/install-bundle.ps1 -DshBin <path-to-@deepseek-ai/dsh/lib/bin.js>
```

The lifecycle test must use a temporary `DSH_HOME` and prove:

- dependency and `dsh.profile.bundles` contain `ai-company-framework` after add;
- dump-config contains the Bundle row;
- the installed package provider lists and loads exactly 14 bundled Skills;
- remove clears dependency, layer and package directory;
- a user Skill sentinel hash is unchanged.

Before any public action, also verify:

- README claims match the tarball, not source-only files;
- screenshots contain no private paths, identifiers, customers or credentials;
- repository URL, author and release version have been confirmed by the repository owner;
- the GitHub release tarball, if referenced, is the exact artifact that passed the gate.

## 4. `awesome-dsh-plugin` directory draft

The researched community directory uses one YAML entry with only these fields:

```yaml
url: https://github.com/yyyy231209/ai-company-framework
name: yyyy231209/ai-company-framework
category: workflow
description:
  en: 'DeepSeek Harness profile Bundle that mounts 14 package-local Skills and 7 on-demand workflow templates via the official filesystem Skill provider; ships no RAG, AgentTeams implementation, or Feishu bridge runtime.'
  zh: 'DeepSeek Harness profile Bundle：通过官方文件系统 Skill provider 挂载 14 个包内 Skills 与 7 个按需工作流模板；不携带 RAG、AgentTeams 实现或飞书 bridge 运行时。'
```

The owner/repository URL is the user-confirmed source. The description intentionally does not claim a bundled Feishu bridge, AgentTeams implementation, UI, automatic model router, or hook runner.

Directory constraints observed during preparation:

- one plugin per `data/plugins/<owner>__<repo>.yml`;
- use a supported category such as `workflow`;
- only `url`, `name`, `category`, `description`, and directory-supported tarball/file fields are allowed;
- the target repository must expose `dsh.bundle` in a package manifest;
- do not add unrecognized `npm:` or compatibility fields;
- change only this project's entry;
- do not hand-edit generated directory READMEs;
- run the directory repository's own generator and checks only after a human authorizes creating a contribution branch.

A directory listing is community metadata. It is not proof that DSH Desktop audits the plugin, and it must not be described as an official security review.

## 5. Optional release tarball

A directory may accept a GitHub-hosted release `.tgz`. If used:

1. generate it with `npm pack` from the reviewed commit;
2. run the lifecycle test against that exact tgz;
3. record its SHA-256 in release notes/QA evidence;
4. upload only after explicit human authorization;
5. make the directory `tarball` point to that immutable release asset.

Do not substitute a source archive for an npm package tarball unless the directory explicitly supports and validates that form.

## 6. PR description draft

```text
Add yyyy231209/ai-company-framework (workflow)

What it is:
- A DeepSeek Harness profile Bundle that registers package-local workflow Skills.

Included:
- 14 bundled Skills.
- 7 on-demand workflow templates.
- One external-bridge onboarding SOP.

Runtime boundary:
- Uses host-provided Harness/DSH capabilities.
- Does not implement AgentTeams, DSH Desktop UI, models, tools, RAG, or a Feishu bridge.

Install:
- dsh plugin --profile web add <package-or-tarball>

Validation:
- bundle-check, smoke, security scan, npm pack dry-run, and isolated add/list/get/remove lifecycle passed on DSH 0.1.0-rc.8.
```

Use the validated local YAML and PR draft from the company artifacts; refresh only facts that change after a confirmed release action.

## 7. Red lines

- no `npm publish`, release upload, tag, push or PR without explicit authorization;
- no changes to another plugin's directory entry;
- no edits to market `registry-snapshot`;
- no claim that `manifest.json` hooks are executed by DSH;
- no claim that `dsh-manifest.json` is required;
- no copying a reference package's `files` array as a universal rule;
- no wording that the Feishu bridge/plugin is supplied by this Bundle;
- no credential, customer data, local username or private absolute path in listing material.
