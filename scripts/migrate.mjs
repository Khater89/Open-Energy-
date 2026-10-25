import pg from "../frontend/node_modules/pg/lib/index.js";
import { readFile } from "node:fs/promises";
import { connectWhenReady, databaseErrorCode } from "./database-readiness.mjs";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
let client;
try {
  client = await connectWhenReady(() => pool.connect(), {
    onRetry: (code) =>
      console.log(
        `Waiting for PostgreSQL (${code}); check that the database service is online and DATABASE_URL references that service.`,
      ),
  });
  await client.query("BEGIN");
  // Serialize schema initialization across overlapping deployments/replicas.
  await client.query("SELECT pg_advisory_xact_lock(1471258701)");
  await client.query(
    await readFile(new URL("../backend/schema.sql", import.meta.url), "utf8"),
  );
  await client.query("COMMIT");
  console.log("Database schema ready.");
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  const code = databaseErrorCode(error);
  console.error(
    `Database initialization failed (${code}). Verify PostgreSQL is running in the same Railway project/environment and DATABASE_URL is a reference to the PostgreSQL service, not the website service.`,
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
