import assert from "node:assert/strict";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { chromium as playwright } from "../frontend/node_modules/playwright-core/index.mjs";
import chromium from "../frontend/node_modules/@sparticuz/chromium/build/index.js";
import pg from "../frontend/node_modules/pg/lib/index.js";
import AxeBuilder from "../frontend/node_modules/@axe-core/playwright/dist/index.mjs";
const base = process.env.INTEGRATION_BASE_URL || "http://localhost:3000";
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const email = `browser-${randomUUID()}@example.test`;
const password = randomBytes(24).toString("hex");
const salt = randomBytes(16).toString("hex");
const stored = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const browser = await playwright.launch({
  headless: true,
  args: chromium.args.filter((arg) => arg !== "--disable-web-security"),
  executablePath: await chromium.executablePath(),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let userId;
try {
  userId = (
    await db.query(
      "INSERT INTO admin_users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id",
      ["Browser Admin", email, stored, "admin"],
    )
  ).rows[0].id;
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/services",
      "/projects",
      "/about",
      "/contact",
      "/book",
      "/faq",
      "/admin",
    ]) {
      const res = await page.goto(base + path, { waitUntil: "networkidle" });
      assert.equal(res.status(), 200, path);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${path} overflow at ${width}`,
      );
    }
  }
  console.log(
    "PASS: all 8 pages at 360, 768 and 1440px without horizontal overflow",
  );
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(base);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Our solutions" })
    .click();
  await page.waitForURL("**/services");
  console.log("PASS: mobile navigation");
  await page.goto(base + "/book");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("alert").filter({ hasText: "Choose on-grid" }).waitFor();
  await page.getByRole("radio", { name: /Hybrid systems/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("City / location").fill("Amman");
  await page.getByLabel("Property type").selectOption("home");
  await page
    .getByLabel("Preferred date")
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  await page.getByLabel("Preferred time").selectOption("morning");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill("Browser Homeowner");
  await page.getByLabel("Email address").fill("invalid-email");
  await page.getByLabel("Phone number").fill("+962790000000");
  await page.getByRole("button", { name: "Request consultation" }).click();
  assert.equal(
    await page.locator("#email-error").textContent(),
    "Enter a valid email address.",
  );
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("checkbox").check();
  await page.route("**/api/bookings", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Temporary outage test. Please retry." }),
    }),
  );
  await page.getByRole("button", { name: "Request consultation" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Temporary outage" })
    .waitFor();
  assert.equal(
    await page.getByLabel("Full name").inputValue(),
    "Browser Homeowner",
  );
  await page.unroute("**/api/bookings");
  await page.getByRole("button", { name: "Request consultation" }).click();
  await page.getByRole("heading", { name: "A brighter next step." }).waitFor();
  assert.equal(
    (
      await db.query("SELECT count(*)::int AS n FROM leads WHERE email=$1", [
        email,
      ])
    ).rows[0].n,
    1,
  );
  console.log(
    "PASS: booking validation, failure preservation and PostgreSQL success",
  );
  await page.goto(base + "/contact");
  await page.getByLabel("Full name").fill("Browser Homeowner");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Phone number").fill("+962790000000");
  await page.getByLabel("Subject").fill("Hybrid consultation");
  await page
    .getByLabel("Your message")
    .fill("Please discuss a hybrid system for my home.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("heading", { name: "Message received." }).waitFor();
  console.log("PASS: contact form saves a real request");
  await page.goto(base + "/admin");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await page.getByRole("heading", { name: "A brighter pipeline." }).waitFor();
  await page.getByRole("textbox", { name: "Search requests" }).fill(email);
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "View", exact: true }).first().click();
  await page.getByLabel("Request status").selectOption("contacted");
  await page.getByLabel("Internal notes").fill("Browser flow verified.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Changes saved." })
    .waitFor();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
  console.log("PASS: admin login, request detail, status update and logout");
  await page.goto(base + "/projects");
  await page.getByRole("textbox", { name: "Search projects" }).fill("unlisted");
  await page.getByRole("button", { name: "Hybrid", exact: true }).click();
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.equal(
    await page.getByRole("textbox", { name: "Search projects" }).inputValue(),
    "",
  );
  console.log("PASS: project filters and clear state");
  const violations = [];
  for (const path of ["/", "/book", "/contact", "/admin"]) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    for (const v of results.violations)
      violations.push({
        path,
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      });
  }
  console.log("Accessibility findings:", JSON.stringify(violations));
  assert.equal(violations.length, 0, "Accessibility violations remain.");
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("PASS: no uncaught browser errors");
  await mkdir("/workspace/artifacts", { recursive: true });
  await page.goto(base);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "/workspace/artifacts/open-energy-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({
    path: "/workspace/artifacts/open-energy-mobile.png",
    fullPage: true,
  });
} catch (e) {
  await page.screenshot({
    path: "/workspace/artifacts/browser-failure.png",
    fullPage: true,
  });
  console.log(
    "Visible errors:",
    await page.locator(".error-banner,.field-error").allTextContents(),
  );
  throw e;
} finally {
  await browser.close();
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
