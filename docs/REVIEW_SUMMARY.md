# Review and validation summary

Prepared September 20, 2026 for the free pilot. This is a producer summary of an independent review and remediation follow-up, not a security certification.

## Defined checks

- **Browser:** 41 assertions passed, covering seven-feed delivery, filters, selected revision/access groups, private profiles, input refusal, synthetic cost arithmetic, mobile layouts, fallback states, and keyboard sorting.
- **Server:** The original 13 tests passed. The source-launch revision now passes 14 tests on Node 22.23.2, adding invalid-request refusal and same-process health recovery to the existing routing, caching, response bounds, private-path and request-budget checks.
- **Syntax:** Both browser scripts and the Node server passed Node syntax checks.
- **Dependency audit:** A generated lockfile is included. `npm audit --json` reported zero vulnerabilities; there are no declared third-party runtime dependencies.
- **Data safety:** An exact readback compared the six unchanged tracker tabs and the three preserved SDK version rows after the additive comparison update.

Machine-readable browser results, server TAP output, and the dependency-audit result are included under `tests/`. The browser assertions use the dated pilot data and are not a generic validator for arbitrary future catalogs; the repeatable server suite lives in `app/test-server.cjs`.

## Production verification

The producer reran all 41 browser assertions against [the published site](https://ai-release-notes.pplx.app) on September 20, 2026. All passed, including seven server-delivered feeds, current counts, filters, synthetic profile privacy/XSS refusal, synthetic cost arithmetic, all seven mobile views, keyboard sorting and intercepted-feed failure states.

Six additional probes passed: health returned 200, unknown feed and unexpected query returned 400, HEAD and POST returned 405, and a private-profile path returned 404. The API base was rewritten to `port/5000`; each feed returned HTTP 200. The page's restrictive CSP meta policy and the platform's API CSP header were observed, with no recorded JavaScript page errors. Policy presence is not proof against every possible attack.

Receipts are `tests/publication-test-results.json` and `tests/publication-production-receipt.json`. Signed-out top-level production use was verified; third-party iframe embedding, uptime and sustained-load resilience were not. These are producer checks, not an independent approval of the published deployment.

## Independent finding status

The later source-launch review identified a request-handling availability blocker not covered by the original suite. The source package now adds request-target validation, a listener error boundary and a raw-request regression. A separate AI reviewer independently retested the corrected source on Node 22.23.2: 14/14 tests and a separate same-process recovery reproduction passed, yielding WARN with no remaining local BLOCK. This source correction has not been republished to the existing hosted pilot, and the prior production receipts do not verify it.

The source workflow pins reviewed action commit IDs, disables checkout credential persistence and tests Node 22. The optional `examples/stack-profile.json` is a synthetic example with “Example provider” and “Exact product”, not the owner's inventory.

The producer also reran all 41 browser checks against the corrected local source, using the public read-only feeds and synthetic profile inputs; all passed. `tests/source-hardening-browser-results.json` records this separate local run. It does not verify the still-unchanged hosted pilot.

The source-only follow-up verified server SHA-256 `4bdfceab7d0d3ce8b64e48ed549306eec767837c68c6dac74debde76bbf1916e` and test-suite SHA-256 `8a68d9b91f990b799248ee78bf36bc0ae10e51b86712efc4511a82a587db8d02`. It did not independently run the browser checks, inspect remote settings or test production. Owner merge authorization remains a separate gate.

The follow-up reviewed implementation commit `285b45f` and returned WARN with no BLOCK findings. The producer's subsequent commit `41df43b` added the lockfile and an explicit overdue-collection label; the follow-up is not represented as an independent review of that later commit.

Remediated findings included unbounded direct-browser feed fallback, missing request and response bounds, incomplete HEAD handling, overbroad “open weights” wording, source-host visibility, missing main landmark/native sorting controls, and missing Content Security Policy.

Protocol checks and visible hostnames do not establish source authenticity. Treat catalog links as evidence to inspect, not automatically trusted instructions.

## Open gates

- **Shared request budget:** The 600-request/minute limit is global. One client can consume it and temporarily affect other visitors; use a trusted edge quota system for per-client isolation before broader scale.
- **Collection continuity:** A successful September 20 catch-up and exact readback are recorded after the earlier spending-limit interruption. One successful run does not establish future unattended reliability; continue checking collection timestamps independently of delivery.
- **Broader assurance:** Sustained load/fairness testing, formal accessibility conformance, historical-data revalidation, operational monitoring, and complete provider/account-tier coverage were not performed.

No paid model benchmark, private-workflow probe, automatic patch, or measured savings experiment was part of this release.
