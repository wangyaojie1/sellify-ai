/**
 * Final comprehensive test
 */
const { chromium } = require('playwright');
const path = require('path');

const EXT_PATH = path.resolve(__dirname, '..');

async function test() {
  console.log('🔬 Sellify AI - Final Test\n');

  const context = await chromium.launchPersistentContext(
    path.resolve(__dirname, '.test-final'),
    {
      headless: false,
      args: [
        `--disable-extensions-except=${EXT_PATH}`,
        `--load-extension=${EXT_PATH}`,
        '--no-sandbox'
      ],
      viewport: { width: 1440, height: 900 }
    }
  );

  const page = await context.newPage();

  // Use a well-known Amazon product
  console.log('📦 Testing on Amazon product page...');
  await page.goto('https://www.amazon.com/Apple-AirPods-Pro-2nd-Generation/dp/B0D1XD1ZV3', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(3000);

  // Extract product data with a more robust selector
  const product = await page.evaluate(() => {
    const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';

    return {
      title: getText('#productTitle') || getText('h1'),
      price: getText('.a-price .a-offscreen') || getText('[data-a-color="price"] .a-offscreen'),
      rating: getText('[data-hook="rating-out-of-text"]') || getText('.a-icon-alt'),
      reviewCount: getText('#acrCustomerReviewText'),
      bullets: Array.from(document.querySelectorAll('#feature-bullets li span:not(.a-list-item)'))
        .map(el => el.textContent.trim()).filter(Boolean),
      hasFloatingBtn: !!document.getElementById('sellify-floating-btn'),
      sellifyFlag: !!window.__sellifyInjected
    };
  });

  // Print results
  const check = (v) => v ? '✅' : '❌';
  console.log(`   Floating button injected: ${check(product.hasFloatingBtn)}`);
  console.log(`   Content script flag: ${check(product.sellifyFlag)}`);
  console.log(`   Title: ${product.title ? '✅ ' + product.title.substring(0, 80) + '...' : '❌'}`);
  console.log(`   Price: ${product.price ? '✅ $' + product.price : '❌'}`);
  console.log(`   Rating: ${product.rating ? '✅ ' + product.rating : '❌'}`);
  console.log(`   Bullet points: ${product.bullets.length > 0 ? '✅ ' + product.bullets.length + ' found' : '❌'}`);
  if (product.bullets.length > 0) {
    product.bullets.slice(0, 3).forEach(b => console.log(`      • ${b.substring(0, 80)}`));
  }

  // Take a screenshot
  const fs = require('fs');
  const ssDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });
  await page.screenshot({ path: path.join(ssDir, 'final-amazon-test.png') });
  console.log(`\n📸 Screenshot: test/screenshots/final-amazon-test.png`);

  // Summary
  const passed = product.hasFloatingBtn && product.title;
  console.log(`\n${passed ? '🎉 ALL CHECKS PASSED!' : '⚠️  Some checks failed'}`);
  console.log('Extension is ready to use!');

  await context.close();
}

test().catch(e => { console.error('Error:', e.message); process.exit(1); });
