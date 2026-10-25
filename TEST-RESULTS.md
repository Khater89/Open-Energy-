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

## Railway deployment configuration

- Production Docker image built successfully with Node.js 24 and development dependencies pruned. The local build required the environment’s existing verified proxy CA and proxy-host resolution; these are build-time options, not included in the deployed image.
- The image ran as a non-root user against a separate PostgreSQL 17 container. Runtime smoke checks passed for the injected port, Railway public-domain origin fallback, schema initialization, booking persistence, initial admin provisioning, HTTPS session-cookie attributes, static CSS and exclusion of real `.env` files.
- The production startup script also passed the existing 11 API/database integration checks against the prepared local database.
- These are local deployment-artifact checks. No deployment into a Railway account or public Railway URL has been performed.

## Railway validation correction

Removed the local-only `proxy_ca` build-secret mount from the production Dockerfile. `docker build --check .` passes with no warnings on the corrected file. This is a Dockerfile validation check; a successful new Railway build is not yet verified. Runtime application logic and database initialization are unchanged.

## Database startup readiness

Added a bounded retry for transient PostgreSQL DNS, connection refusal and initialization errors. Credential and schema errors fail without retry. All 25 validation/integration/readiness checks pass with the running app/database configured. A real PostgreSQL migration also recovered through a local endpoint that became available after startup. Dockerfile validation passes with the new readiness helper included in the runtime image. A successful connection to the user's Railway PostgreSQL service remains unverified and depends on the service state and correct variable reference.

## Contact, motion and concept gallery update

- Production build and TypeScript passed with the new contact data, motion effects, local concept images and lightbox.
- Existing browser smoke passed all eight routes at 360/768/1440px, booking validation/failure/retry/save, contact save and protected staff management. Automated WCAG A/AA checks returned no violations after the scroll reveals settled.
- Additional public-experience checks passed for both phone/WhatsApp destinations, email links, WhatsApp keyboard and outside-click dismissal, concept labels, keyboard image navigation, modal focus containment, scroll reveal, reading progress, reduced-motion changes and content visibility with JavaScript disabled. Expanded WhatsApp and lightbox accessibility checks returned no violations.
- Reference research and image provenance are documented in DESIGN-NOTES.md. The new images are illustrative concepts approved by the owner, not verified company installations.
- These are local browser/build checks; the new Railway deployment must still complete before the public site shows the update.
