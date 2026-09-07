import express from "express";
import SensorReading from "../models/SensorReading.js";
import Alert from "../models/Alert.js";
import Station from "../models/Station.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// In-memory cache for trends data
const trendsCache = new Map();

// Cache TTL: 30 seconds
const CACHE_TTL = 30000;

// Helper function to get cached trends
function getCachedTrends(period) {
  const key = `trends:${period}`;
  const cached = trendsCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  return null;
}

// Helper function to set cached trends
function setCachedTrends(period, data) {
  const key = `trends:${period}`;
  trendsCache.set(key, {
    data,
    cachedAt: new Date(),
    expiresAt: Date.now() + CACHE_TTL,
  });
}

// Get dashboard statistics
router.get("/stats", authenticate, async (req, res) => {
  try {
    // Get latest reading from all active stations
    const latestReadings = await SensorReading.aggregate([
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$stationId",
          latestReading: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "stations",
          localField: "_id",
          foreignField: "_id",
          as: "station",
        },
      },
      {
        $unwind: "$station",
      },
      {
        $match: { "station.isActive": true },
      },
    ]);

    // Calculate overall stats
    const totalStations = await Station.countDocuments({ isActive: true });
    const activeAlerts = await Alert.countDocuments({ isActive: true });
    const criticalAlerts = await Alert.countDocuments({
      isActive: true,
      severity: "critical",
    });
    const warningAlerts = await Alert.countDocuments({
      isActive: true,
      severity: "warning",
    });

    // Get average water level
    const avgWaterLevel =
      latestReadings.length > 0
        ? latestReadings.reduce(
            (sum, r) => sum + r.latestReading.waterLevel,
            0
          ) / latestReadings.length
        : 0;

    // Get latest rainfall (from most recent reading)
    const latestReading =
      latestReadings.length > 0 ? latestReadings[0].latestReading : null;

    // Get average humidity
    const avgHumidity =
      latestReadings.length > 0
        ? latestReadings.reduce(
            (sum, r) => sum + (r.latestReading.humidity || 0),
            0
          ) / latestReadings.length
        : 0;

    res.json({
      success: true,
      data: {
        waterLevel: {
          current: avgWaterLevel.toFixed(1),
          status:
            avgWaterLevel < 0.05
              ? "critical" // Danger: 0-5cm
              : avgWaterLevel < 0.1
              ? "warning" // Caution: 5-10cm
              : "normal", // Safe: > 10cm
        },
        rainfall: {
          intensity: latestReading?.rainfall || 0,
          unit: "mm",
        },
        humidity: {
          value: Math.round(avgHumidity),
          unit: "%",
        },
        stations: {
          total: totalStations,
          online: latestReadings.length,
        },
        alerts: {
          total: activeAlerts,
          critical: criticalAlerts,
          warning: warningAlerts,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
});

// Helper function to fetch trends data from database
async function fetchTrendsData(period) {
  let startDate = new Date();
  switch (period) {
    case "24h":
      startDate.setHours(startDate.getHours() - 24);
      break;
    case "1w":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "1m":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default:
      startDate.setHours(startDate.getHours() - 24);
  }

  // Get average water level per hour/day (aggregated data)
  const isHourly = period === "24h";

  // For 24h period, get data excluding last 5 minutes (will be per-second)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Only exclude last 5 minutes if period is 24h and we have data before 5 minutes ago
  let aggregatedMatch = { timestamp: { $gte: startDate } };
  if (period === "24h" && startDate < fiveMinutesAgo) {
    aggregatedMatch = {
      timestamp: { $gte: startDate, $lt: fiveMinutesAgo },
    };
  }

  const aggregatedTrends = await SensorReading.aggregate([
    {
      $match: aggregatedMatch,
    },
    {
      $group: {
        _id: isHourly
          ? {
              hour: { $hour: "$timestamp" },
              date: {
                $dateToString: { format: "%H:00", date: "$timestamp" },
              },
            }
          : {
              day: { $dayOfYear: "$timestamp" },
              date: {
                $dateToString: { format: "%m/%d", date: "$timestamp" },
              },
            },
        avgLevel: { $avg: "$waterLevel" },
        timestamp: { $first: "$timestamp" },
      },
    },
    {
      $sort: { timestamp: 1 },
    },
    {
      $project: {
        _id: 0,
        time: "$_id.date",
        level: { $round: ["$avgLevel", 3] },
      },
    },
  ]);

  // Get per-second data for last 5 minutes
  const perSecondData = await SensorReading.find({
    timestamp: { $gte: fiveMinutesAgo },
  })
    .sort({ timestamp: 1 })
    .select("timestamp waterLevel")
    .lean();

  const perSecondFormatted = perSecondData.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    level: parseFloat(reading.waterLevel.toFixed(3)),
  }));

  return {
    aggregated: aggregatedTrends,
    perSecond: perSecondFormatted,
  };
}

// Get water level trends (cached)
router.get("/trends", authenticate, async (req, res) => {
  try {
    const { period = "24h" } = req.query;

    // Check cache first
    const cached = getCachedTrends(period);
    if (cached) {
      return res.json({
        success: true,
        data: {
          ...cached,
          cached: true,
          cachedAt: trendsCache.get(`trends:${period}`).cachedAt,
        },
      });
    }

    // Cache miss - fetch from database
    const trendsData = await fetchTrendsData(period);

    // Update cache
    setCachedTrends(period, trendsData);

    res.json({
      success: true,
      data: {
        ...trendsData,
        cached: false,
        cachedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch trends",
      error: error.message,
    });
  }
});

// Refresh water level trends (always fetch fresh data)
router.get("/trends/refresh", authenticate, async (req, res) => {
  try {
    const { period = "24h" } = req.query;

    // Always fetch fresh data from database
    const trendsData = await fetchTrendsData(period);

    // Update cache with fresh data
    setCachedTrends(period, trendsData);

    res.json({
      success: true,
      data: {
        ...trendsData,
        cached: false,
        cachedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to refresh trends",
      error: error.message,
    });
  }
});

// Get recent alerts
router.get("/recent-alerts", authenticate, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const alerts = await Alert.find({ isActive: true })
      .populate("stationId", "stationId location sector")
      .sort({ timeIssued: -1 })
      .limit(parseInt(limit));

    const formattedAlerts = alerts.map((alert) => {
      const station = alert.stationId;
      return {
        id: alert._id,
        type:
          alert.severity === "critical"
            ? "warning"
            : alert.severity === "warning"
            ? "info"
            : "success",
        title: `${station?.stationId || "Unknown"} ${
          alert.severity === "critical"
            ? "Critical Alert"
            : alert.severity === "warning"
            ? "Warning"
            : "Watch"
        }`,
        time: getTimeAgo(alert.timeIssued),
        description: `Water level at ${alert.waterLevel}m (max: ${alert.maxLevel}m)`,
      };
    });

    res.json({
      success: true,
      data: formattedAlerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent alerts",
      error: error.message,
    });
  }
});

// Helper function to get time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds} secs ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default router;
