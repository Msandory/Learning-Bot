import { chromium, Browser, BrowserContext, Page } from "playwright";
import { config, loginUrl } from "./config";
import { logger } from "./logger";

/**
 * The login page is a JavaScript-rendered SPA (confirmed by fetching it —
 * the server-rendered HTML is just a "please enable JavaScript" shell), so
 * there's no way to know the real form field selectors without opening it
 * in an actual browser. These are reasonable first guesses based on common
 * patterns; if login fails, run:
 *
 *   npx playwright codegen https://pack-n-stack.znanja.com/login
 *
 * Playwright will open a real browser, and every field/button you interact
 * with gets printed as a working selector in the codegen panel. Copy the
 * real ones in here. Keeping them in one object (instead of scattered
 * through the function) means that's the only place you'll need to edit.
 */
const SELECTORS = {
  email: "#login-email",
  password: "#login-password",
  submit: 'button[type="submit"]',
  // Unverified — this comes from a page you can only see once logged in,
  // which we don't have. Confirm this once you can inspect the post-login
  // page (e.g. via `npx playwright codegen`).
  loggedInIndicator: 'text=/courses/i',
};

export interface Session {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

/**
 * Logs into the PnS Znanja LMS with the account credentials from .env.
 * Returns the live Playwright browser/context/page so later steps (course
 * discovery, TOC fetching, navigation) can keep using the same
 * authenticated session instead of logging in again.
 */
export async function loginToPns(): Promise<Session> {
  logger.info("Logging into PnS...");

  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(loginUrl, { waitUntil: "networkidle" });

  await page.fill(SELECTORS.email, config.email);
  await page.fill(SELECTORS.password, config.password);

  // Submit and wait for one of: navigation away from /login, or a visible
  // error. Racing these (instead of just waiting a fixed number of seconds)
  // makes the check both faster on success and accurate on failure.
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 25000 }).catch(() => null),
    page.click(SELECTORS.submit),
  ]);
console.log('[INFO] Submitting credentials...');
  const stillOnLogin = page.url().includes("/login");

  if (stillOnLogin) {
    await browser.close();
    throw new Error(
      "Login appears to have failed — still on the login page after submitting. " +
        "Check PNS_EMAIL/PNS_PASSWORD in .env, and verify the selectors in auth/login.ts " +
        "match the real form (use `npx playwright codegen` against the login URL)."
    );
  }

  logger.info("Login successful.");
  return { browser, context, page };
}

/**
 * Standalone entry point for Step 2: run `npm run login-check` to just
 * verify the login flow works, without any of the later course logic.
 */
async function main() {
  let session: Session | undefined;
  try {
    session = await loginToPns();
    logger.info(`Landed on: ${session.page.url()}`);
    logger.info("Login check passed. Leaving the browser open for 10s so you can eyeball the page...");
    await session.page.waitForTimeout(15000);
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    if (session) {
      await session.browser.close();
    }
  }
}

if (require.main === module) {
  main();
}
