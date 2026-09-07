import express from 'express';
import Station from '../models/Station.js';
import SensorReading from '../models/SensorReading.js';
import Alert from '../models/Alert.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all stations for map view
router.get('/stations', authenticate, async (req, res) => {
  try {
    const stations = await Station.find({ isActive: true });

    const stationsWithData = await Promise.all(
      stations.map(async (station) => {
        const latestReading = await SensorReading.findOne({ stationId: station._id })
          .sort({ timestamp: -1 });

        const activeAlerts = await Alert.countDocuments({
          stationId: station._id,
          isActive: true
        });

        return {
          id: station._id,
          stationId: station.stationId,
          name: station.name,
          location: station.location,
          sector: station.sector,
          coordinates: station.coordinates,
          maxLevel: station.maxLevel,
          lastReading: latestReading ? {
            waterLevel: latestReading.waterLevel,
            rainfall: latestReading.rainfall,
            humidity: latestReading.humidity,
            flowRate: latestReading.flowRate,
            status: latestReading.status,
            timestamp: latestReading.timestamp
          } : null,
          activeAlerts,
          isOnline: latestReading && 
            (new Date() - new Date(latestReading.timestamp)) < 3600000 // Online if reading within last hour
        };
      })
    );

    res.json({
      success: true,
      data: stationsWithData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch map stations',
      error: error.message
    });
  }
});

// Get station details for map
router.get('/stations/:id', authenticate, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    const latestReading = await SensorReading.findOne({ stationId: station._id })
      .sort({ timestamp: -1 });

    const activeAlerts = await Alert.find({
      stationId: station._id,
      isActive: true
    }).sort({ timeIssued: -1 });

    res.json({
      success: true,
      data: {
        station: {
          id: station._id,
          stationId: station.stationId,
          name: station.name,
          location: station.location,
          sector: station.sector,
          coordinates: station.coordinates,
          maxLevel: station.maxLevel
        },
        currentReading: latestReading,
        activeAlerts: activeAlerts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch station details',
      error: error.message
    });
  }
});

export default router;

