# Atlas Billing Revamp - Project Brief

## Summary

Atlas Billing Revamp is a cross-functional project to redesign pricing,
checkout, invoicing, failed payment handling, and legacy customer migration for
the Atlas SaaS product.

The current billing experience grew through several one-off launches. Customers
can subscribe from three different checkout entry points, invoices use mixed
terms, and support often has to explain whether legacy discounts still apply.

## Goals

- Launch a clearer three-tier pricing model for new customers.
- Move checkout to a single hosted flow before the public launch.
- Keep annual contracts on their current price until renewal.
- Give support and success teams a migration preview before customers see new
pricing.
- Reduce billing-related support tickets during the first launch month.

## Non-goals

- No custom enterprise quote workflow in the first launch.
- No self-serve plan downgrade flow until after migration.
- No usage-based pricing in the first launch.

## Scope

The team will ship the new pricing page, plan metadata, checkout copy, invoice
labels, tax handling, failed payment retry rules, and migration communications.

## Known risks

- Existing customers may be confused if the billing portal shows both legacy
and new plan names.
- Tax handling needs a final provider decision before checkout can be frozen.
- Support needs an internal migration guide before announcement emails go out.

## Success metrics

- Fewer than 20 billing support tickets in the first week after launch.
- Checkout conversion does not drop by more than 3%.
- No more than 2% of migrated customers contact support about unexpected price
changes.
