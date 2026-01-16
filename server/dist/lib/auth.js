import 'dotenv/config';
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";
const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(',') || [
    'http://localhost:5173', // Local development
];
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        deleteUser: {
            enabled: true
        }
    },
    trustedOrigins: (request) => {
        const origin = request?.headers.get('origin') || request?.headers.get('referer');
        // Start with default origins
        const allowedOrigins = ['http://localhost:5173'];
        // Add environment origins
        if (process.env.TRUSTED_ORIGINS) {
            allowedOrigins.push(...process.env.TRUSTED_ORIGINS.split(','));
        }
        // Allow Vercel deployments for this project (website-builder-ai-a3qj-*)
        if (origin && origin.startsWith('https://website-builder-ai-a3qj-') && origin.endsWith('.vercel.app')) {
            allowedOrigins.push(origin);
        }
        return allowedOrigins;
    },
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    advanced: {
        cookies: {
            session_token: {
                name: 'auth_session',
                attributes: {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                }
            }
        }
    }
});
