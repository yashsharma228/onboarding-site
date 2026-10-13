import express from "express";
import { createSignup } from "../controllers/signupController.js";

const router = express.Router();

router.post("/", createSignup);

export default router;
