// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./db";
import friendsRoutes from "./routes/friend.routes";
import authRoutes from "./routes/auth.routes";
import groupRoutes from "./routes/group.routes";
import accountRoutes from "./routes/account.routes";
import messageRouter from "./routes/message.routes";
import { type Request, type Response } from "express";
import redisClient from "./lib/redis";

dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins: string[] = [
  "http://localhost:5173",
  "https://messageapp-ccvm.vercel.app",
  "https://messageapp-umber.vercel.app",
  "https://messageapp-av9z.vercel.app",
  "https://messageapp-i1a9.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use("/api/friends", friendsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/account/", accountRoutes);
app.use("/api/messages/", messageRouter);

app.get("/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (e: unknown) {
    console.error(e); // Log the actual error to Railway logs
    res
      .status(500)
      .json({ status: "error", db: "failed", details: (e as Error).message });
  }
});
app.get("/redis-test", async (req, res) => {
  const start = Date.now();

  await redisClient.set("test:key", "hello", {
    EX: 10,
  });

  const value = await redisClient.get("test:key");

  const end = Date.now();

  res.json({
    value,
    timeMs: end - start,
  });
});

export default app;
