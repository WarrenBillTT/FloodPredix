import express from 'express';
import Station from '../models/Station.js';
import SensorReading from '../models/SensorReading.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all stations
router.get('/', authenticate, async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    
    const query = {};
    if (active === 'true') {
      query.isActive = true;
    }

    const stations = await Station.find(query).sort({ stationId: 1 });

    // Get latest reading for each station
    const stationsWithData = await Promise.all(
      stations.map(async (station) => {
        const latestReading = await SensorReading.findOne({ stationId: station._id })
          .sort({ timestamp: -1 });

        return {
          id: station._id,
          stationId: station.stationId,
          name: station.name,
          location: station.location,
          sector: station.sector,
          coordinates: station.coordinates,
          maxLevel: station.maxLevel,
          warningLevel: station.warningLevel,
          criticalLevel: station.criticalLevel,
          isActive: station.isActive,
          lastReading: latestReading ? {
            waterLevel: latestReading.waterLevel,
            rainfall: latestReading.rainfall,
            humidity: latestReading.humidity,
            status: latestReading.status,
            timestamp: latestReading.timestamp
          } : null
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
      message: 'Failed to fetch stations',
      error: error.message
    });
  }
});

// Get station by ID
router.get('/:id', authenticate, async (req, res) => {
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

    res.json({
      success: true,
      data: {
        ...station.toObject(),
        lastReading: latestReading
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch station',
      error: error.message
    });
  }
});

// Get station readings
router.get('/:id/readings', authenticate, async (req, res) => {
  try {
    const { limit = 100, startDate, endDate } = req.query;
    
    const query = { stationId: req.params.id };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const readings = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: readings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch readings',
      error: error.message
    });
  }
});

// Create new station (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const station = await Station.create(req.body);

    res.status(201).json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create station',
      error: error.message
    });
  }
});

// Update station (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const station = await Station.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    res.json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update station',
      error: error.message
    });
  }
});

export default router;

