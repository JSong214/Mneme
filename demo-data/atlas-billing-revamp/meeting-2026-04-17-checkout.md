# Meeting Notes - 2026-04-17 Checkout

## Attendees

- Jordan, Engineering
- Priya, Product
- Sofia, Design
- Leo, Support
- Chen, Finance

## Checkout flow

The team agreed to move all new subscriptions into one hosted checkout flow. The
old account settings checkout will redirect to the hosted flow once plan mapping
is verified.

Jordan said the riskiest technical area is webhook replay. The team needs to
prove that failed or delayed events do not create duplicate subscriptions.

## Decisions

- Hosted checkout will be the only purchase path for new customers at launch.
- Failed payment emails will use the same plan names as checkout and invoices.
- The billing owner will receive an internal alert when the final retry fails.

## Action items

- Jordan will test webhook replay with duplicate invoice events by 2026-04-22.
- Sofia will finalize checkout error state copy by 2026-04-23.
- Leo will draft support macros for failed payment questions by 2026-04-24.

## Open questions

- Tax provider decision is still open because Chen is comparing Stripe Tax and
  TaxJar for international VAT handling.
- Coupon mapping for legacy discounts is unresolved.
- The team still needs a policy for partial refunds during plan migration.

## Risks

Jordan said, "The webhook replay path is the highest checkout migration risk."
Chen said tax accuracy is also launch-blocking if the provider decision slips.
