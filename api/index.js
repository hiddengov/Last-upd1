
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import your server code
const serverPath = join(__dirname, '../dist/index.js');

let app;

if (fs.existsSync(serverPath)) {
  // Load the built server
  const { default: createApp } = await import(serverPath);
  app = createApp;
} else {
  // Fallback minimal server
  app = express();
  app.get('/', (req, res) => {
    res.json({ error: 'Server not built properly' });
  });
}

export default app;
