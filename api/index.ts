import express from 'express';
import cors from 'cors';
import routes from '../server/routes.js';
import { initDatabase } from '../server/db.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure database is initialized
initDatabase();

// Mount routes at both /api and / to handle any rewrite variations
app.use('/api', routes);
app.use('/', routes);

export default app;
