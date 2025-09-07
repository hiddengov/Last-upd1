import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIpLogSchema } from "@shared/schema";
import path from "path";
import fs from "fs";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve the decoy image and log the request
  app.get('/image.jpg', async (req: Request, res: Response) => {
    try {
      const clientIp = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const referrerHeader = req.headers.referer || req.headers.referrer;
      const referrer = Array.isArray(referrerHeader) ? referrerHeader[0] : referrerHeader || '';
      const location = getLocationFromIp(clientIp);

      // Log the IP access
      await storage.createIpLog({
        ipAddress: clientIp,
        userAgent,
        referrer,
        location,
        status: 'success'
      });

      // Serve a 1x1 transparent pixel as the decoy image
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

  const httpServer = createServer(app);
  return httpServer;
}
