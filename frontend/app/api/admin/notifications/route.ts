import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  currentUser,
  sameOrigin,
  body,
  invalidBody,
  unavailable,
} from "@/lib/security";
import { notificationSetup } from "@/lib/notifications.mjs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user)
      return NextResponse.json(
        { error: "Sign in to view email notifications." },
        { status: 401 },
      );
    const setup = notificationSetup();
    const counts = await db.query(
      "SELECT status,count(*)::integer AS count FROM notification_outbox GROUP BY status",
    );
    const recent = await db.query(
      "SELECT id,kind,COALESCE(booking_id,contact_id) AS request_id,status,attempts,last_error,accepted_at,created_at FROM notification_outbox ORDER BY created_at DESC LIMIT 20",
    );
    return NextResponse.json(
      {
        setup,
        counts: counts.rows,
        recent: recent.rows,
        canRetry: ["admin", "staff"].includes(user.role),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unavailable();
  }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  try {
    const user = await currentUser(req);
    if (!user)
      return NextResponse.json(
        { error: "Sign in to retry notifications." },
        { status: 401 },
      );
    if (!["admin", "staff"].includes(user.role))
      return NextResponse.json(
        { error: "Your role has read-only access." },
        { status: 403 },
      );
    let value;
    try {
      value = await body(req);
    } catch {
      return invalidBody();
    }
    if (
      typeof value?.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value.id,
      )
    )
      return invalidBody();
    if (!notificationSetup().configured)
      return NextResponse.json(
        { error: "Configure the email service in Railway before retrying." },
        { status: 409 },
      );
    const result = await db.query(
      "UPDATE notification_outbox SET status='pending',attempts=0,next_attempt_at=now(),last_error=NULL,updated_at=now() WHERE id=$1 AND status='failed' RETURNING id",
      [value.id],
    );
    if (!result.rowCount)
      return NextResponse.json(
        {
          error:
            "Only failed notifications can be retried. Accepted notifications cannot be resent.",
        },
        { status: 409 },
      );
    return NextResponse.json({ queued: true });
  } catch {
    return unavailable();
  }
}
