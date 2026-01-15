import prisma from "../lib/prisma.js";
export const protect = async (req, res, next) => {
    try {
        // Parse the session cookie
        const cookies = req.cookies || {};
        console.log('Auth middleware: All cookies:', Object.keys(cookies));
        const sessionToken = cookies.auth_session;
        console.log('Auth middleware: sessionToken:', sessionToken ? 'present' : 'missing');
        if (!sessionToken) {
            console.log('Auth middleware: No session token in cookies');
            return res.status(401).json({ message: 'Unauthorized' });
        }
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
    }
    catch (error) {
        console.log('Auth middleware: Error:', error.message);
        res.status(401).json({ message: 'Unauthorized' });
    }
};
//done all
