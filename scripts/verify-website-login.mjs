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
  if (msg.type() === "error") {
    const text = msg.text();
    if (text.includes("Failed to load resource: the server responded with a status of 503")) {
      return;
    }
    errors.push(text);
  }
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
await page.evaluate(() => window.localStorage.clear());
await page.reload({ waitUntil: "networkidle" });

const heroHeading = await page.getByRole("heading", { name: /The Standard/i }).count();
const employeesLink = await page.locator("#nav").getByRole("link", { name: /Employees/i }).count();

await page.locator("#nav").getByRole("link", { name: /Employees/i }).click();
await page.waitForTimeout(300);
const loginUrl = page.url();
const loginHeading = await page.getByRole("heading", { name: /SSP Command/i }).count();
const usernameField = await page.getByLabel("Username").count();
const passwordField = await page.getByLabel("Password").count();
const rememberField = await page.getByLabel("Remember me").count();

await page.screenshot({
  path: "/tmp/ssp-login-page.png",
  fullPage: true,
});

await page.getByLabel("Username").fill("DLowery5");
await page.getByLabel("Password").fill("Demarcus0614");
await page.getByLabel("Remember me").check();
await page.getByRole("button", { name: /Enter Dashboard/i }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(300);

const dashboardUrl = page.url();
const dashboardHeading = await page.getByRole("heading", { name: /SSP Command Center/i }).count();

await page.getByRole("button", { name: /Payroll/i }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(300);
const payrollHeading = await page.getByRole("heading", { name: /Payroll \+ Paychex/i }).count();
const paychexConnection = await page.getByText("Paychex Connection").count();
const payrollClockIn = await page.getByRole("button", { name: /^Clock In$/i }).first();
await payrollClockIn.click();
await page.waitForTimeout(300);
const payrollClockOut = await page.getByRole("button", { name: /^Clock Out$/i }).first();
await payrollClockOut.click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /^Sync Paychex$/i }).click();
await page.waitForTimeout(300);
const paychexFailureNotice = await page.getByText(/Paychex credentials are not configured yet/i).count();

await page.screenshot({
  path: "/tmp/specialservicesprotection-dashboard.png",
  fullPage: true,
});

await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const rememberedUrl = page.url();
const rememberedHeading = await page.getByRole("heading", { name: /SSP Command Center/i }).count();

await page.getByRole("button", { name: /Sign Out/i }).click();
await page.waitForTimeout(300);
const signOutUrl = page.url();

await page.getByRole("button", { name: /Back to Website/i }).click();
await page.waitForTimeout(300);
const websiteUrl = page.url();
const websiteHeading = await page.getByRole("heading", { name: /The Standard in Protection/i }).count();

await page.screenshot({
  path: "/tmp/ssp-website-login-integration.png",
  fullPage: true,
});

console.log(
  JSON.stringify(
    {
      heroHeading,
      employeesLink,
      loginUrl,
      loginHeading,
      usernameField,
      passwordField,
      rememberField,
      dashboardUrl,
      dashboardHeading,
      payrollHeading,
      paychexConnection,
      paychexFailureNotice,
      rememberedUrl,
      rememberedHeading,
      signOutUrl,
      websiteUrl,
      websiteHeading,
      errors,
      loginScreenshot: "/tmp/ssp-login-page.png",
      dashboardScreenshot: "/tmp/specialservicesprotection-dashboard.png",
      screenshot: "/tmp/ssp-website-login-integration.png",
    },
    null,
    2
  )
);

await browser.close();
