const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3005/api";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  counts?: {
    critical: number;
    warning: number;
    total: number;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        // Handle 401 unauthorized - clear token and redirect to login
        if (response.status === 401) {
          this.setToken(null);
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error(
          data.message || `Request failed: ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth methods
  async googleLogin(
    credential: string,
    email: string = "",
    name: string = "",
    picture: string = ""
  ) {
    // Decode JWT to get user info if not provided
    let userEmail = email;
    let userName = name;
    let userPicture = picture;

    if (credential && !email) {
      try {
        // Simple base64 decode of JWT payload (for client-side extraction)
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          userEmail = payload.email || userEmail;
          userName = payload.name || userName;
          userPicture = payload.picture || userPicture;
        }
      } catch {
        console.warn("Could not decode JWT, using provided values");
      }
    }

    const data = await this.request<{
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        role: string;
      };
      settings: unknown;
    }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({
        credential,
        email: userEmail,
        name: userName,
        picture: userPicture,
      }),
    });

    if (data.data?.token) {
      this.setToken(data.data.token);
    }

    return data;
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  async logout() {
    const data = await this.request("/auth/logout", {
      method: "POST",
    });
    this.setToken(null);
    return data;
  }

  // Dashboard methods
  async getDashboardStats() {
    return this.request("/dashboard/stats");
  }

  async getTrends(period: "24h" | "1w" | "1m" = "24h") {
    return this.request(`/dashboard/trends?period=${period}`);
  }

  async refreshTrends(period: "24h" | "1w" | "1m" = "24h") {
    return this.request(`/dashboard/trends/refresh?period=${period}`);
  }

  async getRecentAlerts(limit: number = 5) {
    return this.request(`/dashboard/recent-alerts?limit=${limit}`);
  }

  // History methods
  async getHistory(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      stationId?: string;
    } = {}
  ) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.stationId) query.append("stationId", params.stationId);

    return this.request(`/history?${query.toString()}`);
  }

  async exportHistory(
    params: {
      startDate?: string;
      endDate?: string;
      status?: string;
    } = {}
  ) {
    const query = new URLSearchParams();
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.status) query.append("status", params.status);

    const url = `${API_BASE_URL}/history/export?${query.toString()}`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "flood-history.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Alerts methods
  async getAlerts(
    params: {
      severity?: string;
      search?: string;
      limit?: number;
    } = {}
  ) {
    const query = new URLSearchParams();
    if (params.severity) query.append("severity", params.severity);
    if (params.search) query.append("search", params.search);
    if (params.limit) query.append("limit", params.limit.toString());

    return this.request(`/alerts?${query.toString()}`);
  }

  async acknowledgeAlert(id: string) {
    return this.request(`/alerts/${id}/acknowledge`, {
      method: "POST",
    });
  }

  async resolveAlert(id: string) {
    return this.request(`/alerts/${id}/resolve`, {
      method: "POST",
    });
  }

  // Stations methods
  async getStations(active: boolean = true) {
    return this.request(`/stations?active=${active}`);
  }

  async getStationReadings(
    id: string,
    params: {
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    return this.request(`/stations/${id}/readings?${query.toString()}`);
  }

  // Map methods
  async getMapStations() {
    return this.request("/map/stations");
  }

  // Settings methods
  async getSettings() {
    return this.request("/settings");
  }

  async updateSettings(settings: {
    notifications?: unknown;
    preferences?: unknown;
  }) {
    return this.request("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async updateProfile(profile: {
    name?: string;
    email?: string;
    avatar?: string;
  }) {
    return this.request("/settings/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  }

  async deleteAccount() {
    const data = await this.request("/settings/account", {
      method: "DELETE",
    });
    this.setToken(null);
    return data;
  }

  // BMKG Weather API methods
  async fetchBMKGWeather() {
    try {
      // BMKG API is public, no authentication needed
      const response = await fetch(
        "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.73.07.1005"
      );

      if (!response.ok) {
        throw new Error(`BMKG API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch BMKG weather data:", error);
      throw error;
    }
  }

  // Latest Data methods
  async getLatestData(stationId?: string) {
    const query = stationId ? `?stationId=${stationId}` : "";
    return this.request(`/latest-data${query}`);
  }

  async setCustomValues(values: {
    stationId?: string;
    rainfall?: number | null;
    humidity?: number | null;
  }) {
    return this.request("/latest-data/custom", {
      method: "PUT",
      body: JSON.stringify(values),
    });
  }

  async clearCustomValues(stationId?: string) {
    const query = stationId ? `?stationId=${stationId}` : "";
    return this.request(`/latest-data/custom${query}`, {
      method: "DELETE",
    });
  }

  // Predictions methods
  async getFloodRiskPrediction(params: {
    waterLevel: number;
    rainfall: number;
    humidity: number;
    trends?: Array<{ time: string; level: number }>;
  }) {
    const { waterLevel, rainfall, humidity, trends } = params;
    const trendsParam = trends
      ? `&trends=${encodeURIComponent(JSON.stringify(trends))}`
      : "";
    return this.request(
      `/predictions/scenarios?waterLevel=${waterLevel}&rainfall=${rainfall}&humidity=${humidity}${trendsParam}`
    );
  }
}

export default new ApiClient();
