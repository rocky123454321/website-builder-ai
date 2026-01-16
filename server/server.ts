import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';

const app = express();

// Use Render's PORT
const PORT = process.env.PORT || 3000;

// Configure CORS using trusted origins from Render environment variables
const corsOptions = {
  origin: process.env.TRUSTED_ORIGINS?.split(',') || [
    'http://localhost:5173', // Local development
    'https://website-builder-ai-a3qj.vercel.app', // Vercel deployment
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// Better Auth handler
const authHandler = toNodeHandler(auth);
app.all('/api/auth/*any', async (req, res, next) => {
  try {
    await authHandler(req, res);
  } catch (error: any) {
    console.error('Better-auth error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        message: error?.message || 'Authentication error',
        error: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      });
    }
  }
});

// Parse JSON requests
app.use(express.json({ limit: '50mb' }));

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});

// Routes
app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!res.headersSent) {
    res.status(500).json({ message: err?.message || 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
