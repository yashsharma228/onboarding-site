import express from "express";
import {
  getSignups,
  updateSignupStatus,
  deleteSignup,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/adminController.js";
import {
  getClients,
  getClientById,
  createClientByAdmin,
  assignPlans,
  recordPayment,
  updateClientStatus,
  deleteOrArchiveClient,
  restoreClient,
} from "../controllers/clientAccountController.js";
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from "../controllers/planController.js";
import {
  getTerms,
  updateTerms,
} from "../controllers/termsController.js";
import { authenticateAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require JWT authentication
router.use(authenticateAdmin);

// Client signups management
router.get("/signups", getSignups);
router.patch("/signups/:id/status", updateSignupStatus);
router.delete("/signups/:id", deleteSignup);

// Client accounts management (Approved Clients)
router.get("/clients", getClients);
router.post("/clients", createClientByAdmin);
router.get("/clients/:id", getClientById);
router.post("/clients/:id/plans", assignPlans);
router.post("/clients/:id/payments", recordPayment);
router.patch("/clients/:id/status", updateClientStatus);
router.delete("/clients/:id", deleteOrArchiveClient);
router.patch("/clients/:id/restore", restoreClient);

// Admin profile & credentials
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/password", changePassword);

// Plans management
router.get("/plans", getPlans);
router.get("/plans/:id", getPlanById);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

// Terms and conditions
router.get("/terms", getTerms);
router.put("/terms", updateTerms);

export default router;
