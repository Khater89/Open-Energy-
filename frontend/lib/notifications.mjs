import { randomUUID } from "node:crypto";

export function notificationSetup(env = process.env) {
  const missing = [];
  if (!env.RESEND_API_KEY?.trim()) missing.push("RESEND_API_KEY");
  if (!env.NOTIFICATION_FROM?.trim()) missing.push("NOTIFICATION_FROM");
  return {
    configured: missing.length === 0,
    missing,
    to: env.NOTIFICATION_TO?.trim() || "abdelrahman.khater.elc@gmail.com",
  };
}
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function notificationContent(record, kind, siteUrl) {
  const title =
    kind === "booking"
      ? "New solar consultation request"
      : "New contact inquiry";
  const fields = [
    ["Reference", record.id],
    [
      "Received at (UTC)",
      record.created_at ? new Date(record.created_at).toISOString() : undefined,
    ],
    ["Name", record.full_name],
    ["Phone", record.phone],
    ["Email", record.email],
    ["System", record.service_type],
    ["City / location", record.city],
    ["Property type", record.property_type],
    ["Address", record.address],
    ["Preferred date", record.preferred_date],
    ["Preferred time (property local time)", record.preferred_time],
    ["Monthly bill (local currency; see message)", record.monthly_bill],
    ["Subject", record.subject],
    ["Message", record.message],
  ].filter(([, v]) => v !== undefined && v !== null && String(v) !== "");
  let adminUrl;
  try {
    const url = new URL(siteUrl);
    if (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    )
      adminUrl = new URL("/admin", url).href;
  } catch {}
  const text = [
    title,
    ...fields.map(([k, v]) => `${k}: ${v}`),
    kind === "booking" ? "This is a request, not a confirmed appointment." : "",
    adminUrl ? `Staff workspace: ${adminUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17262c"><div style="background:#14252b;padding:24px;color:white;font-size:22px">open energy<span style="color:#fdb813">.</span></div><div style="padding:24px;border:1px solid #e1e6dc"><p style="color:#52624c;font-size:12px">NEW WEBSITE REQUEST</p><h1 style="font-size:24px">${title}</h1><table style="width:100%;border-collapse:collapse">${fields.map(([k, v]) => `<tr><th style="text-align:left;vertical-align:top;font-size:12px;padding:12px 10px 12px 0;border-bottom:1px solid #eee;width:35%">${escapeHtml(k)}</th><td style="font-size:14px;padding:12px 0;border-bottom:1px solid #eee;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(v)}</td></tr>`).join("")}</table>${kind === "booking" ? '<p style="font-size:12px;color:#52624c">This is a request, not a confirmed appointment.</p>' : ""}${adminUrl ? `<p><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#fdb813;padding:13px 18px;color:#17262c;text-decoration:none;border-radius:6px">Open staff workspace</a></p>` : ""}</div></div>`;
  return {
    subject: `${title} — ${String(record.full_name || "Website visitor")
      .replace(/[\r\n]/g, " ")
      .slice(0, 100)}`,
    text,
    html,
    reply_to: record.email,
  };
}
export class NotificationError extends Error {
  constructor(code, retryable = true) {
    super(code);
    this.code = code;
    this.retryable = retryable;
  }
}
export async function sendNotification(
  record,
  kind,
  jobId,
  { env = process.env, fetcher = fetch } = {},
) {
  const setup = notificationSetup(env);
  if (!setup.configured) throw new NotificationError("not_configured", false);
  let response;
  try {
    response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `open-energy/${jobId}`,
      },
      body: JSON.stringify({
        from: env.NOTIFICATION_FROM,
        to: [setup.to],
        ...notificationContent(record, kind, env.SITE_URL),
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new NotificationError("provider_unreachable");
  }
  if (!response.ok)
    throw new NotificationError(
      `provider_http_${response.status}`,
      [408, 409, 429].includes(response.status) || response.status >= 500,
    );
  let data;
  try {
    data = await response.json();
  } catch {
    throw new NotificationError("provider_invalid_response");
  }
  if (typeof data?.id !== "string" || !data.id)
    throw new NotificationError("provider_invalid_response");
  return { id: data.id };
}
export async function processNotification(
  pool,
  { env = process.env, fetcher = fetch } = {},
) {
  if (!notificationSetup(env).configured) return false;
  const token = randomUUID();
  const result = await pool.query(
    `WITH candidate AS (SELECT id FROM notification_outbox WHERE (status='pending' AND next_attempt_at<=now()) OR (status='sending' AND locked_until<now()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE notification_outbox n SET status='sending',attempts=n.attempts+1,lock_token=$1,locked_until=now()+interval '2 minutes',updated_at=now() FROM candidate c WHERE n.id=c.id RETURNING n.*`,
    [token],
  );
  const job = result.rows[0];
  if (!job) return false;
  try {
    if (job.attempts > 6) throw new NotificationError("retry_limit", false);
    const query =
      job.kind === "booking"
        ? `SELECT b.id,l.full_name,l.email,l.phone,l.service_type,l.city,l.property_type,l.message,b.preferred_date::text,b.preferred_time,b.monthly_bill::text,b.address,b.created_at FROM consultation_bookings b JOIN leads l ON b.lead_id=l.id WHERE b.id=$1`
        : `SELECT id,full_name,email,phone,subject,message,created_at FROM contact_requests WHERE id=$1`;
    const record = (await pool.query(query, [job.booking_id || job.contact_id]))
      .rows[0];
    if (!record) throw new NotificationError("request_missing", false);
    const delivered = await sendNotification(record, job.kind, job.id, {
      env,
      fetcher,
    });
    await pool.query(
      `UPDATE notification_outbox SET status='accepted',provider_message_id=$1,accepted_at=now(),last_error=NULL,lock_token=NULL,locked_until=NULL,updated_at=now() WHERE id=$2 AND lock_token=$3`,
      [delivered.id, job.id, token],
    );
  } catch (error) {
    // Store only known error codes, never response bodies, request details or credentials.
    const code =
      error instanceof NotificationError ? error.code : "worker_error";
    const retryable = !(error instanceof NotificationError) || error.retryable;
    const status = retryable && job.attempts < 6 ? "pending" : "failed";
    const delay = Math.min(3600, 30 * 2 ** Math.min(job.attempts - 1, 7));
    await pool.query(
      `UPDATE notification_outbox SET status=$1,last_error=$2,next_attempt_at=now()+$3*interval '1 second',lock_token=NULL,locked_until=NULL,updated_at=now() WHERE id=$4 AND lock_token=$5`,
      [status, code, delay, job.id, token],
    );
  }
  return true;
}
