import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import { storage } from "../cloudinary.js";

const router = express.Router();
router.use(authenticateToken);
const upload = multer({ storage });

router.post(
  "/",
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      upload.single("file")(req, res, next);
    } else {
      next();
    }
  },
  sendMessage,
);
router.get("/:friendId", getMessages);

export default router;
