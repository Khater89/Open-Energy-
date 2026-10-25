import pg from "../frontend/node_modules/pg/lib/index.js";
import { readFile } from "node:fs/promises";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
let client;
try {
  client = await pool.connect();
  await client.query("BEGIN");
  // Serialize schema initialization across overlapping deployments/replicas.
  await client.query("SELECT pg_advisory_xact_lock(1471258701)");
  await client.query(
    await readFile(new URL("../backend/schema.sql", import.meta.url), "utf8"),
  );
  await client.query("COMMIT");
  console.log("Database schema ready.");
} catch (error) {
  if (client) await client.query("ROLLBACK");
  throw error;
} finally {
  client?.release();
  await pool.end();
}
