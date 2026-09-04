import express from "express";
import auth from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  getSystemStats,
  getAllUsers,
  toggleAdmin,
  getAllWorkspaces,
  getAllReports,
  deleteWorkspace,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(auth, adminAuth); // all routes require admin

router.get("/stats", getSystemStats);
router.get("/users", getAllUsers);
router.put("/users/:userId/toggle-admin", toggleAdmin);
router.get("/workspaces", getAllWorkspaces);
router.delete("/workspaces/:workspaceId", deleteWorkspace);
router.get("/reports", getAllReports);

export default router;