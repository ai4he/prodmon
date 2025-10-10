/**
 * Content script - Runs on every webpage to detect user activity
 * Captures keystrokes, mouse events, scrolling, and media playback
 */

let activityTimeout = null;
const ACTIVITY_DEBOUNCE = 1000; // Send activity signals max once per second

// Track keystrokes
document.addEventListener('keydown', () => {
  sendActivitySignal({ keystroke: true });
}, { passive: true });

// Track mouse clicks
document.addEventListener('click', () => {
  sendActivitySignal({ click: true });
}, { passive: true });

// Track scrolling
document.addEventListener('scroll', () => {
  sendActivitySignal({ scroll: true });
}, { passive: true });

// Track mouse movement (throttled)
let lastMouseMove = 0;
document.addEventListener('mousemove', () => {
  const now = Date.now();
  if (now - lastMouseMove > 1000) { // Once per second max
    sendActivitySignal({ mouseMove: true });
    lastMouseMove = now;
  }
}, { passive: true });

function sendActivitySignal(activityType) {
  // Debounce activity signals to avoid overwhelming the background script
  if (activityTimeout) {
    clearTimeout(activityTimeout);
  }

  activityTimeout = setTimeout(() => {
    try {
      chrome.runtime.sendMessage({
        type: 'activity',
        ...activityType
      }, () => {
        // Check if extension context is invalidated
        if (chrome.runtime.lastError) {
          console.log('Extension context invalidated, content script needs reload');
        }
      });
    } catch (error) {
      // Extension context invalidated - do nothing
      console.log('Extension context invalidated');
    }
  }, 100);
}

// Detect media playback
function detectMediaPlayback() {
  const videoElements = document.querySelectorAll('video');
  const audioElements = document.querySelectorAll('audio');

  let isPlaying = false;
  let mediaSource = null;

  // Check video elements
  for (const video of videoElements) {
    if (!video.paused && !video.ended && video.currentTime > 0) {
      isPlaying = true;
      mediaSource = detectMediaSource();
      break;
    }
  }

  // Check audio elements if no video playing
  if (!isPlaying) {
    for (const audio of audioElements) {
      if (!audio.paused && !audio.ended && audio.currentTime > 0) {
        isPlaying = true;
        mediaSource = detectMediaSource();
        break;
      }
    }
  }

  try {
    chrome.runtime.sendMessage({
      type: 'media',
      playing: isPlaying,
      source: mediaSource
    }, () => {
      if (chrome.runtime.lastError) {
        // Extension context invalidated
      }
    });
  } catch (error) {
    // Extension context invalidated - ignore
  }
}

function detectMediaSource() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();

  if (url.includes('youtube.com')) return 'YouTube';
  if (url.includes('spotify.com')) return 'Spotify';
  if (url.includes('netflix.com')) return 'Netflix';
  if (url.includes('soundcloud.com')) return 'SoundCloud';
  if (url.includes('twitch.tv')) return 'Twitch';
  if (url.includes('vimeo.com')) return 'Vimeo';
  if (url.includes('apple.com/music')) return 'Apple Music';
  if (url.includes('music.amazon.com')) return 'Amazon Music';
  if (url.includes('tidal.com')) return 'Tidal';
  if (url.includes('pandora.com')) return 'Pandora';

  return 'Web Media';
}

// Check media playback every 10 seconds
setInterval(detectMediaPlayback, 10000);

// Detect specific web app activities
function detectSpecializedActivity() {
  const url = window.location.href;

  // Detect if user is in a code editor (GitHub, GitLab, etc.)
  if (url.includes('github.com') || url.includes('gitlab.com')) {
    const codeEditors = document.querySelectorAll('.CodeMirror, .monaco-editor, textarea[name="commit_message"]');
    if (codeEditors.length > 0) {
      try {
        chrome.runtime.sendMessage({
          type: 'specialized_activity',
          activity: 'coding',
          platform: url.includes('github.com') ? 'GitHub' : 'GitLab'
        }, () => { if (chrome.runtime.lastError) {} });
      } catch (error) {}
    }
  }

  // Detect Google Docs editing
  if (url.includes('docs.google.com')) {
    const editableContent = document.querySelectorAll('.kix-page, [contenteditable="true"]');
    if (editableContent.length > 0) {
      try {
        chrome.runtime.sendMessage({
          type: 'specialized_activity',
          activity: 'writing',
          platform: 'Google Docs'
        }, () => { if (chrome.runtime.lastError) {} });
      } catch (error) {}
    }
  }

  // Detect Figma/design work
  if (url.includes('figma.com')) {
    try {
      chrome.runtime.sendMessage({
        type: 'specialized_activity',
        activity: 'design',
        platform: 'Figma'
      }, () => { if (chrome.runtime.lastError) {} });
    } catch (error) {}
  }

  // Detect meeting platforms
  if (url.includes('zoom.us') || url.includes('meet.google.com') || url.includes('teams.microsoft.com')) {
    const videoElements = document.querySelectorAll('video');
    if (videoElements.length > 0) {
      try {
        chrome.runtime.sendMessage({
          type: 'specialized_activity',
          activity: 'meeting',
          platform: url.includes('zoom') ? 'Zoom' : url.includes('meet') ? 'Google Meet' : 'Teams'
        }, () => { if (chrome.runtime.lastError) {} });
      } catch (error) {}
    }
  }
}

// Check for specialized activities every 30 seconds
setInterval(detectSpecializedActivity, 30000);

// Detect focus/blur events
window.addEventListener('focus', () => {
  sendActivitySignal({ focus: true });
});

window.addEventListener('blur', () => {
  sendActivitySignal({ blur: true });
});

// Visibility change detection (tab switching)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    sendActivitySignal({ tabVisible: true });
  } else {
    sendActivitySignal({ tabHidden: true });
  }
});

console.log('Productivity Monkey content script loaded');
