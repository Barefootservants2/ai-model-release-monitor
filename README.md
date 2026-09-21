# AI Model Release Monitor

What changed. What fits your stack. What might cost less.

A free, evidence-linked pilot for browsing AI releases, reviewing selected workflow-fit assessments, comparing documented access options, and noticing developer changes. It is a decision aid, not a benchmark leaderboard, vulnerability scanner, purchasing agent, or promise of savings.

## Start here

Open the [AI Model Release Monitor](https://ai-release-notes.pplx.app). The free pilot is public and was verified in a signed-out browser on September 20, 2026; this package contains source, instructions, test receipts and unposted media drafts.

1. **Browse without setup:** Open All releases. Search for a provider, product, or capability, then filter by category and license.
2. **See selected reviews:** Use Usefulness. “Test now” proposes an evaluation; it does not mean tested or production-approved.
3. **Personalize privately:** Open My stack, expand the provider picker, select providers, and apply. For exact product matching, paste or import a small JSON profile instead.
4. **Compare access:** Open Versions & access. Search a family and filter free API, standard paid API, or paid batch offerings.
5. **Check economics:** Open Cost lab and replace the synthetic example with your own non-sensitive assumptions.
6. **Check the evidence:** Use Changes & risks and Sources. Always inspect dates, availability, and linked publisher documentation before acting.

Read [Setup and deployment](docs/SETUP_AND_DEPLOYMENT.md), [How to use](docs/HOW_TO_USE.md), [Customization](docs/CUSTOMIZE.md), [Data and methodology](docs/DATA_AND_METHOD.md), and [Privacy](docs/PRIVACY.md). The media folder contains draft posts and ready-to-upload images; nothing in this package automatically posts to a social account.

## Why it exists

A new model announcement is not automatically useful to your workflow. A lower token price is not automatically a lower cost per successful task.

The monitor keeps three questions separate:

- **Stack relevance:** Does the supplied inventory name this product, only the provider, or neither?
- **Capability:** Is there a concrete workflow worth evaluating?
- **Cost:** Is there a plausible mechanism to reduce total cost, with assumptions and unknowns visible?

The public catalog is shared. Your optional stack profile is processed in page memory and is not sent to the application server or saved by the app; reloading resets the active profile.

## Pilot boundaries

- Selected releases and sources, not exhaustive coverage.
- Most catalog entries are unreviewed; unreviewed does not mean low priority.
- Revision history aims for current plus two verified predecessors. Unknown slots are not filled by guessing.
- Plan tiers, model variants, metered APIs, and downloadable weights are different things.
- Publisher statements are evidence of what the publisher says, not independent performance validation.
- No model calls, upgrades, patches, purchases, credential collection, or private-workflow probing.
- Free access to this utility does not make third-party APIs, hosting, or subscriptions free.
- No savings, security remediation, or production suitability is guaranteed.

## Run the source locally

The `app/` folder is a small Node application with no third-party runtime dependencies. Use a currently supported Node release with built-in `fetch` and `AbortSignal.timeout`; Node 22 or newer is the package's target.

```sh
cd app
node server.cjs
```

Open `http://localhost:5000`. The server serves the interface and seven fixed public CSV feeds, with a 60-second delivery cache.

```sh
node --check app.js
node --check intelligence.js
node --check server.cjs
node --test test-server.cjs
```

Browser-test procedures and the test evidence shipped with this package are documented in [Testing](docs/TESTING.md). They do not replace your deployment-specific checks.

## Deploy your own copy

See [Customization](docs/CUSTOMIZE.md). The supplied `__PORT_5000__` expression falls back to same-origin outside Perplexity; run the Node server behind HTTPS and keep the public feed allowlist fixed.

The scheduled discovery workflow is separate from the website. Copying or hosting this source does not create a collector, scheduler, provider account, or notification service.

## Repository publishing checklist

1. Confirm the public pilot URL and access settings in a signed-out browser.
2. The owner selected the [MIT license](LICENSE) for this project. Preserve the license notice; third-party models, source publications and vendor marks retain their own terms.
3. Review the files being uploaded. Publish this package only, not the private Project, estate profile, work ledger, credentials, or internal backups.
4. Private vulnerability reporting is enabled for the approved repository; configure your own private route when forking.
5. Run tests in the intended hosting environment.
6. Keep source attribution and third-party terms. Do not imply sponsorship by any listed vendor.

Created for Ashes2Echoes. Corrections should identify the product, dated claim, official URL, and proposed replacement text; never include credentials or sensitive customer data.
