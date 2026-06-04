/**
 * Sellify AI — Popup Logic (Premium Edition)
 */

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
    const label = document.getElementById('platformLabel');

    if (url.includes('amazon')) {
      currentPlatform = 'amazon';
      label.textContent = 'Amazon Listing Detected';
      bar.style.display = 'flex';
    } else if (url.includes('ebay')) {
      currentPlatform = 'ebay';
      label.textContent = 'eBay Listing Detected';
      bar.style.display = 'flex';
    } else if (url.includes('etsy')) {
      currentPlatform = 'etsy';
      label.textContent = 'Etsy Listing Detected';
      bar.style.display = 'flex';
    } else if (url.includes('aliexpress')) {
      currentPlatform = 'aliexpress';
      label.textContent = 'AliExpress Listing Detected';
      bar.style.display = 'flex';
    }
  } catch(e) {}
}

// --- Tab Switching ---
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// --- Buttons ---
function setupButtons() {
  document.getElementById('scrapeBtn')?.addEventListener('click', handleScrape);
  document.getElementById('optimizeBtn')?.addEventListener('click', handleOptimize);
  document.getElementById('analyzeReviewsBtn')?.addEventListener('click', handleReviewAnalysis);
  document.getElementById('keywordBtn')?.addEventListener('click', handleKeywords);
  document.getElementById('marketingBtn')?.addEventListener('click', handleMarketing);
  document.getElementById('upgradeBtn')?.addEventListener('click', handleUpgrade);
  document.getElementById('settingsBtn')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
  document.getElementById('openOptions')?.addEventListener('click', (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
}

// --- Scrape ---
async function handleScrape() {
  showLoading('loading', true);
  try {
    scrapedData = await SellifyAI.scrapeProductFromPage(currentPlatform);
    document.getElementById('optTitle').value = scrapedData.title || '';
    document.getElementById('optDesc').value = [...(scrapedData.bullets || []), scrapedData.description || ''].filter(Boolean).join('\n');
    document.getElementById('optCategory').value = scrapedData.category || '';
    document.querySelector('.tab[data-tab="optimize"]').click();
    toast('Product data loaded!', 'ok');
  } catch(e) { toast(e.message, 'err'); }
  showLoading('loading', false);
}

// --- Optimize ---
async function handleOptimize() {
  const title = document.getElementById('optTitle').value.trim();
  const desc = document.getElementById('optDesc').value.trim();
  const category = document.getElementById('optCategory').value.trim();
  if (!title) { toast('Please enter a product title', 'err'); return; }

  showLoading('loading', true);
  document.getElementById('optimizeBtn').disabled = true;
  document.getElementById('optimizeBtn').textContent = 'Analyzing...';

  try {
    const result = await SellifyAI.optimizeListing({
      title, description: desc, category,
      bullets: desc.split('\n').filter(l => l.trim()),
      price: scrapedData?.price || ''
    });

    document.getElementById('optimizeResultBody').innerHTML = formatMarkdown(result);
    document.getElementById('optimizeResult').style.display = 'block';
    document.getElementById('optimizeResult').scrollIntoView({ behavior: 'smooth' });
    toast('Optimization complete!', 'ok');
  } catch(e) { toast(e.message, 'err'); }

  showLoading('loading', false);
  document.getElementById('optimizeBtn').disabled = false;
  document.getElementById('optimizeBtn').textContent = 'Analyze & Optimize Listing';
}

// --- Review Analysis ---
async function handleReviewAnalysis() {
  const raw = document.getElementById('reviewInput').value.trim();
  const ctx = document.getElementById('reviewContext').value.trim();
  if (!raw) { toast('Please paste some reviews', 'err'); return; }

  const reviews = raw.split('\n').filter(l => l.trim()).map(line => {
    const m = line.match(/^(\d[.\d]?)\s*[★⭐]?\s*[:\-]?\s*(.+)/);
    return m ? { rating: parseFloat(m[1]), body: m[2] } : { rating: 0, body: line };
  });

  showLoading('loadingReviews', true);
  try {
    const result = await SellifyAI.analyzeReviews(reviews, ctx);
    document.getElementById('reviewResultBody').innerHTML = formatMarkdown(result);
    document.getElementById('reviewResult').style.display = 'block';
    document.getElementById('reviewResult').scrollIntoView({ behavior: 'smooth' });
    toast('Review analysis complete!', 'ok');
  } catch(e) { toast(e.message, 'err'); }
  showLoading('loadingReviews', false);
}

// --- Keywords ---
async function handleKeywords() {
  const product = document.getElementById('kwProduct').value.trim();
  const platform = document.getElementById('kwPlatform').value;
  if (!product) { toast('Please describe your product', 'err'); return; }

  showLoading('loadingKeywords', true);
  try {
    const result = await SellifyAI.generateKeywords({ title: product, category: '', audience: '', features: '', price: '' }, platform);
    document.getElementById('keywordResultBody').innerHTML = formatMarkdown(result);
    document.getElementById('keywordResult').style.display = 'block';
    document.getElementById('keywordResult').scrollIntoView({ behavior: 'smooth' });
    toast('Keywords generated!', 'ok');
  } catch(e) { toast(e.message, 'err'); }
  showLoading('loadingKeywords', false);
}

// --- Marketing ---
async function handleMarketing() {
  const product = document.getElementById('mktProduct').value.trim();
  const audience = document.getElementById('mktAudience').value.trim();
  const platform = document.getElementById('mktPlatform').value;
  if (!product) { toast('Please describe your product', 'err'); return; }

  showLoading('loadingMarketing', true);
  try {
    const result = await SellifyAI.generateMarketingCopy({ title: product, audience, mainBenefit: '', painPoint: '', features: '', price: '' }, platform);
    document.getElementById('marketingResultBody').innerHTML = formatMarkdown(result);
    document.getElementById('marketingResult').style.display = 'block';
    document.getElementById('marketingResult').scrollIntoView({ behavior: 'smooth' });
    toast('Marketing copy ready!', 'ok');
  } catch(e) { toast(e.message, 'err'); }
  showLoading('loadingMarketing', false);
}

// --- Upgrade ---
async function handleUpgrade() {
  chrome.tabs.create({ url: 'https://github.com/wangyaojie1/sellify-ai/releases' });
}

// --- Helpers ---
async function updateQuotaUI() {
  const s = await SellifyAI.getSettings();
  document.getElementById('quotaText').textContent = s.plan === 'pro'
    ? 'Unlimited'
    : s.queriesUsed + '/' + s.queriesLimit;

  const pct = s.plan === 'pro' ? 0 : Math.min(100, (s.queriesUsed / s.queriesLimit) * 100);
  const fill = document.getElementById('quotaFill');
  fill.style.width = pct + '%';
  fill.className = 'quota-fill' + (pct >= 80 ? ' danger' : pct >= 60 ? ' warn' : '');

  const pill = document.getElementById('planPill');
  pill.textContent = s.plan === 'pro' ? 'PRO' : 'FREE';
  pill.className = 'pill ' + (s.plan === 'pro' ? 'pill-pro' : 'pill-free');
}

function checkUpgradeBanner() {
  SellifyAI.getSettings().then(s => {
    document.getElementById('upgradeBanner').style.display = s.plan === 'free' ? 'flex' : 'none';
  });
}

function showLoading(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? 'block' : 'none';
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type + ' show';
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

function formatMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
}
