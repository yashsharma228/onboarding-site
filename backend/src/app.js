import express from "express";
import cors from "cors";
import "dotenv/config";
import signupRoutes from "./routes/signupRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import clientAuthRoutes from "./routes/clientAuthRoutes.js";
import clientDashboardRoutes from "./routes/clientDashboardRoutes.js";
import { getTerms } from "./controllers/termsController.js";

const app = express();
const frontendUrl = process.env.FRONTEND_URL;

if (!frontendUrl) {
  throw new Error("Missing FRONTEND_URL in backend/.env");
}

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Aptionix backend is running",
  });
});

// Public Terms Route
app.get("/api/terms", getTerms);

// Routes
app.use("/api/signups", signupRoutes);
app.use("/api/signup", signupRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/client/auth", clientAuthRoutes);
app.use("/api/client", clientDashboardRoutes);

// Global 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

export default app;
