import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Droplet,
  CloudRain,
  Droplets,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icon in React/Vite
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { BMKGResponse, BMKGWeatherForecast, LatestData } from "@/types";

interface DashboardStats {
  waterLevel: {
    current: string;
    status: string;
  };
  rainfall: {
    intensity: number;
    unit: string;
  };
  humidity: {
    value: number;
    unit: string;
  };
  stations: {
    total: number;
    online: number;
  };
  alerts: {
    total: number;
    critical: number;
    warning: number;
  };
}

interface TrendData {
  time: string;
  level: number;
}

interface TrendsResponse {
  aggregated: TrendData[];
  perSecond: TrendData[];
  cached: boolean;
  cachedAt: string;
}

interface RecentAlert {
  id: string;
  type: string;
  title: string;
  time: string;
  description: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "critical":
    case "danger":
      return "text-red-500";
    case "warning":
    case "caution":
      return "text-yellow-500";
    default:
      return "text-primary";
  }
};

const getStatusBgColor = (status: string) => {
  switch (status) {
    case "critical":
    case "danger":
      return "bg-red-500";
    case "warning":
    case "caution":
      return "bg-yellow-500";
    default:
      return "bg-primary";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "critical":
    case "danger":
      return "Danger";
    case "warning":
    case "caution":
      return "Caution";
    default:
      return "Safe";
  }
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [period, setPeriod] = useState<"24h" | "1w" | "1m">("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingTrends, setRefreshingTrends] = useState(false);
  const [trendsCached, setTrendsCached] = useState(false);
  const [trendsCachedAt, setTrendsCachedAt] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<{
    rainfall: number;
    humidity: number;
  } | null>(null);
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  // Dev mode: Custom values for testing
  const [showRainfallModal, setShowRainfallModal] = useState(false);
  const [showHumidityModal, setShowHumidityModal] = useState(false);
  const [rainfallInputValue, setRainfallInputValue] = useState("");
  const [humidityInputValue, setHumidityInputValue] = useState("");

  // Helper function to find matching forecast based on current time
  const findMatchingForecast = useCallback(
    (forecasts: BMKGWeatherForecast[]): BMKGWeatherForecast | null => {
      const now = new Date();
      const currentHour = now.getHours();
      const nextHour = (currentHour + 1) % 24;
      // Format current date as YYYY-MM-DD
      const currentDate = now.toISOString().split("T")[0];

      // Find forecast with matching hour in local_datetime
      const matching = forecasts.find((forecast) => {
        const [date, time] = forecast.local_datetime.split(" ");
        const [hour] = time.split(":");
        return date === currentDate && parseInt(hour) === nextHour;
      });

      // If no exact match found, try to find the closest forecast
      if (!matching) {
        // Find the first forecast that is in the future
        const futureForecasts = forecasts.filter((forecast) => {
          const forecastDate = new Date(forecast.local_datetime);
          return forecastDate > now;
        });

        if (futureForecasts.length > 0) {
          // Return the closest future forecast
          return futureForecasts.sort(
            (a, b) =>
              new Date(a.local_datetime).getTime() -
              new Date(b.local_datetime).getTime()
          )[0];
        }

        // If no future forecasts, return the most recent one
        return (
          forecasts.sort(
            (a, b) =>
              new Date(b.local_datetime).getTime() -
              new Date(a.local_datetime).getTime()
          )[0] || null
        );
      }

      return matching;
    },
    []
  );

  const fetchBMKGWeather = useCallback(async () => {
    try {
      const response = (await api.fetchBMKGWeather()) as BMKGResponse;

      if (response && response.data && response.data.length > 0) {
        // Flatten all forecasts from all days
        const allForecasts: BMKGWeatherForecast[] = [];
        response.data[0].cuaca.forEach((dayForecasts) => {
          allForecasts.push(...dayForecasts);
        });

        // Find matching forecast
        const matchingForecast = findMatchingForecast(allForecasts);

        if (matchingForecast) {
          setWeatherData({
            rainfall: matchingForecast.tp || 0,
            humidity: matchingForecast.hu || 0,
          });
        } else {
          console.warn("No matching forecast found, using first available");
          if (allForecasts.length > 0) {
            setWeatherData({
              rainfall: allForecasts[0].tp || 0,
              humidity: allForecasts[0].hu || 0,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch BMKG weather data:", err);
      // Don't set error state, just fallback to backend stats
      // The UI will use stats data as fallback
    }
  }, [findMatchingForecast]);

  useEffect(() => {
    fetchDashboardData();
    fetchBMKGWeather();
    // Poll for updates every 10 seconds to show real-time IoT data
    const interval = setInterval(fetchDashboardData, 10000);
    // Poll for weather data every 15 minutes (weather forecasts update less frequently)
    const weatherInterval = setInterval(fetchBMKGWeather, 15 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(weatherInterval);
    };
  }, [fetchBMKGWeather]);

  useEffect(() => {
    fetchTrends(period);
    // Poll for trend updates every 30 seconds (using cached endpoint)
    const interval = setInterval(() => fetchTrends(period), 30000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, alertsRes, latestDataRes] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentAlerts(5),
        api.getLatestData("PROTOTYPE").catch(() => ({ success: false })),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data as DashboardStats);
      }

      if (alertsRes.success && alertsRes.data) {
        setRecentAlerts(alertsRes.data as RecentAlert[]);
      }

      if (
        latestDataRes.success &&
        "data" in latestDataRes &&
        latestDataRes.data
      ) {
        const data = latestDataRes.data as LatestData | LatestData[];
        // Handle both single object and array response
        const latest =
          Array.isArray(data) && data.length > 0
            ? data[0]
            : Array.isArray(data)
            ? null
            : data;
        setLatestData(latest);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch dashboard data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async (period: "24h" | "1w" | "1m") => {
    try {
      const response = await api.getTrends(period);
      if (response.success && response.data) {
        const trendsData = response.data as TrendsResponse;
        // Combine aggregated and per-second data
        const combinedTrends = [
          ...trendsData.aggregated,
          ...trendsData.perSecond,
        ].sort((a, b) => {
          // Sort by time for proper chart display
          return a.time.localeCompare(b.time);
        });
        setTrends(combinedTrends);
        setTrendsCached(trendsData.cached);
        setTrendsCachedAt(trendsData.cachedAt);
      }
    } catch (err) {
      console.error("Failed to fetch trends:", err);
    }
  };

  const handleRefreshTrends = async () => {
    try {
      setRefreshingTrends(true);
      const response = await api.refreshTrends(period);
      if (response.success && response.data) {
        const trendsData = response.data as TrendsResponse;
        // Combine aggregated and per-second data
        const combinedTrends = [
          ...trendsData.aggregated,
          ...trendsData.perSecond,
        ].sort((a, b) => {
          // Sort by time for proper chart display
          return a.time.localeCompare(b.time);
        });
        setTrends(combinedTrends);
        setTrendsCached(false);
        setTrendsCachedAt(new Date().toISOString());
      }
    } catch (err) {
      console.error("Failed to refresh trends:", err);
    } finally {
      setRefreshingTrends(false);
    }
  };

  const waterLevel = parseFloat(stats?.waterLevel.current || "0");
  const status = stats?.waterLevel.status || "normal";
  // Calculate percentage: 0-5cm = 0-50%, 5-10cm = 50-100%, >10cm = 100%+
  const statusPercentage =
    waterLevel < 0.05
      ? Math.min((waterLevel / 0.05) * 50, 50) // 0-5cm maps to 0-50%
      : waterLevel < 0.1
      ? Math.min(50 + ((waterLevel - 0.05) / 0.05) * 50, 100) // 5-10cm maps to 50-100%
      : 100; // >10cm = 100%

  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="lg:col-span-2 h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400">
          {error}
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-sm text-muted-foreground">
            System Operational • Monday, 12 Oct • 10:42 AM
          </p>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Water Level Status - Large Card */}
        <Card className="lg:col-span-2 bg-linear-to-br from-[#1a2c22] to-[#0d1811] border-[#254632] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-primary" />
                <span className="text-primary font-medium text-base">
                  Water Level Status
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Current Depth
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {stats?.waterLevel.current
                      ? parseFloat(stats.waterLevel.current).toFixed(3)
                      : "0.000"}
                  </span>
                  <span className="text-lg text-primary font-bold">m</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (
                    {stats?.waterLevel.current
                      ? (parseFloat(stats.waterLevel.current) * 100).toFixed(1)
                      : "0.0"}{" "}
                    cm)
                  </span>
                </div>
              </div>
            </div>
            <h2
              className={`text-5xl font-bold mb-6 leading-tight ${getStatusColor(
                status
              )}`}
            >
              {getStatusText(status)}
            </h2>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full ${getStatusBgColor(status)}`}
                style={{ width: `${statusPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0cm (Danger)</span>
              <span>Caution: 5cm</span>
              <span>Safe: 10cm+</span>
            </div>
          </CardContent>
        </Card>

        {/* Rainfall Intensity */}
        <Card className="bg-[#1a2c22] border-[#254632]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CloudRain className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                {latestData?.hasCustomRainfall && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500/20 text-yellow-400 text-xs"
                  >
                    Custom
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className="bg-[#1e293b] text-muted-foreground"
                >
                  Last 1h
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRainfallInputValue(
                      latestData?.hasCustomRainfall
                        ? latestData.rainfall.toString()
                        : ""
                    );
                    setShowRainfallModal(true);
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Dev: Set custom value"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Rainfall Intensity
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-white">
                {latestData?.hasCustomRainfall
                  ? latestData.rainfall.toFixed(1)
                  : weatherData?.rainfall !== undefined
                  ? weatherData.rainfall.toFixed(1)
                  : latestData?.rainfall !== undefined
                  ? latestData.rainfall.toFixed(1)
                  : stats?.rainfall.intensity || 0}
              </span>
              <span className="text-lg text-muted-foreground">
                {stats?.rainfall.unit || "mm"}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">-2%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const rainfall = latestData?.hasCustomRainfall
                  ? latestData.rainfall
                  : weatherData?.rainfall !== undefined
                  ? weatherData.rainfall
                  : latestData?.rainfall !== undefined
                  ? latestData.rainfall
                  : stats?.rainfall.intensity || 0;
                return rainfall > 0 ? "Rain detected" : "No rain detected";
              })()}
            </p>
          </CardContent>
        </Card>

        {/* Air Humidity */}
        <Card className="bg-[#1a2c22] border-[#254632]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex items-center gap-2">
                {latestData?.hasCustomHumidity && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500/20 text-yellow-400 text-xs"
                  >
                    Custom
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className="bg-[#1e293b] text-muted-foreground"
                >
                  Live
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHumidityInputValue(
                      latestData?.hasCustomHumidity
                        ? latestData.humidity.toString()
                        : ""
                    );
                    setShowHumidityModal(true);
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Dev: Set custom value"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">Air Humidity</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-white">
                {latestData?.hasCustomHumidity
                  ? Math.round(latestData.humidity)
                  : weatherData?.humidity !== undefined
                  ? Math.round(weatherData.humidity)
                  : latestData?.humidity !== undefined
                  ? Math.round(latestData.humidity)
                  : stats?.humidity.value || 0}
              </span>
              <span className="text-lg text-muted-foreground">
                {stats?.humidity.unit || "%"}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-500">+5%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const humidity = latestData?.hasCustomHumidity
                  ? latestData.humidity
                  : weatherData?.humidity !== undefined
                  ? weatherData.humidity
                  : latestData?.humidity !== undefined
                  ? latestData.humidity
                  : stats?.humidity.value || 0;
                return humidity > 80
                  ? "High humidity levels recorded"
                  : "Normal humidity levels";
              })()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Custom Value Modals */}
      {/* Rainfall Modal */}
      <Dialog open={showRainfallModal} onOpenChange={setShowRainfallModal}>
        <DialogContent className="bg-[#1e293b] border-[#334155]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Set Custom Rainfall
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Dev only: Set a custom rainfall value for testing. Leave empty to
              use real-time data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rainfall-input" className="text-white">
                Rainfall Intensity (mm)
              </Label>
              <Input
                id="rainfall-input"
                type="number"
                placeholder="Enter custom rainfall value"
                value={rainfallInputValue}
                onChange={(e) => setRainfallInputValue(e.target.value)}
                step="0.1"
                className="bg-[#0f172a] border-[#334155] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.setCustomValues({ rainfall: null });
                  await fetchDashboardData();
                  setShowRainfallModal(false);
                  setRainfallInputValue("");
                } catch (err) {
                  console.error("Failed to clear custom rainfall:", err);
                }
              }}
              className="border-[#334155] text-muted-foreground hover:text-white"
            >
              Clear & Use Real-time
            </Button>
            <Button
              onClick={async () => {
                const value = parseFloat(rainfallInputValue);
                if (!isNaN(value)) {
                  try {
                    await api.setCustomValues({ rainfall: value });
                    await fetchDashboardData();
                    setShowRainfallModal(false);
                  } catch (err) {
                    console.error("Failed to set custom rainfall:", err);
                  }
                } else if (rainfallInputValue === "") {
                  try {
                    await api.setCustomValues({ rainfall: null });
                    await fetchDashboardData();
                    setShowRainfallModal(false);
                  } catch (err) {
                    console.error("Failed to clear custom rainfall:", err);
                  }
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Set Value
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Humidity Modal */}
      <Dialog open={showHumidityModal} onOpenChange={setShowHumidityModal}>
        <DialogContent className="bg-[#1e293b] border-[#334155]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Set Custom Humidity
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Dev only: Set a custom humidity value for testing. Leave empty to
              use real-time data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="humidity-input" className="text-white">
                Air Humidity (%)
              </Label>
              <Input
                id="humidity-input"
                type="number"
                placeholder="Enter custom humidity value (0-100)"
                value={humidityInputValue}
                onChange={(e) => setHumidityInputValue(e.target.value)}
                min="0"
                max="100"
                step="1"
                className="bg-[#0f172a] border-[#334155] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.setCustomValues({ humidity: null });
                  await fetchDashboardData();
                  setShowHumidityModal(false);
                  setHumidityInputValue("");
                } catch (err) {
                  console.error("Failed to clear custom humidity:", err);
                }
              }}
              className="border-[#334155] text-muted-foreground hover:text-white"
            >
              Clear & Use Real-time
            </Button>
            <Button
              onClick={async () => {
                const value = parseFloat(humidityInputValue);
                if (!isNaN(value) && value >= 0 && value <= 100) {
                  try {
                    await api.setCustomValues({ humidity: value });
                    await fetchDashboardData();
                    setShowHumidityModal(false);
                  } catch (err) {
                    console.error("Failed to set custom humidity:", err);
                  }
                } else if (humidityInputValue === "") {
                  try {
                    await api.setCustomValues({ humidity: null });
                    await fetchDashboardData();
                    setShowHumidityModal(false);
                  } catch (err) {
                    console.error("Failed to clear custom humidity:", err);
                  }
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Set Value
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Charts and Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Water Level Trends */}
        <Card className="lg:col-span-2 bg-[#1a2c22] border-[#254632]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Water Level Trends</CardTitle>
                <CardDescription>
                  Monitor water level changes over time
                  {trendsCached && trendsCachedAt && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Cached)
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshTrends}
                  disabled={refreshingTrends}
                  className="bg-[#1e293b] border-[#334155] hover:bg-[#334155]"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshingTrends ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
                <Tabs
                  value={period}
                  onValueChange={(value) =>
                    setPeriod(value as "24h" | "1w" | "1m")
                  }
                  className="w-auto"
                >
                  <TabsList className="bg-[#1e293b]">
                    <TabsTrigger
                      value="24h"
                      className="data-[state=active]:bg-primary"
                    >
                      24H
                    </TabsTrigger>
                    <TabsTrigger
                      value="1w"
                      className="data-[state=active]:bg-primary"
                    >
                      1W
                    </TabsTrigger>
                    <TabsTrigger
                      value="1m"
                      className="data-[state=active]:bg-primary"
                    >
                      1M
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={
                  trends.length > 0 ? trends : [{ time: "00:00", level: 0 }]
                }
              >
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#36e27b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#36e27b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => {
                    return [
                      `${value.toFixed(3)}m (${(value * 100).toFixed(1)}cm)`,
                      "Water Level",
                    ];
                  }}
                  labelFormatter={(label: string) => {
                    return `Time: ${label}`;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="level"
                  stroke="#36e27b"
                  fillOpacity={1}
                  fill="url(#colorLevel)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live Monitoring Map */}
        <Card className="bg-[#1a2c22] border-[#254632]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Live Monitoring</CardTitle>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-primary">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-lg overflow-hidden">
              <MapContainer
                center={[-6.1898754779, 106.7913803016]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="rounded-lg"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[-6.1898754779, 106.7913803016]}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">IoT Location</p>
                      <p className="text-muted-foreground">Prototype Station</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card className="bg-[#1a2c22] border-[#254632]">
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent alerts</p>
          ) : (
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 ${
                      alert.type === "warning"
                        ? "bg-yellow-500"
                        : alert.type === "info"
                        ? "bg-slate-500"
                        : "bg-primary"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {alert.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {alert.time} • {alert.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
