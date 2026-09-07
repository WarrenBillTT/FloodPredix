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
import { Search, Calendar, Download, Filter, MoreVertical } from "lucide-react";
import type { HistoryRecord } from "@/types";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "critical":
      return <Badge variant="destructive">Critical</Badge>;
    case "warning":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Warning
        </Badge>
      );
    default:
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          Normal
        </Badge>
      );
  }
};

export function History() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getHistory({
        page,
        limit,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (response.success && response.data) {
        setHistory(response.data as HistoryRecord[]);
        if (response.pagination) {
          setTotal(response.pagination.total);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to fetch history:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load history";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExport = async () => {
    try {
      await api.exportHistory({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: status !== "all" ? status : undefined,
      });
    } catch (err: unknown) {
      console.error("Export failed:", err);
      alert("Failed to export history");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">History Log</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Archive of flood events and water level recordings
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-[#1a2c22] border-[#254632]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Location, Station ID..."
                className="pl-10 bg-[rgba(15,23,42,0.5)] border-[#334155]"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Start Date"
                className="pl-10 bg-[rgba(15,23,42,0.5)] border-[#334155]"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-[rgba(15,23,42,0.5)] border-[#334155]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-[#334155]"
                onClick={fetchHistory}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button className="flex-1 bg-primary" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
          ) : history.length === 0 ? (
            <div className="p-6 text-muted-foreground">
              No history records found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[rgba(15,23,42,0.3)] border-[#334155] hover:bg-[rgba(15,23,42,0.3)]">
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Date & Time
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Location / Station
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Water Level
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Rainfall
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground uppercase text-xs text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow
                    key={record.id}
                    className={`border-[#334155] ${
                      record.status === "critical"
                        ? "bg-red-500/5 border-l-4 border-l-red-500"
                        : ""
                    }`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {record.date}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.time}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Search className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {record.location}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {record.stationId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-lg font-bold ${
                            record.status === "critical"
                              ? "text-red-500"
                              : record.status === "warning"
                              ? "text-yellow-500"
                              : "text-foreground"
                          }`}
                        >
                          {record.waterLevel}m
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {record.maxLevel}m
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">
                        {record.rainfall}mm/h
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
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
            <span className="font-bold text-foreground">
              {history.length > 0 ? (page - 1) * limit + 1 : 0}-
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span className="font-bold text-foreground">{total}</span>{" "}
            results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#334155]"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#334155]"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
