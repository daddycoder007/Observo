import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add headers
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export interface LogEntry {
  _id: string;
  timestamp: string;
  level: string;
  message: string;
  service: string;
  tag: string;
  metadata: {
    host: string;
    [key: string]: any;
  };
  kafkaMetadata: {
    topic: string;
    partition?: number;
    offset: number;
    receivedAt: string;
  };
  raw: any;
}

export interface LogsResponse {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LogStats {
  totalLogs: number;
  recentLogs: number;
  logsByLevel: Array<{ _id: string; count: number }>;
  logsByService: Array<{ _id: string; count: number }>;
  logsPerHour: Array<{ _id: { hour: number }; count: number }>;
}

// Analytics interfaces
export interface AnalyticsOverview {
  summary: {
    totalLogs: number;
    recentLogs: number;
    errorRate: number;
    averageLogsPerHour: string;
  };
  logsByLevel: Array<{ _id: string; count: number; percentage: string }>;
  logsByService: Array<{ _id: string; count: number; errorCount: number; errorRate: string }>;
  logsByHost: Array<{ _id: string; count: number }>;
  hourlyTrends: Array<{
    _id: { year: number; month: number; day: number; hour: number };
    count: number;
    errorCount: number;
  }>;
  timeRange: {
    startDate?: string;
    endDate?: string;
  };
}

export interface PerformanceMetrics {
  responseTimeStats: Array<{
    _id: string;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    count: number;
  }>;
  throughputStats: Array<{
    _id: string;
    avgThroughput: number;
    maxThroughput: number;
    minThroughput: number;
  }>;
  errorPatterns: Array<{
    _id: string;
    errorPattern: Array<{ hour: number; errorCount: number }>;
    totalErrors: number;
  }>;
  timeRange: {
    startDate?: string;
    endDate?: string;
  };
}

export interface TrendData {
  trendsByLevel: Array<{
    _id: { year: number; month: number; day: number; hour: number; minute?: number };
    levels: Array<{ level: string; count: number }>;
    totalCount: number;
  }>;
  trendsByService: Array<{
    _id: { year: number; month: number; day: number; hour: number; minute?: number };
    services: Array<{ service: string; count: number }>;
    totalCount: number;
  }>;
  interval: string;
  timeRange: {
    startDate?: string;
    endDate?: string;
  };
}

export interface AnomalyData {
  volumeAnomalies: Array<{
    _id: { year: number; month: number; day: number; hour: number };
    count: number;
    errorCount: number;
    timestamp: string;
    deviation: string;
    severity: 'high' | 'medium';
  }>;
  errorRateAnomalies: Array<{
    _id: { year: number; month: number; day: number; hour: number };
    count: number;
    errorCount: number;
    errorRate: number;
    timestamp: string;
    deviation: string;
    severity: 'high' | 'medium';
  }>;
  statistics: {
    mean: number;
    stdDev: number;
    threshold: number;
    errorRateMean: number;
    errorRateStdDev: number;
    errorRateThreshold: number;
  };
  timeRange: {
    startDate?: string;
    endDate?: string;
  };
}

// Settings interfaces
export interface DashboardSettings {
  refreshInterval: number;
  defaultTimeRange: string;
  widgets: Array<{ id: string; enabled: boolean; position: number }>;
}

export interface AlertSettings {
  errorRateThreshold: number;
  logVolumeThreshold: number;
  enabled: boolean;
  notifications: {
    email: boolean;
    emails: string[];
    webhook: boolean;
    webhookUrl: string;
    slack: boolean;
    slackWebhookUrl: string;
  };
}

export interface RetentionSettings {
  enabled: boolean;
  days: number;
  autoDelete: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  timezone: string;
  language: string;
}

export interface SystemInfo {
  database: {
    name: string;
    collections: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
    indexSize: number;
  };
  logs: {
    total: number;
    oldest?: string;
    newest?: string;
    uniqueServices: number;
    uniqueHosts: number;
  };
  system: {
    nodeVersion: string;
    platform: string;
    memory: NodeJS.MemoryUsage;
    uptime: number;
  };
}

export interface LogFilters {
  page?: number;
  limit?: number;
  level?: string;
  service?: string;
  host?: string;
  search?: string;
  startTime?: string;
  endTime?: string;
}

class ApiService {
  // Get logs with pagination and filters
  async getLogs(filters: LogFilters = {}): Promise<LogsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/logs?${params.toString()}`);
    return response.data;
  }

  // Get log statistics
  async getLogStats(): Promise<LogStats> {
    const response = await apiClient.get('/logs/stats');
    return response.data;
  }

  // Get available services
  async getServices(): Promise<string[]> {
    const response = await apiClient.get('/logs/services');
    return response.data;
  }

  // Get available hosts
  async getHosts(): Promise<string[]> {
    const response = await apiClient.get('/logs/hosts');
    return response.data;
  }

  // Analytics methods
  async getAnalyticsOverview(filters: { startDate?: string; endDate?: string; service?: string; host?: string } = {}): Promise<AnalyticsOverview> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/analytics/overview?${params.toString()}`);
    return response.data;
  }

  async getPerformanceMetrics(filters: { startDate?: string; endDate?: string; service?: string } = {}): Promise<PerformanceMetrics> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/analytics/performance?${params.toString()}`);
    return response.data;
  }

  async getTrends(filters: { startDate?: string; endDate?: string; interval?: string } = {}): Promise<TrendData> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/analytics/trends?${params.toString()}`);
    return response.data;
  }

  async getAnomalies(filters: { startDate?: string; endDate?: string; threshold?: number } = {}): Promise<AnomalyData> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/analytics/anomalies?${params.toString()}`);
    return response.data;
  }

  // Settings methods
  async getSettings(): Promise<{
    dashboard: DashboardSettings;
    alerts: AlertSettings;
    dataRetention: RetentionSettings;
    api: { rateLimit: number; maxResults: number };
    user: UserSettings;
  }> {
    const response = await apiClient.get('/settings');
    return response.data;
  }

  async updateSettings(settings: any): Promise<{ message: string; settings: any }> {
    const response = await apiClient.put('/settings', settings);
    return response.data;
  }

  async getDashboardSettings(): Promise<DashboardSettings> {
    const response = await apiClient.get('/settings/dashboard');
    return response.data;
  }

  async updateDashboardSettings(settings: Partial<DashboardSettings>): Promise<{ message: string; dashboard: DashboardSettings }> {
    const response = await apiClient.put('/settings/dashboard', settings);
    return response.data;
  }

  async getAlertSettings(): Promise<AlertSettings> {
    const response = await apiClient.get('/settings/alerts');
    return response.data;
  }

  async updateAlertSettings(settings: Partial<AlertSettings>): Promise<{ message: string; alerts: AlertSettings }> {
    const response = await apiClient.put('/settings/alerts', settings);
    return response.data;
  }

  async getRetentionSettings(): Promise<RetentionSettings> {
    const response = await apiClient.get('/settings/retention');
    return response.data;
  }

  async updateRetentionSettings(settings: Partial<RetentionSettings>): Promise<{ message: string; retention: RetentionSettings }> {
    const response = await apiClient.put('/settings/retention', settings);
    return response.data;
  }

  async triggerDataCleanup(): Promise<{ message: string; deletedCount: number; cutoffDate: string }> {
    const response = await apiClient.post('/settings/retention/cleanup');
    return response.data;
  }

  async getUserSettings(): Promise<UserSettings> {
    const response = await apiClient.get('/settings/user');
    return response.data;
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<{ message: string; user: UserSettings }> {
    const response = await apiClient.put('/settings/user', settings);
    return response.data;
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const response = await apiClient.get('/settings/system');
    return response.data;
  }

  async getSystemCheckSettings(): Promise<any> {
    const res = await apiClient.get('/settings/system-check');
    return res.data;
  }

  async updateSystemCheckSettings(settings: any): Promise<any> {
    const res = await apiClient.put('/settings/system-check', settings);
    return res.data;
  }
}

// WebSocket service for real-time updates
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  constructor(private url: string = 'ws://localhost:3000/ws') {}

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const apiService = new ApiService();
export const wsService = new WebSocketService(); 