import express from "express";
import SensorReading from "../models/SensorReading.js";
import Station from "../models/Station.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get history records with filtering and pagination
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      startDate,
      endDate,
      stationId,
    } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Status filter
    if (status !== "all") {
      query.status = status;
    }

    // Station filter
    if (stationId) {
      const station = await Station.findOne({
        stationId: stationId.toUpperCase(),
      });
      if (station) {
        query.stationId = station._id;
      } else {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }
    }

    // Search filter (by location or station ID)
    if (search) {
      const stations = await Station.find({
        $or: [
          { location: { $regex: search, $options: "i" } },
          { stationId: { $regex: search, $options: "i" } },
        ],
      });
      const stationIds = stations.map((s) => s._id);
      query.stationId = { $in: stationIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [readings, total] = await Promise.all([
      SensorReading.find(query)
        .populate("stationId", "stationId location sector maxLevel")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SensorReading.countDocuments(query),
    ]);

    const formattedRecords = readings.map((reading) => {
      const station = reading.stationId;
      const date = new Date(reading.timestamp);
      return {
        id: reading._id,
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        location: station?.location || "Unknown",
        stationId: station?.stationId || "Unknown",
        waterLevel: reading.waterLevel,
        maxLevel: station?.maxLevel || 5.0,
        rainfall: reading.rainfall,
        status: reading.status,
      };
    });

    res.json({
      success: true,
      data: formattedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch history",
      error: error.message,
    });
  }
});

// Export history (CSV format)
router.get("/export", authenticate, async (req, res) => {
  try {
    const { startDate, endDate, status = "all" } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (status !== "all") {
      query.status = status;
    }

    const readings = await SensorReading.find(query)
      .populate("stationId", "stationId location sector")
      .sort({ timestamp: -1 })
      .limit(10000); // Limit exports

    // Convert to CSV
    const csvHeader =
      "Date,Time,Location,Station ID,Water Level (m),Max Level (m),Rainfall (mm),Status\n";
    const csvRows = readings
      .map((r) => {
        const date = new Date(r.timestamp);
        return `${date.toLocaleDateString()},${date.toLocaleTimeString()},${
          r.stationId?.location || ""
        },${r.stationId?.stationId || ""},${r.waterLevel},${
          r.stationId?.maxLevel || 5.0
        },${r.rainfall},${r.status}`;
      })
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=flood-history.csv"
    );
    res.send(csvHeader + csvRows);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export history",
      error: error.message,
    });
  }
});

export default router;
