// db.js
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

import bcrypt from "bcryptjs";

const quickTest = async () => {
  const pass = "diar123";
  const hash = await bcrypt.hash(pass, 10);

  console.log("Newly Generated Hash:", hash);
  const result = await bcrypt.compare(pass, hash);

  console.log("Comparison Result:", result ? "✅ MATCH" : "❌ FAIL");
};

quickTest(); // Example usage
export default prisma;
