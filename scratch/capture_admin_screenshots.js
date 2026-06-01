/**
 * Admin screenshot capture - handles storefront modal-based login
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const BASE_URL = 'http://localhost:5176';
const ADMIN_EMAIL = 'admin@lomentra.com';
const ADMIN_PASSWORD = '1234566789123456789';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function captureScreenshot(page, filename) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`✓ Saved: ${filename}`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // Navigate to platform-admin
    console.log('🔐 Navigating to admin login...');
    await page.goto(`${BASE_URL}/platform-admin`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);
    await captureScreenshot(page, '34_admin_login_page.png');

    // The admin page shows a storefront with a login modal overlay
    // Try multiple selectors for email field inside modal
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
    ];

    let emailInput = null;
    for (const sel of emailSelectors) {
      try {
        emailInput = await page.waitForSelector(sel, { timeout: 3000 });
        if (emailInput) {
          console.log(`Found email input with selector: ${sel}`);
          break;
        }
      } catch (_) {}
    }

    if (!emailInput) {
      // Try to find and click any "Sign In" button to open modal
      console.log('Looking for Sign In button to open modal...');
      try {
        const signInBtns = await page.$$('button');
        for (const btn of signInBtns) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.toLowerCase().includes('sign in')) {
            await btn.click();
            await sleep(1500);
            console.log(`Clicked button with text: ${text}`);
            break;
          }
        }
        emailInput = await page.waitForSelector('input[type="email"]', { timeout: 4000 });
      } catch (e) {
        console.log('Could not find email input:', e.message);
      }
    }

    if (emailInput) {
      // Clear and fill email
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(ADMIN_EMAIL, { delay: 20 });

      // Fill password
      const pwInput = await page.$('input[type="password"]');
      if (pwInput) {
        await pwInput.click({ clickCount: 3 });
        await pwInput.type(ADMIN_PASSWORD, { delay: 20 });
      }

      // Submit
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        // Press Enter
        await page.keyboard.press('Enter');
      }

      await sleep(4000);
      await captureScreenshot(page, '35_admin_dashboard_after_login.png');

      // Wait for modal to close and dashboard to appear
      await sleep(2000);
      await captureScreenshot(page, '36_admin_platform_overview.png');

      // Try clicking Settlements tab
      try {
        const btns = await page.$$('button');
        for (const btn of btns) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.toLowerCase().includes('settlement')) {
            await btn.click();
            await sleep(1500);
            await captureScreenshot(page, '37_admin_settlements_tab.png');
            break;
          }
        }
      } catch (e) {
        console.log('Settlements tab not found');
      }

      // Try clicking Global Orders tab
      try {
        const btns = await page.$$('button');
        for (const btn of btns) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.toLowerCase().includes('global orders')) {
            await btn.click();
            await sleep(1500);
            await captureScreenshot(page, '38_admin_global_orders_tab.png');
            break;
          }
        }
      } catch (e) {
        console.log('Global Orders tab not found');
      }
    } else {
      console.log('⚠️ Could not find login form inputs');
      await captureScreenshot(page, '35_admin_page_fallback.png');
    }

    console.log('\n✅ Admin screenshots complete!');
  } catch (err) {
    console.error('Error:', err.message);
    await captureScreenshot(page, 'admin_error_state.png');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
