// Popup UI controller
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const toggleButton = document.getElementById('toggleButton');
const currentActivity = document.getElementById('currentActivity');
const currentTitle = document.getElementById('currentTitle');
const currentUrl = document.getElementById('currentUrl');

// Load current status
async function loadStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'getStatus' });

    if (response.isTracking) {
      statusIndicator.className = 'indicator active';
      statusText.textContent = 'Tracking';
      toggleButton.textContent = 'Pause Tracking';

      if (response.currentTitle && response.currentUrl) {
        currentActivity.style.display = 'block';
        currentTitle.textContent = response.currentTitle;
        currentUrl.textContent = response.currentUrl;
      }
    } else {
      statusIndicator.className = 'indicator inactive';
      statusText.textContent = 'Paused';
      toggleButton.textContent = 'Resume Tracking';
      currentActivity.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading status:', error);
    statusText.textContent = 'Error';
    toggleButton.textContent = 'Retry';
  }
}

// Toggle tracking
toggleButton.addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'toggleTracking' });
    await loadStatus();
  } catch (error) {
    console.error('Error toggling tracking:', error);
  }
});

// Run diagnostics
async function runDiagnostics() {
  const diagnosticsContainer = document.getElementById('diagnostics');
  const diagnostics = {
    userId: { status: 'error', message: 'Not configured' },
    nativeMessaging: { status: 'error', message: 'Not connected' },
    tracking: { status: 'error', message: 'Not active' },
    localStorage: { status: 'error', message: 'No records' }
  };

  try {
    // Check if userId is configured
    const settings = await chrome.storage.local.get(['userId']);
    if (settings.userId) {
      diagnostics.userId = {
        status: 'ok',
        message: `User ID: ${settings.userId.substring(0, 12)}...`
      };
    } else {
      diagnostics.userId = {
        status: 'error',
        message: 'User ID not configured in extension'
      };
    }

    // Check local storage for backed up activities
    const activities = await chrome.storage.local.get(['activities']);
    const activityCount = activities.activities?.length || 0;
    if (activityCount > 0) {
      diagnostics.localStorage = {
        status: 'ok',
        message: `${activityCount} activities cached locally`
      };
    } else {
      diagnostics.localStorage = {
        status: 'warning',
        message: 'No local activity cache yet'
      };
    }

    // Test native messaging connection
    try {
      const port = chrome.runtime.connectNative('com.prodmon.app');
      let connected = false;
      let disconnectError = null;

      port.postMessage({ type: 'ping' });

      port.onMessage.addListener((response) => {
        if (response.pong) {
          connected = true;
          diagnostics.nativeMessaging = {
            status: 'ok',
            message: `Connected (v${response.version || '1.0.0'})`
          };
        }
      });

      port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
          disconnectError = chrome.runtime.lastError.message;
          diagnostics.nativeMessaging = {
            status: 'error',
            message: `Failed: ${disconnectError.substring(0, 30)}...`
          };
        } else if (!connected) {
          diagnostics.nativeMessaging = {
            status: 'warning',
            message: 'Connected but no response'
          };
        }
        updateDiagnosticsUI(diagnostics);
      });

      // Give it 1 second to respond
      setTimeout(() => {
        if (!connected && !disconnectError) {
          diagnostics.nativeMessaging = {
            status: 'warning',
            message: 'Timeout waiting for response'
          };
        }
        updateDiagnosticsUI(diagnostics);
      }, 1000);

    } catch (error) {
      diagnostics.nativeMessaging = {
        status: 'error',
        message: `Error: ${error.message || 'Unknown'}`
      };
    }

    // Check tracking status
    const trackingStatus = await chrome.runtime.sendMessage({ type: 'getStatus' });
    if (trackingStatus.isTracking) {
      diagnostics.tracking = {
        status: 'ok',
        message: 'Extension is tracking'
      };
    } else {
      diagnostics.tracking = {
        status: 'warning',
        message: 'Tracking is paused'
      };
    }

  } catch (error) {
    console.error('Diagnostics error:', error);
  }

  // Initial UI update (will be updated again after native messaging test)
  updateDiagnosticsUI(diagnostics);
}

function updateDiagnosticsUI(diagnostics) {
  const container = document.getElementById('diagnostics');
  container.innerHTML = '';

  const checks = [
    { label: 'User Config', data: diagnostics.userId },
    { label: 'Tracking', data: diagnostics.tracking },
    { label: 'Native App', data: diagnostics.nativeMessaging },
    { label: 'Local Cache', data: diagnostics.localStorage }
  ];

  checks.forEach(check => {
    const item = document.createElement('div');
    item.className = 'diagnostic-item';

    let icon = '✗';
    if (check.data.status === 'ok') icon = '✓';
    else if (check.data.status === 'warning') icon = '!';

    item.innerHTML = `
      <span class="label">${check.label}: ${check.data.message}</span>
      <span class="diag-icon">${icon}</span>
    `;
    container.appendChild(item);
  });
}

// Load status on popup open
loadStatus();
runDiagnostics();

// Refresh status every 2 seconds while popup is open
setInterval(loadStatus, 2000);
