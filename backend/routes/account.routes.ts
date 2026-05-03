import express from "express";

import { changePassword } from "../controllers/accountContoller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
router.use(authenticateToken);

router.post("/", changePassword);

export default router;
