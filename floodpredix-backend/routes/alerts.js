import express from "express";
import Alert from "../models/Alert.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all alerts with filtering
router.get("/", authenticate, async (req, res) => {
  try {
    const { severity = "all", search = "", limit = 50 } = req.query;

    const query = { isActive: true };

    if (severity !== "all") {
      query.severity = severity;
    }

    // Search by location or station ID
    if (search) {
      const Station = (await import("../models/Station.js")).default;
      const stations = await Station.find({
        $or: [
          { location: { $regex: search, $options: "i" } },
          { stationId: { $regex: search, $options: "i" } },
        ],
      });
      query.stationId = { $in: stations.map((s) => s._id) };
    }

    const alerts = await Alert.find(query)
      .populate("stationId", "stationId location sector maxLevel")
      .sort({ timeIssued: -1 })
      .limit(parseInt(limit));

    const formattedAlerts = alerts.map((alert) => {
      const station = alert.stationId;
      return {
        id: alert._id,
        severity: alert.severity,
        location: station?.location || "Unknown",
        stationId: station?.stationId || "Unknown",
        sector: station?.sector || "Unknown",
        waterLevel: alert.waterLevel,
        maxLevel: alert.maxLevel,
        timeIssued: getTimeAgo(alert.timeIssued),
        trend: alert.trend,
        forecast: alert.forecast,
      };
    });

    // Get counts
    const criticalCount = await Alert.countDocuments({
      isActive: true,
      severity: "critical",
    });
    const warningCount = await Alert.countDocuments({
      isActive: true,
      severity: "warning",
    });

    res.json({
      success: true,
      data: formattedAlerts,
      counts: {
        critical: criticalCount,
        warning: warningCount,
        total: alerts.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      error: error.message,
    });
  }
});

// Get alert by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate(
      "stationId",
      "stationId location sector coordinates maxLevel"
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alert",
      error: error.message,
    });
  }
});

// Acknowledge alert
router.post("/:id/acknowledge", authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    alert.acknowledgedBy = req.user._id;
    alert.acknowledgedAt = new Date();
    await alert.save();

    res.json({
      success: true,
      message: "Alert acknowledged",
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to acknowledge alert",
      error: error.message,
    });
  }
});

// Resolve alert
router.post("/:id/resolve", authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    alert.isActive = false;
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({
      success: true,
      message: "Alert resolved",
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to resolve alert",
      error: error.message,
    });
  }
});

// Helper function
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds} secs ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default router;
