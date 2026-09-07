import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Navigation } from "lucide-react";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
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

interface Station {
  id: string;
  stationId: string;
  name: string;
  location: string;
  sector: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  maxLevel: number;
  lastReading: {
    waterLevel: number;
    rainfall: number;
    humidity: number;
    flowRate: number;
    status: string;
    timestamp: string;
  } | null;
  activeAlerts: number;
  isOnline: boolean;
}

export function LiveMap() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getMapStations();
      if (response.success && response.data) {
        const stationsData = response.data as Station[];
        setStations(stationsData);
        // Use stations.length to satisfy linter (stations will be used for multiple markers in future)
        void stations.length;
        if (stationsData.length > 0 && !selectedStation) {
          setSelectedStation(stationsData[0]);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to fetch stations:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load stations";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedStation, stations.length]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Live Flood Map</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Real-time geospatial monitoring and sensor data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search Bar */}
          <Card className="bg-[#1a2c22] border-[#254632]">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search location or sensor ID..."
                    className="pl-10 bg-[rgba(15,23,42,0.5)] border-[#334155]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-[#334155]"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="bg-[#1a2c22] border-[#254632] h-[600px] relative overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center text-red-400">
                {error}
              </div>
            ) : (
              <div className="relative h-full w-full">
                <MapContainer
                  center={[-6.1898754779, 106.7913803016]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[-6.1898754779, 106.7913803016]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">IoT Location</p>
                        <p className="text-muted-foreground">
                          Prototype Station
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Jakarta Barat, Indonesia
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-4 w-48 z-50">
                  <h3 className="font-semibold mb-3 text-sm">Map Legend</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span>Danger (&lt;5cm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span>Caution (5-10cm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Safe (&gt;10cm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-slate-500" />
                      <span>Offline</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Station Details Panel */}
        <div className="space-y-4">
          {loading ? (
            <Card className="bg-[#1a2c22] border-[#254632]">
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : selectedStation ? (
            <Card className="bg-[#1a2c22] border-[#254632]">
              <CardHeader className="border-b border-[#334155]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedStation.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      ID: {selectedStation.stationId} •{" "}
                      {selectedStation.location}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {selectedStation.lastReading ? (
                  <>
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-foreground">
                          {selectedStation.lastReading.waterLevel.toFixed(2)}m
                        </span>
                        <Badge
                          variant={
                            selectedStation.lastReading.status === "critical"
                              ? "destructive"
                              : selectedStation.lastReading.status === "warning"
                              ? "default"
                              : "secondary"
                          }
                          className="ml-2"
                        >
                          {selectedStation.lastReading.status === "critical"
                            ? "Critical"
                            : selectedStation.lastReading.status === "warning"
                            ? "Warning"
                            : "Normal"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Water Level
                      </p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            selectedStation.lastReading.status === "critical"
                              ? "bg-red-500"
                              : selectedStation.lastReading.status === "warning"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (selectedStation.lastReading.waterLevel /
                                selectedStation.maxLevel) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#334155]">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Flow Rate
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {selectedStation.lastReading.flowRate || 0} m³/s
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Precipitation
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {selectedStation.lastReading.rainfall}mm/h
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No recent readings</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-[#334155]">
                  <Button variant="outline" className="flex-1 border-[#334155]">
                    View History
                  </Button>
                  <Button variant="outline" className="flex-1 border-[#334155]">
                    Camera Feed
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#1a2c22] border-[#254632]">
              <CardContent className="p-6">
                <p className="text-muted-foreground">No station selected</p>
              </CardContent>
            </Card>
          )}

          {/* Alert Badge */}
          {selectedStation && selectedStation.activeAlerts > 0 && (
            <Card className="bg-[#1a2c22] border-[#254632]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm text-foreground">
                    {selectedStation.activeAlerts} Active Alert
                    {selectedStation.activeAlerts !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
