/**
 * Productivity Monkey Browser Extension - Background Service Worker
 * Tracks browser activity and communicates with native Electron app
 */

const TRACKING_INTERVAL = 5000; // 5 seconds - matches Electron app interval
const IDLE_THRESHOLD = 300; // 5 minutes in seconds
const APP_ID = 'com.prodmon.app'; // Native messaging host ID

// Activity state
let currentTab = null;
let currentUrl = null;
let currentTitle = null;
let tabStartTime = Date.now();
let keystrokeCount = 0;
let scrollCount = 0;
let clickCount = 0;
let lastActivityTime = Date.now();
let isTracking = true;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Productivity Monkey extension installed');
  initializeTracking();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Productivity Monkey extension started');
  initializeTracking();
});

async function initializeTracking() {
  // Load settings
  const settings = await chrome.storage.local.get(['isTracking', 'userId']);
  isTracking = settings.isTracking !== false; // Default to true

  // Auto-fetch userId from native app if not configured
  if (!settings.userId) {
    await fetchUserIdFromNativeApp();
  }

  // Start tracking interval
  setInterval(captureAndSendActivity, TRACKING_INTERVAL);

  // Check idle state periodically
  setInterval(checkIdleState, 10000);
}

async function fetchUserIdFromNativeApp() {
  try {
    const port = chrome.runtime.connectNative(APP_ID);

    port.postMessage({ type: 'get_config' });

    port.onMessage.addListener((response) => {
      if (response.success && response.userId) {
        chrome.storage.local.set({ userId: response.userId });
        console.log('Auto-configured userId from native app:', response.userId);
      }
    });

    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.log('Could not fetch userId from native app:', chrome.runtime.lastError.message);
        // Generate a local userId as fallback
        const localUserId = `user-${Date.now()}`;
        chrome.storage.local.set({ userId: localUserId });
        console.log('Generated local userId:', localUserId);
      }
    });
  } catch (error) {
    console.error('Error fetching userId:', error);
    // Generate a local userId as fallback
    const localUserId = `user-${Date.now()}`;
    chrome.storage.local.set({ userId: localUserId });
    console.log('Generated local userId:', localUserId);
  }
}

// Track tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateCurrentTab(activeInfo.tabId);
});

// Track URL changes within same tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    await updateCurrentTab(tabId);
  }
});

// Track window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    currentTab = null;
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (tab) {
    await updateCurrentTab(tab.id);
  }
});

// Track web navigation (more precise than tabs API)
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id === details.tabId) {
      await updateCurrentTab(details.tabId);
    }
  }
});

async function updateCurrentTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);

    // Record context switch if URL or title changed
    if (currentUrl !== tab.url || currentTitle !== tab.title) {
      // Send the previous session data before switching
      if (currentUrl) {
        await captureAndSendActivity();
      }

      currentTab = tab;
      currentUrl = tab.url;
      currentTitle = tab.title;
      tabStartTime = Date.now();

      // Reset activity counters
      keystrokeCount = 0;
      scrollCount = 0;
      clickCount = 0;
    }

    lastActivityTime = Date.now();
  } catch (error) {
    console.error('Error updating current tab:', error);
  }
}

// Listen for activity signals from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'activity') {
    lastActivityTime = Date.now();

    if (message.keystroke) keystrokeCount++;
    if (message.scroll) scrollCount++;
    if (message.click) clickCount++;
  } else if (message.type === 'media') {
    // Media playback detected
    if (currentTab && sender.tab.id === currentTab.id) {
      currentTab.mediaPlaying = message.playing;
      currentTab.mediaSource = message.source;
    }
  } else if (message.type === 'getStatus') {
    sendResponse({ isTracking, currentUrl, currentTitle });
  } else if (message.type === 'toggleTracking') {
    isTracking = !isTracking;
    chrome.storage.local.set({ isTracking });
    sendResponse({ isTracking });
  }

  return true;
});

async function checkIdleState() {
  const idleState = await chrome.idle.queryState(IDLE_THRESHOLD);

  if (idleState === 'idle' || idleState === 'locked') {
    currentTab = null;
    currentUrl = null;
    currentTitle = null;
  }
}

async function captureAndSendActivity() {
  if (!isTracking) return;

  const settings = await chrome.storage.local.get(['userId']);
  if (!settings.userId) {
    console.log('No userId configured, skipping activity capture');
    return;
  }

  const now = Date.now();
  const sessionDuration = now - tabStartTime;

  // Get current active tab if we don't have one
  if (!currentTab) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      currentTab = tab;
      currentUrl = tab.url;
      currentTitle = tab.title;
      tabStartTime = now;
    } else {
      return; // No active tab
    }
  }

  // Check if idle
  const timeSinceActivity = now - lastActivityTime;
  const isIdle = timeSinceActivity > (IDLE_THRESHOLD * 1000);

  // Build activity record
  const activityRecord = {
    userId: settings.userId,
    timestamp: now,
    url: currentUrl || '',
    title: currentTitle || '',
    domain: extractDomain(currentUrl),
    category: categorizeUrl(currentUrl, currentTitle),
    sessionDuration,
    keystrokeCount,
    scrollCount,
    clickCount,
    isIdle,
    mediaPlaying: currentTab.mediaPlaying || false,
    mediaSource: currentTab.mediaSource || null,
    favIconUrl: currentTab.favIconUrl || null
  };

  // Send to native app via native messaging
  await sendToNativeApp(activityRecord);

  // Also store locally as backup
  await storeActivityLocally(activityRecord);

  // Reset counters
  keystrokeCount = 0;
  scrollCount = 0;
  clickCount = 0;
}

async function sendToNativeApp(activityRecord) {
  try {
    // Native messaging to Electron app
    const port = chrome.runtime.connectNative(APP_ID);

    port.postMessage({
      type: 'browser_activity',
      data: activityRecord
    });

    port.onMessage.addListener((response) => {
      console.log('Response from native app:', response);
    });

    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.error('Native messaging error:', chrome.runtime.lastError.message);
        // Fallback: store locally if native app not available
      }
    });
  } catch (error) {
    console.error('Error sending to native app:', error);
    // Data is already stored locally as backup
  }
}

async function storeActivityLocally(activityRecord) {
  // Store in IndexedDB for backup and offline sync
  const activities = await chrome.storage.local.get(['activities']);
  const activityList = activities.activities || [];

  activityList.push(activityRecord);

  // Keep last 1000 records only
  if (activityList.length > 1000) {
    activityList.shift();
  }

  await chrome.storage.local.set({ activities: activityList });
}

function extractDomain(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

function categorizeUrl(url, title) {
  if (!url) return 'unknown';

  const lowerUrl = url.toLowerCase();
  const lowerTitle = title ? title.toLowerCase() : '';

  // Deep work sites
  const deepWorkPatterns = [
    'github.com', 'gitlab.com', 'bitbucket.org',
    'stackoverflow.com', 'stackexchange.com',
    'docs.microsoft.com', 'developer.mozilla.org', 'dev.to',
    'figma.com', 'miro.com', 'notion.so', 'obsidian.md',
    'codesandbox.io', 'replit.com', 'codepen.io',
    'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com',
    'jupyter.org', 'kaggle.com', 'databricks.com'
  ];

  // Shallow work / communication sites
  const shallowWorkPatterns = [
    'slack.com', 'teams.microsoft.com', 'discord.com',
    'mail.google.com', 'outlook.office.com', 'outlook.live.com',
    'calendar.google.com', 'zoom.us', 'meet.google.com',
    'asana.com', 'trello.com', 'monday.com', 'jira.atlassian.com',
    'linkedin.com/messaging', 'telegram.org'
  ];

  // Distraction sites
  const distractionPatterns = [
    'youtube.com', 'netflix.com', 'hulu.com', 'disneyplus.com',
    'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
    'reddit.com', 'tiktok.com', 'twitch.tv',
    'espn.com', 'cnn.com', 'bbc.com', 'news',
    'shopping', 'amazon.com/gp', 'ebay.com'
  ];

  // Learning / Research
  const learningPatterns = [
    'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org',
    'youtube.com/watch', // Can be learning if watching tutorials
    'medium.com', 'substack.com',
    'wikipedia.org', 'arxiv.org', 'scholar.google.com'
  ];

  for (const pattern of deepWorkPatterns) {
    if (lowerUrl.includes(pattern)) return 'deep';
  }

  for (const pattern of shallowWorkPatterns) {
    if (lowerUrl.includes(pattern)) return 'shallow';
  }

  for (const pattern of distractionPatterns) {
    if (lowerUrl.includes(pattern)) return 'distracted';
  }

  for (const pattern of learningPatterns) {
    if (lowerUrl.includes(pattern)) {
      // Check if it's actually learning content
      if (lowerTitle.includes('tutorial') || lowerTitle.includes('course') ||
          lowerTitle.includes('lesson') || lowerTitle.includes('documentation')) {
        return 'deep';
      }
      return 'admin';
    }
  }

  // Default to admin for unclassified sites
  return 'admin';
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    categorizeUrl,
    extractDomain
  };
}
