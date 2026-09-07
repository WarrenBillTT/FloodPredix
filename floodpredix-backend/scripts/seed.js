import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Station from '../models/Station.js';
import SensorReading from '../models/SensorReading.js';
import Alert from '../models/Alert.js';
import UserSettings from '../models/UserSettings.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Station.deleteMany({});
    await SensorReading.deleteMany({});
    await Alert.deleteMany({});
    await UserSettings.deleteMany({});

    console.log('Cleared existing data...');

    // Create sample users
    const users = await User.insertMany([
      {
        name: 'Alex Morgan',
        email: 'alex.morgan@floodguard.sys',
        role: 'Station Chief',
        avatar: null,
        isActive: true
      },
      {
        name: 'Admin User',
        email: 'admin@floodpredix.com',
        role: 'Admin',
        isActive: true
      }
    ]);

    console.log('Created users...');

    // Create user settings
    for (const user of users) {
      await UserSettings.create({
        userId: user._id,
        notifications: {
          email: true,
          sms: true,
          push: false,
          minimumSeverity: 'warning-critical'
        },
        preferences: {
          language: 'en-us',
          theme: 'dark',
          timezone: 'pacific'
        }
      });
    }

    console.log('Created user settings...');

    // Create sample stations
    const stations = await Station.insertMany([
      {
        stationId: 'ST-A04',
        name: 'North River Station',
        location: 'North River Sector 7',
        sector: 'Sector 7',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        maxLevel: 5.0,
        warningLevel: 3.0,
        criticalLevel: 4.5,
        isActive: true
      },
      {
        stationId: 'ST-B12',
        name: 'East Dam Station',
        location: 'East Dam Gate 2',
        sector: 'Sector 2',
        coordinates: { latitude: 37.7849, longitude: -122.4094 },
        maxLevel: 5.0,
        warningLevel: 3.0,
        criticalLevel: 4.5,
        isActive: true
      },
      {
        stationId: 'ST-C01',
        name: 'Lowland Bridge Station',
        location: 'Lowland Bridge Area',
        sector: 'Sector 3',
        coordinates: { latitude: 37.7649, longitude: -122.4294 },
        maxLevel: 5.0,
        warningLevel: 3.0,
        criticalLevel: 4.5,
        isActive: true
      },
      {
        stationId: 'ST-D09',
        name: 'West Canal Station',
        location: 'West Canal Zone',
        sector: 'Sector 4',
        coordinates: { latitude: 37.7549, longitude: -122.4394 },
        maxLevel: 4.5,
        warningLevel: 3.0,
        criticalLevel: 4.0,
        isActive: true
      },
      {
        stationId: 'ST-F05',
        name: 'South Creek Station',
        location: 'South Creek Basin',
        sector: 'Sector 1',
        coordinates: { latitude: 37.7949, longitude: -122.3994 },
        maxLevel: 3.8,
        warningLevel: 2.5,
        criticalLevel: 3.5,
        isActive: true
      }
    ]);

    console.log('Created stations...');

    // Create sample sensor readings (last 7 days)
    const readings = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      for (const station of stations) {
        // Generate readings every 4 hours
        for (let hour = 0; hour < 24; hour += 4) {
          const timestamp = new Date(date);
          timestamp.setHours(hour, 0, 0, 0);
          
          // Vary water levels based on station
          const baseLevel = station.stationId === 'ST-C01' ? 5.5 : 
                           station.stationId === 'ST-F05' ? 4.0 :
                           station.stationId === 'ST-B12' ? 4.1 : 2.4;
          
          const waterLevel = baseLevel + (Math.random() * 0.5 - 0.25);
          const rainfall = Math.random() * 50;
          const humidity = 70 + Math.random() * 20;
          
          let status = 'normal';
          if (waterLevel >= station.criticalLevel) status = 'critical';
          else if (waterLevel >= station.warningLevel) status = 'warning';
          
          readings.push({
            stationId: station._id,
            waterLevel: parseFloat(waterLevel.toFixed(1)),
            rainfall: parseFloat(rainfall.toFixed(1)),
            humidity: parseFloat(humidity.toFixed(1)),
            flowRate: parseFloat((waterLevel * 25 + Math.random() * 10).toFixed(1)),
            status,
            timestamp
          });
        }
      }
    }
    
    await SensorReading.insertMany(readings);
    console.log('Created sensor readings...');

    // Create sample alerts
    const criticalStation = stations.find(s => s.stationId === 'ST-C01');
    const warningStation = stations.find(s => s.stationId === 'ST-B12');
    
    const alerts = [
      {
        stationId: criticalStation._id,
        severity: 'critical',
        waterLevel: 5.8,
        maxLevel: criticalStation.maxLevel,
        trend: 'rising-fast',
        forecast: '+12cm next hour',
        isActive: true,
        timeIssued: new Date(now.getTime() - 12 * 60 * 1000) // 12 mins ago
      },
      {
        stationId: warningStation._id,
        severity: 'warning',
        waterLevel: 4.2,
        maxLevel: warningStation.maxLevel,
        trend: 'stable',
        forecast: 'Peak expected 14:00',
        isActive: true,
        timeIssued: new Date(now.getTime() - 75 * 60 * 1000) // 1h 15m ago
      }
    ];

    await Alert.insertMany(alerts);
    console.log('Created alerts...');

    console.log('✅ Seed data created successfully!');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${stations.length} stations`);
    console.log(`   - ${readings.length} sensor readings`);
    console.log(`   - ${alerts.length} alerts`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

