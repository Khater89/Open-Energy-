import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  notificationSetup,
  notificationContent,
  sendNotification,
} from "../frontend/lib/notifications.mjs";
const env = {
  RESEND_API_KEY: "fixture-key-not-a-real-key",
  NOTIFICATION_FROM: "Open Energy <solar@example.test>",
  NOTIFICATION_TO: "owner@example.test",
  SITE_URL: "https://solar.example.test",
};
const record = {
  id: "request-reference",
  full_name: "<script>bad()</script>",
  email: "client@example.test",
  phone: "+962790000000",
  service_type: "hybrid",
  city: "Amman",
  property_type: "home",
  preferred_date: "2027-02-01",
  preferred_time: "morning",
  monthly_bill: "140",
  address: "A & B street",
  message: "Client message <img src=x onerror=alert(1)>",
};
test("missing sending credentials do not imply email notifications are active", () => {
  const config = notificationSetup({});
  assert.equal(config.configured, false);
  assert.deepEqual(config.missing, ["RESEND_API_KEY", "NOTIFICATION_FROM"]);
  assert.equal(config.to, "abdelrahman.khater.elc@gmail.com");
});
test("email contains every qualification field, reply address and an escaped HTML representation", () => {
  const content = notificationContent(record, "booking", env.SITE_URL);
  for (const value of [
    record.phone,
    record.email,
    record.city,
    record.preferred_date,
    record.preferred_time,
    record.monthly_bill,
    record.message,
  ])
    assert.ok(content.text.includes(value));
  assert.equal(content.reply_to, record.email);
  assert.ok(!content.html.includes("<script>"));
  assert.ok(!content.html.includes("<img src=x"));
  assert.match(content.html, /&lt;script&gt;/);
  assert.match(content.html, /https:\/\/solar.example.test\/admin/);
  assert.match(content.text, /not a confirmed appointment/);
});
test("sender acceptance is verified through a real HTTP exchange with a local provider fixture", async () => {
  let received;
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    received = { headers: req.headers, body: JSON.parse(body) };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id: "provider-reference" }));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const result = await sendNotification(record, "booking", "job-id", {
      env,
      fetcher: (url, options) => {
        assert.equal(url, "https://api.resend.com/emails");
        return fetch(
          `http://127.0.0.1:${server.address().port}/emails`,
          options,
        );
      },
    });
    assert.equal(result.id, "provider-reference");
    assert.equal(received.headers["idempotency-key"], "open-energy/job-id");
    assert.equal(
      received.headers.authorization,
      `Bearer ${env.RESEND_API_KEY}`,
    );
    assert.deepEqual(received.body.to, ["owner@example.test"]);
    assert.equal(received.body.reply_to, record.email);
    assert.match(received.body.text, /Amman/);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
test("provider rejection and malformed success never become a delivery confirmation", async () => {
  for (const [status, retryable] of [
    [401, false],
    [422, false],
    [429, true],
    [503, true],
  ])
    await assert.rejects(
      sendNotification(record, "contact", "job", {
        env,
        fetcher: async () =>
          new Response("private provider detail", { status }),
      }),
      (error) =>
        error.code === `provider_http_${status}` &&
        error.retryable === retryable,
    );
  await assert.rejects(
    sendNotification(record, "contact", "job", {
      env,
      fetcher: async () => new Response("{}", { status: 200 }),
    }),
    { code: "provider_invalid_response" },
  );
});
test("missing credentials prevent all provider calls", async () => {
  await assert.rejects(
    sendNotification(record, "contact", "job", {
      env: {},
      fetcher: () => assert.fail("must not contact provider"),
    }),
    { code: "not_configured" },
  );
});
