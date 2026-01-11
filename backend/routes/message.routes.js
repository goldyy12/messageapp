import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();
router.use(authenticateToken);


router.post("/", sendMessage);
router.get("/:friendId", getMessages);

export default router;
