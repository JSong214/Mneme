---
name: planning
description: Turn complex feature requests, architecture changes, or multi-file refactors into a phased implementation plan. Use when the work is too large, risky, or ambiguous to jump straight into editing.
---

# Planning

Use this skill to turn a vague or large request into a sequence of concrete,
verifiable steps before implementation starts.

## Use When

- A feature touches multiple files or subsystems
- The request implies architectural change or refactoring
- The scope is ambiguous and needs assumptions called out
- The work should be broken into safe incremental phases

## Planning Workflow

1. Clarify the request.
   - Identify goals, constraints, non-goals, and success criteria.
   - State assumptions explicitly if the codebase does not answer them.
2. Review the current structure.
   - Find the likely files, modules, or workflows affected.
   - Check for existing patterns worth extending instead of replacing.
3. Break the work into steps.
   - Each step should be concrete, bounded, and verifiable.
   - Prefer steps that can land independently.
4. Sequence by dependency.
   - Put prerequisites first.
   - Group related changes to reduce context switching.
5. Add testing and validation.
   - Name the tests or verification steps each phase needs.
6. Call out risk.
   - Note unclear assumptions, migration hazards, edge cases, or rollback
     concerns.

## Plan Rules

- Prefer minimal-change plans over speculative redesigns.
- Use file paths, modules, or components when they are known.
- Separate blockers from optional polish.
- If the task is large, split it into phases that deliver usable progress.
- If the request is under-specified, say what needs confirmation before coding.

## Output Format

Structure the plan like this:

```markdown
# Implementation Plan: <feature or change>

## Overview
- Short summary of the intended change

## Requirements
- Functional requirement
- Constraint or assumption

## Affected Areas
- path/to/file or module: why it changes

## Phases
### Phase 1
1. Step name
   - Action: what to change
   - Why: why this step exists
   - Dependencies: none or prior step
   - Risk: low / medium / high

### Phase 2
...

## Testing
- Unit
- Integration
- End-to-end or manual verification

## Risks
- Risk and mitigation

## Success Criteria
- Observable outcome
```

## Anti-Patterns

- Writing a plan with no file or module targets
- Listing vague tasks like "update backend" or "fix frontend"
- Mixing mandatory work with optional cleanup
- Planning a rewrite when an extension would do
