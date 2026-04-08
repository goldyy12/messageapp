import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import { storage } from "../cloudinary.js";

const router = express.Router();
router.use(authenticateToken);
const upload = multer({ storage });

// Handle both multipart/form-data (with file) and application/json (text only)
router.post(
  "/",
  (req, res, next) => {
    // If there's a file, use multer. Otherwise, parse JSON
    if (req.is("multipart/form-data")) {
      upload.single("file")(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  },
  sendMessage,
);

router.get("/:friendId", getMessages);

export default router;
