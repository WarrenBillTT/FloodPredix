import express from "express";
import Station from "../models/Station.js";
import SensorReading from "../models/SensorReading.js";
import Alert from "../models/Alert.js";
import LatestData from "../models/LatestData.js";

const router = express.Router();

// POST Route to receive water level data from ESP32
// Endpoint: POST /api/iot/water-level
router.post("/water-level", async (req, res) => {
  try {
    // Log incoming request
    console.log("📡 IoT Data Request Received");
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Body:`, JSON.stringify(req.body));

    const { waterLevel, stationId, rainfall, humidity, flowRate, temperature } =
      req.body;

    // Validation: Check if required data was received
    if (waterLevel === undefined || waterLevel === null) {
      console.log("❌ Error: Received empty or invalid waterLevel data");
      return res.status(400).json({
        status: "error",
        message: "No waterLevel provided",
      });
    }

    // Convert water level from cm to meters
    const waterLevelMeters = parseFloat(waterLevel) / 100;

    // Calculate status based on thresholds:
    // Danger: 0-5cm (0-0.05m) - low water level, dangerous
    // Caution: 5-10cm (0.05m - 0.10m) - moderate water level
    // Safe: > 10cm (>0.10m) - high water level, safe
    let status = "normal";
    let severity = null;

    if (waterLevelMeters < 0.05) {
      // 0-5cm: Danger
      status = "critical";
      severity = "critical";
    } else if (waterLevelMeters < 0.1) {
      // 5-10cm: Caution
      status = "warning";
      severity = "warning";
    } else {
      // > 10cm: Safe
      status = "normal";
      severity = null;
    }

    // For prototype: Use default station if stationId is not provided
    let station;
    if (stationId) {
      // If stationId is provided, try to find it
      station = await Station.findOne({
        stationId: stationId.toUpperCase(),
      });

      if (!station) {
        console.log(`⚠️ Station ${stationId} not found, using default station`);
        station = null; // Will create default below
      } else if (!station.isActive) {
        console.log(
          `⚠️ Station ${stationId} is not active, using default station`
        );
        station = null; // Will create default below
      }
    }

    // Create or find default prototype station
    if (!station) {
      station = await Station.findOne({ stationId: "PROTOTYPE" });

      if (!station) {
        // Create default prototype station
        station = await Station.create({
          stationId: "PROTOTYPE",
          name: "Prototype Station",
          location: "Prototype Location",
          sector: "Prototype Sector",
          coordinates: {
            latitude: 0,
            longitude: 0,
          },
          maxLevel: 0.1, // 10cm in meters
          warningLevel: 0.05, // 5cm in meters (Caution threshold)
          criticalLevel: 0.05, // 5cm in meters (Danger threshold - below this is danger)
          isActive: true,
          description: "Default station for prototype IoT devices",
        });
        console.log("✅ Created default PROTOTYPE station");
      }
    }

    // Get previous reading to calculate trend
    const previousReading = await SensorReading.findOne({
      stationId: station._id,
    })
      .sort({ timestamp: -1 })
      .limit(1);

    let trend = "stable";
    if (previousReading) {
      const diff = waterLevelMeters - previousReading.waterLevel;
      if (diff > 0.02) {
        trend = "rising-fast";
      } else if (diff > 0.005) {
        trend = "rising";
      } else if (diff < -0.02) {
        trend = "receding";
      } else if (diff < -0.005) {
        trend = "receding";
      } else {
        trend = "stable";
      }
    }

    // Create sensor reading
    const reading = await SensorReading.create({
      stationId: station._id,
      waterLevel: waterLevelMeters,
      rainfall: rainfall || 0,
      humidity: humidity || 0,
      flowRate: flowRate || 0,
      temperature: temperature || null,
      status: status,
      timestamp: new Date(),
    });

    // Update station's lastReading timestamp
    station.lastReading = new Date();
    await station.save();

    // Update LatestData model (preserve custom values if they exist)
    const existingLatestData = await LatestData.findOne({
      stationId: station._id,
    });

    await LatestData.findOneAndUpdate(
      { stationId: station._id },
      {
        stationId: station._id,
        waterLevel: waterLevelMeters,
        rainfall: rainfall || 0,
        humidity: humidity || 0,
        flowRate: flowRate || 0,
        temperature: temperature || null,
        status: status,
        timestamp: new Date(),
        lastUpdated: new Date(),
        lastUpdatedBy: "iot",
        // Preserve existing custom values if they exist
        ...(existingLatestData && {
          customRainfall: existingLatestData.customRainfall,
          customHumidity: existingLatestData.customHumidity,
        }),
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Updated LatestData for station ${station.stationId}`);

    // Create alert if status is caution (warning) or danger (critical)
    if (severity) {
      // Check if there's already an active alert for this station with the same severity
      const existingAlert = await Alert.findOne({
        stationId: station._id,
        severity: severity,
        isActive: true,
      });

      if (!existingAlert) {
        // Create new alert
        const forecast =
          trend === "rising-fast"
            ? `+${(
                (waterLevelMeters - (previousReading?.waterLevel || 0)) *
                100
              ).toFixed(0)}cm next hour`
            : trend === "rising"
            ? `+${(
                (waterLevelMeters - (previousReading?.waterLevel || 0)) *
                100
              ).toFixed(0)}cm next hour`
            : trend === "receding"
            ? `-${Math.abs(
                (waterLevelMeters - (previousReading?.waterLevel || 0)) * 100
              ).toFixed(0)}cm last hour`
            : "Stable";

        await Alert.create({
          stationId: station._id,
          severity: severity,
          waterLevel: waterLevelMeters,
          maxLevel: station.maxLevel,
          trend: trend,
          forecast: forecast,
          isActive: true,
          timeIssued: new Date(),
        });

        console.log(
          `⚠️ Alert created: ${severity.toUpperCase()} for station ${
            station.stationId
          }`
        );
      }
    }

    // Log the received data with full details
    console.log(`---------------------------------`);
    console.log(`✅ IoT Data Successfully Processed!`);
    console.log(`   Station ID: ${station.stationId}`);
    console.log(`   Station Name: ${station.name || "N/A"}`);
    console.log(`   Location: ${station.location || "N/A"}`);
    console.log(
      `   Water Level: ${waterLevel} cm (${waterLevelMeters.toFixed(3)} m)`
    );
    console.log(`   Status: ${status.toUpperCase()}`);
    console.log(`   Trend: ${trend}`);
    console.log(`   Rainfall: ${rainfall || 0} mm/h`);
    console.log(`   Humidity: ${humidity || 0}%`);
    console.log(`   Flow Rate: ${flowRate || 0} m³/s`);
    console.log(`   Temperature: ${temperature || "N/A"}°C`);
    console.log(`   Reading ID: ${reading._id}`);
    console.log(`   Timestamp: ${new Date().toLocaleString()}`);
    console.log(`   Data saved to database ✅`);
    console.log(`---------------------------------`);

    // Send success response back to ESP32
    res.status(200).json({
      status: "success",
      message: "Data received",
      data: {
        waterLevel: waterLevelMeters,
        status: status,
      },
    });
  } catch (error) {
    console.error("❌ Error processing water level data:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
