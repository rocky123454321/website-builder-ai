import { auth } from "../lib/auth.js";
export const protect = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({ req, res });
        if (!session || !session?.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = session.user.id;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
//done all
