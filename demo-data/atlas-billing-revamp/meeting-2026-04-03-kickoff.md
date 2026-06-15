# Meeting Notes - 2026-04-03 Kickoff

## Attendees

- Priya, Product
- Jordan, Engineering
- Maya, Growth
- Leo, Support
- Chen, Finance
- Sofia, Design

## Context

Priya opened by saying the goal is not only a new checkout screen. The team
needs a shared billing language that appears consistently across pricing,
checkout, invoices, lifecycle emails, and support macros.

## Decisions

- The first launch will focus on new customers and customers whose annual
contracts are renewing in Q3.
- The team will preserve legacy pricing for active annual contracts until their
renewal date.
- Support will receive a migration preview at least one week before the public
pricing page changes.

## Action items

- Jordan will map all checkout entry points by 2026-04-08.
- Maya will draft the first version of pricing page messaging by 2026-04-11.
- Leo will list the top billing confusion tickets from the last quarter by
  2026-04-09.
- Chen will confirm revenue recognition constraints for grandfathered contracts.

## Notes

Jordan warned that plan IDs are reused in two old webhook handlers. He said,
"We should not rename plan IDs until the webhook replay path is tested."

Leo said support needs exact wording for legacy pricing. He said, "Customers
will ask whether the new names mean their current price changed."

## Open questions

- Should monthly legacy customers be migrated immediately or only when they
  change plans?
- Should annual customers see the new tier name before their renewal email?
