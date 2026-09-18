// backend/routes/report.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import {
  getReports,
  getReport,           
  downloadReportPDF,
} from "../controllers/reportController.js";

const router = express.Router();

const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many PDF requests. Please slow down." },
});

router.get("/", auth, getReports);
router.get("/:id", auth, getReport);          
router.get("/:id/pdf", auth, downloadReportPDF);

export default router;