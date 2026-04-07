import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import { storage } from "../cloudinary.js";

const router = express.Router();
router.use(authenticateToken);
const upload = multer({ storage });

router.post("/", upload.single("file"), sendMessage);
router.get("/:friendId", getMessages);

export default router;
