# Slack Export - Billing Thread

## 2026-04-18

Priya: Can we make failed payment retries less aggressive than the current
daily retry schedule? Support has flagged the daily emails as noisy.

Jordan: Yes. We can configure three retry attempts over seven days.

Leo: Please make the email sequence clear. The first email should be helpful,
not scary.

Maya: Growth is fine with three retries if the final email explains the account
pause clearly.

Jordan: Proposal: retry on day 1, day 3, and day 7. Send customer email after
the first and third failed attempts. Notify the billing owner after the final
failure.

Priya: That sounds right. Let's put it in the decision log.

## 2026-04-19

Chen: Annual contract grandfathering is still important. Existing annual
customers should keep their legacy price until renewal.

Leo: Support will need a macro for "why do I see a new tier name but the old
price?"

Priya: Agreed. Migration preview must show both old plan name and new tier name.

## 2026-04-20

Maya: Pricing page copy draft is on track for April 24. I need the final annual
discount decision before the comparison table is locked.

Sofia: Checkout cards can show the new tier names first, with legacy mapping in
the help text.
