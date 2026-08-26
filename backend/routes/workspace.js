// backend/routes/workspace.js
import express from "express";
import {
  getWorkspace,
  updateWorkspace,
  addMember,
  removeMember,
  updateMemberRole,
} from "../controllers/workspaceController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, getWorkspace);
router.put("/", auth, updateWorkspace);
router.post("/members", auth, addMember);
router.delete("/members/:userId", auth, removeMember);
router.put("/members/:userId", auth, updateMemberRole);

export default router;
