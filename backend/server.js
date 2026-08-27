import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import analyzeRoutes from "./routes/analyze.js";
import reportRoutes from "./routes/report.js";
import githubRoutes from "./routes/github.js";
import dashboardRoutes from "./routes/dashboard.js";
import billingRoutes from "./routes/billing.js";
import workspaceRoutes from "./routes/workspace.js";
import statsRoutes from "./routes/stats.js";

connectDB();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL || "https://codeverity.pages.dev"
];

app.use(cors({ origin: allowedOrigins, }));
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
