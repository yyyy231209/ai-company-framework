$gh = 'C:\Program Files\GitHub CLI\gh.exe'
$body = @'
Hi 👋

I just released **AI Company Framework v0.1.1** — a multi-agent starter kit that runs on top of DeepSeek Harness / DSH Desktop. One sentence → a working AI company or workflow, with AgentTeams, employee sidebar, model routing, QA, delivery, and an optional Feishu plugin.

- Repo: https://github.com/yyyy231209/ai-company-framework
- v0.1.1 release: https://github.com/yyyy231209/ai-company-framework/releases/tag/v0.1.1
- 14 Skills (3 framework + 11 roles), 7 templates, plugin-manifest/v1, screenshots included
- Compatible with DSH Desktop + Harness, and ships a root `manifest.json` ready for `dshmarket >= 1.9.0`

The project is honest about its scope: it is a Skills starter kit, not a standalone agent runtime. A declarative company spec, code-level model router, plugin loader, and end-to-end executor are not part of v0.1.1 and are explicitly listed as future work in the README.

Looking for feedback on:

1. Which role you wish existed for your own workflow.
2. Whether you would want roles promoted from Skill rules to runtime (the v0.2 ideas).
3. Plugin authors: would you want to ship roles through the framework `plugin-manifest/v1`?

Happy to iterate on PRs and issues. Thanks for reading!
'@

$query = 'mutation($repositoryId:ID!,$categoryId:ID!,$title:String!,$body:String!){createDiscussion(input:{repositoryId:$repositoryId,categoryId:$categoryId,title:$title,body:$body}){discussion{id url title}}}'

& $gh api graphql `
  -F repositoryId='R_kgDOT3T1gw' `
  -F categoryId='DIC_kwDOT3T1g84DDSUe' `
  -F title='[Show Your Plugins!] AI Company Framework v0.1.1 — multi-agent starter kit on Harness' `
  -F body="$body" `
  -f query="$query"