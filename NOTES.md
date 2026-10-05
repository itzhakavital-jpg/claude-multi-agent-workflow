# Notes

## What the plugin does

`api-quality` checks a small Express API in one command. `/api-quality:quality-check course-api` sends two read-only reviews out at the same time (one on the code, one on test coverage), merges what they find into a single gap list, has a second agent write the missing tests and run them, and ends with a short report that separates "bugs a test now proves" from style findings. A skill holds the route conventions so they are applied the same way every time, and a hook lints every JS file Claude edits.

## How to install

```
/plugin marketplace add itzhakavital-jpg/claude-multi-agent-workflow
/plugin install api-quality@avital-quality-tools
```

For local work: `claude --plugin-dir .` from the repo root, after `cd course-api && npm install`.

## Scoping decision: the reviewer gets Read, Grep, Glob and nothing else

The obvious temptation was to give `code-reviewer` Bash so it could run `npm test` and see coverage for itself. I did not. A reviewer that can run commands can also change state (install packages, write snapshot files, start a server on a port), and then its report is no longer a pure function of the code it was given. Keeping it to `Read, Grep, Glob` means three things: it can run twice in parallel with no chance of the two copies stepping on each other, its output can be trusted as "what the code says" rather than "what happened on this machine", and nothing it does needs a permission prompt. Test execution belongs to `test-writer`, which already needs `Write`, `Edit` and `Bash` and is told to use Bash only for `npm test` and `npm run lint`.

Both agents use `sonnet`. Reviewing four short files and writing supertest cases is not hard reasoning, so `opus` would be cost without benefit. I considered `haiku` for the reviewer, but the coverage review has to map each route branch to a specific test, and the cheap failure there is marking a branch "covered" because a test with a similar name exists. I have not benchmarked Haiku on this, so it is a judgement call, not a measurement. Either way that mistake would flow straight into Step 2, so the reviewer stays on `sonnet`.

## Orchestration decision: what runs in parallel and what waits

**Parallel:** the code review and the coverage review. They read overlapping files but neither needs the other's answer, and both are read-only, so running them together costs nothing in safety and roughly halves the wall time of the first step.

**Sequential:** test writing waits for both reviews. It cannot start earlier because its input is the merged gap list, and that list needs both halves: Review B says which branches have no test, Review A adds the findings a test can prove (for example a missing `400` on a bad id). Starting the writer early would mean it guesses what to test and then gets corrected, which is slower than waiting.

**Sequential again:** the final report waits for the writer, because the most useful line in it ("this finding is now proven by a failing test") only exists after the tests have run.

I deliberately did not let the command fix application code. Reviewing, testing and fixing in one unattended pass makes it too easy for the same run to write a test and then change the app until that test passes, which proves nothing. The report names the fix and a human applies it.

## Known limits

- The workflow assumes the project has `npm test` and `npm run lint` scripts. Other projects need the command text adjusted.
- The hook only blocks on ESLint errors, not warnings, because that matches what `npm run lint` treats as a failure in `course-api`.
