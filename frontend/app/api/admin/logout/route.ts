import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, hash, unavailable } from "@/lib/security";
import { db } from "@/lib/db";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  try {
    const token = req.cookies.get("oe_session")?.value;
    if (token)
      await db.query("DELETE FROM sessions WHERE token_hash=$1", [hash(token)]);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("oe_session", "", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch {
    return unavailable();
  }
}
