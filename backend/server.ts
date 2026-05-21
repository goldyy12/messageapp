import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app";
import {
  type clientToServer,
  type serverToClient,
  type SocketData,
} from "./types/socket";

const server = http.createServer(app);

const io = new Server<clientToServer, serverToClient, SocketData>(server, {
  cors: {
    origin: [
      "https://messageapp-ccvm.vercel.app",
      "http://localhost:5173",
      "https://messageapp-umber.vercel.app",
      "https://messageapp-av9z.vercel.app",
      "https://messageapp-i1a9.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinUser", (userId: number) => {
    const userIdNum = Number(userId);

    if (Number.isNaN(userIdNum)) return;

    onlineUsers.set(userIdNum, socket.id);

    console.log(`User ${userIdNum} connected with socket ${socket.id}`);
    console.log("📊 Online Users:", Array.from(onlineUsers.entries()));
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        console.log(`User ${userId} disconnected`);
        onlineUsers.delete(userId);
        break;
      }
    }

    console.log("📊 Online Users:", Array.from(onlineUsers.entries()));
  });
});

import { type Request, type Response, type NextFunction } from "express";
import { connectRedis } from "./lib/redis";
connectRedis();

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: "Internal Server Error" });
});
export { io, onlineUsers };
const PORT = process.env.PORT || 8080;

server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
