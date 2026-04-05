import "dotenv/config";
import { PrismaClient } from '../generated/prisma/client/index.js' // ✅ add /index.js
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export default prisma