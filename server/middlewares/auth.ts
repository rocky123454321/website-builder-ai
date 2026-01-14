import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Parse the session cookie
        const cookies = req.cookies || {};
        const sessionToken = cookies.auth_session;

        if (!sessionToken) {
            console.log('Auth middleware: No session token in cookies');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Query the database directly to validate the session
        const session = await prisma.session.findUnique({
            where: { token: sessionToken },
            include: { user: true }
        });

        if (!session || !session.user || session.expiresAt < new Date()) {
            console.log('Auth middleware: Invalid or expired session');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        console.log('Auth middleware: User authenticated:', session.user.id);
        req.userId = session.user.id;
        next();
    } catch (error: any) {
        console.log('Auth middleware: Error:', error.message);
        res.status(401).json({ message: 'Unauthorized' });
    }
};
//done all