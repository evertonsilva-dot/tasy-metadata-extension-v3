import * as api from './services/api.js';

// Setup
const defaultHosts = [
  'tasyprod.whebdc.com.br',
  'dev.tasy.whebdc.com.br',
  'localhost:3000'
];

chrome.runtime.onInstalled.addListener(details => {
  setupDefaults();
  registerRuntimeEvent(details);
});

function setupDefaults() {
  chrome.storage.local.get(['hosts'], result => {
    if (!result.hosts) {
      chrome.storage.local.set({ hosts: defaultHosts });
    }
  });
}

function registerRuntimeEvent(details) {
  chrome.storage.local.get(['userId'], async result => {
    api.getOrCreateUser(result.userId).then(user => {
      api.createEvent(user.id, details.reason);
      chrome.storage.local.set({ userId: user.id });
    }).catch(() => {});
  });
}

// Listeners
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'show_page_action') {
    chrome.action.enable(sender.tab.id);
  } else if (message === 'reloadOptions') {
    reloadOptions(sender.tab.id);
  } else if (message === 'reloadStylesheets') {
    reloadStylesheets(sender.tab.id);
  }
});

chrome.storage.onChanged.addListener(changes => {
  reloadOptions();
  saveChangesForStats(changes);
});

chrome.alarms.clearAll(() => {
  chrome.alarms.create('sendStats', {
    delayInMinutes: 1,
    periodInMinutes: 1
  });

  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'sendStats') sendStats();
  });
});

function saveChangesForStats(changes) {
  const ignoredKeys = ['userId', 'stats', 'recentFeatures', 'hosts'];
  const filteredKeys = Object.keys(changes).filter(key => !ignoredKeys.includes(key));

  if (filteredKeys.length === 0) return;

  const usefulChanges = filteredKeys.map((key) => {
    const { oldValue, newValue } = changes[key];
    return {
      option: key,
      newValue,
      oldValue
    };
  });

  chrome.storage.local.get({ stats: [] }, ({ stats }) => {
    chrome.storage.local.set({
      stats: [...usefulChanges, ...stats]
    });
  });
}

function sendStats() {
  chrome.storage.local.get({ userId: undefined, stats: [] }, ({ userId, stats }) => {
    if (stats.length === 0) return;

    api.getOrCreateUser(userId).then(user => {
      api.createOptions(user.id, stats).finally(() => {
        chrome.storage.local.set({ stats: [] });
      });
    }).catch(() => {});
  });
}

function reloadOptions(tabId) {
  chrome.storage.local.get(null, (options = {}) => {
    const message = JSON.stringify({
      eventType: 'setOptions',
      data: options
    });

    if (tabId) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (msg) => {
          window.postMessage(msg, '*');
        },
        args: [message]
      }).catch(err => console.error(err));
    }
  });
}

function reloadStylesheets(tabId) {
  if (tabId) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        var links = document.getElementsByTagName('link');
        for (var i = 0; i < links.length; i++) {
          var link = links[i];
          if (link.rel === 'stylesheet') {
            link.href += '?';
          }
        }
      }
    }).catch(err => console.error(err));
  }
}
