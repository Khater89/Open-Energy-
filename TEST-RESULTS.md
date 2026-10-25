# Validation — 25 October 2026

- Production `next build`: passed; public pages prerendered and API routes built.
- TypeScript `tsc --noEmit`: passed.
- Node validation + PostgreSQL/API integration: **20 passed, 0 failed, 0 skipped** with the integration environment supplied.
- Database verification: booking and lead transaction, contact persistence, idempotent retries, modified-payload conflicts, admin reads, audited status updates, stale-edit conflicts, viewer authorization and session revocation passed.
- Browser smoke: all eight routes loaded at **360, 768 and 1440px** with no horizontal overflow. Mobile navigation, three-step booking validation, failure with input preservation, real booking/contact saves, admin login/status update/logout and project filter clearing passed.
- axe automated checks on Home, Booking, Contact and Staff Login: **0 violations** for the tested WCAG A/AA rules. This is an automated check, not a full accessibility certification.
- Browser console: no uncaught page errors in the smoke run.
- Cloud installation script: executed successfully against the prepared environment; frozen dependency installation, repeatable schema application, unit checks and build passed. The default test command explicitly skips the integration suite unless its running-app configuration is supplied.

Screenshots are in `/workspace/artifacts/open-energy-desktop.png` and `/workspace/artifacts/open-energy-mobile.png`. The running site and saved environment draft have been validated; public deployment and restoration into a fresh cloud task have not been performed.
