/**
 * Sellify AI - Popup UI Logic
 */

// --- State ---
let currentTab = 'optimize';
let currentPlatform = null;
let scrapedData = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await updateQuotaUI();
  await detectPlatform();
  setupTabs();
  setupButtons();
  checkUpgradeBanner();
});

// --- Platform Detection ---
async function detectPlatform() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url || '';

    const bar = document.getElementById('platformBar');
    const icon = document.getElementById('platformIcon');
    const name = document.getElementById('platformName');

    if (url.includes('amazon')) {
      currentPlatform = 'amazon';
      icon.textContent = '📦'; name.textContent = 'Amazon Listing Detected';
      bar.style.display = 'flex';
    } else if (url.includes('ebay')) {
      currentPlatform = 'ebay';
      icon.textContent = '🛒'; name.textContent = 'eBay Listing Detected';
      bar.style.display = 'flex';
    } else if (url.includes('etsy')) {
      currentPlatform = 'etsy';
      icon.textContent = '🎨'; name.textContent = 'Etsy Listing Detected';
      bar.style.display = 'flex';
    } else if (url.includes('aliexpress')) {
      currentPlatform = 'aliexpress';
      icon.textContent = '🌏'; name.textContent = 'AliExpress Listing Detected';
      bar.style.display = 'flex';
    }
  } catch (e) {
    // Not on a supported page
  }
}

// --- Tab Switching ---
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      currentTab = tab.dataset.tab;
    });
  });
}

// --- Button Wiring ---
function setupButtons() {
  document.getElementById('scrapeBtn')?.addEventListener('click', handleScrape);
  document.getElementById('optimizeBtn')?.addEventListener('click', handleOptimize);
  document.getElementById('analyzeReviewsBtn')?.addEventListener('click', handleReviewAnalysis);
  document.getElementById('keywordBtn')?.addEventListener('click', handleKeywords);
  document.getElementById('marketingBtn')?.addEventListener('click', handleMarketing);
  document.getElementById('upgradeBtn')?.addEventListener('click', handleUpgrade);
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  document.getElementById('openOptions')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

// --- Scrape Product ---
async function handleScrape() {
  showLoading(true);
  try {
    scrapedData = await SellifyAI.scrapeProductFromPage(currentPlatform);

    // Auto-fill the optimize tab
    document.getElementById('optTitle').value = scrapedData.title || '';
    document.getElementById('optDesc').value = [
      ...(scrapedData.bullets || []),
      scrapedData.description || ''
    ].filter(Boolean).join('\n');
    document.getElementById('optCategory').value = scrapedData.category || '';

    // Switch to optimize tab
    document.querySelector('.tab[data-tab="optimize"]').click();

    showToast('Product data scanned! ✓', 'success');
  } catch (e) {
    showToast('Failed to scan product: ' + e.message, 'error');
  }
  showLoading(false);
}

// --- Optimize Listing ---
async function handleOptimize() {
  const title = document.getElementById('optTitle').value.trim();
  const desc = document.getElementById('optDesc').value.trim();
  const category = document.getElementById('optCategory').value.trim();

  if (!title) { showToast('Please enter a product title', 'error'); return; }

  showLoading(true);
  try {
    const result = await SellifyAI.optimizeListing({
      title,
      description: desc,
      category,
      bullets: desc.split('\n').filter(l => l.trim()),
      price: scrapedData?.price || ''
    });

    const resultBox = document.getElementById('optimizeResult');
    resultBox.innerHTML = formatMarkdown(result);
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });
    showToast('Optimization complete! ✨', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
  showLoading(false);
}

// --- Analyze Reviews ---
async function handleReviewAnalysis() {
  const rawReviews = document.getElementById('reviewInput').value.trim();
  const context = document.getElementById('reviewContext').value.trim();

  if (!rawReviews) { showToast('Please paste some reviews', 'error'); return; }

  // Parse reviews - try to extract rating and body
  let reviews = [];
  const lines = rawReviews.split('\n').filter(l => l.trim());
  for (const line of lines) {
    // Try "Rating: Body" or "★ Body" format
    const match = line.match(/^(\d[.\d]?)\s*[★⭐]?\s*[:\-]?\s*(.+)/);
    if (match) {
      reviews.push({ rating: parseFloat(match[1]), body: match[2] });
    } else {
      reviews.push({ rating: 0, body: line });
    }
  }

  if (reviews.length === 0) { showToast('No reviews found to analyze', 'error'); return; }

  showLoading(true);
  try {
    const result = await SellifyAI.analyzeReviews(reviews, context);
    const resultBox = document.getElementById('reviewResult');
    resultBox.innerHTML = formatMarkdown(result);
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });
    showToast('Review analysis complete! 📊', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
  showLoading(false);
}

// --- Generate Keywords ---
async function handleKeywords() {
  const product = document.getElementById('kwProduct').value.trim();
  const platform = document.getElementById('kwPlatform').value;

  if (!product) { showToast('Please describe your product', 'error'); return; }

  showLoading(true);
  try {
    const result = await SellifyAI.generateKeywords({
      title: product,
      category: '',
      audience: '',
      features: '',
      price: ''
    }, platform);

    const resultBox = document.getElementById('keywordResult');
    resultBox.innerHTML = formatMarkdown(result);
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });
    showToast('Keywords generated! 🔑', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
  showLoading(false);
}

// --- Generate Marketing Copy ---
async function handleMarketing() {
  const product = document.getElementById('mktProduct').value.trim();
  const audience = document.getElementById('mktAudience').value.trim();
  const platform = document.getElementById('mktPlatform').value;

  if (!product) { showToast('Please describe your product', 'error'); return; }

  showLoading(true);
  try {
    const result = await SellifyAI.generateMarketingCopy({
      title: product,
      audience: audience,
      mainBenefit: '',
      painPoint: '',
      features: '',
      price: ''
    }, platform);

    const resultBox = document.getElementById('marketingResult');
    resultBox.innerHTML = formatMarkdown(result);
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });
    showToast('Marketing copy ready! 📝', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
  showLoading(false);
}

// --- Upgrade ---
async function handleUpgrade() {
  // Open Stripe payment link (to be configured)
  const settings = await SellifyAI.getSettings();
  if (settings.stripeLink) {
    chrome.tabs.create({ url: settings.stripeLink });
  } else {
    showToast('Payment system coming soon! Check back in a few days.', 'success');
  }
}

// --- Helpers ---

async function updateQuotaUI() {
  const settings = await SellifyAI.getSettings();
  const used = settings.queriesUsed;
  const limit = settings.plan === 'pro' ? Infinity : settings.queriesLimit;

  document.getElementById('quotaText').textContent =
    settings.plan === 'pro' ? `${used} queries (Unlimited)` : `${used}/${limit} queries today`;

  const pct = settings.plan === 'pro' ? 0 : Math.min(100, (used / limit) * 100);
  const fill = document.getElementById('quotaFill');
  fill.style.width = pct + '%';
  fill.className = 'quota-fill' + (pct >= 80 ? ' danger' : pct >= 60 ? ' warning' : '');

  // Plan badge
  const badge = document.getElementById('planBadge');
  badge.textContent = settings.plan === 'pro' ? 'PRO' : 'FREE';
  badge.className = 'badge ' + (settings.plan === 'pro' ? 'badge-pro' : 'badge-free');
}

function checkUpgradeBanner() {
  SellifyAI.getSettings().then(s => {
    document.getElementById('upgradeBanner').style.display =
      s.plan === 'free' ? 'flex' : 'none';
  });
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type + ' show';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Simple markdown to HTML formatter
function formatMarkdown(md) {
  if (!md) return '';
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^[-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}
