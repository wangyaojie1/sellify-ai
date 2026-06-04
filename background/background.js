/**
 * Sellify AI - Background Service Worker
 * Handles: install, context menus, message passing, upgrade flow
 */

// --- Install ---
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set defaults
    chrome.storage.sync.set({
      apiKey: '',
      model: 'deepseek-v4-pro',
      queriesUsed: 0,
      queriesLimit: 5,
      plan: 'free',
      lastResetDate: new Date().toDateString()
    });

    // Open onboarding/options page
    chrome.runtime.openOptionsPage();
  }
});

// --- Daily Reset ---
function checkDailyReset() {
  const today = new Date().toDateString();
  chrome.storage.sync.get(['lastResetDate'], (result) => {
    if (result.lastResetDate !== today) {
      chrome.storage.sync.set({
        queriesUsed: 0,
        lastResetDate: today
      });
    }
  });
}

// Check on startup
chrome.runtime.onStartup.addListener(checkDailyReset);

// Also set up an alarm to check periodically
chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') checkDailyReset();
});

// --- Message Handlers ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_QUOTA':
      chrome.storage.sync.get(['queriesUsed', 'queriesLimit', 'plan', 'lastResetDate'], (data) => {
        sendResponse(data);
      });
      return true; // async

    case 'OPEN_OPTIONS':
      chrome.runtime.openOptionsPage();
      break;

    case 'OPEN_UPGRADE':
      chrome.storage.sync.get(['stripeLink'], (data) => {
        if (data.stripeLink) {
          chrome.tabs.create({ url: data.stripeLink });
        } else {
          // Default behavior - open options
          chrome.runtime.openOptionsPage();
        }
      });
      break;
  }
});

// --- Context Menu (right-click to analyze) ---
chrome.contextMenus.create({
  id: 'sellify-analyze',
  title: '🔍 Analyze with Sellify AI',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sellify-analyze' && info.selectionText) {
    // Store selected text and open popup
    chrome.storage.local.set({ contextText: info.selectionText }, () => {
      chrome.action.openPopup();
    });
  }
});
