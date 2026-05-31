---
name: search-first
description: Check the repo, existing tools, installed skills, package ecosystems, and official documentation before writing custom code. Use when starting a feature, adding a dependency, designing a helper, or evaluating build-vs-buy tradeoffs.
---

# Search First

Use this skill to avoid writing net-new code before checking whether the repo,
the current toolchain, or a well-supported external solution already covers the
need.

## Use When

- Starting a feature that may already have a known library or pattern
- Adding an integration, dependency, formatter, linter, or test tool
- Creating a new helper, wrapper, adapter, or CLI utility
- Deciding whether to adopt, extend, compose, or build a solution

## Workflow

1. Define the need precisely.
   - State the capability, target stack, constraints, and non-goals.
2. Search the repo first.
   - Check existing modules, utilities, tests, scripts, and docs.
   - Prefer extending an existing local pattern over adding a new dependency.
3. Search the current environment.
   - Check installed skills, available plugins, connectors, and project tooling.
4. Search external primary sources.
   - Prefer official docs, package registries, and maintained upstream
     repositories over blog posts or random snippets.
5. Evaluate candidates.
   - Compare fit, maintenance, docs quality, license, operational risk, and
     dependency weight.
6. Decide explicitly.
   - `Adopt`: use an existing solution as-is.
   - `Extend`: add a thin wrapper or small project-specific layer.
   - `Compose`: combine a few small tools to cover the requirement.
   - `Build`: write custom code only when the search result is weak or absent.
7. Explain the choice briefly before implementation.

## Evaluation Rules

- Prefer the smallest well-maintained solution that fits the requirement.
- Avoid large dependencies for narrow problems.
- Avoid wrappers that hide a library so heavily that upgrades become harder.
- Prefer official or dominant community standards when multiple options exist.
- Prefer local consistency when the repo already uses a similar tool or pattern.

## Output

When this skill materially affects a decision, report:

- What was searched
- The top candidate options
- The chosen path: `Adopt`, `Extend`, `Compose`, or `Build`
- Why that path is the lowest-risk and lowest-complexity option

## Example

User asks: "Add dead link checking for markdown files."

- Search the repo for existing markdown or lint tooling.
- Search package ecosystems for maintained link-checking tools.
- Compare whether a markdown plugin, textlint rule, or standalone checker fits
  the existing toolchain best.
- Prefer adding a well-supported rule to the current lint pipeline over writing
  a custom checker.

## Anti-Patterns

- Jumping straight into implementation
- Adding a dependency without checking whether the repo already has one
- Using secondary sources when official docs are available
- Treating "custom code" as the default answer
