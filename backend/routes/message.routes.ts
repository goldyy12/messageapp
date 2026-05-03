import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController";
import { authenticateToken } from "../middleware/auth";
import multer from "multer";
import { storage } from "../cloudinary";

const router = express.Router();
router.use(authenticateToken);
const upload = multer({ storage });

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
