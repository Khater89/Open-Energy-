import assert from "node:assert/strict";
import { chromium as playwright } from "../frontend/node_modules/playwright-core/index.mjs";
import chromium from "../frontend/node_modules/@sparticuz/chromium/build/index.js";
import AxeBuilder from "../frontend/node_modules/@axe-core/playwright/dist/index.mjs";
const base = process.env.INTEGRATION_BASE_URL || "http://localhost:3000";
const browser = await playwright.launch({
  headless: true,
  args: chromium.args.filter((a) => a !== "--disable-web-security"),
  executablePath: await chromium.executablePath(),
});
try {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/contact", { waitUntil: "networkidle" });
  for (const href of [
    "mailto:abdelrahman.khater.elc@gmail.com",
    "tel:+962790619770",
    "tel:+962790931706",
  ])
    assert.ok((await page.locator(`a[href="${href}"]`).count()) > 0);
  const trigger = page.getByRole("button", { name: "Chat on WhatsApp" });
  await trigger.click();
  const panel = page.getByRole("region", {
    name: "Contact Open Energy on WhatsApp",
  });
  await panel.waitFor();
  await page.waitForTimeout(350);
  const links = await panel
    .locator("a")
    .evaluateAll((items) => items.map((a) => a.href));
  assert.equal(links.length, 2);
  assert.ok(links[0].startsWith("https://wa.me/962790619770?"));
  assert.ok(links[1].startsWith("https://wa.me/962790931706?"));
  let a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  console.log(
    "WhatsApp/contact accessibility:",
    JSON.stringify(
      a11y.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ),
  );
  assert.equal(a11y.violations.length, 0);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#whatsapp-options").count(), 0);
  assert.equal(
    await trigger.evaluate((e) => e === document.activeElement),
    true,
  );
  await trigger.click();
  await page.getByRole("heading", { name: "Let’s make a connection." }).click();
  assert.equal(await page.locator("#whatsapp-options").count(), 0);
  console.log(
    "PASS: real email/phone links, both WhatsApp destinations, keyboard dismissal and outside-click dismissal",
  );
  await page.goto(base + "/projects", { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "View residential solar illustration" })
    .click();
  const modal = page.getByRole("dialog");
  await modal.waitFor();
  assert.match(await modal.innerText(), /AI-generated visual/);
  await page.keyboard.press("ArrowRight");
  assert.match(await modal.innerText(), /Big spaces/);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    assert.equal(
      await modal.evaluate((e) => e.contains(document.activeElement)),
      true,
    );
  }
  a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  console.log(
    "Lightbox accessibility:",
    JSON.stringify(
      a11y.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ),
  );
  assert.equal(a11y.violations.length, 0);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  console.log(
    "PASS: labeled image concepts, keyboard gallery navigation and modal focus containment",
  );
  await page.goto(base, { waitUntil: "networkidle" });
  const last = page.locator(".process-card").last();
  await last.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector(".process-card:last-child"))
        .opacity === "1",
  );
  assert.equal(await last.evaluate((e) => getComputedStyle(e).opacity), "1");
  assert.ok(
    Number(
      await page.evaluate(() =>
        document.documentElement.style.getPropertyValue("--reading-progress"),
      ),
    ) > 0,
  );
  console.log("PASS: scroll reveal and reading progress");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  assert.equal(await page.locator(".reveal-target").count(), 0);
  assert.equal(
    await page
      .locator(".reading-progress")
      .evaluate((e) => getComputedStyle(e).display),
    "none",
  );
  console.log(
    "PASS: reduced-motion preference removes decorative motion and hidden reveal states",
  );
  const noScript = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 360, height: 800 },
  });
  const staticPage = await noScript.newPage();
  await staticPage.goto(base, { waitUntil: "networkidle" });
  assert.equal(
    await staticPage
      .locator(".process-card")
      .last()
      .evaluate((e) => getComputedStyle(e).opacity),
    "1",
  );
  assert.equal(
    await staticPage.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  console.log("PASS: no-JavaScript content remains visible");

  assert.equal(errors.length, 0, errors.join("\n"));
} finally {
  await browser.close();
}
