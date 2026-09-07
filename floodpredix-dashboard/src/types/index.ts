export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface SensorData {
  id: string;
  location: string;
  stationId: string;
  waterLevel: number;
  maxLevel: number;
  rainfall: number;
  humidity: number;
  status: 'normal' | 'warning' | 'critical' | 'caution' | 'danger';
  timestamp: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'watch';
  location: string;
  stationId: string;
  sector: string;
  waterLevel: number;
  maxLevel: number;
  timeIssued: string;
  trend: 'rising' | 'rising-fast' | 'stable' | 'receding' | 'rising-slowly';
  forecast?: string;
}

export interface HistoryRecord {
  id: string;
  date: string;
  time: string;
  location: string;
  stationId: string;
  waterLevel: number;
  maxLevel: number;
  rainfall: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface TrendData {
  time: string;
  level: number;
}

export interface TrendsResponse {
  aggregated: TrendData[];
  perSecond: TrendData[];
  cached: boolean;
  cachedAt: string;
}

export interface FloodRiskAssessment {
  riskLevel: "high" | "medium" | "low";
  confidence: number; // 0-100
  probability24h: number; // 0-100
}

export interface FloodScenario {
  title: string;
  probability: number; // 0-100
  description: string;
  severity: "critical" | "warning" | "info";
}

export interface HydrologicalProjection {
  time: string; // "-12H", "-6H", "NOW", "+6H", "+12H"
  observed: number; // water level in meters
  predicted: number; // AI predicted water level
  rainfall?: number; // rainfall intensity in mm (for predictions)
  humidity?: number; // humidity percentage (for predictions)
}

export interface LatestData {
  stationId: string;
  stationName?: string;
  location?: string;
  waterLevel: number;
  rainfall: number; // effective value (custom if set, otherwise real)
  humidity: number; // effective value (custom if set, otherwise real)
  flowRate: number;
  temperature: number | null;
  status: string;
  timestamp: string;
  lastUpdated: string;
  lastUpdatedBy: "iot" | "user";
  hasCustomRainfall: boolean;
  hasCustomHumidity: boolean;
}

export interface BMKGWeatherForecast {
  datetime: string;
  t: number; // temperature
  tcc: number;
  tp: number; // precipitation (rainfall) in mm
  weather: number;
  weather_desc: string;
  weather_desc_en: string;
  wd_deg: number;
  wd: string;
  wd_to: string;
  ws: number;
  hu: number; // humidity percentage
  vs: number;
  vs_text: string;
  time_index: string;
  analysis_date: string;
  image: string;
  utc_datetime: string;
  local_datetime: string;
}

export interface BMKGLocation {
  adm1: string;
  adm2: string;
  adm3: string;
  adm4: string;
  provinsi: string;
  kotkab: string;
  kecamatan: string;
  desa: string;
  lon: number;
  lat: number;
  timezone: string;
  type?: string;
}

export interface BMKGResponse {
  lokasi: BMKGLocation;
  data: Array<{
    lokasi: BMKGLocation;
    cuaca: BMKGWeatherForecast[][]; // Array of day arrays
  }>;
}

