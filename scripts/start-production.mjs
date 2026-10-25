import { spawnSync, spawn } from "node:child_process";
import { resolve } from "node:path";

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is required. Link the Railway PostgreSQL service before deploying.",
  );
  process.exit(1);
}
const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
if (!process.env.SITE_URL && domain) process.env.SITE_URL = `https://${domain}`;
if (process.env.SITE_URL) {
  try {
    const url = new URL(process.env.SITE_URL);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      throw new Error();
    process.env.SITE_URL = url.origin;
  } catch {
    console.error(
      "SITE_URL must be an HTTP(S) origin without a path, query or credentials.",
    );
    process.exit(1);
  }
} else {
  console.log(
    "Setup notice: generate a Railway public domain and redeploy, or set SITE_URL, before accepting form submissions.",
  );
}
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be a valid TCP port.");
  process.exit(1);
}
function run(file) {
  const result = spawnSync(process.execPath, [resolve("scripts", file)], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
run("migrate.mjs");
if (process.env.ADMIN_EMAIL || process.env.ADMIN_PASSWORD)
  run("create-admin.mjs");
// Provisioning credentials are not needed by the running web server.
const env = { ...process.env };
for (const key of ["ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_NAME", "ADMIN_ROLE"])
  delete env[key];
const server = spawn(
  process.execPath,
  [
    resolve("frontend/node_modules/next/dist/bin/next"),
    "start",
    "--hostname",
    "0.0.0.0",
    "--port",
    String(port),
  ],
  { cwd: resolve("frontend"), env, stdio: "inherit" },
);
let stopping = false;
let worker;
let restartTimer;
function startWorker() {
  worker = spawn(
    process.execPath,
    [resolve("scripts/notification-worker.mjs")],
    { env, stdio: "inherit" },
  );
  worker.on("error", () =>
    console.error("Could not launch the notification worker."),
  );
  worker.on("exit", () => {
    if (!stopping) {
      console.error("Notification worker stopped; restarting in five seconds.");
      restartTimer = setTimeout(startWorker, 5000);
    }
  });
}
startWorker();
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    stopping = true;
    clearTimeout(restartTimer);
    worker?.kill(signal);
    server.kill(signal);
  });
server.on("error", () => {
  stopping = true;
  clearTimeout(restartTimer);
  worker?.kill();
  console.error("Could not start the web server.");
  process.exit(1);
});
server.on("exit", (code) => {
  stopping = true;
  clearTimeout(restartTimer);
  worker?.kill();
  process.exit(code ?? 0);
});
