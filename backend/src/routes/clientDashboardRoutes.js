import express from "express";
import {
  getClientDashboardData,
  getClientProfile,
  updateClientProfile,
  changeClientPassword,
} from "../controllers/clientDashboardController.js";
import { authenticateClient } from "../middleware/clientAuthMiddleware.js";

const router = express.Router();

// All routes here are protected with authenticateClient
router.use(authenticateClient);

router.get("/dashboard", getClientDashboardData);
router.get("/profile", getClientProfile);
router.put("/profile", updateClientProfile);
router.put("/change-password", changeClientPassword);

export default router;
