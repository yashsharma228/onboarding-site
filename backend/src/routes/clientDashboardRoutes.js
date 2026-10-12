import express from "express";
import {
  getClientDashboardData,
  getClientProfile,
  updateClientProfile,
  changeClientPassword,
  getDirectClientProfile,
} from "../controllers/clientDashboardController.js";
import { authenticateClient } from "../middleware/clientAuthMiddleware.js";

const router = express.Router();

// Direct passwordless client profile access via secure token
router.get("/direct-profile", getDirectClientProfile);

// Authenticated client portal routes
router.use(authenticateClient);

router.get("/dashboard", getClientDashboardData);
router.get("/profile", getClientProfile);
router.put("/profile", updateClientProfile);
router.put("/change-password", changeClientPassword);

export default router;
