---
description: Run the review and test workflow on an Express API (review in parallel, then write tests, then report)
argument-hint: "[project folder, default course-api]"
---

Run a quality check on the Express API in `$ARGUMENTS`. If no folder was given, use `course-api`.

Use the plugin's subagents `api-quality:code-reviewer` and `api-quality:test-writer`. Follow the steps in order and do not skip the waits.

## Step 1, in parallel: two independent reviews

Start both of these at the same time, in a single message with two Agent calls. They read different files and do not depend on each other.

- **Review A, code**: ask `code-reviewer` to review the route files and the data layer (`routes/`, `db/`, `server.js`) against the project's `CLAUDE.md`, and return only the Findings table and the Verdict.
- **Review B, test coverage**: ask `code-reviewer` to compare every route and branch (success, `400`, `404`) with the files in `tests/`, and return only the Test gaps table.

## Step 2, after Step 1: write the tests

Wait until both reviews are back. Then merge them into one gap list: every row from Review B, plus any high or medium finding from Review A that a test could prove (for example a missing `400`).

Hand that merged list to `test-writer` and ask it to add the tests and run `npm test` and `npm run lint` inside the project folder. This step depends on Step 1, it cannot start earlier because it does not know what to test until the reviews exist.

## Step 3, after Step 2: report

Write the final report yourself, no subagent:

1. **Findings** from Review A, sorted by severity.
2. **Tests added**, and the test run result, from `test-writer`.
3. **Bugs proven by failing tests**: the findings that a new failing test now demonstrates. Do not fix application code in this command, list the fix instead.
4. **Next step**: the one change you would make first.

Do not commit anything.
