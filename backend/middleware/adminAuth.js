import User from "../models/User.js";

export default async function adminAuth(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!user.isGlobalAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.status(500).json({ error: "Server error" });
  }
}