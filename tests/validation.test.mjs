import test from "node:test";
import assert from "node:assert/strict";
import { validateRequest } from "../frontend/lib/validation.mjs";
const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const booking = {
  full_name: "Test Homeowner",
  phone: "+962 790000000",
  email: "test@example.test",
  service_type: "hybrid",
  city: "Amman",
  property_type: "home",
  message: "Test request",
  consent: true,
  preferred_date: future,
  preferred_time: "morning",
  monthly_bill: "125.50",
  address: "",
};
test("valid booking is accepted without losing data", () => {
  const r = validateRequest(booking);
  assert.equal(r.valid, true);
  assert.equal(r.data.city, "Amman");
});
test("unknown system types are rejected", () =>
  assert.match(
    validateRequest({ ...booking, service_type: "wind" }).errors.service_type,
    /Choose/,
  ));
test("missing and malformed contacts have field errors", () => {
  const r = validateRequest({
    ...booking,
    full_name: "",
    email: "bad-email",
    phone: "12",
  });
  for (const key of ["full_name", "email", "phone"]) assert.ok(r.errors[key]);
  assert.equal(r.data.city, "Amman");
});
test("past date and impossible date are rejected", () => {
  for (const preferred_date of ["2020-01-01", "2030-02-30"])
    assert.ok(
      validateRequest({ ...booking, preferred_date }).errors.preferred_date,
    );
});
test("negative and unbounded monthly bills are rejected", () => {
  for (const monthly_bill of ["-1", "1000001", "NaN"])
    assert.ok(
      validateRequest({ ...booking, monthly_bill }).errors.monthly_bill,
    );
});
test("consent is mandatory", () =>
  assert.ok(validateRequest({ ...booking, consent: false }).errors.consent));
test("contact requires subject and message", () => {
  const r = validateRequest(
    { ...booking, subject: "", message: "" },
    "contact",
  );
  assert.ok(r.errors.subject);
  assert.ok(r.errors.message);
});
test("contact accepts a complete inquiry", () =>
  assert.equal(
    validateRequest({ ...booking, subject: "System upgrade" }, "contact").valid,
    true,
  ));
test("oversized content is rejected", () =>
  assert.ok(
    validateRequest({ ...booking, message: "a".repeat(4001) }).errors.message,
  ));
