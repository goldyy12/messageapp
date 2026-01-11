// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import friendsRoutes from "./routes/friend.routes.js";
import authRoutes from "./routes/auth.routes.js";
import groupRoutes from "./routes/group.routes.js";
import accountRoutes from "./routes/account.routes.js"
import messageRouter from "./routes/message.routes.js"

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/friends", friendsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/account/",accountRoutes)
app.use("/api/messages/",messageRouter)

export default app;
