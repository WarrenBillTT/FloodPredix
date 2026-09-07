import express from "express";
import LatestData from "../models/LatestData.js";
import Station from "../models/Station.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET /api/latest-data
// Get latest data for all stations or specific station
// Returns effective values (custom if set, otherwise real)
router.get("/", authenticate, async (req, res) => {
  try {
    const { stationId } = req.query;

    let query = {};
    if (stationId) {
      // Find station by stationId string
      const station = await Station.findOne({
        stationId: stationId.toUpperCase(),
      });
      if (!station) {
        return res.status(404).json({
          success: false,
          message: "Station not found",
        });
      }
      query = { stationId: station._id };
    }

    const latestDataDocs = await LatestData.find(query).populate(
      "stationId",
      "stationId name location"
    );

    if (latestDataDocs.length === 0) {
      return res.json({
        success: true,
        data: stationId ? null : [],
        message: stationId
          ? "No latest data found for this station"
          : "No latest data found",
      });
    }

    // Transform data to return effective values
    const transformData = (doc) => {
      const station = doc.stationId;
      return {
        stationId: station?.stationId || doc.stationId.toString(),
        stationName: station?.name || "Unknown",
        location: station?.location || "Unknown",
        waterLevel: doc.waterLevel,
        // Effective values: custom if set, otherwise real
        rainfall: doc.customRainfall !== null ? doc.customRainfall : doc.rainfall,
        humidity: doc.customHumidity !== null ? doc.customHumidity : doc.humidity,
        flowRate: doc.flowRate,
        temperature: doc.temperature,
        status: doc.status,
        timestamp: doc.timestamp,
        lastUpdated: doc.lastUpdated,
        lastUpdatedBy: doc.lastUpdatedBy,
        hasCustomRainfall: doc.customRainfall !== null,
        hasCustomHumidity: doc.customHumidity !== null,
      };
    };

    const data = stationId
      ? transformData(latestDataDocs[0])
      : latestDataDocs.map(transformData);

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching latest data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest data",
      error: error.message,
    });
  }
});

// PUT /api/latest-data/custom
// Set custom rainfall and/or humidity values
router.put("/custom", authenticate, async (req, res) => {
  try {
    const { stationId, rainfall, humidity } = req.body;

    // Find station if stationId provided, otherwise use PROTOTYPE
    let station;
    if (stationId) {
      station = await Station.findOne({
        stationId: stationId.toUpperCase(),
      });
      if (!station) {
        return res.status(404).json({
          success: false,
          message: "Station not found",
        });
      }
    } else {
      // Default to PROTOTYPE station
      station = await Station.findOne({ stationId: "PROTOTYPE" });
      if (!station) {
        return res.status(404).json({
          success: false,
          message: "Default PROTOTYPE station not found",
        });
      }
    }

    // Find or create LatestData for this station
    let latestData = await LatestData.findOne({ stationId: station._id });

    if (!latestData) {
      // Create LatestData if it doesn't exist
      latestData = await LatestData.create({
        stationId: station._id,
        waterLevel: 0,
        rainfall: 0,
        humidity: 0,
        flowRate: 0,
        temperature: null,
        status: "normal",
        timestamp: new Date(),
        lastUpdated: new Date(),
        lastUpdatedBy: "user",
        customRainfall: null,
        customHumidity: null,
      });
    }

    // Update custom values
    const updateData = {
      lastUpdated: new Date(),
      lastUpdatedBy: "user",
    };

    if (rainfall !== undefined) {
      updateData.customRainfall = rainfall === null ? null : parseFloat(rainfall);
    }

    if (humidity !== undefined) {
      const humidityValue = humidity === null ? null : parseFloat(humidity);
      if (humidityValue !== null && (humidityValue < 0 || humidityValue > 100)) {
        return res.status(400).json({
          success: false,
          message: "Humidity must be between 0 and 100",
        });
      }
      updateData.customHumidity = humidityValue;
    }

    latestData = await LatestData.findOneAndUpdate(
      { stationId: station._id },
      updateData,
      { new: true }
    ).populate("stationId", "stationId name");

    console.log(
      `✅ Updated custom values for station ${station.stationId}:`,
      updateData
    );

    res.json({
      success: true,
      message: "Custom values updated successfully",
      data: {
        stationId: station.stationId,
        customRainfall: latestData.customRainfall,
        customHumidity: latestData.customHumidity,
      },
    });
  } catch (error) {
    console.error("Error updating custom values:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update custom values",
      error: error.message,
    });
  }
});

// DELETE /api/latest-data/custom
// Clear all custom values
router.delete("/custom", authenticate, async (req, res) => {
  try {
    const { stationId } = req.query;

    // Find station if stationId provided, otherwise use PROTOTYPE
    let station;
    if (stationId) {
      station = await Station.findOne({
        stationId: stationId.toUpperCase(),
      });
      if (!station) {
        return res.status(404).json({
          success: false,
          message: "Station not found",
        });
      }
    } else {
      // Default to PROTOTYPE station
      station = await Station.findOne({ stationId: "PROTOTYPE" });
      if (!station) {
        return res.status(404).json({
          success: false,
          message: "Default PROTOTYPE station not found",
        });
      }
    }

    const latestData = await LatestData.findOneAndUpdate(
      { stationId: station._id },
      {
        customRainfall: null,
        customHumidity: null,
        lastUpdated: new Date(),
        lastUpdatedBy: "user",
      },
      { new: true }
    );

    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: "Latest data not found for this station",
      });
    }

    console.log(`✅ Cleared custom values for station ${station.stationId}`);

    res.json({
      success: true,
      message: "Custom values cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing custom values:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear custom values",
      error: error.message,
    });
  }
});

export default router;

