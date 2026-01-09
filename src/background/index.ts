// Background service worker
console.log('React Component Cloner: Background service worker initialized');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('React Component Cloner: Extension installed');
    // Set default settings
    chrome.storage.sync.set({
      settings: {
        codeStyle: 'typescript',
        styleStrategy: 'css-module',
        autoFormat: true,
        includeComments: true
      }
    });
  } else if (details.reason === 'update') {
    console.log('React Component Cloner: Extension updated');
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-inspector') {
    // Get the active tab and send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_INSPECTOR_FROM_COMMAND'
        });
      }
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SETTINGS') {
    chrome.storage.sync.get('settings', (data) => {
      sendResponse({ settings: data.settings });
    });
    return true;
  }

  if (request.type === 'UPDATE_SETTINGS') {
    chrome.storage.sync.set({ settings: request.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === 'STORE_COMPONENT') {
    // Store extracted component in history
    chrome.storage.local.get('history', (data) => {
      const history = data.history || [];
      history.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        component: request.component,
        url: sender.tab?.url || ''
      });

      // Keep only last 50 items
      const trimmedHistory = history.slice(0, 50);

      chrome.storage.local.set({ history: trimmedHistory }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.type === 'GET_HISTORY') {
    chrome.storage.local.get('history', (data) => {
      sendResponse({ history: data.history || [] });
    });
    return true;
  }

  return false;
});

// Context menu (future enhancement)
// chrome.contextMenus.create({
//   id: 'clone-component',
//   title: 'Clone React Component',
//   contexts: ['all']
// });
