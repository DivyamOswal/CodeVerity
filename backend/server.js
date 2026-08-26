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
// import billingRoutes from "./routes/billing.js";
import workspaceRoutes from "./routes/workspace.js";

connectDB();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
// app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/billing", billingRoutes);
app.use("/api/workspace", workspaceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
