import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "../frontend/node_modules/pg/lib/index.js";
import { processNotification } from "../frontend/lib/notifications.mjs";
test(
  "durable email outbox retries, leases and provider acceptance",
  { skip: !process.env.INTEGRATION_BASE_URL },
  async (t) => {
    const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const schema = "mail_test_" + randomUUID().replaceAll("-", "");
    await admin.query(`CREATE SCHEMA ${schema}`);
    const db = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      options: `-c search_path=${schema}`,
      max: 4,
    });
    const env = {
      RESEND_API_KEY: "fixture-key-not-a-real-key",
      NOTIFICATION_FROM: "sender@example.test",
      NOTIFICATION_TO: "owner@example.test",
    };
    const makeJob = async () => {
      const contact = (
        await db.query(
          "INSERT INTO contact_requests(full_name,phone,email,subject,message,idempotency_key,payload_hash) VALUES('Test client','0790000000','client@example.test','Subject','Message',$1,'hash') RETURNING id",
          [randomUUID()],
        )
      ).rows[0];
      return (
        await db.query(
          "INSERT INTO notification_outbox(kind,contact_id) VALUES('contact',$1) RETURNING id",
          [contact.id],
        )
      ).rows[0].id;
    };
    const row = async (id) =>
      (await db.query("SELECT * FROM notification_outbox WHERE id=$1", [id]))
        .rows[0];
    const clear = () => db.query("DELETE FROM contact_requests");
    try {
      await db.query(
        await readFile(
          new URL("../backend/schema.sql", import.meta.url),
          "utf8",
        ),
      );
      await t.test(
        "jobs remain untouched while email is not configured",
        async () => {
          const id = await makeJob();
          assert.equal(
            await processNotification(db, {
              env: {},
              fetcher: () => assert.fail("no send"),
            }),
            false,
          );
          assert.equal((await row(id)).attempts, 0);
          assert.equal((await row(id)).status, "pending");
          await clear();
        },
      );
      await t.test(
        "concurrent workers claim a job once and mark only provider-accepted mail",
        async () => {
          const id = await makeJob();
          let calls = 0;
          const fetcher = async () => {
            calls++;
            await new Promise((r) => setTimeout(r, 40));
            return new Response(JSON.stringify({ id: "provider-1" }), {
              status: 200,
            });
          };
          await Promise.all([
            processNotification(db, { env, fetcher }),
            processNotification(db, { env, fetcher }),
          ]);
          assert.equal(calls, 1);
          assert.equal((await row(id)).status, "accepted");
          assert.equal((await row(id)).provider_message_id, "provider-1");
          await clear();
        },
      );
      await t.test(
        "temporary errors retain the job and reuse the same provider idempotency key",
        async () => {
          const id = await makeJob();
          const keys = [];
          await processNotification(db, {
            env,
            fetcher: async (url, opts) => {
              keys.push(opts.headers["Idempotency-Key"]);
              return new Response("private provider error", { status: 503 });
            },
          });
          assert.equal((await row(id)).status, "pending");
          assert.equal((await row(id)).last_error, "provider_http_503");
          await db.query(
            "UPDATE notification_outbox SET next_attempt_at=now()-interval '1 second' WHERE id=$1",
            [id],
          );
          await processNotification(db, {
            env,
            fetcher: async (url, opts) => {
              keys.push(opts.headers["Idempotency-Key"]);
              return new Response(JSON.stringify({ id: "provider-retry" }), {
                status: 200,
              });
            },
          });
          assert.deepEqual(keys, [`open-energy/${id}`, `open-energy/${id}`]);
          assert.equal((await row(id)).status, "accepted");
          assert.equal((await row(id)).attempts, 2);
          await clear();
        },
      );
      await t.test(
        "permanent rejection is visible without storing private provider messages",
        async () => {
          const id = await makeJob();
          await processNotification(db, {
            env,
            fetcher: async () =>
              new Response("Sensitive recipient or credential details", {
                status: 401,
              }),
          });
          assert.equal((await row(id)).status, "failed");
          assert.equal((await row(id)).last_error, "provider_http_401");
          assert.equal(
            await processNotification(db, {
              env,
              fetcher: () => assert.fail("failed jobs must not loop"),
            }),
            false,
          );
          await clear();
        },
      );
      await t.test("an abandoned expired lease can be recovered", async () => {
        const id = await makeJob();
        await db.query(
          "UPDATE notification_outbox SET status='sending',lock_token=$1,locked_until=now()-interval '1 second',attempts=1 WHERE id=$2",
          [randomUUID(), id],
        );
        await processNotification(db, {
          env,
          fetcher: async () =>
            new Response(JSON.stringify({ id: "recovered" }), { status: 200 }),
        });
        assert.equal((await row(id)).status, "accepted");
        assert.equal((await row(id)).attempts, 2);
        await clear();
      });
      await t.test(
        "a stale worker cannot overwrite a newer lease",
        async () => {
          const id = await makeJob();
          const newerToken = randomUUID();
          await processNotification(db, {
            env,
            fetcher: async () => {
              await db.query(
                "UPDATE notification_outbox SET lock_token=$1,locked_until=now()+interval '2 minutes' WHERE id=$2",
                [newerToken, id],
              );
              return new Response(
                JSON.stringify({ id: "old-worker-reference" }),
                { status: 200 },
              );
            },
          });
          assert.equal((await row(id)).lock_token, newerToken);
          assert.equal((await row(id)).status, "sending");
          await clear();
        },
      );
      await t.test(
        "repeated failure stops at the documented limit",
        async () => {
          const id = await makeJob();
          await db.query(
            "UPDATE notification_outbox SET attempts=5 WHERE id=$1",
            [id],
          );
          await processNotification(db, {
            env,
            fetcher: async () => new Response("", { status: 503 }),
          });
          assert.equal((await row(id)).status, "failed");
          assert.equal((await row(id)).attempts, 6);
          await clear();
        },
      );
      await t.test(
        "deleted requests remove their queued notifications",
        async () => {
          await makeJob();
          await clear();
          assert.equal(
            (
              await db.query(
                "SELECT count(*)::integer AS n FROM notification_outbox",
              )
            ).rows[0].n,
            0,
          );
        },
      );
    } finally {
      await db.end();
      await admin.query(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
    }
  },
);
