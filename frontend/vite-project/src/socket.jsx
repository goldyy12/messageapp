import { io } from "socket.io-client";


const socket = io("https://messageapp-dj2x.onrender.com", {
  withCredentials: true,
  transports: ["websocket"]
});

export default socket;
