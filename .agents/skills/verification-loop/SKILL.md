---
name: verification-loop
description: Run a structured verification pass after significant code changes, before a PR, or before a commit that should be considered ready. Check build health, types, lint, tests, security signals, and the final diff, then report what passed and what still needs work.
---

# Verification Loop

Use this skill to run a disciplined pre-merge or pre-PR verification pass. The
goal is not to run every possible command, but to run the right checks in a
useful order and stop when a blocking failure appears.

## Use When

- Finishing a feature or bug fix
- Preparing a commit or pull request
- After a meaningful refactor
- Before claiming a change is ready

## Verification Order

1. Build or compile check
   - Confirm the project still builds or the changed target still compiles.
   - If this fails, stop and fix it before broader verification.
2. Type or static analysis check
   - Run the relevant type checker or equivalent static validation.
   - Treat newly introduced errors as blockers.
3. Lint or style check
   - Run the relevant linter for the changed area.
   - Separate blocking errors from non-blocking warnings.
4. Test check
   - Start with the most relevant tests.
   - Expand to broader suites only as needed for confidence.
   - If coverage is tracked, report it rather than guessing.
5. Security signal check
   - Check for obvious secrets, risky logging, and newly introduced security
     regressions in the changed area.
   - If the change is security-sensitive, use `$security-review`.
6. Diff review
   - Review the final diff for unintended edits, missing error handling, and
     untested behavior.

## Verification Rules

- Run the smallest useful check first, then broaden scope.
- Stop early on hard blockers instead of burying them in a long report.
- Prefer project-native commands over generic examples when the repo provides
  them.
- Report what you did not verify; do not imply coverage you do not have.

## What To Report

For each phase, mark one of:

- `PASS`
- `FAIL`
- `NOT RUN`
- `NOT APPLICABLE`

Then summarize:

- Blocking issues
- Non-blocking warnings
- Overall readiness for commit or PR

## Suggested Report Shape

```text
VERIFICATION REPORT

Build: PASS
Types: PASS
Lint: FAIL
Tests: PASS
Security: PASS
Diff: PASS

Overall: NOT READY

Blocking issues:
1. Lint error in src/example.ts

Warnings:
1. Coverage not checked because the repo has no coverage command
```

## Anti-Patterns

- Running broad, expensive checks before the obvious fast blockers
- Reporting "all good" without naming the commands or checks actually run
- Treating warnings as passes without mentioning them
- Skipping diff review because automated checks passed
