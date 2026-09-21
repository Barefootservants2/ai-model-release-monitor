# Pilot release status

Prepared September 20, 2026. This package contains source, documentation, test evidence, and media drafts; it does not mean a repository or social post has been published.

## Implemented and tested

- Bounded read-only delivery of seven fixed public data feeds.
- Explicit separation between delivery freshness and collection freshness.
- Dated snapshot/error states when live data cannot be retrieved.
- Full-catalog filters, optional provider picker, and exact-product profile matching in browser memory.
- Selected capability and cost hypotheses, separate developer events, source registry, version/access history, and manual cost scenarios.
- Free, standard-paid, and batch API access distinctions with source links, check dates, and caveats.
- Request limits, upstream coalescing, response bounds, read-only methods, input validation, escaped rendering, and a restrictive script policy.
- 41 browser assertions and 13 server tests passed in the local validation run.

The subsequent source-launch correction passes 14 server tests on Node 22.23.2, including invalid-request refusal and health recovery. Browser and hosted receipts above remain historical evidence for the earlier build; the corrected source is not yet the published pilot.

All 41 browser checks were subsequently rerun against that corrected local source and passed, recorded separately in `tests/source-hardening-browser-results.json`. The original hosted receipts remain tied to the older deployment.

## Coverage and freshness

The September 20 tracker readback contains 268 populated release rows, 4 selected desk reviews, 10 technical events, 8 registered direct-source endpoints, and 29 version/access offerings across 8 groups. These are Gemini Flash, GPT-5.6 variants, Gemini Flash-Lite, OpenAI Python SDK, Step 5, Codex CLI, Hugging Face Hub, and Claude Code. Five groups have documented current-plus-two-predecessor slots; variants and access tiers are not treated as predecessors. These are point-in-time counts, not exhaustive coverage.

The earlier 5,191 count was a spreadsheet row-index/blank-flag counting error, not a verified catalog size. This build counts populated name-and-organization rows; historical records have not all been revalidated.

The earlier September 20 spending-limit interruption was followed by a successful collection. Metadata records `2026-09-20T15:21:31Z`; the final seven-tab readback matched the planned cells. Live delivery was separately checked at `2026-09-20T19:50:01Z`.

## Publication gates

The publication receipt confirms [the free public pilot](https://ai-release-notes.pplx.app), with visibility Public. Signed-out production checks passed all 41 browser assertions plus six health/routing/refusal probes; all seven feeds returned HTTP 200 through the published API route, and no page JavaScript errors were recorded.

The published URL differs from the earlier monitor address. The README and media package use the verified `ai-release-notes.pplx.app` address; the website was not republished during verification.

The owner approved public GitHub publication at `Barefootservants2/ai-model-release-monitor` under MIT. Track the separate repository/PR receipts for publication and merge state; LinkedIn requires an authorized publishing path, and Instagram is deferred.

## Limits

This is not a formal penetration-test certification or accessibility-conformance audit. Sustained-load testing, comprehensive historical verification, complete account-tier mapping, operational uptime monitoring, and model-performance/cost experiments are outside this validation.

No paid model calls, private-data experiments, production patches, purchases, or payment features were executed. No measured savings are claimed.

## Independent review and remediation

The later launch-package review found a request-handling availability blocker. A source-only correction and regression passed an independent AI-reviewer follow-up on Node 22.23.2, with no remaining local BLOCK. Merge still requires owner authorization. The hosted pilot has not been republished with this correction.

The earlier pre-publication independent follow-up returned WARN with no BLOCK findings. It rechecked the server tests, local seven-feed delivery, profile privacy, XSS refusal, input bounds, CSP, accessible sorting, and corrected license labeling. That earlier scope is distinct from the later source-only follow-up above.

The missing-lockfile warning was subsequently addressed by the producer: the package now contains `package-lock.json`, and `npm audit --json` returned zero reported dependency vulnerabilities. This does not audit the Node runtime, hosting platform, or all application logic.

The producer has now verified production routing, top-level runtime and served security policies. This is not a new independent review. The 600-request/minute budget remains shared across clients rather than providing per-client isolation; broad load testing and third-party iframe embedding were not performed. See `docs/REVIEW_SUMMARY.md` for the bounded evidence and remaining gates.
