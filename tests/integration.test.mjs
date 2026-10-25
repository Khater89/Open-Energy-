import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";
import pg from "../frontend/node_modules/pg/lib/index.js";
const base = process.env.INTEGRATION_BASE_URL;
test(
  "PostgreSQL intake, secure admin and concurrent edits",
  { skip: !base },
  async (t) => {
    const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const suffix = randomUUID();
    const email = `integration-${suffix}@example.test`;
    const password = randomBytes(24).toString("hex");
    const salt = randomBytes(16).toString("hex");
    const stored = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
    let userId;
    let bookingId;
    let contactId;
    const headers = { "Content-Type": "application/json", Origin: base };
    const submit = (path, data, extra = {}) =>
      fetch(base + path, {
        method: "POST",
        headers: { ...headers, ...extra },
        body: JSON.stringify(data),
      });
    try {
      await t.test("health checks real PostgreSQL tables", async () =>
        assert.equal((await fetch(base + "/api/health")).status, 200),
      );
      await t.test("private records reject anonymous access", async () =>
        assert.equal((await fetch(base + "/api/admin/requests")).status, 401),
      );
      await t.test(
        "malformed input and cross-origin posts are rejected",
        async () => {
          const r = await submit("/api/bookings", { email: "bad" });
          assert.equal(r.status, 400);
          assert.ok((await r.json()).errors.email);
          const evil = await submit(
            "/api/contact",
            {},
            { Origin: "https://other.example" },
          );
          assert.equal(evil.status, 403);
        },
      );
      const payload = {
        full_name: "Integration Test",
        email,
        phone: "+962790000000",
        city: "Amman",
        property_type: "home",
        service_type: "hybrid",
        preferred_date: new Date(Date.now() + 7 * 86400000)
          .toISOString()
          .slice(0, 10),
        preferred_time: "morning",
        monthly_bill: "125",
        message: "Automated integration fixture",
        consent: true,
      };
      const key = randomUUID();
      await t.test(
        "booking is durably saved and retries do not duplicate",
        async () => {
          const r = await submit("/api/bookings", payload, {
            "Idempotency-Key": key,
          });
          assert.equal(r.status, 201);
          bookingId = (await r.json()).id;
          const retry = await submit("/api/bookings", payload, {
            "Idempotency-Key": key,
          });
          assert.equal((await retry.json()).id, bookingId);
          const conflict = await submit(
            "/api/bookings",
            { ...payload, city: "Irbid" },
            { "Idempotency-Key": key },
          );
          assert.equal(conflict.status, 409);
          const saved = await db.query(
            "SELECT b.id,l.city FROM consultation_bookings b JOIN leads l ON b.lead_id=l.id WHERE b.id=$1",
            [bookingId],
          );
          assert.equal(saved.rows[0].city, "Amman");
        },
      );
      await t.test("contact is saved and persisted", async () => {
        const r = await submit(
          "/api/contact",
          { ...payload, subject: "Solar question" },
          { "Idempotency-Key": randomUUID() },
        );
        assert.equal(r.status, 201);
        contactId = (await r.json()).id;
        assert.equal(
          (
            await db.query("SELECT subject FROM contact_requests WHERE id=$1", [
              contactId,
            ])
          ).rows[0].subject,
          "Solar question",
        );
      });
      userId = (
        await db.query(
          "INSERT INTO admin_users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id",
          ["Integration Admin", email, stored, "admin"],
        )
      ).rows[0].id;
      await t.test("incorrect password is rejected", async () =>
        assert.equal(
          (await submit("/api/admin/login", { email, password: "incorrect" }))
            .status,
          401,
        ),
      );
      const login = await submit("/api/admin/login", { email, password });
      assert.equal(login.status, 200);
      const cookie = login.headers.get("set-cookie").split(";")[0];
      assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
      assert.match(login.headers.get("set-cookie"), /SameSite=strict/i);
      await t.test("staff can see saved bookings and contacts", async () => {
        const r = await fetch(
          base + `/api/admin/requests?q=${encodeURIComponent(email)}`,
          { headers: { Cookie: cookie } },
        );
        assert.equal(r.status, 200);
        const d = await r.json();
        assert.equal(d.requests.length, 2);
        assert.ok(d.requests.some((r) => r.id === bookingId));
        assert.ok(d.requests.some((r) => r.id === contactId));
      });
      const update = {
        id: bookingId,
        kind: "booking",
        status: "contacted",
        version: 1,
        notes: "Follow-up requested",
      };
      await t.test(
        "status updates are audited and stale updates are blocked",
        async () => {
          const r = await fetch(base + "/api/admin/requests", {
            method: "PATCH",
            headers: { ...headers, Cookie: cookie },
            body: JSON.stringify(update),
          });
          assert.equal(r.status, 200);
          assert.equal((await r.json()).version, 2);
          assert.equal(
            (
              await db.query(
                "SELECT status FROM consultation_bookings WHERE id=$1",
                [bookingId],
              )
            ).rows[0].status,
            "contacted",
          );
          const conflict = await fetch(base + "/api/admin/requests", {
            method: "PATCH",
            headers: { ...headers, Cookie: cookie },
            body: JSON.stringify(update),
          });
          assert.equal(conflict.status, 409);
          assert.equal(
            (
              await db.query(
                "SELECT count(*)::int AS n FROM audit_log WHERE entity_id=$1",
                [bookingId],
              )
            ).rows[0].n,
            1,
          );
        },
      );
      await t.test("viewers cannot change records", async () => {
        await db.query("UPDATE admin_users SET role='viewer' WHERE id=$1", [
          userId,
        ]);
        const r = await fetch(base + "/api/admin/requests", {
          method: "PATCH",
          headers: { ...headers, Cookie: cookie },
          body: JSON.stringify({ ...update, version: 2 }),
        });
        assert.equal(r.status, 403);
      });
      await t.test("logout revokes the server session", async () => {
        assert.equal(
          (await submit("/api/admin/logout", {}, { Cookie: cookie })).status,
          200,
        );
        assert.equal(
          (
            await fetch(base + "/api/admin/requests", {
              headers: { Cookie: cookie },
            })
          ).status,
          401,
        );
      });
    } finally {
      await db.query("DELETE FROM audit_log WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM admin_users WHERE email=$1", [email]);
      await db.query(
        "DELETE FROM consultation_bookings WHERE lead_id IN (SELECT id FROM leads WHERE email=$1)",
        [email],
      );
      await db.query("DELETE FROM leads WHERE email=$1", [email]);
      await db.query("DELETE FROM contact_requests WHERE email=$1", [email]);
      await db.end();
    }
  },
);
