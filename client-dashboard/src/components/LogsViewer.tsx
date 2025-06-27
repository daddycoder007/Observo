import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Pagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Visibility,
  Error,
  Warning,
  Info,
  BugReport,
  RadioButtonChecked,
  Pause,
  Notifications,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { apiService, LogEntry, LogsResponse, wsService } from '../services/api';

const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    level: '',
    service: '',
    host: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const previousLogCount = useRef(0);

  useEffect(() => {
    fetchLogs();
    
    // Connect to WebSocket for real-time updates
    wsService.connect();
    
    wsService.on('connected', () => {
      console.log('WebSocket connected to logs viewer');
      setWsConnected(true);
    });

    wsService.on('disconnected', () => {
      console.log('WebSocket disconnected from logs viewer');
      setWsConnected(false);
    });

    wsService.on('newLog', (data: any) => {
      console.log('New log received via WebSocket:', data);
      // Only refresh if we're on the first page and no filters are applied
      if (pagination.page === 1 && !hasActiveFilters()) {
        fetchLogs();
      }
      
      // Show notification for new logs
      setNotification({
        message: `New ${data.data.level} log from ${data.data.service}`,
        type: 'success'
      });
      setShowNotification(true);
    });
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [pagination.page, pagination.limit, filters, autoRefresh]);

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  const fetchLogs = async () => {
    try {
      setLoading(false); // Don't show loading on subsequent updates
      const response: LogsResponse = await apiService.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      
      // Check for new logs
      if (previousLogCount.current > 0 && response.logs.length > previousLogCount.current) {
        const newLogsCount = response.logs.length - previousLogCount.current;
        setNotification({
          message: `${newLogsCount} new log${newLogsCount > 1 ? 's' : ''} received`,
          type: 'success'
        });
        setShowNotification(true);
      }
      
      setLogs(response.logs);
      setPagination(response.pagination);
      setLastUpdate(new Date());
      previousLogCount.current = response.logs.length;
      setError(null);
    } catch (err) {
      setError('Failed to fetch logs');
      console.error('Error fetching logs:', err);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  const clearFilters = () => {
    setFilters({
      level: '',
      service: '',
      host: '',
      search: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleManualRefresh = () => {
    fetchLogs();
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

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Logs Viewer
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {wsConnected ? (
              autoRefresh ? (
                <RadioButtonChecked 
                  sx={{ 
                    color: '#00d4ff', 
                    fontSize: 12,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }} 
                />
              ) : (
                <Pause sx={{ color: '#666', fontSize: 12 }} />
              )
            ) : (
              <RadioButtonChecked sx={{ color: '#ff4757', fontSize: 12 }} />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label={wsConnected ? (autoRefresh ? 'Live' : 'Paused') : 'Disconnected'}
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1 }} />
            Filters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search in messages..."
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level}
                label="Level"
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Service"
              value={filters.service}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              placeholder="Filter by service..."
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Host"
              value={filters.host}
              onChange={(e) => handleFilterChange('host', e.target.value)}
              placeholder="Filter by host..."
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Start Date"
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="outlined" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Logs ({pagination.total.toLocaleString()} total)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Page {pagination.page} of {pagination.pages}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Host</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatTimestamp(log.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getLevelIcon(log.level)}
                            label={log.level.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getLevelColor(log.level),
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {log.service}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {truncateMessage(log.message)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {log.metadata.host}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedLog(log);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.pages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Log Details
          {selectedLog && (
            <Chip
              icon={getLevelIcon(selectedLog.level)}
              label={selectedLog.level.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: getLevelColor(selectedLog.level),
                color: 'white',
                fontWeight: 'bold',
                ml: 2,
              }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Message
              </Typography>
              <Paper sx={{ p: 2, mb: 3, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {selectedLog.message}
                </Typography>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Timestamp:</strong> {formatTimestamp(selectedLog.timestamp)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Service:</strong> {selectedLog.service}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tag:</strong> {selectedLog.tag}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Host:</strong> {selectedLog.metadata.host}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Kafka Metadata
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Topic:</strong> {selectedLog.kafkaMetadata.topic}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Partition:</strong> {selectedLog.kafkaMetadata.partition || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Offset:</strong> {selectedLog.kafkaMetadata.offset}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Received:</strong> {formatTimestamp(selectedLog.kafkaMetadata.receivedAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="h6" sx={{ mb: 1, mt: 3 }}>
                Raw Data
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {JSON.stringify(selectedLog.raw, null, 2)}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default LogsViewer; 