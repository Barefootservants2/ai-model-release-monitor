# AI Model Release Monitor: Setup and Deployment

The launch model is free, MIT-licensed software operated by its user. Start locally; use your own hosting account only if you choose to host it. The existing [public demonstration](https://ai-release-notes.pplx.app) is separate from this distribution and does not include a promise of continued hosting, collection, support or update frequency.

No model-provider, LinkedIn or n8n account is required for browsing or selecting your stack. You need Node 22 or newer, a terminal and a browser. Live catalog retrieval requires network access to the configured public Sheet; no Google login is required to read that public feed. An independently maintained catalog requires your own authorized data store and separately configured collector. This package does not install that collector.

## Cost ownership

| Component | Operator and cost responsibility |
|---|---|
| Local interface and server | User's computer; no paid model calls made by this app |
| Optional remote hosting | User's chosen hosting account and applicable charges |
| Catalog collection and maintenance | Whoever runs the separate collector; not included as a managed service |
| Evaluating or using a recommended model | User's provider access, compute and applicable charges |
| Existing public demonstration/feed | Separate owner-operated pilot; availability and future updates are not guaranteed |

Local operation is not fully offline or independent by default: the server attempts shared-feed reads, and the page may load external fonts. A dated bundled snapshot is a fallback, not a background updater. Do not describe this version as air-gapped or as an automatic spreadsheet synchronizer.

## Choose the right setup

| Goal | What to do | What is not required |
|---|---|---|
| Use the existing monitor | Open the public URL, browse and filter | Installation, API credentials, a repository |
| Personalize recommendations | Use My stack and select providers or import a non-sensitive profile | Connecting provider accounts or uploading secrets |
| Run the supplied source | Extract the launch ZIP and start the Node server | A frontend build step or paid model API |
| Host a separate website | Deploy the `app/` directory as a Node web service | Recreating the original Perplexity Project |
| Maintain a separate catalog | Configure your own seven-tab public Sheet and a separate collector | Publishing private estate or billing information |

## Use and personalize the public app

1. Open [the public monitor](https://ai-release-notes.pplx.app).
2. Start with **All releases**; search and filter by category or license.
3. Open **My stack**, expand **Start without a JSON file**, select providers and press **Use selected providers**.
4. For exact-product comparisons, import or paste a small JSON profile instead.
5. Use **Usefulness**, **Changes & risks**, **Versions & access** and **Cost lab** to investigate candidates.
6. Read collection dates, source evidence and limitations before acting.

The provider picker gives provider overlap, not proof that an exact model is installed or available to your account. The catalog remains browsable outside your selected stack so useful alternatives are not hidden.

Example profile:

```json
{
  "as_of": "2026-09-20",
  "complete": false,
  "products": [
    {
      "org": "Example provider",
      "name": "Exact product",
      "version": "1.0",
      "status": "user-confirmed"
    }
  ]
}
```

Replace the example with your own non-sensitive product names and a current date. The application processes the profile in page memory, does not upload it, and clears the active profile on reload; never put credentials, private URLs, customer data or billing exports into it.

“Test now” means a bounded evaluation is proposed, not that testing or production approval occurred. Cost-lab output is a scenario, not measured savings.

## Run locally

Use the sanitized GitHub source or launch ZIP, never the private Project checkout. Open a terminal in the extracted repository/package root, which contains `app/`.

Prerequisites:

- A Node runtime with built-in `fetch` and `AbortSignal.timeout`; Node 22 or newer is the documented package target.
- A terminal and a browser.
- Network access to the configured public Google Sheet for live data.

The package declares no third-party runtime dependencies. A lockfile is included, but no install or build step is needed to start this version.

```sh
cd app
node --version
node --check app.js
node --check intelligence.js
node --check server.cjs
node --test test-server.cjs
node server.cjs
```

Open `http://localhost:5000`. Leave the terminal running; use Ctrl+C to stop the server.

For a different port on a POSIX shell:

```sh
PORT=8080 node server.cjs
```

On PowerShell:

```powershell
$env:PORT = "8080"
node server.cjs
```

Then open `http://localhost:8080`. This changes only your local instance.

The supplied server binds all network interfaces. Keep it behind your operating-system firewall and do not forward its port or expose it publicly by accident. Intentional public hosting needs HTTPS and the acceptance checks below.

## Future reports and user-edited spreadsheets

Paid reports and their cadence are deferred, not offered by this release. No current code writes to a user's Google Sheet or Excel workbook.

Any future import/update feature must preserve user-edited fields, formulas, notes, formatting and working tabs. The proposed design uses a separate dated/import tab, stable record keys, explicit conflicts and user-approved reconciliation rather than overwriting the working sheet. This is a future acceptance requirement, not an implemented guarantee. Weekly versus more frequent reporting remains undecided.

## Deploy your own Node web service

The app has a server as well as static files. Deploying only the HTML/CSS/JavaScript does not reproduce the seven-feed backend.

Use these settings with a host that supports a long-running Node process:

| Setting | Value |
|---|---|
| Service type | Node web service |
| Root directory | `app` when repository root contains the package contents |
| Build command | None required by this version |
| Start command | `node server.cjs` |
| Port | Hosting platform's `PORT`, otherwise 5000 |
| Health-check method | GET |
| Health-check path | `/api/health` |
| Required app secrets | None for this public, read-only delivery server |
| Public access | Enable only after reviewing the sanitized package and data |

Deployment steps:

1. Upload only the sanitized package to the approved repository or host. Do not upload the private Project checkout.
2. Configure the root directory and start command above.
3. Serve the Node service behind HTTPS. Keep the frontend and API on the same origin for the simplest setup.
4. If using a reverse proxy, forward `/api/` and the app's static paths to this service without dropping the path.
5. Allow server-side access to the configured Google Sheet CSV endpoints.
6. Run the acceptance checks below before advertising your new URL.

The supplied `API_BASE` expression falls back to same-origin when the Perplexity-specific placeholder is not rewritten. For a separately maintained, non-Perplexity copy, explicitly using `const API_BASE = '';` in `app.js` is also supported by this design.

Keep the server's fixed `TABS` and `STATIC` allowlists. Do not add an arbitrary `url` or spreadsheet parameter to API requests.

This is a proposed deployment recipe for your chosen host, not a claim that a separate host has been deployed or tested. Hosting charges and service limits depend on that host; the free public utility does not guarantee free infrastructure.

## Verify a deployment

For your own same-origin deployment, replace `YOUR_HOST`:

```sh
curl --fail --show-error https://YOUR_HOST/api/health
curl --fail --show-error https://YOUR_HOST/api/feeds/meta
curl --fail --show-error https://YOUR_HOST/api/feeds/releases
```

Use GET, not `curl -I`: this version intentionally returns 405 for HEAD. Health should return an object including `"status":"ok"` and `"mode":"public-read-only"`.

The existing Perplexity publication uses a platform route prefix. Its health endpoint is:

```sh
curl --fail --show-error \
  https://ai-release-notes.pplx.app/port/5000/api/health
```

Check in a signed-out browser:

- All seven feeds connect: releases, meta, assessments, signals, events, sources and versions.
- All seven navigation views work on desktop and a narrow screen.
- Filters and sorting work; source links are inspectable.
- Collection freshness and delivery freshness remain separate.
- A synthetic stack profile causes no profile-triggered network request and is not saved by the app.
- Blocked feeds show a dated snapshot or an explicit unavailable state, never invented live success.
- No private files are served and write methods are refused.

The September 20 production receipt records 41 browser checks and six endpoint probes passing; the packaged server suite also passed 13 tests. Those are point-in-time producer checks, not an uptime promise or comprehensive security certification.

The source-launch revision subsequently adds request-target hardening and passes 14 server tests on Node 22.23.2, independently rechecked with no remaining local BLOCK. Owner merge approval remains required; the prior hosted pilot has not been republished with this correction. Verify your deployed revision rather than applying the earlier production receipt to newer source.

A separate producer browser rerun passed 41/41 assertions against the corrected local source. Its receipt is `tests/source-hardening-browser-results.json`; new hosted deployments still need their own acceptance checks.

The shared 600-request/minute budget does not isolate clients. Add reviewed edge protections before broad scale; do not disable the limit simply to suppress errors.

## Use your own public catalog

Leave the existing shared catalog unchanged if you only want to use the monitor. For an independent catalog:

1. Create your own Sheet with the seven schemas in [Data and methodology](DATA_AND_METHOD.md).
2. Put only deliberately public information in it. The delivery server has no private-Sheet authentication.
3. Set the Sheet ID in `app/app.js` and `app/server.cjs`.
4. Update the tracker links in `app/index.html`.
5. Replace `app/snapshot.json` with a sanitized snapshot of your own catalog, retaining the expected structure and an honest capture date.
6. Re-run local and hosted checks.
7. Establish separate collection and maintenance procedures.

Never place a private estate profile in the Sheet, repository, snapshot or served files. Retain source links and distinguish announcements from usable API/weight releases.

## Configure daily collection separately

The website reads data; it does not discover releases, write the Sheet or send a digest. Copying this source does not install the owner's scheduled task.

A separate collector needs:

- Authorized write access to your own tracker, held outside the public app.
- Primary-source discovery and availability checks.
- Name-and-organization deduplication, alias checks and bounded history backfills.
- Separate assessments, capability/cost signals and developer events.
- Safe append/update operations, RAW descriptive values and exact readback.
- Metadata updated only after successful writes.
- Explicit failure reporting, notification consent and a timezone-aware schedule.

The current owner's existing task has already been updated to use `ai-release-notes.pplx.app`; this deployment guide does not create a duplicate. Its fixed UTC cadence needs separate daylight-saving review if 9 AM New York time must remain constant year-round.

## Publish the three launch channels

### GitHub

The repository content is the contents of `public-launch/`, with README at repository root. The owner approved `Barefootservants2/ai-model-release-monitor`, public visibility and the MIT license; changes follow a reviewed pull-request workflow.

Repository: [Barefootservants2/ai-model-release-monitor](https://github.com/Barefootservants2/ai-model-release-monitor). The initial source package uses the `launch/free-pilot` review branch until merge is approved; do not assume the default branch already includes the application.

```sh
git clone --branch launch/free-pilot https://github.com/Barefootservants2/ai-model-release-monitor.git
cd ai-model-release-monitor/app
node --test test-server.cjs
node server.cjs
```

After that pull request merges, a normal clone of the default branch can replace the branch-specific command. Suggested description, topics and release copy are in [GitHub presentation](../media/GITHUB.md).

Do not upload the whole workspace, private Project files, estate profile, governance material, backup data or credentials. The approved source-code license is included as `LICENSE`; third-party content retains its own terms.

### LinkedIn

Use [the LinkedIn draft](../media/LINKEDIN.md) and `media/linkedin-launch.png`. The intended profile is [William Earl Lemon / Ashes2Echoes](https://www.linkedin.com/in/ashes2echoes); review the complete text, add its supplied alt text and use `https://ai-release-notes.pplx.app`.

This package does not post or connect an account. [LinkedIn setup](LINKEDIN_SETUP.md) covers both manual upload and the separately authorized API path.

### Instagram

Instagram is deferred by the owner. When separately authorized, use [the Instagram caption and alt text](../media/INSTAGRAM.md) and upload `instagram-01.png` through `instagram-04.png` in that order.

Confirm the exact account, review the caption and images, and set the intended website/profile link separately. This package does not change the account profile or post automatically.

## Updates, rollback and troubleshooting

- **Feeds unavailable:** Inspect health, upstream connectivity and CSV access. Preserve the labeled snapshot rather than claiming live delivery.
- **Data stale but feeds connected:** Investigate the collector. Restarting or redeploying the website does not run research.
- **429 responses:** The shared budget was exceeded. Do not bypass it; review traffic and edge protection.
- **Profile disappeared:** Expected after reload; re-import your own non-sensitive local profile.
- **Missing predecessor or cost evidence:** Leave it Unknown until primary evidence is obtained.
- **Deploy regression:** Roll back to a previously tested app package. Do not erase Sheet history.

Keep dated test receipts, review known limitations and back up the public data. A rollback of app code does not automatically restore or change the tracker.

## Ready-to-paste deployment handoff

> Deploy the sanitized AI Model Release Monitor package as a Node web service. Use app/ as the root, node server.cjs as the start command, the platform PORT, HTTPS and GET /api/health. Preserve the seven fixed feed allowlists, profile privacy, labeled snapshot fallback and separation of collection from delivery. Do not add credentials to browser code or publish the private Project. Run the server suite and signed-out desktop/mobile acceptance checks, then return the deployment URL, test receipts and unresolved gates. Do not overwrite the existing ai-release-notes.pplx.app deployment or publish social posts without explicit destination approval.

Required inputs: sanitized launch package, chosen hosting destination, approved repository/license if publishing source, public Sheet choice, and exact social destinations if posting. Supply secrets only through an approved secure credential mechanism, never in chat or repository files.
