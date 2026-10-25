import pg from "../frontend/node_modules/pg/lib/index.js";
import { setTimeout as delay } from "node:timers/promises";
import {
  notificationSetup,
  processNotification,
} from "../frontend/lib/notifications.mjs";
const stop = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => stop.abort());
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  connectionTimeoutMillis: 5000,
});
const setup = notificationSetup();
console.log(
  setup.configured
    ? "Email notification worker started."
    : `Email notifications are not configured. Add ${setup.missing.join(" and ")} in Railway. New requests will remain queued.`,
);
try {
  while (!stop.signal.aborted) {
    let worked = false;
    try {
      worked = await processNotification(pool);
    } catch {
      console.error(
        "Notification worker could not process the queue; it will retry. Request data and credentials are not logged.",
      );
    }
    await delay(worked ? 600 : 5000, undefined, { signal: stop.signal }).catch(
      () => {},
    );
  }
} finally {
  await pool.end();
}
