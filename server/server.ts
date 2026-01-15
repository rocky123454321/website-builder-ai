// server.ts
import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import path from 'path';
import serverless from 'serverless-http';
import prisma from './prismaClient.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';

// Express app
const app = express();

// CORS - only allow frontend origin
app.use(cors({
  origin: process.env.TRUSTED_ORIGINS?.split(','),
  credentials: true
}));

// JSON parsing
app.use(express.json({ limit: '50mb' }));

// Better Auth
const authHandler = toNodeHandler(auth);
app.all('/api/auth/*any', async (req, res) => {
  try {
    await authHandler(req, res);
  } catch (error: any) {
    console.error('Better-auth error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        message: error?.message || 'Authentication error'
      });
    }
  }
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});

// Favicon support
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// API routes
app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: Function) => {
  if (!res.headersSent) {
    res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
});

// Export serverless handler
export const handler = serverless(app);
