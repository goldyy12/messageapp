import express from "express";


import { changePassword } from "../controllers/accountContoller.js";
import { authenticateToken } from "../middleware/auth.js";


const router = express.Router();
router.use(authenticateToken);

router.post("/", changePassword)

export default router;