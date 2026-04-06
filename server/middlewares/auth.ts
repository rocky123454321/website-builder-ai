import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { Request, Response, NextFunction } from "express";

const getSessionWithRetry = async (headers: any, retries = 3): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const session = await auth.api.getSession({ headers });
      return session;
    } catch (error: any) {
      const isTimeout = error?.code === 'ETIMEDOUT' || 
                        error?.message?.includes('ETIMEDOUT') ||
                        error?.body?.code === 'FAILED_TO_GET_SESSION';

      if (isTimeout && attempt < retries) {
        console.log(`Session lookup timeout, retrying... (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, 1000 * attempt)); // wait 1s, 2s, 3s
        continue;
      }

      throw error;
    }
  }
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await getSessionWithRetry(fromNodeHeaders(req.headers));

    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.userId = session.user.id;
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);

    // Distinguish between auth failure and server error
    const isTimeout = error?.code === 'ETIMEDOUT' ||
                      error?.message?.includes('ETIMEDOUT') ||
                      error?.body?.code === 'FAILED_TO_GET_SESSION';

    if (isTimeout) {
      return res.status(503).json({ message: "Server busy, please try again" });
    }

    return res.status(401).json({ message: "Unauthorized" });
  }
};