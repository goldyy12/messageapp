import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  transports: ["polling", "websocket"],
});

console.log("Connecting to socket at:", import.meta.env.VITE_API_URL);

export default socket;
