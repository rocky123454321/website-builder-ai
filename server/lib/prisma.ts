// prismaClient.ts
import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });

// Avoid multiple instances in serverless
let prisma: PrismaClient;

declare global {
  var __prismaClient: PrismaClient | undefined;
}

if (global.__prismaClient) {
  prisma = global.__prismaClient;
} else {
  prisma = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== 'production') global.__prismaClient = prisma;
}

export default prisma;
