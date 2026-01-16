import express, { Request, Response } from 'express';
import 'dotenv/config'
import cors from 'cors'
import path from 'path';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
const app = express();
//check
const port = 3000;
const corsOptions={
    origin: process.env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
}
app.use(cors(corsOptions))
const authHandler = toNodeHandler(auth);
app.all('/api/auth/*any', async (req, res, next) => {
    try {
        await authHandler(req, res);
    } catch (error: any) {
        console.error('Better-auth error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                message: error?.message || 'Authentication error',
                error: process.env.NODE_ENV === 'development' ? error?.stack : undefined
            });
        }
    }
});



app.use(express.json({limit: '50mb'}))

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user', userRouter);

app.use('/api/project', projectRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!res.headersSent) {
        res.status(500).json({ message: err?.message || 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
