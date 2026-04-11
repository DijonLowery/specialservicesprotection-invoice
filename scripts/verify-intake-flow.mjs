import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5175";

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
});
const page = await context.newPage();
const errors = [];

page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await page.evaluate(() => window.localStorage.clear());
await page.reload({ waitUntil: "networkidle" });

await page.getByLabel("Username").fill("DLowery5");
await page.getByLabel("Password").fill("Demarcus0614");
await page.getByRole("button", { name: /Enter Dashboard/i }).click();
await page.waitForLoadState("networkidle");
await page.getByRole("button", { name: "Associates" }).click();

await page.getByLabel("Name").fill("Alex Jordan");
await page.getByLabel("Email").fill("alex.jordan@example.com");
await page.getByLabel("City").fill("Atlanta");
await page.getByLabel("Role").fill("Event Officer");

const popupPromise = context.waitForEvent("page").catch(() => null);
await page.getByRole("button", { name: /Send Profile Invite/i }).click();
const popup = await Promise.race([
  popupPromise,
  new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
]);
if (popup) {
  await popup.close().catch(() => {});
}

await page.waitForTimeout(500);
const inviteText = await page.locator("body").innerText();
const escapedBaseUrl = BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const inviteMatch = inviteText.match(new RegExp(`${escapedBaseUrl}/login\\?invite=LINK-\\d+`));
if (!inviteMatch) {
  throw new Error("Invite URL not found after sending associate invite.");
}

const inviteUrl = inviteMatch[0];
await page.goto(inviteUrl, { waitUntil: "networkidle" });

await page.getByLabel("Phone").fill("(404) 555-0199");
await page.getByLabel("Certifications").fill("Event Security, Crowd Control");
await page.getByLabel("Preferred Roles").fill("Crowd Control, Event Security");
await page.getByLabel("Availability").fill("Fri 18:00-02:00\nSat 12:00-22:00");
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: /Submit Profile/i }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);

const profileHeading = await page.getByRole("heading", { name: "My Profile" }).count();
const associateName = await page.getByText("Alex Jordan").count();

await page.screenshot({
  path: "/tmp/specialservicesprotection-intake-flow.png",
  fullPage: true,
});

console.log(
  JSON.stringify(
    {
      inviteUrl,
      profileHeading,
      associateName,
      errors,
      screenshot: "/tmp/specialservicesprotection-intake-flow.png",
    },
    null,
    2
  )
);

await browser.close();
