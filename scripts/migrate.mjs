import pg from "../frontend/node_modules/pg/lib/index.js";
import { readFile } from "node:fs/promises";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(
    await readFile(new URL("../backend/schema.sql", import.meta.url), "utf8"),
  );
  console.log("Database schema ready.");
} finally {
  await pool.end();
}
