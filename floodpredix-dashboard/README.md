# FloodPredix Dashboard

A modern, real-time flood monitoring dashboard built with React, TypeScript, Vite, and Shadcn UI. This application provides comprehensive monitoring capabilities for flood management systems with live sensor data, predictive analytics, and emergency alert systems.

## Features

- 🔐 **Google OAuth2 Authentication** - Secure login with Google Sign-In
- 📊 **Real-time Dashboard** - Live water level, rainfall, and humidity monitoring
- 📈 **Interactive Charts** - Visual data representation with Recharts
- 🗺️ **Live Map View** - Geospatial monitoring with sensor markers
- 📋 **History Log** - Comprehensive archive of flood events and recordings
- 🚨 **Alert Management** - Real-time alerts with severity levels and trends
- ⚙️ **Settings & Preferences** - User profile and notification configuration
- 🎨 **Modern UI** - Built with Shadcn UI components and Tailwind CSS

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **Recharts** - Chart library
- **@react-oauth/google** - Google OAuth integration
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, Header, DashboardLayout)
│   └── ui/              # Shadcn UI components
├── pages/               # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── History.tsx
│   ├── LiveMap.tsx
│   ├── Alerts.tsx
│   └── Settings.tsx
├── hooks/               # Custom React hooks
│   └── useAuth.tsx      # Authentication hook
├── lib/                 # Utility libraries
│   └── utils.ts         # Helper functions
├── types/               # TypeScript type definitions
│   └── index.ts
└── App.tsx              # Main application component
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google OAuth2 Client ID (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd floodpredix-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Getting Google OAuth2 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (for production)
7. Copy the Client ID and add it to your `.env` file

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth2 Client ID for authentication | Yes |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key for AI predictions | No (optional, for Prediction page) |
| `VITE_OPENROUTER_MODEL` | OpenRouter model to use (default: openai/gpt-4o) | No |

### Example `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_OPENROUTER_MODEL=openai/gpt-4o
```

**Important:** 
- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file
- For production, set these variables in your hosting platform's environment settings

## Available Pages

- **Login** (`/login`) - Google OAuth2 authentication
- **Dashboard** (`/dashboard`) - Main monitoring dashboard with metrics and charts
- **Predictions** (`/predictions`) - AI-powered flood risk analytics and predictions
- **History** (`/history`) - Historical data log with search and filters
- **Live Map** (`/live-map`) - Interactive map with sensor locations
- **Alerts** (`/alerts`) - Active alerts and warnings management
- **Settings** (`/settings`) - User profile and application preferences

## Components Used from Shadcn UI

- Button
- Card
- Input
- Table
- Select
- Badge
- Avatar
- Switch
- Sidebar
- Separator
- Dropdown Menu
- Tabs
- Label

## Development

### Adding Shadcn Components

To add more Shadcn UI components:

```bash
npx shadcn@latest add [component-name]
```

### Code Style

This project uses ESLint for code linting. Run the linter:

```bash
npm run lint
```

## License

© 2025 FloodPredix. All rights reserved.
