# Data and methodology

The tracker is the public evidence layer. Personal stack information is not part of it.

## Seven datasets

| Tab | Purpose |
|---|---|
| releases | Dated model release records with publisher citations |
| meta | Successful collection timestamps, next schedule label, populated release count |
| assessments | Workflow-fit desk reviews, evidence, caveats, test status, next test |
| signals | Separate capability and cost hypotheses |
| events | Developer tools, patches, advisories, breaking changes, pricing, deprecations, incidents |
| sources | Selected official endpoints, coverage, last check and fetch limitations |
| versions | Family, organization, version, product, relation, release date, access channel, tier, price, units, availability, support, replacement, source URLs and check date |

## Release and counting rules

A model release requires documented usable API access or downloadable weights. An announcement, benchmark, waitlist, plug-in, or SDK version is not automatically a model release.

Count rows with both name and organization populated. Normalize names for duplicate checks, but preserve historical rows and citations rather than deleting them automatically.

## Evidence and recommendations

Publisher claims, independently evaluated results, and hands-on tests are separate evidence classes. This pilot's seeded usefulness reviews remain Not tested.

Test now means a concrete bounded evaluation is proposed. It does not authorize a model call, production integration, purchase, or private-data experiment.

## First comparison coverage

The initial API comparisons cover documented Gemini Flash generations and their free, standard-paid, and batch access; GPT-5.6 Sol/Terra/Luna as variants of one documented family; and current Gemini Flash-Lite access, using the [Gemini model catalog](https://ai.google.dev/gemini-api/docs/models), [Gemini release notes](https://ai.google.dev/gemini-api/docs/changelog), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [OpenAI release notes](https://developers.openai.com/api/docs/changelog), and [OpenAI pricing](https://developers.openai.com/api/docs/pricing).

The Google catalog labels prior Flash generations and the release notes provide their chronology; the display does not claim a mandatory migration chain ([model catalog](https://ai.google.dev/gemini-api/docs/models), [release notes](https://ai.google.dev/gemini-api/docs/changelog)). Exact predecessor slots for GPT-5.6 and Flash-Lite remain incomplete rather than inferred from similar names.

Free API tiers can have different content-use terms from paid tiers; the seeded records preserve this distinction and exclude unverified account quotas ([Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)). Chat-plan entitlements and self-hosting costs are not comprehensively mapped in this pilot.

Prices were checked September 19, 2026. They are observations with units and conditions, not guaranteed quotes or proof of cost savings.

## Corrections

Provide a model/product, the exact disputed claim, a dated official URL, and a proposed correction. Unknowns should remain explicit until verified; a missing record is not proof of absence.
