import test from "node:test";
import assert from "node:assert/strict";
import {
  connectWhenReady,
  databaseErrorCode,
} from "../scripts/database-readiness.mjs";
const failure = (code) =>
  Object.assign(new Error("connection unavailable"), { code });
test("database connection recovers from DNS and connection refusal before deadline", async () => {
  let time = 0,
    attempts = 0;
  const seen = [];
  const connection = { release() {} };
  const result = await connectWhenReady(
    async () => {
      attempts++;
      if (attempts === 1) throw failure("ENOTFOUND");
      if (attempts === 2) throw failure("ECONNREFUSED");
      return connection;
    },
    {
      timeoutMs: 20,
      delayMs: 3,
      now: () => time,
      sleep: async (ms) => {
        time += ms;
      },
      onRetry: (code) => seen.push(code),
    },
  );
  assert.equal(result, connection);
  assert.equal(attempts, 3);
  assert.deepEqual(seen, ["ENOTFOUND", "ECONNREFUSED"]);
});
test("unavailable database fails within the retry deadline", async () => {
  let time = 0,
    attempts = 0;
  await assert.rejects(
    connectWhenReady(
      async () => {
        attempts++;
        throw failure("ECONNREFUSED");
      },
      {
        timeoutMs: 10,
        delayMs: 3,
        now: () => time,
        sleep: async (ms) => {
          time += ms;
        },
      },
    ),
    { code: "ECONNREFUSED" },
  );
  assert.equal(time, 10);
  assert.equal(attempts, 4);
});
test("invalid database credentials fail immediately without retrying", async () => {
  let attempts = 0;
  await assert.rejects(
    connectWhenReady(
      async () => {
        attempts++;
        throw failure("28P01");
      },
      { sleep: async () => assert.fail("must not wait") },
    ),
    { code: "28P01" },
  );
  assert.equal(attempts, 1);
});
test("schema errors are not treated as transient connection errors", async () => {
  let attempts = 0;
  await assert.rejects(
    connectWhenReady(async () => {
      attempts++;
      throw failure("42601");
    }),
    { code: "42601" },
  );
  assert.equal(attempts, 1);
});
test("aggregate connection codes are recognized and unsafe error codes are not logged", () => {
  assert.equal(
    databaseErrorCode(new AggregateError([failure("ECONNREFUSED")])),
    "ECONNREFUSED",
  );
  assert.equal(
    databaseErrorCode({ code: "connection string with password" }),
    "UNKNOWN",
  );
});
