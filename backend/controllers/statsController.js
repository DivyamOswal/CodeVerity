// backend/controllers/statsController.js
import Report from "../models/Report.js";

export const getPublicStats = async (req, res) => {
  try {
    // Total scans
    const totalScans = await Report.countDocuments();

    // Average scores across all reports
    const result = await Report.aggregate([
      {
        $group: {
          _id: null,
          avgQuality: { $avg: "$scores.codeQuality" },
          avgSecurity: { $avg: "$scores.security" },
          avgPerformance: { $avg: "$scores.performance" },
          avgMaintainability: { $avg: "$scores.maintainability" },
        },
      },
    ]);

    let avgQuality = 0;
    if (result.length > 0) {
      const avg =
        (result[0].avgQuality +
          result[0].avgSecurity +
          result[0].avgPerformance +
          result[0].avgMaintainability) /
        4;
      avgQuality = Math.round(avg);
    }

    // For "Issue Accuracy" – we could compute grade distribution or something else
    // For simplicity, we'll show average quality as the second stat.
    // For the third stat, we'll show average time (not stored). Let's use "99.9%" uptime or "~2 min" average.
    // We'll hardcode a placeholder or compute average scan duration if we have timestamps.
    // Since we don't have duration, we'll show a static or computed value.

    // If you have createdAt and maybe the analysis completion time, you could compute.
    // We'll just show "< 2 min" as an example.

    res.json({
      success: true,
      stats: {
        totalScans,
        avgQuality,
        avgTime: "< 2 min", // Placeholder
      },
    });
  } catch (err) {
    console.error("Public stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};