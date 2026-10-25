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

## Staff access

Visit `/admin`. Provision staff accounts with `scripts/create-admin.mjs`, supplying `ADMIN_EMAIL` and `ADMIN_PASSWORD` securely as described in [SETUP.md](SETUP.md). No shared default password is included.

## Verification

Run `npm run typecheck --prefix frontend` and `npm test --prefix frontend`. Integration and browser checks need a running application and database; see [SETUP.md](SETUP.md) and [TEST-RESULTS.md](TEST-RESULTS.md).

## Launch content

Company contact details, service regions and authorized project photography must be supplied before public launch. The gallery starts empty, and the solar landscape is labeled illustrative imagery. Booking requests are saved for staff review, not automatically confirmed appointments.

See [SETUP.md](SETUP.md) for full configuration, API contracts, roles, deployment instructions and implementation decisions.
