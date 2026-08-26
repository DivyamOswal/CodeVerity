// backend/routes/stats.js
import express from "express";
import { getPublicStats } from "../controllers/statsController.js";

const router = express.Router();

router.get("/public", getPublicStats);

export default router;