import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import serverless from 'serverless-http';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
const app = express();
//check
const port = 3000;
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        // Allow localhost for development
        if (origin.includes('localhost'))
            return callback(null, true);
        // Allow Vercel domains (*.vercel.app)
        if (origin.endsWith('.vercel.app'))
            return callback(null, true);
        // Check against explicitly trusted origins
        const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(',') || [];
        if (trustedOrigins.includes(origin))
            return callback(null, true);
        // Reject other origins
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};
app.use(cors(corsOptions));
const authHandler = toNodeHandler(auth);
app.all('/api/auth/*any', async (req, res, next) => {
    try {
        await authHandler(req, res);
    }
    catch (error) {
        console.error('Better-auth error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                message: error?.message || 'Authentication error',
                error: process.env.NODE_ENV === 'development' ? error?.stack : undefined
            });
        }
    }
});
app.use(express.json({ limit: '50mb' }));
app.get('/', (req, res) => {
    res.send('Server is Live!');
});
app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);
app.use((err, req, res, next) => {
    if (!res.headersSent) {
        res.status(500).json({ message: err?.message || 'Internal Server Error' });
    }
});
// Export for serverless deployment
export default serverless(app);
