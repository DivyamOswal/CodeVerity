// backend/routes/workspace.js
import express from "express";
import {
  getWorkspace,
  updateWorkspace,
  listMembers,      
  addMember,
  removeMember,
  updateMemberRole,
  leaveWorkspace,
} from "../controllers/workspaceController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, getWorkspace);
router.put("/", auth, updateWorkspace);
router.get("/members", auth, listMembers);  
router.post("/members", auth, addMember);
router.delete("/members/:userId", auth, removeMember);
router.put("/members/:userId", auth, updateMemberRole);
router.post("/leave", auth, leaveWorkspace);

export default router;