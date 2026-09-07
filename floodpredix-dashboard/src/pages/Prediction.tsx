import { useEffect, useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  CloudRain,
  Droplets,
  Download,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  FloodRiskAssessment,
  FloodScenario,
  HydrologicalProjection,
  TrendData,
  LatestData,
  BMKGResponse,
  BMKGWeatherForecast,
} from "@/types";

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
}

export function Prediction() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskAssessment, setRiskAssessment] =
    useState<FloodRiskAssessment | null>(null);
  const [scenarios, setScenarios] = useState<FloodScenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const hasFetchedScenarios = useRef(false);
  const [projectionData, setProjectionData] = useState<
    HydrologicalProjection[]
  >([]);
  const [forecastPeriod, setForecastPeriod] = useState<"12H" | "24H" | "48H">(
    "12H"
  );
  const [rainfall, setRainfall] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [rainfallTrend, setRainfallTrend] = useState<
    "increasing" | "decreasing" | "stable"
  >("stable");
  const [bmkgForecasts, setBmkgForecasts] = useState<BMKGWeatherForecast[]>([]);

  // Helper function to find matching BMKG forecast for a specific time
  const findBMKGForecast = useCallback(
    (
      targetTime: Date,
      forecasts: BMKGWeatherForecast[]
    ): BMKGWeatherForecast | null => {
      if (forecasts.length === 0) return null;

      // Find the closest forecast to target time
      let closest: BMKGWeatherForecast | null = null;
      let minDiff = Infinity;

      forecasts.forEach((forecast) => {
        const forecastTime = new Date(forecast.local_datetime);
        const diff = Math.abs(forecastTime.getTime() - targetTime.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closest = forecast;
        }
      });

      return closest;
    },
    []
  );

  // Fetch BMKG weather data
  const fetchBMKGWeather = useCallback(async () => {
    try {
      const response = (await api.fetchBMKGWeather()) as BMKGResponse;

      if (response && response.data && response.data.length > 0) {
        // Flatten all forecasts from all days
        const allForecasts: BMKGWeatherForecast[] = [];
        response.data[0].cuaca.forEach((dayForecasts) => {
          allForecasts.push(...dayForecasts);
        });

        setBmkgForecasts(allForecasts);
      }
    } catch (err) {
      console.error("Failed to fetch BMKG weather data:", err);
      // Don't set error state, just fallback to current values
    }
  }, []);

  // Enhanced prediction algorithm - calculates change for a single hour
  const predictWaterLevelChange = useCallback(
    (
      _currentLevel: number, // Not used but kept for potential future use
      rainfall: number, // mm/h from BMKG
      humidity: number, // % from BMKG
      trend: number // current trend per hour
    ): number => {
      // Base change from trend (per hour)
      let change = trend;

      // Rainfall impact: Higher rainfall = faster water level rise
      // 1mm rainfall ≈ 0.0001m water level increase per hour (simplified model)
      // Heavy rainfall (>50mm) has exponential impact
      let rainfallImpact = 0;
      if (rainfall > 0) {
        if (rainfall > 50) {
          // Heavy rainfall: exponential impact
          rainfallImpact = (rainfall / 10) * 0.0001; // 50mm = 0.0005m/hour
        } else if (rainfall > 25) {
          // Moderate rainfall
          rainfallImpact = (rainfall / 10) * 0.00008; // 25mm = 0.0002m/hour
        } else {
          // Light rainfall
          rainfallImpact = (rainfall / 10) * 0.00005; // 10mm = 0.00005m/hour
        }
      }

      // Humidity impact: High humidity (>80%) reduces evaporation, increases retention
      // Low humidity (<60%) increases evaporation, reduces water level
      let humidityFactor = 1.0;
      if (humidity > 80) {
        // High humidity: less evaporation, more retention
        humidityFactor = 1.05 + (humidity - 80) / 200; // 1.05 to 1.15
      } else if (humidity < 60) {
        // Low humidity: more evaporation
        humidityFactor = 0.95 - (60 - humidity) / 200; // 0.95 to 0.85
      }

      // Combine factors
      change = change + rainfallImpact;
      change = change * humidityFactor;

      return change;
    },
    []
  );

  // Fetch latest data and trends
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [latestDataRes, statsRes, trendsRes] = await Promise.all([
        api.getLatestData("PROTOTYPE").catch(() => ({ success: false })),
        api.getDashboardStats(),
        api.getTrends("24h"),
      ]);

      // Use latest data if available, otherwise fallback to stats
      if (
        latestDataRes.success &&
        "data" in latestDataRes &&
        latestDataRes.data
      ) {
        const data = latestDataRes.data as LatestData | LatestData[];
        const latest =
          Array.isArray(data) && data.length > 0
            ? data[0]
            : Array.isArray(data)
            ? null
            : data;

        if (latest) {
          setLatestData(latest);
          setRainfall(latest.rainfall);
          setHumidity(latest.humidity);

          // Calculate trends (simplified - in real app, compare with previous values)
          if (latest.rainfall > 30) {
            setRainfallTrend("increasing");
          } else if (latest.rainfall < 10) {
            setRainfallTrend("decreasing");
          } else {
            setRainfallTrend("stable");
          }
        }
      } else if (statsRes.success && statsRes.data) {
        // Fallback to dashboard stats
        const dashboardStats = statsRes.data as DashboardStats;
        setStats(dashboardStats);

        const currentRainfall = dashboardStats.rainfall?.intensity || 0;
        const currentHumidity = dashboardStats.humidity?.value || 0;

        setRainfall(currentRainfall);
        setHumidity(currentHumidity);

        if (currentRainfall > 30) {
          setRainfallTrend("increasing");
        } else if (currentRainfall < 10) {
          setRainfallTrend("decreasing");
        } else {
          setRainfallTrend("stable");
        }
      }

      if (trendsRes.success && trendsRes.data) {
        const trendsData = trendsRes.data as {
          aggregated: TrendData[];
          perSecond: TrendData[];
        };
        const allTrends = [
          ...trendsData.aggregated,
          ...trendsData.perSecond,
        ].sort((a, b) => a.time.localeCompare(b.time));
        setTrends(allTrends);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch prediction data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load prediction data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBMKGWeather();
    // Poll for weather data every 15 minutes
    const weatherInterval = setInterval(fetchBMKGWeather, 15 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, [fetchBMKGWeather]);

  // Fetch AI predictions (for manual refresh)
  const fetchAIPredictions = useCallback(async () => {
    // Reset the ref to allow fetching again (for manual refresh)
    hasFetchedScenarios.current = false;

    const waterLevel = latestData
      ? latestData.waterLevel
      : stats
      ? parseFloat(stats.waterLevel.current || "0")
      : 0;

    if (waterLevel === 0 && !latestData && !stats) {
      // Use fallback immediately if no data
      const fallback = calculateFloodRiskFallback(
        waterLevel,
        rainfall,
        humidity
      );
      setRiskAssessment(fallback);
      setScenarios(fallback.scenarios);
      hasFetchedScenarios.current = true;
      return;
    }

    setScenariosLoading(true);
    try {
      const response = await api.getFloodRiskPrediction({
        waterLevel,
        rainfall,
        humidity,
        trends,
      });

      if (response.success && response.data) {
        const prediction = response.data as FloodRiskAssessment & {
          scenarios: FloodScenario[];
        };
        setRiskAssessment({
          riskLevel: prediction.riskLevel,
          confidence: prediction.confidence,
          probability24h: prediction.probability24h,
        });

        setScenarios(prediction.scenarios || []);
      } else {
        throw new Error(response.message || "Failed to get prediction");
      }
      hasFetchedScenarios.current = true;
    } catch (err) {
      console.error("Failed to fetch AI predictions:", err);
      // Use fallback calculation
      const fallback = calculateFloodRiskFallback(
        waterLevel,
        rainfall,
        humidity
      );
      setRiskAssessment(fallback);
      setScenarios(fallback.scenarios || []);
      hasFetchedScenarios.current = true;
    } finally {
      setScenariosLoading(false);
    }
  }, [latestData, stats, rainfall, humidity, trends]);

  // Generate projection chart data with BMKG integration
  const generateProjectionData = useCallback(() => {
    if (trends.length === 0) return;

    const now = new Date();

    // Calculate current trend (change per hour)
    // Use the difference between last two points to get recent trend
    let trend = 0;
    if (trends.length > 1) {
      // Use last 2-3 points for more stable trend calculation
      const recentPoints = trends.slice(-3);
      if (recentPoints.length >= 2) {
        const firstLevel = recentPoints[0].level;
        const lastLevel = recentPoints[recentPoints.length - 1].level;
        // Assume points are roughly 1 hour apart (or adjust based on actual time difference)
        const timeDiff = recentPoints.length - 1;
        trend = timeDiff > 0 ? (lastLevel - firstLevel) / timeDiff : 0;
      }
    }

    // Cap the trend to prevent extreme predictions
    // If trend is too negative, limit it to prevent immediate drop to 0
    if (trend < -0.01) {
      trend = -0.01; // Maximum decrease of 1cm per hour
    }

    // Get last observed data points (historical)
    const observedData: HydrologicalProjection[] = [];
    const recentTrends = trends.slice(-12); // Last 12 data points

    recentTrends.forEach((trend, index) => {
      const hoursAgo = recentTrends.length - index - 1;
      observedData.push({
        time: hoursAgo === 0 ? "NOW" : `-${hoursAgo}H`,
        observed: trend.level,
        predicted: 0,
      });
    });

    const lastObserved = observedData[observedData.length - 1].observed;

    // Determine number of future points based on forecast period
    let futurePoints = 6; // Default for 12H
    let hoursPerPoint = 2;
    if (forecastPeriod === "24H") {
      futurePoints = 12;
      hoursPerPoint = 2;
    } else if (forecastPeriod === "48H") {
      futurePoints = 24;
      hoursPerPoint = 2;
    }

    // Generate predicted values using BMKG forecasts
    const predictedData: HydrologicalProjection[] = [];
    let currentPredictedLevel = lastObserved;

    for (let i = 1; i <= futurePoints; i++) {
      const hoursAhead = i * hoursPerPoint;
      const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      // Find matching BMKG forecast for this future time
      const matchingForecast = findBMKGForecast(futureTime, bmkgForecasts);

      // Use forecast data if available, otherwise use current values
      const forecastRainfall = matchingForecast
        ? matchingForecast.tp || 0
        : rainfall;
      const forecastHumidity = matchingForecast
        ? matchingForecast.hu || 0
        : humidity;

      // Calculate change for this time period (accumulate from previous prediction)
      // For each hour in this period, calculate the change and accumulate
      for (let hour = 0; hour < hoursPerPoint; hour++) {
        const change = predictWaterLevelChange(
          currentPredictedLevel,
          forecastRainfall,
          forecastHumidity,
          trend
        );
        currentPredictedLevel = currentPredictedLevel + change;
        // Ensure non-negative but allow small positive values
        currentPredictedLevel = Math.max(0, currentPredictedLevel);
      }

      // Apply safeguards to ensure realistic predictions
      // If we have rainfall, ensure the level reflects it
      if (forecastRainfall > 0) {
        const minIncrease = (forecastRainfall / 10) * hoursPerPoint * 0.0001;
        // Ensure prediction is at least lastObserved + rainfall impact
        if (currentPredictedLevel < lastObserved + minIncrease) {
          currentPredictedLevel = lastObserved + minIncrease;
        }
      } else {
        // If no rainfall and negative trend, allow gradual decrease but maintain minimum
        // Don't let it drop below 0.005m (0.5cm) unless lastObserved is already lower
        const minLevel = Math.min(lastObserved, 0.005);
        if (currentPredictedLevel < minLevel) {
          currentPredictedLevel = minLevel;
        }
      }

      // If trend is positive, ensure we're not below the starting level
      if (trend > 0 && currentPredictedLevel < lastObserved) {
        currentPredictedLevel = lastObserved + trend * hoursAhead * 0.5;
      }

      predictedData.push({
        time: `+${hoursAhead}H`,
        observed: 0,
        predicted: currentPredictedLevel,
        rainfall: forecastRainfall,
        humidity: forecastHumidity,
      });
    }

    // Combine observed and predicted
    const combined = [...observedData];
    predictedData.forEach((point) => {
      const existing = combined.find((p) => p.time === point.time);
      if (existing) {
        existing.predicted = point.predicted;
      } else {
        combined.push(point);
      }
    });

    setProjectionData(combined);
  }, [
    trends,
    forecastPeriod,
    bmkgForecasts,
    rainfall,
    humidity,
    findBMKGForecast,
    predictWaterLevelChange,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Only fetch if we have data and haven't fetched scenarios yet
    if (
      (latestData || stats) &&
      trends.length > 0 &&
      !hasFetchedScenarios.current
    ) {
      const waterLevel = latestData
        ? latestData.waterLevel
        : stats
        ? parseFloat(stats.waterLevel.current || "0")
        : 0;

      // Mark as fetched immediately to prevent re-runs
      hasFetchedScenarios.current = true;

      if (waterLevel === 0 && !latestData && !stats) {
        // Use fallback immediately if no data
        const fallback = calculateFloodRiskFallback(
          waterLevel,
          rainfall,
          humidity
        );
        setRiskAssessment(fallback);
        setScenarios(fallback.scenarios);
        return;
      }

      setScenariosLoading(true);
      api
        .getFloodRiskPrediction({
          waterLevel,
          rainfall,
          humidity,
          trends,
        })
        .then((response) => {
          if (response.success && response.data) {
            const prediction = response.data as FloodRiskAssessment & {
              scenarios: FloodScenario[];
            };
            setRiskAssessment({
              riskLevel: prediction.riskLevel,
              confidence: prediction.confidence,
              probability24h: prediction.probability24h,
            });
            setScenarios(prediction.scenarios || []);
          } else {
            throw new Error(response.message || "Failed to get prediction");
          }
        })
        .catch((err: unknown) => {
          console.error("Failed to fetch AI predictions:", err);
          const fallback = calculateFloodRiskFallback(
            waterLevel,
            rainfall,
            humidity
          );
          setRiskAssessment(fallback);
          setScenarios(fallback.scenarios || []);
        })
        .finally(() => {
          setScenariosLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestData, stats, trends.length, rainfall, humidity]);

  useEffect(() => {
    if ((latestData || stats) && trends.length > 0) {
      generateProjectionData();
    }
  }, [
    latestData,
    stats,
    trends,
    forecastPeriod,
    bmkgForecasts,
    rainfall,
    humidity,
    generateProjectionData,
  ]);

  // Fallback risk calculation
  function calculateFloodRiskFallback(
    waterLevel: number,
    rainfall: number,
    humidity: number
  ): FloodRiskAssessment & { scenarios: FloodScenario[] } {
    let riskScore = 0;

    if (waterLevel < 0.05) riskScore += 40;
    else if (waterLevel < 0.1) riskScore += 20;

    if (rainfall > 50) riskScore += 30;
    else if (rainfall > 25) riskScore += 15;

    if (humidity > 90) riskScore += 30;
    else if (humidity > 80) riskScore += 15;

    const riskLevel =
      riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
    const confidence = Math.min(95, 60 + riskScore);
    const probability24h = Math.min(95, riskScore + (rainfall > 30 ? 20 : 0));

    const scenarios: FloodScenario[] = [
      {
        title: "River Bank Breach",
        probability:
          riskLevel === "high" ? 75 : riskLevel === "medium" ? 40 : 15,
        description:
          riskLevel === "high"
            ? "Water levels predicted to exceed embankment capacity at Sector 7. Immediate evacuation prep advised."
            : "Potential overflow if conditions worsen.",
        severity: riskLevel === "high" ? "critical" : "warning",
      },
      {
        title: "Urban Drainage Overflow",
        probability: rainfall > 30 ? 40 : 20,
        description:
          "High rainfall intensity may overwhelm city drainage in low-lying areas (Zone B).",
        severity: "warning",
      },
      {
        title: "Rapid Water Recession",
        probability: 15,
        description:
          "Optimistic scenario if rainfall ceases abruptly within the next hour.",
        severity: "info",
      },
    ];

    return { riskLevel, confidence, probability24h, scenarios };
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  const getRiskBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Analytics & Prediction
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <p className="text-sm text-muted-foreground">
              AI Model v2.4 Active • Forecast for next 48 Hours
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="bg-[#1a2c22] border-[#334155] hover:bg-[#254632]"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Top Row Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flood Risk Assessment - Large Card */}
        <Card className="lg:col-span-2 bg-[#1a2c22] border-[#254632] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-red-900/30 via-green-900/20 to-transparent opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(127,29,29,0.9) 0%, rgba(17,33,23,0) 50%, rgba(17,33,23,0.8) 100%)",
            }}
          />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-xs text-red-400 uppercase tracking-wide font-medium">
                  Flood Risk Assessment
                </span>
              </div>
              <Badge className="bg-white/10 backdrop-blur-sm border border-white/20 text-white">
                Confidence {riskAssessment?.confidence || 94}%
              </Badge>
            </div>

            <h2
              className={`text-5xl font-bold mb-2 ${getRiskColor(
                riskAssessment?.riskLevel || "high"
              )}`}
            >
              {riskAssessment?.riskLevel === "high"
                ? "High Risk"
                : riskAssessment?.riskLevel === "medium"
                ? "Medium Risk"
                : "Low Risk"}
            </h2>

            <p className="text-sm text-white/70 mb-6">
              Based on multi-sensor predictive data
            </p>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white/90">
                  Probability of Flood (24h)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {riskAssessment?.probability24h || 87}
                  </span>
                  <span className="text-lg text-red-400 font-bold">%</span>
                </div>
              </div>

              {/* Progress Bar with Zones */}
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-green-500/30" />
                  <div className="flex-1 bg-yellow-500/30" />
                  <div className="flex-1 bg-red-500/30" />
                </div>
                <div
                  className={`absolute h-full ${getRiskBgColor(
                    riskAssessment?.riskLevel || "high"
                  )} rounded-full shadow-lg`}
                  style={{
                    width: `${Math.min(
                      100,
                      riskAssessment?.probability24h || 87
                    )}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-white/50">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>Critical</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forecasted Rainfall */}
        <Card className="bg-[#1a2c22] border-[#3b82f6] border-l-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CloudRain className="h-6 w-6 text-blue-500" />
              </div>
              <Badge className="bg-[#1e293b] text-muted-foreground">
                Next 24h
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Forecasted Rainfall
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-white">
                {rainfall.toFixed(0)}
              </span>
              <span className="text-lg text-muted-foreground">mm</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {rainfallTrend === "increasing" ? (
                <>
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                    Increasing
                  </Badge>
                </>
              ) : rainfallTrend === "decreasing" ? (
                <>
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    Decreasing
                  </Badge>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 text-gray-500" />
                  <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                    Stable
                  </Badge>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Heavy precipitation expected in upper catchment.
            </p>
          </CardContent>
        </Card>

        {/* Projected Humidity */}
        <Card className="bg-[#1a2c22] border-[#a855f7] border-l-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-purple-500" />
              </div>
              <Badge className="bg-[#1e293b] text-muted-foreground">
                Trend
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Projected Humidity
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-white">
                {Math.round(humidity)}
              </span>
              <span className="text-lg text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-500 font-medium">
                Peak 18:00
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Saturation levels nearing critical mass.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hydrological Projection Model */}
        <Card className="lg:col-span-2 bg-[#1a2c22] border-[#254632]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Hydrological Projection Model</CardTitle>
                <Badge className="bg-primary text-black">Live</Badge>
              </div>
              <Tabs
                value={forecastPeriod}
                onValueChange={(value) =>
                  setForecastPeriod(value as "12H" | "24H" | "48H")
                }
              >
                <TabsList className="bg-[#1e293b]">
                  <TabsTrigger
                    value="12H"
                    className="data-[state=active]:bg-[#334155]"
                  >
                    12H Forecast
                  </TabsTrigger>
                  <TabsTrigger
                    value="24H"
                    className="data-[state=active]:bg-[#334155]"
                  >
                    24H
                  </TabsTrigger>
                  <TabsTrigger
                    value="48H"
                    className="data-[state=active]:bg-[#334155]"
                  >
                    48H
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              Observed vs. Predicted Water Levels (Based on BMKG Rainfall &
              Humidity Forecasts)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tick={{ fill: "#94a3b8" }}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string, props: unknown) => {
                    const payload = props as {
                      payload?: HydrologicalProjection;
                    };
                    if (name === "Observed Data") {
                      return [
                        `${value.toFixed(3)}m (${(value * 100).toFixed(1)}cm)`,
                        "Observed Water Level",
                      ];
                    } else if (name === "AI Prediction") {
                      const rainfall = payload.payload?.rainfall;
                      const humidity = payload.payload?.humidity;
                      let tooltipText = `${value.toFixed(3)}m (${(
                        value * 100
                      ).toFixed(1)}cm)`;
                      if (rainfall !== undefined) {
                        tooltipText += `\nRainfall: ${rainfall.toFixed(1)}mm`;
                      }
                      if (humidity !== undefined) {
                        tooltipText += `\nHumidity: ${Math.round(humidity)}%`;
                      }
                      return [tooltipText, "AI Prediction"];
                    }
                    return [`${value.toFixed(3)}m`, name];
                  }}
                  labelFormatter={(label: string) => {
                    return `Time: ${label}`;
                  }}
                />
                <ReferenceLine
                  y={0.045}
                  stroke="#fbbf24"
                  strokeDasharray="5 5"
                  label={{ value: "Alert Threshold (4.5m)", position: "top" }}
                />
                <Line
                  type="monotone"
                  dataKey="observed"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Observed Data"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  name="AI Prediction"
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Anticipated Scenarios */}
        <Card className="bg-[#1a2c22] border-[#254632]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Anticipated Scenarios</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAIPredictions}
                  disabled={scenariosLoading}
                  className="text-muted-foreground hover:text-white"
                  title="Regenerate scenarios"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      scenariosLoading ? "animate-spin" : ""
                    }`}
                  />
                </Button>
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {scenariosLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">
                  Generating Prediction...
                </p>
              </div>
            ) : scenarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No scenarios available. Click the refresh button to generate.
                </p>
              </div>
            ) : (
              scenarios.map((scenario, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    scenario.severity === "critical"
                      ? "bg-red-500/10 border-red-500"
                      : scenario.severity === "warning"
                      ? "bg-yellow-500/10 border-yellow-500"
                      : "bg-gray-500/10 border-gray-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-white text-sm">
                      {scenario.title}
                    </h4>
                    <Badge
                      className={
                        scenario.severity === "critical"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : scenario.severity === "warning"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }
                    >
                      {scenario.probability}% Prob.
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
