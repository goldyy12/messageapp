import { io } from "socket.io-client";

const socket = io("https://messageapp-dj2x.onrender.com", {
  transports: ["websocket", "polling"], // Allow fallback to polling
  withCredentials: true,
});
export default socket;
