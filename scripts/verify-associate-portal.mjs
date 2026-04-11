import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5175";

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 1200 },
});

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await page.evaluate(() => window.localStorage.clear());
await page.reload({ waitUntil: "networkidle" });

await page.getByLabel("Username").fill("marcus@example.com");
await page.getByLabel("Password").fill("Associate2026!");
await page.getByRole("button", { name: /Enter Dashboard/i }).click();
await page.waitForLoadState("networkidle");

const scheduleHeading = await page.getByRole("heading", { name: "My Schedule" }).count();
const upcomingHeading = await page.getByText("Upcoming Schedule").count();
const historyHeading = await page.getByText("Paycheck History").count();
const clockInButton = await page.getByRole("button", { name: "Clock In" }).count();

if (clockInButton) {
  await page.getByRole("button", { name: "Clock In" }).click();
  await page.waitForTimeout(300);
}

const clockOutButton = await page.getByRole("button", { name: "Clock Out" }).count();

if (clockOutButton) {
  await page.getByRole("button", { name: "Clock Out" }).click();
  await page.waitForTimeout(300);
}

const pendingSyncCount = await page.getByText("Pending Sync").count();

await page.screenshot({
  path: "/tmp/ssp-associate-portal.png",
  fullPage: true,
});

console.log(
  JSON.stringify(
    {
      scheduleHeading,
      upcomingHeading,
      historyHeading,
      clockInButton,
      clockOutButton,
      pendingSyncCount,
      errors,
      screenshot: "/tmp/ssp-associate-portal.png",
    },
    null,
    2
  )
);

await browser.close();
