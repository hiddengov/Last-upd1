import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from 'path';
import { spawn } from 'child_process';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();

// Configure CORS to allow requests from all origins (including other hosted apps)
app.use(cors({
  origin: true, // Allow all origins
  credentials: true, // Allow credentials to be included
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false, limit: '500mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);

    // Add SPA fallback for development mode
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      // Let Vite handle SPA routing in development
      next();
    });
  } else {
    serveStatic(app);
  }

  // Start Discord bot only if token is available
  const discordToken = process.env.DISCORD_BOT_TOKEN;
  if (discordToken) {
    console.log('🚀 Starting Discord bot...');
    console.log('✅ Discord token found in environment, starting bot...');

    const botProcess = spawn('node', ['discord-bot/bot.js'], {
      stdio: ['inherit', 'inherit', 'inherit'],
      env: {
        ...process.env,
        DISCORD_BOT_TOKEN: discordToken,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    botProcess.on('error', (error) => {
      console.error('❌ Failed to start Discord bot:', error);
    });

    botProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`❌ Discord bot exited with code ${code} and signal ${signal}`);
      }
    });
  } else {
    console.log('⚠️ Discord bot token not found - skipping Discord bot startup');
    console.log('Add DISCORD_BOT_TOKEN to Secrets to enable Discord bot functionality');
  }

  // Create dev account if it doesn't exist
  const existingDev = await storage.getUserByUsername('.GOVdev');
  if (!existingDev) {
    console.log('🔧 Creating dev account...');
    try {
      const devUser = await storage.createUser({
        username: '.GOVdev',
        password: 'devpassword123',
        accountType: 'developer'
      });

      // Create unlimited access key for .GOVdev
      await storage.createAccessKey({
        key: '.GOVdev',
        usageLimit: 999999,
        isActive: true,
        createdBy: devUser.id
        // No expirationDays = unlimited
      });

      // Create access key for extension creators
      await storage.createAccessKey({
        key: 'extension-creator-2024',
        usageLimit: 500,
        isActive: true,
        createdBy: devUser.id
        // No expirationDays = unlimited for extension creators
      });

      console.log('✅ Dev account and access keys created successfully');
    } catch (error) {
      console.error('❌ Failed to create dev account:', error);
    }
  } else {
    console.log('✅ Dev account already exists with username:', existingDev.username);

    // Ensure access keys exist
    try {
      const exnlKey = await storage.getAccessKey('.GOVdev');
      if (!exnlKey) {
        await storage.createAccessKey({
          key: '.GOVdev',
          usageLimit: 999999,
          isActive: true,
          createdBy: existingDev.id
        });
        console.log('✅ Created unlimited access key for .GOVdev');
      }

      const extensionKey = await storage.getAccessKey('extension-creator-2024');
      if (!extensionKey) {
        await storage.createAccessKey({
          key: 'extension-creator-2024',
          usageLimit: 500,
          isActive: true,
          createdBy: existingDev.id
        });
        console.log('✅ Created access key for extension creators');
      }
    } catch (error) {
      console.error('❌ Failed to create access keys:', error);
    }
  }

  // Dashboard name is already set in the sidebar component, no need to override app.get

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();