import pg from "../frontend/node_modules/pg/lib/index.js";
import { randomBytes, scryptSync } from "node:crypto";
const {
  DATABASE_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME = "Administrator",
  ADMIN_ROLE = "admin",
} = process.env;
if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD)
  throw new Error(
    "Set DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD in your secure environment.",
  );
if (ADMIN_PASSWORD.length < 14)
  throw new Error("Choose a password of at least 14 characters.");
if (!["admin", "staff", "viewer"].includes(ADMIN_ROLE))
  throw new Error("ADMIN_ROLE must be admin, staff or viewer.");
const salt = randomBytes(16).toString("hex");
const stored = `${salt}:${scryptSync(ADMIN_PASSWORD, salt, 64).toString("hex")}`;
const pool = new pg.Pool({ connectionString: DATABASE_URL });
try {
  const result = await pool.query(
    "INSERT INTO admin_users(name,email,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id",
    [ADMIN_NAME, ADMIN_EMAIL.toLowerCase().trim(), stored, ADMIN_ROLE],
  );
  console.log(
    result.rowCount
      ? "Staff user created."
      : "User already exists; no credentials were changed.",
  );
} finally {
  await pool.end();
}
