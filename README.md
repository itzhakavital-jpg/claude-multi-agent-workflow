# api-quality

A Claude Code plugin that reviews, tests and lints a small Express API. This repo is both the plugin and the marketplace that offers it.

The original course brief for this project is kept in [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md). The API used for testing lives in [`course-api/`](course-api/).

## What is in it

| Piece | Name in Claude Code | What it does |
|---|---|---|
| Subagent | `api-quality:code-reviewer` | Read-only review against the project's `CLAUDE.md`. Returns findings, test gaps and a verdict. Tools: `Read, Grep, Glob`. |
| Subagent | `api-quality:test-writer` | Writes missing tests under `tests/` and runs `npm test` and `npm run lint`. Never touches app code. |
| Command | `/api-quality:quality-check [folder]` | The workflow: two reviews in parallel, then test writing, then a report. |
| Skill | `api-quality:api-conventions` | Checklist for adding or changing a route (status codes, error shape, store access, tests). |
| Hook | `PostToolUse` on `Write\|Edit\|MultiEdit` | Runs the project's ESLint on any `.js` file Claude just changed and feeds errors back to Claude. |

## Install

From inside Claude Code:

```
/plugin marketplace add itzhakavital-jpg/claude-multi-agent-workflow
/plugin install api-quality@avital-quality-tools
```

Then restart Claude Code, or run `/reload-plugins`.

## Try it locally (without installing)

```bash
git clone https://github.com/itzhakavital-jpg/claude-multi-agent-workflow
cd claude-multi-agent-workflow
(cd course-api && npm install)
claude --plugin-dir .
```

In the session:

```
/api-quality:quality-check course-api
```

The command does not commit. Look at the new tests with `git diff course-api/tests` before keeping them.

## Layout

```
.claude-plugin/
  plugin.json          # name + version
  marketplace.json     # lists this plugin with source "./"
agents/
  code-reviewer.md
  test-writer.md
commands/
  quality-check.md
skills/
  api-conventions/SKILL.md
hooks/
  hooks.json           # calls ${CLAUDE_PLUGIN_ROOT}/scripts/lint-on-edit.js
scripts/
  lint-on-edit.js
```

Only the two manifest files live in `.claude-plugin/`. Everything else is at the repo root, which is where Claude Code looks for it.

## Hook details

`scripts/lint-on-edit.js` reads the hook event from stdin, and if the edited file is `.js`, `.cjs` or `.mjs` it walks up to the nearest folder that has an `eslint.config.*` and a local `node_modules/.bin/eslint`, then lints just that file. ESLint errors exit with code `2` so Claude sees them and fixes them. Warnings, non-JS files, and projects with no ESLint install pass silently. Node is the only requirement.

## Versioning

Bump `version` in both `.claude-plugin/plugin.json` and the plugin entry in `.claude-plugin/marketplace.json`, then push. Users pick up the change with `/plugin marketplace update avital-quality-tools`.

## Checks

`node .github/scripts/validate-plugin.js` is the course check that runs in CI. `claude plugin validate .` is Claude Code's own manifest check. Both pass.
