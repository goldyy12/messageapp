import express from "express";
import {
  getFriends,
  getAvailableFriends,
  addFriend,
  getFriendsOnline,
  searchFriends,
  getFriendByID
} from "../controllers/friendController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/", getFriends);

router.get("/available", getAvailableFriends);

router.post("/", addFriend);
router.get("/:id",getFriendByID)

router.get("/online", getFriendsOnline);

router.get("/search", searchFriends);

export default router;
