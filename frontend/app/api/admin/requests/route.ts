import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  currentUser,
  body,
  sameOrigin,
  unavailable,
  invalidBody,
} from "@/lib/security";
import { statuses } from "@/lib/content";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user)
      return NextResponse.json(
        { error: "Sign in to access requests." },
        { status: 401 },
      );
    const q = (req.nextUrl.searchParams.get("q") || "").slice(0, 200);
    const status = req.nextUrl.searchParams.get("status") || "";
    if (status && !statuses.includes(status as (typeof statuses)[number]))
      return invalidBody();
    const records = await db.query(
      `SELECT * FROM (SELECT b.id,'booking' AS kind,l.full_name,l.phone,l.email,l.service_type,l.city,l.property_type,l.message,b.preferred_date::text,b.preferred_time,b.monthly_bill::text,b.address,b.status,b.notes,b.version,b.created_at,'' AS subject FROM consultation_bookings b JOIN leads l ON b.lead_id=l.id UNION ALL SELECT c.id,'contact' AS kind,c.full_name,c.phone,c.email,'' AS service_type,'' AS city,'' AS property_type,c.message,NULL AS preferred_date,'' AS preferred_time,NULL AS monthly_bill,'' AS address,c.status,c.notes,c.version,c.created_at,c.subject FROM contact_requests c) r WHERE ($1='' OR status=$1) AND ($2='' OR full_name ILIKE '%'||$2||'%' OR email ILIKE '%'||$2||'%' OR city ILIKE '%'||$2||'%' OR phone ILIKE '%'||$2||'%') ORDER BY created_at DESC LIMIT 200`,
      [status, q],
    );
    const metrics = await db.query(
      "SELECT status,count(*)::integer AS count FROM (SELECT status FROM consultation_bookings UNION ALL SELECT status FROM contact_requests) r GROUP BY status",
    );
    return NextResponse.json(
      { requests: records.rows, metrics: metrics.rows, user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unavailable();
  }
}
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  let client;
  try {
    const user = await currentUser(req);
    if (!user)
      return NextResponse.json(
        { error: "Sign in to access requests." },
        { status: 401 },
      );
    if (!["admin", "staff"].includes(user.role))
      return NextResponse.json(
        { error: "Your role has read-only access." },
        { status: 403 },
      );
    let data;
    try {
      data = await body(req);
    } catch {
      return invalidBody();
    }
    if (
      !["booking", "contact"].includes(data.kind) ||
      !statuses.includes(data.status) ||
      !Number.isInteger(data.version) ||
      typeof data.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(data.id) ||
      typeof data.notes !== "string" ||
      data.notes.length > 4000
    )
      return invalidBody();
    const table =
      data.kind === "booking" ? "consultation_bookings" : "contact_requests";
    client = await db.connect();
    await client.query("BEGIN");
    const old = await client.query(
      `SELECT status,version FROM ${table} WHERE id=$1 FOR UPDATE`,
      [data.id],
    );
    if (!old.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Request not found." },
        { status: 404 },
      );
    }
    if (old.rows[0].version !== data.version) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error:
            "Another staff member updated this request. Refresh the list and review the latest details before saving.",
        },
        { status: 409 },
      );
    }
    const updated = await client.query(
      `UPDATE ${table} SET status=$1,notes=$2,version=version+1,updated_at=now() WHERE id=$3 RETURNING version`,
      [data.status, data.notes, data.id],
    );
    await client.query(
      "INSERT INTO audit_log(user_id,entity_type,entity_id,old_status,new_status) VALUES($1,$2,$3,$4,$5)",
      [user.id, data.kind, data.id, old.rows[0].status, data.status],
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, version: updated.rows[0].version });
  } catch {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return unavailable();
  } finally {
    client?.release();
  }
}
