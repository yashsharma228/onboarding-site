import express from "express";
import { login, getMe, forgotPassword, logout } from "../controllers/authController.js";
import { authenticateAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/logout", logout);
router.get("/me", authenticateAdmin, getMe);

export default router;
