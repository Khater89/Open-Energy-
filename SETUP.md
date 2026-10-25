# Open Energy — implementation and operations

This implementation follows `project-prd (2).md`, not the original repository README (which describes an unrelated product). The public website is English/LTR and includes Home, Services, Projects, About, Contact, FAQ and a three-step consultation request. Staff use `/admin` to review and update requests.

## Architecture

- Node.js 22+; Next.js 16.4.3, React 19.3.1, TypeScript, PostgreSQL 17+.
- `frontend/` contains both the public UI and the server-only Next.js route handlers in `app/api/`.
- `backend/schema.sql` defines persistent leads, bookings, contact requests, projects, services, staff users, sessions, rate limits and an audit trail.
- The PRD explicitly permits Next.js route handlers as an alternative. This implementation uses that alternative instead of a separate C# service, keeping one deployment and same-origin secure sessions. No database credentials or authentication logic run in the browser. Styling is custom CSS with locally hosted fonts.
- Three service types only: `on-grid`, `off-grid`, `hybrid`. A booking is a **request**, never an automatically confirmed appointment.
- Preferred dates start tomorrow (UTC date validation); preferred time windows refer to the property's local timezone and must be confirmed by staff. No calendar integration or invented availability.

## Run locally

1. Prepare PostgreSQL and create a database. Set `DATABASE_URL` and `SITE_URL` in `frontend/.env.local` using `frontend/.env.example`. Use a secure secret manager for hosted deployments. Do not commit real credentials.
2. `npm ci --prefix frontend`
3. `node --env-file=frontend/.env.local scripts/migrate.mjs`
4. Create a staff account using secure environment variables `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 14 characters), optionally `ADMIN_NAME` and `ADMIN_ROLE` (`admin`, `staff`, `viewer`): `node --env-file=frontend/.env.local scripts/create-admin.mjs`. Existing users are not overwritten. No default shared password is supplied.
5. `npm run dev --prefix frontend`, or `npm run build --prefix frontend` followed by `npm start --prefix frontend`.
6. Verify `GET /api/health` returns HTTP 200 and `{"status":"ok","database":"connected"}`. Submit a real test request and confirm it in the staff panel.

Cloud-specific repeatable setup: `bash scripts/setup-cloud.sh`. It uses signed Debian packages for local PostgreSQL, retains the database outside the checkout, and binds it to loopback. Its trust authentication is **development only**. Do not expose that cluster publicly or use its connection settings in production. Cloud tasks are isolated; reuse the existing checkout instead of creating worktrees. Startup processes need to be restarted in new tasks.

## Checks

- `npm run typecheck --prefix frontend`
- `npm test --prefix frontend` runs validation tests; integration tests are explicitly skipped without `INTEGRATION_BASE_URL`.
- `DATABASE_URL=... INTEGRATION_BASE_URL=http://localhost:3000 node --test tests/*.test.mjs` runs API/database/auth/conflict tests against a running app. Fixtures are removed afterward.
- `DATABASE_URL=... node tests/browser-smoke.mjs` checks the eight pages at 360/768/1440px, mobile navigation, booking errors and successful save, contact submission, admin login/status/logout, gallery filtering and automated accessibility. It uses a Chromium distribution from npm (standard Playwright browser downloads are blocked by the onboarding network). Fixtures are removed afterward. The browser screenshot outputs go to `/workspace/artifacts/`.

## Deployment

Deploy `frontend/` as a Node.js Next.js service with authenticated PostgreSQL (TLS with certificate verification), then apply `backend/schema.sql`. Set `DATABASE_URL` and the exact HTTPS `SITE_URL`; the latter controls origin validation and Secure session cookies. Start with `npm start` from `frontend/`, behind your HTTPS reverse proxy. Migrations are an explicit deployment step, not run per request. Review database backups, least-privilege database roles and a company-approved retention policy before public launch.

There is no standalone HTML build and opening a file does not run server features. Public pages render without external APIs; forms, projects and admin require the Node service and PostgreSQL. Email, WhatsApp, payments, customer accounts and notifications are not integrated. A saved request is available to authenticated staff, not delivered to a fabricated inbox.

## API and data contracts

All intake fields are validated server-side; request bodies are limited to 32 KiB. JSON errors carry a message and, for validation, an `errors` object keyed by field. Frontend fields are preserved on failure. Successful intake returns `{id,status:"received"}` only after database commit.

- `POST /api/bookings`: required `full_name`, `email`, `phone`, `service_type`, `city`, `property_type` (`home/business/farm/other`), `preferred_date` (ISO date), `preferred_time` (`morning/afternoon/evening`), `consent:true`; optional `address`, `monthly_bill` (0–1,000,000, local currency clarified in notes), `message`. Requires UUIDv4 `Idempotency-Key` header. Lead and booking commit together. Identical retries return the saved ID; modified payloads under the same key return 409.
- `POST /api/contact`: required `full_name`, `email`, `phone`, `subject`, `message`, `consent:true`; same idempotency behavior.
- `GET /api/projects`: published project records, empty until verified content is inserted. Images must be authorized before publication.
- `POST /api/admin/login`: email/password; generic failed-credential message; scrypt hashes; ten attempts per email per 15 minutes. Login creates an 8-hour, HttpOnly, SameSite=Strict server-backed session (Secure on HTTPS).
- `POST /api/admin/logout`: revokes the session.
- `GET /api/admin/session`: current user; 401 when unauthenticated.
- `GET /api/admin/requests?q=&status=`: authenticated; latest 200 matching records and metrics. Search covers name/email/city/phone.
- `PATCH /api/admin/requests`: `id`, `kind` (`booking/contact`), `status` (`new/contacted/scheduled/closed`), `notes` (max 4,000 characters), `version`. Admin/staff only; viewers read only. Atomic version check returns 409 on stale edits. Changes are audited.
- All mutation requests require the configured same origin. Intake is limited to five accepted requests per email per hour. Database failures return 503 without false confirmation. Intake fetches time out at 20 seconds; retries use idempotency keys.

Records belong to the company; contact/booking data are private to authenticated staff. Staff accounts have no public registration. Company retention requirements are pending: no automatic deletion schedule is invented. Sessions expire after eight hours; expired session/rate-limit rows may be periodically purged by operations. Never log request bodies or passwords.

## Content and launch decisions

- No customer testimonials, certifications, completed projects, service regions, phone numbers or office details have been invented. The verified company-project gallery starts empty; a separate, clearly labeled concept gallery contains illustrative AI-generated imagery. The supplied email and both mobile/WhatsApp numbers are shown on the contact page and footer, with a floating WhatsApp chooser. Coverage is confirmed individually.
- The hero image is AI-generated illustrative imagery, labeled as such, and is not evidence of company installations. `frontend/public/images/solar-farm.webp` is the optimized image. Fonts are local via Fontsource; icons use Lucide.
- Company contact details have been supplied by the owner. Final coverage, authorized project photos, logo approval, staff accounts and data-retention policy remain to be confirmed before public launch.
- Admin project/service CRUD is outside MVP; add verified projects via an authorized database workflow. Do not seed invented portfolio records.
- Future bilingual support: `frontend/lib/content.ts` holds structured service/FAQ content, semantic layout declares `lang`/`dir`, and component boundaries separate content from interaction. English is implemented now. Arabic translation/routing is a future change, not a currently working language toggle.

## Acceptance cases

- Valid hybrid booking for a home with full contact details and a future preferred date: saved lead + booking and reference ID, visible in staff panel.
- Invalid email, blank name, invalid system, past/impossible date, negative bill or missing consent: field error, no save, other input preserved.
- Service outage: explicit error, no false success, retry preserves entries and prevents duplicate records.
- Anonymous request to staff records: 401. Viewer update: 403. Stale staff update: 409. Authorized status update: saved version increment and audit entry.
- Empty gallery: honest empty state; filter/search reset works.
- Public routes: distinct title/description, English LTR, keyboard navigation and no horizontal overflow from 360px upward.

## Railway

See [RAILWAY.md](RAILWAY.md) for the root Docker deployment. This deployment applies the repeatable schema during startup under a PostgreSQL advisory lock, optionally provisions an initial staff account, and listens on Railway’s injected `PORT`. The container starts as a non-root user and excludes local credentials.

## Public design and contact updates

Contact data is centralized in `frontend/lib/company.ts`. The numbers use Jordan’s +962 country code for telephone and WhatsApp links. Scroll reveals, image interactions, a keyboard-accessible concept lightbox and the floating contact chooser support reduced-motion preferences. See [DESIGN-NOTES.md](DESIGN-NOTES.md) for sources actually reviewed and image provenance. Run `INTEGRATION_BASE_URL=http://localhost:3000 node tests/public-experience.mjs` for the contact, gallery keyboard, motion and no-JavaScript checks.
