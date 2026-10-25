import { Pool } from "pg";
const globalDB = globalThis as unknown as { db?: Pool };
export const db =
  globalDB.db ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    connectionTimeoutMillis: 4000,
    idleTimeoutMillis: 30000,
  });
if (process.env.NODE_ENV !== "production") globalDB.db = db;
