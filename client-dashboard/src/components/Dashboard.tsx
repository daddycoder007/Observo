import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Warning,
  Error,
  Info,
  BugReport,
  Schedule,
  Refresh,
  RadioButtonChecked,
  Notifications,
} from '@mui/icons-material';
import { apiService, LogStats, wsService } from '../services/api';
import { format } from 'date-fns';

const COLORS = ['#00d4ff', '#ff6b35', '#ffd700', '#ff4757', '#2ed573'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    fetchStats();
    
    // Connect to WebSocket for real-time updates
    wsService.connect();
    
    wsService.on('connected', () => {
      console.log('WebSocket connected to dashboard');
      setWsConnected(true);
    });

    wsService.on('disconnected', () => {
      console.log('WebSocket disconnected from dashboard');
      setWsConnected(false);
    });

    wsService.on('newLog', (data: any) => {
      console.log('New log received via WebSocket:', data);
      // Refresh stats when new log arrives
      fetchStats();
      
      // Show notification for new logs
      setNotification({
        message: `New ${data.data.level} log from ${data.data.service}`,
        type: 'success'
      });
      setShowNotification(true);
    });

    // More frequent updates for real-time feel
    const interval = setInterval(() => {
      if (isLive) {
        fetchStats();
      }
    }, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(interval);
      wsService.disconnect();
    };
  }, [isLive]);

  const fetchStats = async () => {
    try {
      setLoading(false); // Don't show loading on subsequent updates
      const data = await apiService.getLogStats();
      setStats(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching stats:', err);
    }
  };

  const handleManualRefresh = () => {
    fetchStats();
  };

  const toggleLiveMode = () => {
    setIsLive(!isLive);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return '#ff4757';
      case 'warn':
        return '#ffd700';
      case 'debug':
        return '#00d4ff';
      case 'info':
        return '#2ed573';
      default:
        return '#b0b0b0';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <Error />;
      case 'warn':
        return <Warning />;
      case 'debug':
        return <BugReport />;
      case 'info':
        return <Info />;
      default:
        return <Info />;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare data for charts
  const logsPerHourData = stats.logsPerHour.map((item) => ({
    time: `${item._id.hour}:00`,
    count: item.count,
  }));

  const logsByLevelData = stats.logsByLevel.map((item) => ({
    name: item._id.toUpperCase(),
    value: item.count,
    color: getLevelColor(item._id),
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Dashboard Overview
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {wsConnected ? (
              <RadioButtonChecked 
                sx={{ 
                  color: isLive ? '#00d4ff' : '#666', 
                  fontSize: 12,
                  animation: isLive ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  },
                }} 
              />
            ) : (
              <RadioButtonChecked sx={{ color: '#ff4757', fontSize: 12 }} />
            )}
            <Typography variant="body2" color="text.secondary">
              {wsConnected ? (isLive ? 'Live' : 'Paused') : 'Disconnected'}
            </Typography>
          </Box>
          <Tooltip title="Manual Refresh">
            <IconButton onClick={handleManualRefresh} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            Last update: {format(lastUpdate, 'HH:mm:ss')}
          </Typography>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Total Logs
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.totalLogs.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time logs collected
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Recent Logs
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.recentLogs.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Error sx={{ color: '#ff4757', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Errors
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#ff4757' }}>
                {stats.logsByLevel.find(l => l._id === 'error')?.count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Error level logs
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: '#ffd700', mr: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Warnings
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#ffd700' }}>
                {stats.logsByLevel.find(l => l._id === 'warn')?.count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warning level logs
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Logs per Hour Chart */}
        <Box sx={{ flex: '2 1 600px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Logs per Hour (Last 24 Hours)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={logsPerHourData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="time"
                    stroke="#b0b0b0"
                    fontSize={12}
                  />
                  <YAxis stroke="#b0b0b0" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#00d4ff"
                    strokeWidth={3}
                    dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Log Levels Distribution */}
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Log Levels Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={logsByLevelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {logsByLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Top Services */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Top Services
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.logsByService.slice(0, 5).map((service, index) => (
                  <Box
                    key={service._id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(0, 212, 255, 0.05)',
                      border: '1px solid rgba(0, 212, 255, 0.1)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          backgroundColor: COLORS[index % COLORS.length],
                          color: 'white',
                          mr: 2,
                          fontWeight: 'bold',
                        }}
                      />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {service._id}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {service.count.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Log Levels Breakdown */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Log Levels Breakdown
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.logsByLevel.map((level) => (
                  <Box
                    key={level._id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          color: getLevelColor(level._id),
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {getLevelIcon(level._id)}
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'uppercase' }}>
                        {level._id}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: getLevelColor(level._id) }}>
                      {level.count.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Real-time Notification */}
      <Snackbar
        open={showNotification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications sx={{ fontSize: 16 }} />
            {notification?.message}
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard; 