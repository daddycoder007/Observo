import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Warning,
  Timeline,
  Refresh,
  FilterList,
  Download,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { apiService, AnalyticsOverview, PerformanceMetrics, TrendData, AnomalyData } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#00d4ff', '#ff6b35', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];

const Analytics: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData | null>(null);
  
  // Filter states
  const [timeRange, setTimeRange] = useState('24h');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedService, setSelectedService] = useState('');
  const [selectedHost, setSelectedHost] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = {
        startDate: timeRange === 'custom' ? startDate : undefined,
        endDate: timeRange === 'custom' ? endDate : undefined,
        service: selectedService || undefined,
        host: selectedHost || undefined,
      };

      // Load data based on active tab
      switch (tabValue) {
        case 0: // Overview
          const overviewData = await apiService.getAnalyticsOverview(filters);
          setOverview(overviewData);
          break;
        case 1: // Performance
          const performanceData = await apiService.getPerformanceMetrics(filters);
          setPerformance(performanceData);
          break;
        case 2: // Trends
          const trendsData = await apiService.getTrends({ ...filters, interval: 'hour' });
          setTrends(trendsData);
          break;
        case 3: // Anomalies
          const anomaliesData = await apiService.getAnomalies({ ...filters, threshold: 2 });
          setAnomalies(anomaliesData);
          break;
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tabValue, timeRange, startDate, endDate, selectedService, selectedHost]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderOverview = () => {
    if (!overview) return null;

    const { summary, logsByLevel, logsByService, logsByHost, hourlyTrends } = overview;

    // Prepare chart data
    const hourlyData = hourlyTrends.map(h => ({
      time: `${h._id.hour}:00`,
      logs: h.count,
      errors: h.errorCount,
    }));

    const levelData = logsByLevel.map(level => ({
      name: level._id,
      value: level.count,
      percentage: parseFloat(level.percentage),
    }));

    const serviceData = logsByService.slice(0, 10).map(service => ({
      name: service._id,
      logs: service.count,
      errors: service.errorCount,
      errorRate: parseFloat(service.errorRate),
    }));

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Logs
              </Typography>
              <Typography variant="h4" component="div">
                {formatNumber(summary.totalLogs)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last 24h: {formatNumber(summary.recentLogs)}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Error Rate
              </Typography>
              <Typography variant="h4" component="div" color="error">
                {summary.errorRate.toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg: {summary.averageLogsPerHour} logs/hour
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Services
              </Typography>
              <Typography variant="h4" component="div">
                {logsByService.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active services
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Hosts
              </Typography>
              <Typography variant="h4" component="div">
                {logsByHost.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Monitored hosts
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Charts */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Log Volume Trends (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="logs" stackId="1" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="errors" stackId="2" stroke="#ff6b35" fill="#ff6b35" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Log Levels Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={levelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {levelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Service Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="logs" fill="#00d4ff" />
                <Bar dataKey="errors" fill="#ff6b35" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderPerformance = () => {
    if (!performance) return null;

    const { responseTimeStats, throughputStats, errorPatterns } = performance;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Response Time Statistics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={responseTimeStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="avgResponseTime" fill="#00d4ff" name="Avg Response Time" />
                <Bar dataKey="p95ResponseTime" fill="#ff6b35" name="P95 Response Time" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Throughput Statistics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={throughputStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="avgThroughput" fill="#4caf50" name="Avg Throughput" />
                <Bar dataKey="maxThroughput" fill="#ff9800" name="Max Throughput" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Error Patterns by Hour
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                {errorPatterns.map((pattern, index) => (
                  <Line
                    key={pattern._id}
                    type="monotone"
                    data={pattern.errorPattern}
                    dataKey="errorCount"
                    stroke={COLORS[index % COLORS.length]}
                    name={pattern._id}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderTrends = () => {
    if (!trends) return null;

    const { trendsByLevel, trendsByService } = trends;

    // Prepare data for charts
    const levelTrendData = trendsByLevel.map(trend => ({
      time: `${trend._id.hour}:00`,
      ...trend.levels.reduce((acc, level) => ({ ...acc, [level.level]: level.count }), {}),
    }));

    const serviceTrendData = trendsByService.map(trend => ({
      time: `${trend._id.hour}:00`,
      ...trend.services.reduce((acc, service) => ({ ...acc, [service.service]: service.count }), {}),
    }));

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Log Level Trends
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={levelTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                {trendsByLevel[0]?.levels.map((level, index) => (
                  <Line
                    key={level.level}
                    type="monotone"
                    dataKey={level.level}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Service Trends
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={serviceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                {trendsByService[0]?.services.slice(0, 5).map((service, index) => (
                  <Line
                    key={service.service}
                    type="monotone"
                    dataKey={service.service}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderAnomalies = () => {
    if (!anomalies) return null;

    const { volumeAnomalies, errorRateAnomalies, statistics } = anomalies;

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Volume Anomalies
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Mean: {statistics.mean.toFixed(2)} | Std Dev: {statistics.stdDev.toFixed(2)} | Threshold: {statistics.threshold.toFixed(2)}
              </Typography>
            </Box>
            {volumeAnomalies.length === 0 ? (
              <Typography color="textSecondary">No volume anomalies detected</Typography>
            ) : (
              volumeAnomalies.map((anomaly, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #333', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {format(new Date(anomaly.timestamp), 'MMM dd, HH:mm')}
                    </Typography>
                    <Chip
                      label={anomaly.severity}
                      color={anomaly.severity === 'high' ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2">
                    Logs: {anomaly.count} (Deviation: {anomaly.deviation}σ)
                  </Typography>
                </Box>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Error Rate Anomalies
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Mean: {statistics.errorRateMean.toFixed(2)}% | Std Dev: {statistics.errorRateStdDev.toFixed(2)}% | Threshold: {statistics.errorRateThreshold.toFixed(2)}%
              </Typography>
            </Box>
            {errorRateAnomalies.length === 0 ? (
              <Typography color="textSecondary">No error rate anomalies detected</Typography>
            ) : (
              errorRateAnomalies.map((anomaly, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #333', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {format(new Date(anomaly.timestamp), 'MMM dd, HH:mm')}
                    </Typography>
                    <Chip
                      label={anomaly.severity}
                      color={anomaly.severity === 'high' ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2">
                    Error Rate: {anomaly.errorRate.toFixed(2)}% (Deviation: {anomaly.deviation}σ)
                  </Typography>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>

          {timeRange === 'custom' && (
            <>
              <TextField
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ width: 150 }}
              />
              <TextField
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{ width: 150 }}
              />
            </>
          )}

          <Tooltip title="Refresh Data">
            <IconButton onClick={loadData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="analytics tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<TrendingUp />} label="Overview" />
          <Tab icon={<Speed />} label="Performance" />
          <Tab icon={<Timeline />} label="Trends" />
          <Tab icon={<Warning />} label="Anomalies" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {renderOverview()}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderPerformance()}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              {renderTrends()}
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              {renderAnomalies()}
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Analytics; 