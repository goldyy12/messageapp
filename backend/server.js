import http from "http";
import { Server } from "socket.io";
import app from "./app.js";

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",                         // local dev
  "https://messageapp-ccvm.vercel.app",           // frontend 1
  "https://messageapp-umber.vercel.app"           // frontend 2
];

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // allow requests with no origin (like Postman) or in allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  
  socket.on("joinUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});


export { io, onlineUsers };
const PORT = process.env.PORT || 8080;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});