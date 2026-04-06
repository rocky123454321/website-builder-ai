import "dotenv/config";
import { PrismaClient } from '../generated/prisma/client/index.js';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = `${process.env.DATABASE_URL}`;

// Create a connection pool with timeout settings
const pool = new pg.Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

// Reconnect on idle timeout
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;