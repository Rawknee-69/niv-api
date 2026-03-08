import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { usersRouter } from './routes/users.js';
import { propertiesRouter } from './routes/properties.js';
import { ownerRouter } from './routes/owner.js';
import { studentRouter } from './routes/student.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://main.nivasya.pages.dev',
  /^https:\/\/[a-z0-9-]+\.nivasya\.pages\.dev$/,  // any Cloudflare Pages preview
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Serve static files from photos directory
app.use('/photos', express.static(path.join(process.cwd(), 'photos')));

// API routes
app.use('/api/users', usersRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/student', studentRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});

