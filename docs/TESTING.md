# Testing the pilot

Testing covers bounded behavior, not a guarantee of complete security or service availability. No paid model evaluation or private-workflow probe is part of these checks.

## Repeatable server tests

Run `node --test test-server.cjs` from `app/`. These tests use synthetic upstream responses and exercise read-only methods, fixed routes, cache behavior, rejection paths, and response-size limits.

Run syntax checks on both browser scripts and the server. Test the actual hosted endpoint separately because local success does not prove production routing.

## Browser acceptance

Use a desktop and narrow mobile viewport. Verify all seven views, search/filter states, keyboard access, readable focus indicators, and no page-wide horizontal overflow.

Verify profile provider and exact-product matching, historical exclusion, stale-date warnings, malformed JSON rejection, invalid calendar-date refusal, clearing, and no profile-triggered network requests. Test escaped HTML text and unsafe source URLs.

Exercise synthetic cost arithmetic, retries, migration amortization, invalid numeric input, and overflow refusal. Confirm the output says scenario rather than measured savings.

Block feed requests and verify the dated snapshot label. Block the snapshot too and verify an explicit unavailable state; block one optional feed and ensure the interface does not claim a complete live connection.

Verify that a successful delivery timestamp does not replace the collection timestamp. A missed daily scan must not be represented as fresh research.

## Review boundaries

An independent review is part of launch preparation. Preserve the dated review and remediation receipts; do not call a bounded code review a penetration-test certification.

The completed follow-up and remaining limits are summarized in [Review and validation](REVIEW_SUMMARY.md). The included lockfile enables `npm audit --json`; its current result is saved under `tests/dependency-audit.json`, separately from application-security testing.

Load testing, formal accessibility conformance, provider-terms/legal review, operational monitoring, full historical catalog auditing, and complete multi-provider pricing coverage remain separate work.
