---
name: tdd-workflow
description: Use a test-first workflow for new features, bug fixes, and refactors. Define expected behavior, write a failing test, implement the smallest passing change, then refactor while keeping tests green.
---

# TDD Workflow

Use this skill to keep implementation driven by executable behavior rather than
guesswork. Favor the smallest useful TDD loop that fits the task.

## Use When

- Adding a new feature
- Fixing a bug with a reproducible failure
- Refactoring behavior that must stay stable
- Adding or changing API, UI, or business logic

## Workflow

1. Define the behavior.
   - State the user-visible outcome or the bug being reproduced.
   - Identify the smallest test target that proves the behavior.
2. Write the test first.
   - Add a failing test that exercises the intended path.
   - Prefer a narrow test over a broad one when both prove the same point.
3. Verify `RED`.
   - Run the relevant test target.
   - Confirm the new test actually executes and fails for the intended reason.
   - Do not start implementation if the failure is caused only by broken setup,
     syntax errors, or unrelated regressions.
4. Implement the smallest passing change.
   - Change production code only enough to satisfy the failing test.
   - Avoid opportunistic refactors during the `GREEN` step.
5. Verify `GREEN`.
   - Re-run the same relevant test target.
   - Confirm the previously failing test now passes.
6. Refactor.
   - Improve naming, structure, and duplication while keeping tests green.
   - Re-run the relevant tests after refactoring.
7. Broaden verification.
   - Run adjacent tests, then broader suites as needed.
   - Check coverage if the repo tracks it.

## Test Selection

- `Unit tests`: pure functions, helpers, state transitions, component logic
- `Integration tests`: API routes, persistence boundaries, service composition
- `E2E tests`: critical user flows and browser-visible regressions

Prefer the cheapest test that gives strong confidence. Use E2E for true end-user
flows, not as the default for every change.

## Test Design Rules

- Test behavior, not internal implementation details
- Use clear names that describe the scenario and expected result
- Cover happy path, error path, and important edge cases
- Keep tests isolated; avoid hidden shared state
- Mock external systems only at the boundary that keeps the test reliable
- Use assertions that prove the behavior changed, not assertions so weak that
  the test would pass either way

## Edge Cases To Consider

- Null, undefined, empty, or missing input
- Invalid types or malformed payloads
- Boundary values and off-by-one behavior
- Network, database, or dependency failures
- Fallback behavior when a dependency is unavailable
- Concurrency or race-condition behavior when the feature can be triggered in
  parallel
- Large input or data-volume behavior when scale is part of the risk
- Special characters, Unicode, or escaping-sensitive content when relevant

## Quality Checks

- Public or externally consumed behavior has direct test coverage
- Error paths are tested, not just the happy path
- External dependencies are mocked or isolated at the right boundary
- Tests do not depend on execution order or shared leftover state

## Coverage

- Follow the repository's configured coverage threshold when one exists
- If no threshold exists, use `80%` as a default target, not a blind rule
- Do not chase coverage by writing low-value tests that assert nothing useful

## Output

When using this skill, report:

- What behavior or bug the test covers
- What test target was used for `RED` and `GREEN`
- What minimal implementation change was made
- What broader verification was or was not run

## Anti-Patterns

- Writing production code before proving a failing case
- Calling a test `RED` without actually running it
- Fixing the test when the implementation is wrong
- Refactoring during `GREEN` instead of after it
- Using broad end-to-end coverage to avoid precise tests
