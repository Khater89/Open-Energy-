import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "./validation.mjs";
import {
  body,
  hash,
  rateLimit,
  sameOrigin,
  unavailable,
  invalidBody,
} from "./security";
import { db } from "./db";
export async function intake(req: NextRequest, kind: "booking" | "contact") {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  let raw;
  try {
    raw = await body(req);
  } catch {
    return invalidBody();
  }
  const { data, errors, valid } = validateRequest(raw, kind);
  if (!valid)
    return NextResponse.json(
      { error: "Please check the highlighted fields.", errors },
      { status: 400 },
    );
  const key = req.headers.get("idempotency-key");
  if (
    !key ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    )
  )
    return NextResponse.json(
      {
        error:
          "Refresh the page and try again. A request identifier is missing.",
      },
      { status: 400 },
    );
  const fingerprint = hash(JSON.stringify(data));
  const table =
    kind === "booking" ? "consultation_bookings" : "contact_requests";
  let client;
  try {
    client = await db.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `${kind}:${key}`,
    ]);
    const existing = await client.query(
      `SELECT id,payload_hash FROM ${table} WHERE idempotency_key=$1`,
      [key],
    );
    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return existing.rows[0].payload_hash === fingerprint
        ? NextResponse.json({ id: existing.rows[0].id, status: "received" })
        : NextResponse.json(
            {
              error:
                "This request identifier was already used for different details. Refresh the page to submit a new request.",
            },
            { status: 409 },
          );
    }
    if (
      !(await rateLimit(
        `intake:${hash(data.email.toLowerCase())}`,
        5,
        60,
        client,
      ))
    ) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Too many requests. Please try again in an hour." },
        { status: 429 },
      );
    }
    let saved;
    if (kind === "booking") {
      const lead = await client.query(
        "INSERT INTO leads(full_name,phone,email,service_type,city,property_type,message) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
        [
          data.full_name,
          data.phone,
          data.email,
          data.service_type,
          data.city,
          data.property_type,
          data.message,
        ],
      );
      saved = await client.query(
        "INSERT INTO consultation_bookings(lead_id,preferred_date,preferred_time,monthly_bill,address,idempotency_key,payload_hash) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
        [
          lead.rows[0].id,
          data.preferred_date,
          data.preferred_time,
          data.monthly_bill || null,
          data.address,
          key,
          fingerprint,
        ],
      );
    } else
      saved = await client.query(
        "INSERT INTO contact_requests(full_name,phone,email,subject,message,idempotency_key,payload_hash) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
        [
          data.full_name,
          data.phone,
          data.email,
          data.subject,
          data.message,
          key,
          fingerprint,
        ],
      );
    await client.query(
      "INSERT INTO notification_outbox(kind,booking_id,contact_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
      [
        kind,
        kind === "booking" ? saved.rows[0].id : null,
        kind === "contact" ? saved.rows[0].id : null,
      ],
    );
    await client.query("COMMIT");
    return NextResponse.json(
      { id: saved.rows[0].id, status: "received" },
      { status: 201 },
    );
  } catch {
    if (client) await client.query("ROLLBACK").catch(() => {});
    return unavailable();
  } finally {
    client?.release();
  }
}
