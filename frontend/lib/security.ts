import type { Pool, PoolClient } from "pg";
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function verifyPassword(password: string, stored: string) {
  try {
    const [salt, expected] = stored.split(":");
    const actual = scryptSync(password, salt, 64);
    const check = Buffer.from(expected, "hex");
    return check.length === actual.length && timingSafeEqual(check, actual);
  } catch {
    return false;
  }
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const expected = process.env.SITE_URL || req.nextUrl.origin;
  return !!origin && origin === new URL(expected).origin;
}
export async function body(req: NextRequest) {
  if (Number(req.headers.get("content-length") || 0) > 32768)
    throw new Error("BODY_SIZE");
  const text = await req.text();
  if (text.length > 32768) throw new Error("BODY_SIZE");
  return JSON.parse(text);
}
export async function rateLimit(
  bucket: string,
  max: number,
  minutes: number,
  executor: Pool | PoolClient = db,
) {
  const result = await executor.query(
    `INSERT INTO rate_limits(bucket,hits,expires_at) VALUES($1,1,now()+$2 * interval '1 minute') ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.hits+1 END,expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+$2 * interval '1 minute' ELSE rate_limits.expires_at END RETURNING hits`,
    [bucket, minutes],
  );
  return result.rows[0].hits <= max;
}
export async function currentUser(req: NextRequest) {
  const token = req.cookies.get("oe_session")?.value;
  if (!token) return null;
  const result = await db.query(
    "SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN admin_users u ON s.user_id=u.id WHERE token_hash=$1 AND expires_at>now()",
    [hash(token)],
  );
  return result.rows[0] || null;
}
export async function newSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await db.query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",
    [hash(token), userId],
  );
  return token;
}
export function unavailable() {
  return NextResponse.json(
    {
      error:
        "Our request service is temporarily unavailable. Your entries are preserved. Please try again later.",
    },
    { status: 503 },
  );
}
export function invalidBody() {
  return NextResponse.json(
    { error: "Invalid request. Check the submitted fields." },
    { status: 400 },
  );
}
