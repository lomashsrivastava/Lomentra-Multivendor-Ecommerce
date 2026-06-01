/**
 * Screenshot capture script for Lomentra Multi-Vendor Platform
 * Uses puppeteer-core with system-installed Chrome
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
  return filepath;
}

async function main() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // =============================================
    // STOREFRONT SCREENSHOTS
    // =============================================
    console.log('\n📸 Capturing storefront pages...');

    // Homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(2000);
    await captureScreenshot(page, '21_storefront_homepage.png');

    // Scroll down on homepage to show more sections
    await page.evaluate(() => window.scrollTo(0, 600));
    await sleep(800);
    await captureScreenshot(page, '22_storefront_homepage_deals.png');

    await page.evaluate(() => window.scrollTo(0, 1400));
    await sleep(800);
    await captureScreenshot(page, '23_storefront_homepage_categories.png');

    // Flash Deals
    await page.goto(`${BASE_URL}/flash-deals`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '24_flash_deals_page.png');

    // Best Sellers
    await page.goto(`${BASE_URL}/best-sellers`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '25_best_sellers_page.png');

    // Summer Sale
    await page.goto(`${BASE_URL}/summer-sale`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '26_summer_sale_page.png');

    // Top Brands
    await page.goto(`${BASE_URL}/top-brands`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '27_top_brands_page.png');

    // New Arrivals
    await page.goto(`${BASE_URL}/new-arrivals`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '28_new_arrivals_page.png');

    // Categories
    await page.goto(`${BASE_URL}/categories`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '29_categories_page.png');

    // Coupons (Spin Wheel)
    await page.goto(`${BASE_URL}/coupons`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(2000);
    await captureScreenshot(page, '30_coupons_spinwheel.png');

    // Wishlist
    await page.goto(`${BASE_URL}/wishlist`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '31_wishlist_page.png');

    // AI Assistant
    await page.goto(`${BASE_URL}/ai-assistant`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '32_ai_assistant_page.png');

    // =============================================
    // ADMIN DASHBOARD SCREENSHOTS
    // =============================================
    console.log('\n🔐 Logging into admin panel...');
    await page.goto(`${BASE_URL}/platform-admin`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);
    await captureScreenshot(page, '33_admin_login.png');

    // Fill login form
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.click('input[type="email"]', { clickCount: 3 });
      await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 30 });

      await page.click('input[type="password"]', { clickCount: 3 });
      await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 30 });

      await page.click('button[type="submit"]');
      await sleep(3000);
      await captureScreenshot(page, '34_admin_dashboard_overview.png');

      // Click Settlements tab
      const settlementsBtn = await page.$x("//button[contains(., 'Settlements')]");
      if (settlementsBtn.length > 0) {
        await settlementsBtn[0].click();
        await sleep(1500);
        await captureScreenshot(page, '35_admin_settlements.png');
      }

      // Click Global Orders tab
      const ordersBtn = await page.$x("//button[contains(., 'Global Orders')]");
      if (ordersBtn.length > 0) {
        await ordersBtn[0].click();
        await sleep(1500);
        await captureScreenshot(page, '36_admin_global_orders.png');
      }
    } catch (loginErr) {
      console.log('⚠️ Admin login form not found or error:', loginErr.message);
      await captureScreenshot(page, '33_admin_page_state.png');
    }

    // =============================================
    // VENDOR DASHBOARD SCREENSHOTS
    // =============================================
    console.log('\n🏪 Navigating to vendor dashboard...');
    await page.goto(`${BASE_URL}/vendor`, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(2000);
    await captureScreenshot(page, '37_vendor_dashboard.png');

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`📁 Saved to: ${SCREENSHOTS_DIR}`);

  } catch (err) {
    console.error('Error during capture:', err.message);
    await captureScreenshot(page, 'error_state.png');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
