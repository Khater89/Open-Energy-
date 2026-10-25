import { NextRequest, NextResponse } from "next/server";
import {
  body,
  hash,
  verifyPassword,
  newSession,
  rateLimit,
  sameOrigin,
  unavailable,
  invalidBody,
} from "@/lib/security";
import { db } from "@/lib/db";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  let data;
  try {
    data = await body(req);
  } catch {
    return invalidBody();
  }
  if (
    typeof data?.email !== "string" ||
    typeof data?.password !== "string" ||
    data.password.length > 256 ||
    data.email.length > 254
  )
    return invalidBody();
  try {
    const email = data.email.trim().toLowerCase();
    if (!(await rateLimit(`login:${hash(email)}`, 10, 15)))
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    const r = await db.query("SELECT * FROM admin_users WHERE email=$1", [
      email,
    ]);
    const user = r.rows[0];
    const stored =
      user?.password_hash ||
      "00000000000000000000000000000000:" + "0".repeat(128);
    if (!verifyPassword(data.password, stored) || !user)
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    const token = await newSession(user.id);
    await db.query("UPDATE admin_users SET last_login_at=now() WHERE id=$1", [
      user.id,
    ]);
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, role: user.role },
    });
    res.cookies.set("oe_session", token, {
      httpOnly: true,
      secure:
        new URL(process.env.SITE_URL || req.nextUrl.origin).protocol ===
        "https:",
      sameSite: "strict",
      path: "/",
      maxAge: 28800,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch {
    return unavailable();
  }
}
