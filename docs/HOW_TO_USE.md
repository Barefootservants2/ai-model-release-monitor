# How to use the monitor

Start with the full catalog, then narrow it to what matters. Personalization is optional; no account or stack upload is required by this application.

## Browse and interpret the views

- **Usefulness:** Selected desk reviews with Test now, Watch, or Low priority. Inspect the workflow, evidence, caveats, test status, and proposed next test.
- **All releases:** Search provider, name, or capability, with category and license filters. The displayed count uses populated name-and-organization records, not physical spreadsheet rows.
- **Changes & risks:** Separate technical-event records. Provider overlap is a reason to investigate, not proof that your installation is affected.
- **My stack:** Choose providers for a simple comparison, or supply exact products in JSON. Nothing is installed or connected.
- **Cost lab:** A manual scenario calculator. The default numbers are synthetic and are not live model quotes.
- **Sources:** Selected direct feeds, check times, and limitations. A fetched status landing page is not a live health probe.
- **Versions & access:** Current and two predecessor slots within documented families, plus access offerings. Multiple rows for one version can be free, standard, batch, or distinct model variants rather than new releases.

## Choose your stack

For a quick start, expand “Start without a JSON file,” check the providers you use, and press Use selected providers. These selections produce provider-overlap flags only.

For exact product matching, use this non-sensitive example:

```json
{
  "as_of": "2026-09-20",
  "complete": false,
  "products": [
    {"org": "Example provider", "name": "Exact product", "version": "1.0", "status": "user-confirmed"},
    {"org": "Another provider", "name": "", "version": "", "status": "documented"}
  ]
}
```

Replace the example with your own names and a current date. Do not include API keys, passwords, private URLs, project identifiers, customer records, or billing exports.

Accepted statuses are documented, user-confirmed, runtime-verified, and historical. The labels are assertions you supply, not attestations produced by this app; historical entries do not establish current overlap.

## Read the stack flags correctly

- **Exact product listed:** Product and provider match your profile. The app has not checked the installed version, account entitlement, usage, or vulnerability applicability.
- **Provider overlap:** Same provider, no exact product match. A chat subscription does not establish access to a named API model.
- **Not in supplied profile:** Not found in the supplied list. Incomplete inventory is not evidence of absence from your estate.
- **Estate unknown:** No active profile. Profiles older than 30 days are annotated as stale.

Clear profile removes the active comparison, entered JSON, chosen file, and provider selections. Reloading resets the active profile; do not rely on browser form restoration or a shared-device session as a secure storage method.

## Compare cost without fooling yourself

Use the same acceptable outcome for both options. Enter input/output sizes, rates, attempts per successful task, other monthly costs, and migration amortization.

Other costs should include tools, hosting, review labor, subscriptions, and operational support. Cache/batch discounts, tax, different tokenization, latency, quality failures, and discounts are not automatically modeled.

A lower estimate is a hypothesis. Validate it with an authorized, bounded test using public or synthetic inputs before making a production decision.

## Check freshness

“Feeds connected” describes delivery, not a new research scan. Read the collection timestamp separately from the delivery timestamp.

The delivery cache lasts up to 60 seconds. A daily collection timestamp older than 25 hours is flagged as stale or unknown; a dated snapshot is explicitly marked not live when feed delivery fails.

If a source or feed is unavailable, missing entries do not mean nothing happened. Refresh later, open the linked tracker, and verify critical changes with the publisher.
