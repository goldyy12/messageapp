import express from "express";
import {
  getGroups,
  addGroup,
  getGroupById,
  newGroupMsg,
  addToGroup,
  getAvailableFriends,
  leaveGroup
} from "../controllers/groupController.js";

import { authenticateToken } from "../middleware/auth.js"; // Protect routes


const router = express.Router();

router.use(authenticateToken);

router.get("/", getGroups);
router.post("/", addGroup);

router.post("/message", newGroupMsg);
router.post("/addmember", addToGroup);
router.delete("/leavegroup", leaveGroup);
router.get("/:id", getGroupById);
router.get("/:id/available-friends", getAvailableFriends);
export default router;
