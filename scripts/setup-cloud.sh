#!/usr/bin/env bash
set -euo pipefail
# Cloud tasks are already isolated. Reuse this checkout; do not create a worktree.
cd /workspace/Open-Energy-
npm --cache /tmp/open-energy-npm ci --prefix frontend --no-audit --no-fund
pgroot=/workspace/.open-energy-tools/pg
runtime=/workspace/.open-energy-runtime
if [ ! -x "$pgroot/usr/lib/postgresql/17/bin/postgres" ]; then
  mkdir -p /tmp/open-energy-apt/lists/partial /tmp/open-energy-apt/cache/archives/partial /workspace/.open-energy-tools
  cat > /tmp/open-energy-apt/sources.list <<'SOURCES'
deb https://deb.debian.org/debian trixie main
deb https://deb.debian.org/debian-security trixie-security main
SOURCES
  apt_options=(-o Dir::Etc::parts=- -o Dir::Etc::sourcelist=/tmp/open-energy-apt/sources.list -o Dir::Etc::sourceparts=- -o Dir::State::lists=/tmp/open-energy-apt/lists -o Dir::Cache=/tmp/open-energy-apt/cache)
  apt-get "${apt_options[@]}" update
  (cd /workspace/.open-energy-tools && apt-get "${apt_options[@]}" download postgresql-17 postgresql-client-17)
  for package in /workspace/.open-energy-tools/postgresql-17_*.deb /workspace/.open-energy-tools/postgresql-client-17_*.deb; do dpkg-deb -x "$package" "$pgroot"; done
fi
mkdir -p "$runtime/socket"
# Local development only: loopback-only PostgreSQL. Production uses authenticated managed PostgreSQL.
if [ ! -f "$runtime/pgdata/PG_VERSION" ]; then
  "$pgroot/usr/lib/postgresql/17/bin/initdb" -D "$runtime/pgdata" --no-locale --encoding=UTF8 --auth-local=trust --auth-host=trust
fi
if ! "$pgroot/usr/lib/postgresql/17/bin/pg_ctl" -D "$runtime/pgdata" status >/dev/null 2>&1; then
 "$pgroot/usr/lib/postgresql/17/bin/pg_ctl" -D "$runtime/pgdata" -l "$runtime/postgres.log" -o '-h 127.0.0.1 -p 5432 -k /workspace/.open-energy-runtime/socket' start
fi
if ! "$pgroot/usr/lib/postgresql/17/bin/psql" -h 127.0.0.1 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='open_energy'" | rg -q 1; then
 "$pgroot/usr/lib/postgresql/17/bin/createdb" -h 127.0.0.1 open_energy
fi
if [ ! -f frontend/.env.local ]; then
 (umask 077; printf 'DATABASE_URL=postgresql://agent@127.0.0.1:5432/open_energy\nSITE_URL=http://localhost:3000\n' > frontend/.env.local)
fi
node --env-file=frontend/.env.local scripts/migrate.mjs
npm test --prefix frontend
npm run build --prefix frontend
