# FloodPredix Backend API

Express.js backend with MongoDB for the FloodPredix Dashboard application.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the `backend` directory:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/floodpredix
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Seed initial data (optional):**

   ```bash
   node backend/scripts/seed.js
   ```

5. **Start the server:**

   ```bash
   npm run dev
   ```

   Or for production:

   ```bash
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics (requires auth)
- `GET /api/dashboard/trends?period=24h|1w|1m` - Get water level trends (requires auth)
- `GET /api/dashboard/recent-alerts?limit=5` - Get recent alerts (requires auth)

### History

- `GET /api/history?page=1&limit=10&search=&status=&startDate=&endDate=&stationId=` - Get history records (requires auth)
- `GET /api/history/export?startDate=&endDate=&status=` - Export history as CSV (requires auth)

### Alerts

- `GET /api/alerts?severity=&search=&limit=50` - Get all alerts (requires auth)
- `GET /api/alerts/:id` - Get alert by ID (requires auth)
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert (requires auth)
- `POST /api/alerts/:id/resolve` - Resolve alert (requires auth)

### Stations

- `GET /api/stations?active=true` - Get all stations (requires auth)
- `GET /api/stations/:id` - Get station by ID (requires auth)
- `GET /api/stations/:id/readings?limit=100&startDate=&endDate=` - Get station readings (requires auth)
- `POST /api/stations` - Create station (Admin only)
- `PUT /api/stations/:id` - Update station (Admin only)

### Settings

- `GET /api/settings` - Get user settings (requires auth)
- `PUT /api/settings` - Update user settings (requires auth)
- `PUT /api/settings/profile` - Update user profile (requires auth)
- `DELETE /api/settings/account` - Delete user account (requires auth)

### Map

- `GET /api/map/stations` - Get all stations for map view (requires auth)
- `GET /api/map/stations/:id` - Get station details for map (requires auth)

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Data Models

### User

- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, optional - for OAuth users)
- `avatar` (String, optional)
- `role` (String, enum: Admin, Station Chief, Operator, User)
- `googleId` (String, optional)
- `isActive` (Boolean, default: true)

### Station

- `stationId` (String, required, unique)
- `name` (String, required)
- `location` (String, required)
- `sector` (String, required)
- `coordinates` (Object: {latitude, longitude})
- `maxLevel` (Number, default: 5.0)
- `warningLevel` (Number, default: 3.0)
- `criticalLevel` (Number, default: 4.5)
- `isActive` (Boolean, default: true)

### SensorReading

- `stationId` (ObjectId, ref: Station)
- `waterLevel` (Number, required)
- `rainfall` (Number, default: 0)
- `humidity` (Number, 0-100)
- `flowRate` (Number, optional)
- `temperature` (Number, optional)
- `status` (String, enum: normal, warning, critical)
- `timestamp` (Date, required)

### Alert

- `stationId` (ObjectId, ref: Station)
- `severity` (String, enum: critical, warning, watch)
- `waterLevel` (Number, required)
- `maxLevel` (Number, required)
- `trend` (String, enum: rising, rising-fast, rising-slowly, stable, receding)
- `forecast` (String, optional)
- `isActive` (Boolean, default: true)
- `acknowledgedBy` (ObjectId, ref: User)
- `acknowledgedAt` (Date)
- `resolvedAt` (Date)
- `timeIssued` (Date, required)

### UserSettings

- `userId` (ObjectId, ref: User, unique)
- `notifications` (Object: {email, sms, push, minimumSeverity})
- `preferences` (Object: {language, theme, timezone})
