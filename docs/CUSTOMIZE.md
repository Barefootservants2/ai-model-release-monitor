# Customize the monitor

You can personalize the existing application without changing code. You can also host a separate copy with your own public catalog, but collection and scheduling must be configured separately.

## Personal use without code

Use search, category, license, event-type, and access filters to browse the full public catalog. Use the provider picker or a profile file for private relevance flags.

This pilot does not hide all unmatched entries automatically. Keeping the full catalog visible lets you discover useful alternatives outside your current stack; profile badges identify overlap without turning your current inventory into the only recommendation criterion.

## Host a separate catalog

1. Copy the seven-tab schema from [Data and methodology](DATA_AND_METHOD.md).
2. Populate only information intended for public disclosure.
3. Set the spreadsheet ID in both `app.js` and `server.cjs`.
4. Replace tracker links in `index.html`.
5. Replace `snapshot.json` with a sanitized snapshot of your own public data. Never leave another catalog's snapshot behind after changing the live source.
6. Keep `TABS` and `STATIC` in `server.cjs` as explicit allowlists.
7. For ordinary same-origin hosting, keep or explicitly set `const API_BASE = '';` in `app.js`. The supplied expression falls back to same-origin when the environment-specific `__PORT_5000__` placeholder has not been rewritten.
8. Run `node server.cjs` behind an HTTPS reverse proxy. The default port is 5000; `PORT` can override it. Adjust local frontend routing if using a different local port.
9. Run server and browser tests, including blocked upstream feeds and stale metadata.

Do not make the endpoint accept arbitrary URLs or spreadsheet IDs from a request. That would turn a bounded feed service into an unreviewed proxy and risk private-data disclosure.

## Customize review priorities

Change the collector's evaluation instructions and the public methodology text together. Keep a concrete workflow, evidence source, unknowns, and next test rather than assigning unsupported numerical scores.

Never infer installed products from subscriptions or provider roles. If you add automatic account discovery, persistent profiles, authentication, or billing ingestion, treat that as a separate security/privacy project.

## Maintain version history

Use stable family identities backed by publisher evidence. Keep model variants, preview/stable channels, account plans, and price routes separate.

When a new revision is verified, promote the slots in the history layer while retaining older records. Do not rewrite the original release catalog or silently discard historical pricing.

The current renderer focuses on Current, Previous 1, and Previous 2. Older Archive records remain in the backing data; an archive browser is a future enhancement, not an existing feature.

## Configure collection

The website does not run release discovery itself. A separate collector reads official sources, deduplicates candidates, writes public Sheet rows, updates metadata only after successful writes, and verifies the result.

Keep credentials in the collector's secured environment, never in browser code or a public repository. Establish source-check budgets, failure handling, notification consent, and a daylight-saving-safe schedule.

## Licensing and redistribution

The product is intended to remain free to use. The owner selected the [MIT license](../LICENSE) for the project source; retain its notice when using the code.

Linked sources and vendor marks retain their own terms. Keep citations and avoid reproducing full articles or implying vendor affiliation.
