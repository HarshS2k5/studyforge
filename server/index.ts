import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import routes from './routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize SQLite database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StudyForge Core API',
  });
});

import fs from 'fs';

// Serve frontend static files if built in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// For client-side routing SPA fallback
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile('index.html', { root: distPath });
  } else {
    res.status(200).send('StudyForge API is running. Start the Vite client dev server or run `npm run build` to serve client.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 StudyForge API Server listening on http://localhost:${PORT}`);
});
