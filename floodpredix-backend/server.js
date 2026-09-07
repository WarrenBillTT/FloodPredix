import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import historyRoutes from "./routes/history.js";
import alertsRoutes from "./routes/alerts.js";
import stationsRoutes from "./routes/stations.js";
import settingsRoutes from "./routes/settings.js";
import mapRoutes from "./routes/map.js";
import iotRoutes from "./routes/iot.js";
import latestDataRoutes from "./routes/latestData.js";
import predictionsRoutes from "./routes/predictions.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FloodPredix API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/stations", stationsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/", iotRoutes);
app.use("/api/latest-data", latestDataRoutes);
app.use("/api/predictions", predictionsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
