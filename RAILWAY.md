# Deploy Open Energy to Railway

Deploy the repository as one web service and one PostgreSQL service. Keep the web service **Root Directory at the repository root** (empty or `/`), not `frontend`: the Docker build needs the database schema and startup scripts too.

1. In Railway create a project, choose **Deploy from GitHub repo**, and select `Khater89/Open-Energy-`, branch `main`.
2. Add a **PostgreSQL** database to that same Railway project.
3. Open the web service's **Variables**. Add `DATABASE_URL` using **Add Reference** and select the PostgreSQL service's `DATABASE_URL`. Use Railway's private database connection. Do not paste database credentials into GitHub.
4. To provision the initial staff account, add `ADMIN_EMAIL` and `ADMIN_PASSWORD` (14+ characters) as private Railway variables. Optionally set `ADMIN_NAME` and `ADMIN_ROLE` (`admin`, `staff`, `viewer`). Startup creates a missing account; it does not reset an existing account's password. After a successful initial deployment, remove the bootstrap `ADMIN_*` variables and redeploy; the account remains stored in PostgreSQL.
5. In the web service's **Settings → Networking**, choose **Generate Domain**. If a target port is requested, use the service's runtime `PORT` (Railway injects it), or explicitly set `PORT=3000` and target port `3000`. This is the web service, not the PostgreSQL service.
6. Set `SITE_URL` in the web service's Variables to the exact generated HTTPS address, without any path. Example only: `https://YOUR-SERVICE.up.railway.app`. Deploy/redeploy after setting it. The startup script can also derive it from `RAILWAY_PUBLIC_DOMAIN` when available; an explicit `SITE_URL` is recommended and takes precedence. For a custom domain, set `SITE_URL` to that domain instead.
7. Wait for a healthy deployment, then open the generated domain. Test a consultation request and sign into `/admin` to confirm it appears.

## Automatic configuration

`railway.json` selects the root `Dockerfile` and `/api/health` readiness check. The image builds Next.js, removes development dependencies and runs as a non-root user. Real `.env` files, local credentials, caches and dependency folders are excluded from the Docker context.

At runtime `scripts/start-production.mjs` applies the repeatable PostgreSQL schema, optionally provisions the initial staff account, and starts the web server on `0.0.0.0:$PORT`. Do not override the start command with a frontend-only command, which would skip database initialization. No public database port is required for the web service to work on Railway's private network.

Public pages can build without database credentials. The runtime readiness check requires PostgreSQL and the schema. Requests and staff accounts persist in the PostgreSQL service, not the disposable web container filesystem.

## Troubleshooting

- **DATABASE_URL is required**: add the variable reference on the web service, not just the database service.
- **Connection refused / unhealthy**: ensure PostgreSQL is healthy and its private connection is referenced in the same Railway project/environment.
- **Request origin is not allowed**: set `SITE_URL` to the exact HTTPS origin you are visiting, then redeploy.
- **Sign-in fails**: provision the initial user via the `ADMIN_EMAIL` / `ADMIN_PASSWORD` variables; an existing account is not overwritten by redeployment.
- **Application failed to respond**: check the web service's generated domain target port matches its `PORT`; inspect startup logs without posting secrets.

No Railway deployment or public domain is created merely by committing these files. The project must be connected in the user's Railway account. Railway plan and usage charges are controlled by Railway.
