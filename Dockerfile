FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm ci --prefix frontend --no-audit --no-fund
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend
RUN npm prune --prefix frontend --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/frontend ./frontend
COPY --chown=node:node backend/schema.sql ./backend/schema.sql
COPY --chown=node:node scripts/migrate.mjs scripts/database-readiness.mjs scripts/create-admin.mjs scripts/start-production.mjs scripts/notification-worker.mjs ./scripts/
USER node
EXPOSE 3000
CMD ["node", "scripts/start-production.mjs"]
