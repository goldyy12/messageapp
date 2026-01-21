// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./db.js";
import friendsRoutes from "./routes/friend.routes.js";
import authRoutes from "./routes/auth.routes.js";
import groupRoutes from "./routes/group.routes.js";
import accountRoutes from "./routes/account.routes.js"
import messageRouter from "./routes/message.routes.js"

dotenv.config();

const app = express();



const allowedOrigins = [
  "http://localhost:5173",                       // local dev
  "https://messageapp-ccvm.vercel.app",         // current frontend
  "https://messageapp-umber.vercel.app"         // other frontends you might use
];

app.use(cors({
  origin: function(origin, callback) {
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));


app.use(express.json());

app.use("/api/friends", friendsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/account/",accountRoutes)
app.use("/api/messages/",messageRouter);

app.get("/health", async (req, res) => {
  try {
    
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (e) {
    console.error(e); // Log the actual error to Railway logs
    res.status(500).json({ status: "error", db: "failed", details: e.message });
  }
});

export default app;
