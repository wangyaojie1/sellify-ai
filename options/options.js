/**
 * Sellify AI - Options Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadStats();
  setupButtons();
});

async function loadSettings() {
  const settings = await SellifyAI.getSettings();
  document.getElementById('apiKey').value = settings.apiKey || '';
  document.getElementById('modelSelect').value = settings.model || 'deepseek-v4-pro';
  document.getElementById('licenseKey').value = settings.licenseKey || '';
  updatePlanUI(settings.plan);
}

async function loadStats() {
  const settings = await SellifyAI.getSettings();
  document.getElementById('statQueries').textContent = settings.queriesUsed;
  document.getElementById('statPlan').textContent = settings.plan === 'pro' ? 'Pro' : 'Free';
}

function updatePlanUI(plan) {
  const freeCard = document.getElementById('planFree');
  const proCard = document.getElementById('planPro');

  if (plan === 'pro') {
    freeCard.querySelector('.btn-outline').textContent = 'Downgrade';
    freeCard.querySelector('.btn-outline').disabled = false;
    proCard.querySelector('.btn-gold').textContent = '✓ Current Plan';
    proCard.querySelector('.btn-gold').disabled = true;
  }
}

function setupButtons() {
  // Save settings
  document.getElementById('saveSettings').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value;

    await chrome.storage.sync.set({ apiKey, model });
    showToast('Settings saved! ✓', 'success');
  });

  // Test connection
  document.getElementById('testConnection').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
      showTestResult('Please enter an API key first.', 'error');
      return;
    }

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Reply with just "OK"' }]
        })
      });

      if (response.ok) {
        showTestResult('✅ Connection successful! API key is valid.', 'success');
      } else {
        const err = await response.json().catch(() => ({}));
        showTestResult('❌ API error: ' + (err.error?.message || response.statusText), 'error');
      }
    } catch (e) {
      showTestResult('❌ Connection failed: ' + e.message, 'error');
    }
  });

  // Toggle API key visibility
  document.getElementById('toggleKey').addEventListener('click', () => {
    const input = document.getElementById('apiKey');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Activate License
  document.getElementById('activateLicense').addEventListener('click', async () => {
    const licenseKey = document.getElementById('licenseKey').value.trim();
    if (!licenseKey) {
      showToast('Please enter a license key', 'error');
      return;
    }

    const statusEl = document.getElementById('licenseStatus');
    statusEl.textContent = 'Verifying...';
    statusEl.style.color = '#8b91a8';

    try {
      const settings = await SellifyAI.getSettings();
      const serverUrl = settings.licenseServer || 'https://sellify.ai';

      const response = await fetch(`${serverUrl}/verify-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });

      const data = await response.json();

      if (data.valid) {
        await chrome.storage.sync.set({ plan: 'pro', licenseKey });
        updatePlanUI('pro');
        statusEl.textContent = '✅ License activated! You are now on the Pro plan.';
        statusEl.style.color = '#10b981';
        showToast('🎉 Upgraded to Pro!', 'success');
        // Reload stats
        await loadStats();
      } else {
        statusEl.textContent = '❌ Invalid license key. Please check and try again.';
        statusEl.style.color = '#ef4444';
      }
    } catch (e) {
      // If server is not reachable, accept locally-formatted keys as fallback
      if (/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(licenseKey)) {
        await chrome.storage.sync.set({ plan: 'pro', licenseKey });
        updatePlanUI('pro');
        statusEl.textContent = '✅ License activated (offline mode)!';
        statusEl.style.color = '#10b981';
        showToast('🎉 Upgraded to Pro!', 'success');
        await loadStats();
      } else {
        statusEl.textContent = '⚠️ Cannot verify license. Check your connection.';
        statusEl.style.color = '#ef4444';
      }
    }
  });

  // Upgrade button
  document.getElementById('upgradeToPro').addEventListener('click', async () => {
    const settings = await SellifyAI.getSettings();
    if (settings.plan === 'pro') {
      showToast('You are already on the Pro plan!', 'success');
      return;
    }

    if (settings.stripeLink) {
      chrome.tabs.create({ url: settings.stripeLink });
    } else {
      showToast('Payment system coming soon! We will notify you when it\'s ready.', 'success');
    }
  });
}

function showTestResult(msg, type) {
  const el = document.getElementById('testResult');
  el.textContent = msg;
  el.className = 'test-result ' + type;
  el.style.display = 'block';
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
