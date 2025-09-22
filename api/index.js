
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  const serverPath = join(__dirname, '../dist/index.js');
  
  // Try to load built server
  if (fs.existsSync(serverPath)) {
    try {
      const { default: createApp } = await import(serverPath);
      const serverApp = typeof createApp === 'function' ? createApp() : createApp;
      
      // Use the server app to handle the request
      return new Promise((resolve) => {
        serverApp(req, res, () => {
          resolve();
        });
      });
    } catch (error) {
      console.error('Error loading server:', error);
    }
  }
  
  // Fallback handler
  const publicPath = join(__dirname, '../dist/public');
  
  // Handle API requests
  if (req.url.startsWith('/api/')) {
    return res.status(503).json({ error: 'Server not built properly' });
  }
  
  // Serve static files
  if (fs.existsSync(publicPath)) {
    const indexPath = join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(indexContent);
    }
  }
  
  return res.status(404).json({ error: 'Application not built' });
}
