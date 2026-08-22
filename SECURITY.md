# Security Policy

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately instead:

- **GitHub private vulnerability reporting** (preferred): use the "Report a vulnerability" button on the repo's **Security** tab.
- **Email**: `yyyy231209` at GitHub (or the maintainer's public contact).

Include, when possible:

- Affected version(s) and install path (`dsh plugin --profile web add …`).
- Steps to reproduce (minimal).
- Impact (what could an attacker do) and suggested fix if you have one.

## Response

- We aim to acknowledge within **3 business days** and to triage within **1 week**.
- Confirmed issues are fixed privately, then disclosed via a [GitHub Security Advisory](https://github.com/yyyy231209/ai-company-framework/security/advisories) after a release is available.

## Scope

The repository and the published bundle (`ai-company-framework-*.tgz`). Notes:

- The package ships **zero user data** — databases, logs and credentials are created locally at first use; App Secrets are stored via Windows DPAPI (CurrentUser scope) only.
- Feishu authorization, model API keys and workspace selection are human gates and out of scope for the bundle itself.
- If a report involves credentials/tokens that were pushed to the repository, use GitHub's secret-scanning flow and rotate the secret immediately.

## Supported versions

Security fixes are backported to the latest release only. Please upgrade to the newest `v0.3.x` before reporting.
