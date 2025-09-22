
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Try to import the built server
const serverPath = join(__dirname, '../dist/index.js');

if (fs.existsSync(serverPath)) {
  try {
    const { default: createApp } = await import(serverPath);
    // If it's a function, call it, otherwise use it directly
    const serverApp = typeof createApp === 'function' ? createApp() : createApp;
    
    // Mount the server app
    app.use('/', serverApp);
  } catch (error) {
    console.error('Error loading server:', error);
    setupFallback(app);
  }
} else {
  console.log('Server build not found at:', serverPath);
  setupFallback(app);
}

function setupFallback(app) {
  // Serve static files from dist/public
  const publicPath = join(__dirname, '../dist/public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
  
  // API fallback
  app.get('/api/*', (req, res) => {
    res.status(503).json({ error: 'Server not built properly' });
  });
  
  // Serve index.html for all other routes
  app.get('*', (req, res) => {
    const indexPath = join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Application not built' });
    }
  });
}

export default app;
