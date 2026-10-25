# Open Energy

Renewable-energy company website built from the supplied PRD. Includes English public pages, on-grid/off-grid/hybrid service comparisons, a three-step consultation request, contact forms, and a protected staff workspace backed by PostgreSQL.

## Project structure

- `frontend/`: Next.js, React and TypeScript website, with server-side API routes.
- `backend/schema.sql`: PostgreSQL tables, sessions, request statuses and audit trail.
- `scripts/`: database migration, staff provisioning and repeatable cloud setup.
- `tests/`: validation, API/database integration and browser smoke checks.

## Quick start

Requires Node.js 22+ and PostgreSQL 17+.

1. Run `npm ci --prefix frontend`.
2. Copy `frontend/.env.example` to `frontend/.env.local` and configure your PostgreSQL connection and site origin. Never commit real credentials.
3. Run `node --env-file=frontend/.env.local scripts/migrate.mjs`.
4. Run `npm run dev --prefix frontend`.

For production, run `npm run build --prefix frontend`, then `npm start --prefix frontend`. The website requires a Node.js service and PostgreSQL; GitHub Pages cannot run the booking API or staff workspace.

## Deploy to Railway

See [RAILWAY.md](RAILWAY.md) for GitHub deployment, private PostgreSQL binding, initial staff provisioning and a public HTTPS domain. Keep the Railway service root at the repository root; `railway.json` and `Dockerfile` configure the build and startup.

## New-request emails

New booking/contact details can be emailed to the supplied company address through Resend, with a durable PostgreSQL outbox and staff-visible sending status. Add `RESEND_API_KEY` and `NOTIFICATION_FROM` privately in Railway before expecting email. See [EMAIL-NOTIFICATIONS.md](EMAIL-NOTIFICATIONS.md).

## Staff access

Visit `/admin`. Provision staff accounts with `scripts/create-admin.mjs`, supplying `ADMIN_EMAIL` and `ADMIN_PASSWORD` securely as described in [SETUP.md](SETUP.md). No shared default password is included.

## Verification

Run `npm run typecheck --prefix frontend` and `npm test --prefix frontend`. Integration and browser checks need a running application and database; see [SETUP.md](SETUP.md) and [TEST-RESULTS.md](TEST-RESULTS.md).

## Launch content

The supplied company email and both mobile/WhatsApp numbers are live in the contact page and footer. A floating WhatsApp chooser opens either number. Clearly labeled AI-generated solar concepts appear separately from the verified company-project portfolio; service regions and authorized photography for actual company projects remain to be supplied. Booking requests are saved for staff review, not automatically confirmed appointments.

See [SETUP.md](SETUP.md) for full configuration, API contracts, roles, deployment instructions and implementation decisions.
