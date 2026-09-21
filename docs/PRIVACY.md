# Privacy and data handling

This is a technical description of the pilot, not a blanket anonymity guarantee. Hosting platforms, public data providers, font hosts, and linked publishers have their own network logging and policies.

## Stack profiles and cost inputs

The app processes profiles and calculator inputs in browser memory. It does not send them to its feed endpoint, save them in localStorage/sessionStorage, or persist them in a server database.

Do not enter secrets or sensitive customer information. Browser extensions, shared-device access, developer tools, and the browser itself are outside this app's control.

The active profile resets on reload. Clear profile also clears the form controls; do not rely on browser autofill behavior as secure deletion.

## Network requests

The browser retrieves application files, public feed data from the bounded delivery endpoint, and Google-hosted fonts. If feed delivery fails, the app uses the bundled dated snapshot or reports that data is unavailable; it does not fall back to an unbounded direct Google fetch.

The server fetches only seven allowlisted tabs from a fixed public spreadsheet. It has no credentials and cannot write back to the tracker.

## Future changes

Server-saved profiles, analytics, accounts, billing imports, or cloud synchronization would require a new privacy review and an updated notice. They are not part of this pilot.
