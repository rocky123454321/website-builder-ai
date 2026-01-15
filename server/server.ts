import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import serverless from 'serverless-http';

const app = express();

// CORS
app.use(cors({
  origin: process.env.TRUSTED_ORIGINS?.split(','),
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Better Auth
const authHandler = toNodeHandler(auth);
app.all('/api/auth/*any', async (req, res) => {
  try {
    await authHandler(req, res);
  } catch (error: any) {
    console.error('Better-auth error:', error);
    res.status(500).json({ message: error?.message });
  }
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});

app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);

// Error handler
app.use((err: any, req: Request, res: Response, next: Function) => {
  if (!res.headersSent) res.status(500).json({ message: err?.message });
});

// Export serverless handler
export const handler = serverless(app);
