# Security

This pilot has a bounded, read-only design. It is not a vulnerability scanner and does not determine whether your installed products are exposed to a vendor advisory.

## Reporting

Do not post credentials, personal profiles, customer records, or exploit payloads against a live service in public issues. Private vulnerability reporting is enabled for [this repository](https://github.com/Barefootservants2/ai-model-release-monitor). Open its Security tab and choose “Report a vulnerability” to contact the maintainers privately.

Use synthetic inputs for reproduction. Include the affected version, expected behavior, observed behavior, and minimal steps without private data.

## Boundaries

The server exposes seven fixed public CSV tabs, uses no credentials, and rejects writes and arbitrary source URLs. Profile processing is local to the page.

The included review and tests are point-in-time evidence. They do not establish sustained-load resistance, complete accessibility compliance, uninterrupted collection, or universal security.
