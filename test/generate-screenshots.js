/**
 * Generate Chrome Web Store screenshots (1280x800)
 * Uses direct DOM manipulation to avoid chrome API dependency
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EXT_PATH = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'store', 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function switchTab(page, tabName) {
  return page.evaluate((name) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    const tab = document.querySelector(`.tab[data-tab="${name}"]`);
    const content = document.getElementById(`tab-${name}`);
    if (tab) tab.classList.add('active');
    if (content) content.style.display = 'block';
  }, tabName);
}

async function run() {
  console.log('📸 Generating Chrome Web Store screenshots...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const popupPath = `file:///${EXT_PATH.replace(/\\/g, '/')}/popup/popup.html`;

  // --- Screenshot 1: Main Popup - Optimize Tab (filled) ---
  console.log('1/5: Main Popup (Optimize Tab)...');
  await page.goto(popupPath, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Switch to optimize tab (should be default, but ensure)
  await switchTab(page, 'optimize');

  // Fill sample data via direct DOM
  await page.evaluate(() => {
    document.getElementById('optTitle').value = 'Premium Wireless Bluetooth Headphones - Active Noise Cancelling, 40H Battery, Hi-Fi Audio';
    document.getElementById('optDesc').value = '🎵 Premium Hi-Fi Audio with 40mm custom drivers\n🔇 Advanced ANC with 3 modes (Transport, Indoor, Outdoor)\n🔋 40 Hours Battery Life with USB-C quick charge\n👂 Memory Foam Ear Cups with protein leather coating\n🎤 ENC Microphones for crystal clear calls';
    document.getElementById('optCategory').value = 'Electronics > Headphones & Earbuds > Over-Ear Headphones';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '1-main-popup-optimize.png') });
  console.log('   ✅ 1-main-popup-optimize.png');

  // --- Screenshot 2: Review Analysis Tab (filled) ---
  console.log('2/5: Review Analysis Tab...');
  await switchTab(page, 'reviews');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.getElementById('reviewInput').value = '5.0 ★ Best headphones ever! Noise cancelling is incredible for the price.\n3.0 ★ Good sound but mic picks up background noise during calls.\n4.0 ★ Comfortable for all-day wear but ear cups get warm.\n2.0 ★ Battery life does NOT match claims. Getting 25h not 40h.\n5.0 ★ Perfect for travel! Blocked out engine noise on a 12-hour flight.';
    document.getElementById('reviewContext').value = 'Wireless Bluetooth Headphones';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '2-review-analysis.png') });
  console.log('   ✅ 2-review-analysis.png');

  // --- Screenshot 3: Keywords Tab (filled) ---
  console.log('3/5: Keyword Generator Tab...');
  await switchTab(page, 'keywords');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.getElementById('kwProduct').value = 'Premium wireless Bluetooth headphones, active noise cancelling, 40H battery life, hi-fi audio, memory foam ear cups, ideal for travel work gym';
    document.getElementById('kwPlatform').value = 'amazon';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '3-keyword-generator.png') });
  console.log('   ✅ 3-keyword-generator.png');

  // --- Screenshot 4: Marketing Tab (filled) ---
  console.log('4/5: Marketing Copy Tab...');
  await switchTab(page, 'marketing');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.getElementById('mktProduct').value = 'Premium wireless Bluetooth headphones with ANC, 40H battery, hi-fi audio';
    document.getElementById('mktAudience').value = 'Busy professionals and frequent travelers who want premium audio without the premium price tag';
    document.getElementById('mktPlatform').value = 'facebook';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '4-marketing-copy.png') });
  console.log('   ✅ 4-marketing-copy.png');

  // --- Screenshot 5: Options Page ---
  console.log('5/5: Options/Settings Page...');
  const optionsPath = `file:///${EXT_PATH.replace(/\\/g, '/')}/options/options.html`;
  await page.goto(optionsPath, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '5-settings-upgrade.png') });
  console.log('   ✅ 5-settings-upgrade.png');

  await browser.close();

  // List results
  console.log('\n📁 Screenshots generated:');
  fs.readdirSync(OUTPUT_DIR).forEach(f => {
    const stat = fs.statSync(path.join(OUTPUT_DIR, f));
    console.log(`   ${f} (${(stat.size/1024).toFixed(1)} KB)`);
  });
  console.log('\n✅ Done! Ready for Chrome Web Store.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
