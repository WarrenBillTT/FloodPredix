import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  AlertTriangle,
  AlertCircle,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Settings,
} from "lucide-react";
import type { Alert } from "@/types";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "critical":
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          CRITICAL
        </Badge>
      );
    case "warning":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          WARNING
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Bell className="h-3 w-3 mr-1" />
          WATCH
        </Badge>
      );
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "rising-fast":
    case "rising":
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    case "receding":
      return <TrendingDown className="h-4 w-4 text-blue-500" />;
    case "stable":
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    default:
      return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
  }
};

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [counts, setCounts] = useState({
    critical: 0,
    warning: 0,
    total: 0,
  });

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getAlerts({
        severity: severity !== "all" ? severity : undefined,
        search: search || undefined,
        limit: 50,
      });

      if (response.success && response.data) {
        setAlerts(response.data as Alert[]);
        if (response.counts) {
          setCounts(response.counts);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to fetch alerts:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load alerts";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [search, severity]);

  useEffect(() => {
    fetchAlerts();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      fetchAlerts();
    } catch (err: unknown) {
      console.error("Failed to resolve alert:", err);
      alert("Failed to resolve alert");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Active Alerts</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Overview of current critical events and warnings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Critical Alerts
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {counts.critical}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Warnings Active
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {counts.warning}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2c22] border-[#254632]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#1e293b] flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Alerts
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {counts.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a2c22] border-[#254632]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search alerts by location..."
                className="pl-10 bg-[rgba(15,23,42,0.5)] border-[#334155]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="bg-[rgba(15,23,42,0.5)] border-[#334155]">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="watch">Watch</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-[#334155]">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card className="bg-[#1a2c22] border-[#254632]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-red-400">{error}</div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-muted-foreground">No active alerts</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[rgba(15,23,42,0.3)] border-[#334155] hover:bg-[rgba(15,23,42,0.3)]">
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Severity
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Location / Station
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Time Issued
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Water Level
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Trend Forecast
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={`border-[#334155] ${
                      alert.severity === "critical"
                        ? "bg-red-500/5 border-l-4 border-l-red-500"
                        : alert.severity === "warning"
                        ? "bg-yellow-500/5 border-l-4 border-l-yellow-500"
                        : ""
                    }`}
                  >
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {alert.location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {alert.stationId} • {alert.sector}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {alert.timeIssued}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-lg font-bold ${
                            alert.severity === "critical"
                              ? "text-red-500"
                              : alert.severity === "warning"
                              ? "text-yellow-500"
                              : "text-foreground"
                          }`}
                        >
                          {alert.waterLevel}m
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {alert.maxLevel}m
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(alert.trend)}
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              alert.trend.includes("rising")
                                ? "text-red-500"
                                : alert.trend === "stable"
                                ? "text-muted-foreground"
                                : "text-blue-500"
                            }`}
                          >
                            {alert.trend === "rising-fast"
                              ? "Rising Fast"
                              : alert.trend === "rising-slowly"
                              ? "Rising Slowly"
                              : alert.trend.charAt(0).toUpperCase() +
                                alert.trend.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alert.forecast}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#334155]"
                          onClick={() => handleResolve(alert.id)}
                        >
                          Resolve
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <div className="border-t border-[#334155] p-4 flex items-center justify-between bg-[rgba(15,23,42,0.3)]">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-bold text-foreground">{alerts.length}</span>{" "}
            active alerts
          </p>
        </div>
      </Card>
    </div>
  );
}
