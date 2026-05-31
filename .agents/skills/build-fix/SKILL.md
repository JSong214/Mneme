---
name: build-fix
description: Fix build failures, type errors, import issues, and other compilation blockers with the smallest reasonable change. Use when the goal is to get the project green again without refactoring or redesigning unrelated code.
---

# Build Fix

Use this skill when the immediate goal is recovery, not improvement. Optimize
for a green build with minimal risk and minimal diff.

## Use When

- The build fails
- Type checking fails
- Imports or module resolution break
- A configuration or dependency change causes compilation errors

## Workflow

1. Collect the actual errors.
   - Run the narrowest command that reproduces the failure.
   - If needed, run the broader build command only after understanding the
     first blocker.
2. Categorize the error.
   - Type mismatch
   - Missing import or export
   - Nullability or undefined access
   - Missing package or broken path alias
   - Config or compiler mismatch
3. Apply the smallest safe fix.
   - Add the missing type annotation, null check, import, export, or config
     correction.
   - Avoid rewriting logic unless the error cannot be fixed otherwise.
4. Re-run the relevant failing command.
   - Confirm the original blocker is gone.
   - If a new blocker appears, repeat with the next one.
5. Stop once the build is green.
   - Do not turn a build-fix task into a refactor task.

## Allowed Fixes

- Type annotations or type narrowing
- Null or undefined checks
- Import and export corrections
- Path or alias corrections
- Missing dependency declarations when clearly required
- Small configuration corrections directly tied to the failure

## Avoid

- Refactoring unrelated code
- Renaming or restructuring code for style reasons
- Relaxing project rules just to silence errors
- Broad cleanup that increases review surface
- Using cache-clearing or reinstall "nuclear options" before understanding the
  real failure

## Output

When using this skill, report:

- The failing command or check
- The root cause category
- The minimal fix that was applied
- The verification command that passed afterward
- Any remaining warnings or unresolved follow-up work

## Anti-Patterns

- Changing architecture to fix a local compile error
- Editing config to weaken checks instead of fixing source code
- Claiming success after only fixing the first error without rerunning
- Bundling style or performance changes into a build recovery patch
