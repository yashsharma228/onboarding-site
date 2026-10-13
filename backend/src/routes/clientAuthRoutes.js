import express from "express";
import { clientLogin, getClientMe, clientForgotPassword, clientLogout } from "../controllers/clientAuthController.js";
import { authenticateClient } from "../middleware/clientAuthMiddleware.js";

const router = express.Router();

router.post("/login", clientLogin);
router.post("/forgot-password", clientForgotPassword);
router.post("/logout", clientLogout);
router.get("/me", authenticateClient, getClientMe);

export default router;
