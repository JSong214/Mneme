# Decision Log

## 2026-04-03 - Preserve annual legacy pricing until renewal

Active annual customers will keep their current price until their renewal date.
The migration preview will show both the old plan name and the new tier name so
support can explain the transition.

Rationale: annual customers already committed under the old terms, and changing
their price mid-contract would create trust and support risk.

Source quote: "Existing annual customers should keep their legacy price until
renewal."

## 2026-04-10 - Adopt three fixed pricing tiers

The launch pricing model will use Starter, Growth, and Scale tiers instead of
usage-based pricing.

Rationale: tiered pricing improves customer predictability, keeps the pricing
page easier to understand, and simplifies sales conversations during launch.

Source quote: "Tiered pricing is easier to explain on the pricing page and
easier for customers to approve."

## 2026-04-17 - Use hosted checkout for new customers

New customers will purchase through the hosted checkout flow at launch. The old
account settings checkout will redirect after plan mapping is verified.

Rationale: one purchase path reduces inconsistent plan metadata and makes
checkout instrumentation easier to validate.

Source quote: "Hosted checkout will be the only purchase path for new customers
at launch."

## 2026-04-18 - Configure failed payment retry sequence

Failed payments will retry on day 1, day 3, and day 7. Customer emails will go
out after the first and third failed attempts. The billing owner will be
notified after the final failure.

Rationale: three retries over seven days is less noisy than daily retries while
still giving customers multiple chances to update payment details.

Source quote: "Proposal: retry on day 1, day 3, and day 7."
