import { io } from "socket.io-client";


const socket = io("https://messageapp-production-2dee.up.railway.app", {
  withCredentials: true,
  transports: ["websocket"] 
});
export default socket;
