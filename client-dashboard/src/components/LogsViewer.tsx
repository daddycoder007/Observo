import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Pagination,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Search,
  Refresh,
  Error,
  Warning,
  Info,
  BugReport,
  ExpandMore,
  AccessTime,
  Computer,
  Label,
  Storage,
  Code,
  ContentCopy,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { apiService, LogEntry, LogsResponse, wsService } from '../services/api';
import { BarChart } from '@mui/x-charts/BarChart';

const LogLevelChip = ({ level }: { level: string }) => {
    const style = {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        padding: '0 8px',
        height: 24,
        borderRadius: '6px',
        textTransform: 'uppercase'
    };
    switch (level.toLowerCase()) {
        case 'error':
            return <Chip icon={<Error sx={{ fontSize: 16, ml: 1 }}/>} label="Error" sx={{ ...style, backgroundColor: 'error.main' }} />;
        case 'warn':
            return <Chip icon={<Warning sx={{ fontSize: 16, ml: 1 }}/>} label="Warn" sx={{ ...style, backgroundColor: 'warning.main' }} />;
        case 'debug':
            return <Chip icon={<BugReport sx={{ fontSize: 16, ml: 1 }}/>} label="Debug" sx={{ ...style, backgroundColor: 'secondary.dark' }} />;
        case 'info':
            return <Chip icon={<Info sx={{ fontSize: 16, ml: 1 }}/>} label="Info" sx={{ ...style, backgroundColor: 'success.main' }} />;
        default:
            return <Chip label={level} sx={{ ...style, backgroundColor: 'text.secondary' }} />;
    }
};

const LogEntryItem = ({ log }: { log: LogEntry }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  return (
    <Paper variant="outlined" sx={{ mb: 1, p: 1.5, '&:hover': { borderColor: 'primary.main' } }} >
        <Box display="flex" alignItems="center" gap={2} onClick={() => setExpanded(!expanded)} sx={{cursor: 'pointer'}}>
            <Box sx={{ width: { xs: '100%', sm: '20%' } }}>
                <Typography variant="body2" color="text.secondary" sx={{fontSize: '18px'}}>{format(new Date(log.timestamp), 'MMM dd, h:mm:ss a')}</Typography>
            </Box>
            <Box>
                <LogLevelChip level={log.level} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" component="span" sx={{ fontWeight: 500, mr: 1, whiteSpace: 'nowrap', fontSize: '18px' }}>{log.service}</Typography>
                <Typography
                    variant="body2"
                    component="span"
                    color="text.secondary"
                    sx={{
                        fontFamily: "'Fira Code', 'Menlo', 'monospace'",
                        fontSize: '18px',
                        ...(expanded ? {
                            whiteSpace: 'normal',
                            wordBreak: 'break-all',
                        } : {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        })
                    }}
                >
                    {log.message}
                </Typography>
            </Box>
            <Box>
                <Tooltip title={expanded ? "Show less" : "Show more"}>
                    <IconButton size="small">
                        <ExpandMore sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
        <Collapse in={expanded}>
            <Divider sx={{ my: 1.5 }}/>
            <Box sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>Log Details</Typography>
                
                {/* Key Information Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontSize: '1rem', fontWeight: 500 }}>Timestamp:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: 'text.primary', fontWeight: 500 }}>
                            {format(new Date(log.timestamp), 'MMM dd, yyyy at h:mm:ss a')}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Computer sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontSize: '1rem', fontWeight: 500 }}>Host:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: 'text.primary', fontWeight: 500 }}>
                            {log.metadata?.host || 'N/A'}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Label sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontSize: '1rem', fontWeight: 500 }}>Tag:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: 'text.primary', fontWeight: 500 }}>
                            {log.tag || 'N/A'}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Storage sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, fontSize: '1rem', fontWeight: 500 }}>Topic:</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: 'text.primary', fontWeight: 500 }}>
                            {log.kafkaMetadata?.topic || 'N/A'}
                        </Typography>
                    </Box>
                </Box>

                {/* Message Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
                        <Code sx={{ fontSize: 20, color: 'primary.main' }} />
                        Message
                    </Typography>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            backgroundColor: 'action.hover',
                            position: 'relative',
                            '&:hover .copy-button': { opacity: 1 }
                        }}
                    >
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                fontFamily: "'Fira Code', 'Menlo', 'monospace'",
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: 1.5,
                                fontSize: '1rem',
                                color: 'text.primary',
                                fontWeight: 400
                            }}
                        >
                            {log.message}
                        </Typography>
                        <IconButton
                            className="copy-button"
                            size="small"
                            sx={{ 
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => navigator.clipboard.writeText(log.message)}
                        >
                            <ContentCopy sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Paper>
                </Box>

                {/* Kafka Metadata */}
                {log.kafkaMetadata && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
                            Kafka Metadata
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Partition:</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.primary', fontWeight: 500 }}>
                                    {log.kafkaMetadata.partition ?? 'N/A'}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Offset:</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.primary', fontWeight: 500 }}>
                                    {log.kafkaMetadata.offset}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Received:</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'text.primary', fontWeight: 500 }}>
                                    {format(parseISO(log.kafkaMetadata.receivedAt), 'HH:mm:ss.SSS')}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Additional Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 1 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
                            Additional Metadata
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'action.hover' }}>
                            {Object.entries(log.metadata).map(([key, value]) => {
                                if (key === 'host') return null; // Already shown above
                                return (
                                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize', fontSize: '0.875rem', fontWeight: 500 }}>
                                            {key}:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', textAlign: 'right', fontSize: '0.875rem', color: 'text.primary', fontWeight: 500 }}>
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Paper>
                    </Box>
                )}

                {/* Raw Data Section (Collapsible) */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Raw JSON Data
                    </Typography>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 2, 
                            backgroundColor: 'action.hover',
                            position: 'relative',
                            '&:hover .copy-button-raw': { opacity: 1 }
                        }}
                    >
                        <pre style={{ 
                            margin: 0, 
                            whiteSpace: 'pre-wrap', 
                            wordBreak: 'break-all', 
                            color: theme.palette.text.primary, 
                            fontFamily: "'Fira Code', 'Menlo', 'monospace'",
                            fontSize: '0.875rem',
                            lineHeight: 1.4,
                            maxHeight: '200px',
                            overflow: 'auto',
                            fontWeight: 400
                        }}>
                            {JSON.stringify(log, null, 2)}
                        </pre>
                        <IconButton
                            className="copy-button-raw"
                            size="small"
                            sx={{ 
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))}
                        >
                            <ContentCopy sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Paper>
                </Box>
            </Box>
        </Collapse>
    </Paper>
  );
}

const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ 
      level: '', 
      service: '', 
      search: '',
      startTime: '',
      endTime: '',
  });
  const [logStats, setLogStats] = useState<any>(null);
  const [services, setServices] = useState<string[]>([]);

  const fetchLogs = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response: LogsResponse = await apiService.getLogs({ page: pagination.page, limit: pagination.limit, ...filters });
      setLogs(response.logs);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch logs');
    } finally {
        if (showLoading) setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);
  
  const fetchStats = useCallback(async () => {
    try {
      const stats = await apiService.getLogStats();
      setLogStats(stats);
      if (stats.logsByService) {
        setServices(stats.logsByService.map((s: any) => s._id));
      }
    } catch (err) {
      console.error("Failed to fetch log stats", err);
    }
  }, []);

  useEffect(() => {
    fetchLogs(true);
    fetchStats();
    
    wsService.connect();
    wsService.on('message', (data: any) => {
      if (data.type === 'newLog') {
        console.log('New log received on LogsViewer, refreshing...');
        fetchLogs(false);
        fetchStats();
      }
    });

    return () => {
      wsService.disconnect();
    };
  }, [fetchLogs, fetchStats]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  };
  
  const logsPerHourData = logStats?.logsPerHour.map((item: any) => item.count) || [];
  const logsPerHourLabels = logStats?.logsPerHour.map((item: any) => `${item._id.hour}:00`) || [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Logs Explorer
        </Typography>

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ width: '100%', flex: { sm: 4 } }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search logs by message, service, or host..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    />
                </Box>
                <Box sx={{ width: '100%', flex: { sm: 1.5 } }}>
                     <FormControl fullWidth>
                        <InputLabel>Level</InputLabel>
                        <Select
                            value={filters.level}
                            label="Level"
                            onChange={(e) => handleFilterChange('level', e.target.value)}
                        >
                            <MenuItem value="">Any</MenuItem>
                            <MenuItem value="info">Info</MenuItem>
                            <MenuItem value="warn">Warn</MenuItem>
                            <MenuItem value="error">Error</MenuItem>
                            <MenuItem value="debug">Debug</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{ width: '100%', flex: { sm: 1.5 } }}>
                     <FormControl fullWidth>
                        <InputLabel>Service</InputLabel>
                        <Select
                            value={filters.service}
                            label="Service"
                            onChange={(e) => handleFilterChange('service', e.target.value)}
                        >
                            <MenuItem value="">Any</MenuItem>
                            {services.map(service => (
                                <MenuItem key={service} value={service}>{service}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                 <Box sx={{ width: '100%', flex: { sm: 2.5 } }}>
                    <TextField
                        fullWidth
                        label="Start Time"
                        type="datetime-local"
                        value={filters.startTime}
                        onChange={(e) => handleFilterChange('startTime', e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Box>
                 <Box sx={{ width: '100%', flex: { sm: 2.5 } }}>
                    <TextField
                        fullWidth
                        label="End Time"
                        type="datetime-local"
                        value={filters.endTime}
                        onChange={(e) => handleFilterChange('endTime', e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Box>
                <Box sx={{ width: '100%', flex: { sm: 1 } }}>
                    <Button fullWidth variant="contained" onClick={() => fetchLogs(true)} startIcon={<Refresh/>} sx={{height: '56px'}}>Refresh</Button>
                </Box>
            </Box>
        </Paper>

        {logStats && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, height: 200 }}>
                 <Typography variant="h6" sx={{mb: 1}}>Logs Over Time</Typography>
                 <BarChart
                    series={[{ data: logsPerHourData, color: '#6C63FF' }]}
                    xAxis={[{ data: logsPerHourLabels, scaleType: 'band' }]}
                    margin={{ top: 10, right: 10, bottom: 20, left: 30 }}
                    grid={{ horizontal: true }}
                    sx={{
                        '& .MuiChartsAxis-tickLabel': {
                            fill: '#BDBDBD'
                        },
                        '& .MuiChartsAxis-line': {
                            stroke: '#BDBDBD'
                        },
                        '& .MuiChartsGrid-line': {
                            stroke: 'rgba(255, 255, 255, 0.12)'
                        }
                    }}
                />
            </Paper>
        )}

        <Box sx={{ flexGrow: 1, overflow: 'auto', pr: 1 }}>
            {loading ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ): error ? (
                <Alert severity="error">{error}</Alert>
            ): (
                logs.map(log => <LogEntryItem key={log._id} log={log} />)
            )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
            />
        </Box>
    </Box>
  );
};

export default LogsViewer; 