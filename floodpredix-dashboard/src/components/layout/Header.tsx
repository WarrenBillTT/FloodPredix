import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Search,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  LayoutDashboard,
  History,
  Map,
  Settings,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import type { Alert } from "@/types";

// Menu items matching Sidebar navigation
const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/predictions", label: "Predictions", icon: TrendingUp },
  { path: "/history", label: "History", icon: History },
  { path: "/live-map", label: "Live Map", icon: Map },
  { path: "/alerts", label: "Alerts", icon: Bell },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Header() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertCounts, setAlertCounts] = useState({
    critical: 0,
    warning: 0,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true);
      const response = await api.getRecentAlerts(10);
      if (response.success && response.data) {
        const alertsData = response.data as Alert[];
        setAlerts(alertsData);

        // Calculate counts
        const critical = alertsData.filter(
          (a) => a.severity === "critical"
        ).length;
        const warning = alertsData.filter(
          (a) => a.severity === "warning"
        ).length;
        setAlertCounts({
          critical,
          warning,
          total: critical + warning,
        });
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Poll for alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Filter menu items based on search query
  const filteredMenuItems = searchQuery.trim()
    ? menuItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.path.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(e.target.value.trim().length > 0);
  };

  // Handle suggestion click
  const handleSuggestionClick = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Handle search submit (Enter key)
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredMenuItems.length > 0) {
      handleSuggestionClick(filteredMenuItems[0].path);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get severity badge component
  const getSeverityBadge = (severity: string) => {
    if (severity === "critical") {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-1.5 py-0.5">
          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
          CRITICAL
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-1.5 py-0.5">
        <AlertCircle className="h-2.5 w-2.5 mr-1" />
        WARNING
      </Badge>
    );
  };

  // Format time
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border px-6 z-40 relative bg-background">
      <SidebarTrigger />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {/* Search Box with Suggestions */}
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          {/* Suggestions Dropdown */}
          {showSuggestions && filteredMenuItems.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-64 overflow-auto">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSuggestionClick(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent text-left transition-colors"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {showSuggestions &&
            searchQuery.trim().length > 0 &&
            filteredMenuItems.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
        </div>

        {/* Notification Button with Alerts Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {alertCounts.total > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                  {alertCounts.total > 9 ? "9+" : alertCounts.total}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">
                Recent Alerts
              </DropdownMenuLabel>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/alerts");
                }}
              >
                View All
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[400px] overflow-y-auto">
              {alertsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading alerts...
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No active alerts
                </div>
              ) : (
                alerts.map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex flex-col items-start gap-2 p-3 cursor-pointer"
                    onClick={() => navigate("/alerts")}
                  >
                    <div className="flex items-center justify-between w-full">
                      {getSeverityBadge(alert.severity)}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(alert.timeIssued)}
                      </span>
                    </div>
                    <div className="w-full">
                      <p className="text-sm font-medium text-foreground">
                        {alert.location ||
                          alert.stationId ||
                          "Unknown Location"}
                      </p>
                      {alert.waterLevel !== undefined &&
                      alert.maxLevel !== undefined ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Water Level: {alert.waterLevel.toFixed(3)}m / Max:{" "}
                          {alert.maxLevel.toFixed(3)}m
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Water level data unavailable
                        </p>
                      )}
                      {alert.sector && (
                        <p className="text-xs text-muted-foreground">
                          Sector: {alert.sector}
                        </p>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
