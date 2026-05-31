---
name: security-review
description: Review code that handles authentication, authorization, secrets, user input, file uploads, API endpoints, payments, or sensitive data. Check for common web vulnerabilities, unsafe data handling, and risky operational patterns before shipping.
---

# Security Review

Use this skill to review risky code paths before merge or release. Focus on
real vulnerabilities and concrete exploit paths, not generic security noise.

## Use When

- Adding auth, session, role, or permission logic
- Handling user input, form data, query params, or file uploads
- Creating API endpoints, webhooks, or background jobs
- Working with secrets, tokens, credentials, or environment-backed config
- Implementing payment, billing, or other sensitive flows
- Logging, exporting, or storing user or operational data

## Review Workflow

1. Identify the trust boundaries.
   - What input enters the system?
   - What state changes occur?
   - What privileged resources are touched?
2. Scan the highest-risk paths first.
   - Auth and authorization gates
   - Input validation and parsing
   - Database queries and command execution
   - Dependency changes and new external packages
   - File handling, URLs, webhooks, and external API calls
   - Logging, errors, and secret handling
3. Look for concrete vulnerability classes.
   - Hardcoded secrets or leaked credentials
   - Missing validation or unsafe deserialization
   - SQL injection or shell injection
   - XSS, unsafe HTML rendering, or templating issues
   - CSRF gaps on state-changing requests
   - Broken access control or missing authorization checks
   - SSRF or untrusted outbound fetch targets
   - Sensitive data exposure in logs, errors, or responses
   - Missing rate limiting on abuse-prone endpoints
4. Check operational safety.
   - Are secrets sourced from environment or a secret manager?
   - Are newly added dependencies introducing known or obvious security risk?
   - Are user-facing errors sanitized?
   - Are unsafe debug behaviors gated or removed?
   - Does the implementation fail safely when validation or auth fails?
5. Report findings by severity.
   - Prioritize exploitable issues and real data exposure over style advice.
6. If a critical issue is found, stop normal flow and fix it before continuing.

## Review Rules

- Prefer primary source reasoning from the code and configuration actually
  changed.
- Flag only issues with a clear exploit path or realistic failure mode.
- Distinguish absence of evidence from evidence of safety.
- Avoid false positives where context clearly makes a pattern safe.

## High-Value Checks

- Secrets are never hardcoded and are not printed in logs
- Dependency changes have been reviewed for obvious security risk
- User input is validated before use
- Database access uses safe parameterization or trusted query builders
- Authorization is enforced before sensitive reads or writes
- HTML or rich content rendering is sanitized or safely escaped
- State-changing endpoints have CSRF protection where applicable
- Error responses do not leak stack traces, SQL, tokens, or internal state

## Output

When using this skill, report:

- Findings ordered by severity
- The vulnerable path or affected file
- Why the issue is exploitable or risky
- The concrete fix or mitigation
- Any residual uncertainty or missing validation evidence

## Anti-Patterns

- Treating every suspicious string match as a real vulnerability
- Ignoring authorization because authentication exists
- Reviewing only happy paths
- Assuming framework defaults are safe without verifying the code path
- Logging or returning sensitive internal details for debugging convenience
