import express from "express";
import {
  getGroups,
  addGroup,
  getGroupById,
  newGroupMsg,
  addToGroup,
  getAvailableFriends,
  leaveGroup,
} from "../controllers/groupController";

import { authenticateToken } from "../middleware/auth";

import multer from "multer";
import { storage } from "../cloudinary";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getGroups);
router.post("/", addGroup);

const upload = multer({ storage });
router.post("/message", upload.single("file"), newGroupMsg);
router.post("/addmember", addToGroup);
router.delete("/leavegroup", leaveGroup);
router.get("/:id", getGroupById);
router.get("/:id/available-friends", getAvailableFriends);
export default router;
