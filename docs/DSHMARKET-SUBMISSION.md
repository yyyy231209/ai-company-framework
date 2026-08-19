# Publishing to the dshmarket

This document explains how to submit AI Company Framework to the [DSH Desktop](https://github.com/dataelement/dsh-desktop) `dshmarket` plugin catalog (v1.9.0+).

The marketplace expects a `plugin-manifest/v1` file at the root of the repository, a defined list of skills, and an `afterCompanyCreate` hook for installation. This project already meets that contract.

## 1. Required files

| File | Purpose |
|---|---|
| `manifest.json` | Framework-level manifest for the marketplace |
| `core/skills/*.md` | Skills referenced by the manifest |
| `scripts/install.ps1` | Executed by the `afterCompanyCreate` hook |
| `scripts/validate-manifest.ps1` | Local validation helper |
| `README.md` and `docs/` | Displayed on the marketplace listing |
| `assets/screenshots/*.png` | Listing visuals (keep taskbars and paths redacted) |

## 2. Validate locally

```powershell
.\scripts\validate-manifest.ps1
.\tests\smoke.ps1
.\scripts\security-scan.ps1
```

All three scripts must pass before submission.

## 3. Prepare the release

1. Bump `version` in `manifest.json` and matching `CHANGELOG.md` entry.
2. Update `README.md` if the user-facing flow changed.
3. Tag and push:

```powershell
git tag -a v0.1.1 -m "AI Company Framework v0.1.1"
git push origin v0.1.1
```

## 4. Submit to the marketplace

The exact submission flow depends on the dshmarket version. For `>= v1.9.0`:

1. Open `DSH Desktop` -> Settings -> Marketplace -> Submit Plugin.
2. Provide the GitHub repository URL and the tag name.
3. The marketplace loads `manifest.json` and runs `scripts/install.ps1` through the `afterCompanyCreate` hook in a sandbox.
4. If `validate-manifest.ps1` and the smoke tests pass in CI, the listing is created.

If the marketplace uses a PR-based submission:

1. Fork `dataelement/dsh-marketplace` (or whatever the official catalog repository is).
2. Add an entry under `catalog/ai-company-framework.json` with the same fields as `manifest.json` plus `repository`, `latestRelease`, and `verified: false`.
3. Open a PR titled `Add AI Company Framework v0.1.1`.

## 5. Required version compatibility

| dshmarket | minFrameworkVersion |
|---|---|
| `>= 1.9.0` | `2.0` (this release) |
| `< 1.9.0`  | not supported — older versions lack the `plugin-manifest/v1` schema |

If the installed dshmarket is older than 1.9.0, the manifest will be rejected. Users can still install manually via `git clone` + `install.ps1`.

## 6. Post-submission

- Watch the marketplace for user reviews and bug reports.
- Bump `version` and tag a new release for every fix or capability change.
- Update screenshots in `assets/screenshots/` to keep the listing current.
- Pin this doc to the released version.