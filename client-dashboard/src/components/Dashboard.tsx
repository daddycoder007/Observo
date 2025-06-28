import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    DonutLarge,
    TrendingUp,
    ErrorOutline,
    BugReport,
    Info,
    Warning,
    ReceiptLong,
    BarChart as BarChartIcon
} from '@mui/icons-material';
import { LineChart, PieChart, BarChart } from '@mui/x-charts';
import { apiService, LogEntry, LogStats, wsService } from '../services/api';
import { format, parseISO } from 'date-fns';

const DashboardPanel = ({ title, children, sx }: { title: string, children: React.ReactNode, sx?: object }) => (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>{title}</Typography>
        <Box sx={{flexGrow: 1}}>
            {children}
        </Box>
    </Paper>
);

const StatDisplay = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactElement }) => (
    <Box sx={{display: 'flex', alignItems: 'center'}}>
        {icon}
        <Box sx={{ml: 2}}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
            <Typography variant="body1" color="text.secondary">{title}</Typography>
        </Box>
    </Box>
);

const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
        case 'error':
            return <ErrorOutline color="error" />;
        case 'warn':
            return <Warning color="warning" />;
        case 'debug':
            return <BugReport color="secondary" />;
        case 'info':
            return <Info color="success" />;
        default:
            return <Info color="disabled" />;
    }
};

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<LogStats | null>(null);
    const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchData = useCallback(async (showLoading = false) => {
        try {
            if(showLoading) setLoading(true);
            const [statsData, logsData] = await Promise.all([
                apiService.getLogStats(),
                apiService.getLogs({ limit: 10, page: 1 })
            ]);
            setStats(statsData);
            setRecentLogs(logsData.logs);
            setError(null);
        } catch (err) {
            setError('Failed to fetch dashboard data');
            console.error(err);
        } finally {
            if(showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(true); // Initial fetch with loading indicator

        wsService.connect();
        wsService.on('message', (data: any) => {
            if (data.type === 'newLog') {
                console.log('New log received via WebSocket, refreshing dashboard...');
                fetchData(false); // Refresh without loading indicator
            }
        });

        return () => {
            wsService.disconnect();
        };
    }, [fetchData]);

    if (loading && !stats) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
    }

    if (!stats) {
        return null;
    }

    const logsByLevelData = stats.logsByLevel.map((item, index) => ({
        id: index,
        value: item.count,
        label: item._id.toUpperCase(),
        color: (theme.palette[item._id as keyof typeof theme.palette] as any)?.main || theme.palette.grey[500]
    }));
    
    const logsPerHourData = stats.logsPerHour.map(item => item.count);
    const logsPerHourLabels = stats.logsPerHour.map(item => `${item._id.hour}:00`);

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
            <Box sx={{ gridColumn: 'span 12' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Dashboard</Typography>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                <DashboardPanel title="Total Logs">
                    <StatDisplay value={stats.totalLogs.toLocaleString()} title="All time records" icon={<ReceiptLong sx={{fontSize: 40, color: 'primary.main'}} />} />
                </DashboardPanel>
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                <DashboardPanel title="Errors">
                    <StatDisplay value={stats.logsByLevel.find(l => l._id === 'error')?.count || 0} title="Critical failures" icon={<ErrorOutline sx={{fontSize: 40, color: 'error.main'}} />} />
                </DashboardPanel>
            </Box>
             <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                <DashboardPanel title="Warnings">
                    <StatDisplay value={stats.logsByLevel.find(l => l._id === 'warn')?.count || 0} title="Potential issues" icon={<Warning sx={{fontSize: 40, color: 'warning.main'}} />} />
                </DashboardPanel>
            </Box>
             <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
                <DashboardPanel title="Uptime">
                    <StatDisplay value="99.9%" title="Service availability" icon={<TrendingUp sx={{fontSize: 40, color: 'success.main'}} />} />
                </DashboardPanel>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 8' }, height: 350 }}>
                <DashboardPanel title="Events per Hour">
                    <LineChart
                        series={[{ data: logsPerHourData, showMark: false, color: theme.palette.primary.main, area: true }]}
                        xAxis={[{ scaleType: 'point', data: logsPerHourLabels }]}
                        sx={{
                            '.MuiLineElement-root': { strokeWidth: 2 },
                            '.MuiAreaElement-root': {
                                fill: `url(#${'gradientId'})`,
                                fillOpacity: 0.3
                            },
                            '& .MuiChartsAxis-tickLabel': { fill: theme.palette.text.secondary },
                            '& .MuiChartsAxis-line': { stroke: 'transparent' },
                            '& .MuiChartsGrid-line': { stroke: theme.palette.divider, strokeDasharray: '4 4' },
                        }}
                        grid={{ horizontal: true }}
                    >
                         <defs>
                            <linearGradient id={'gradientId'} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                    </LineChart>
                </DashboardPanel>
            </Box>

            <Box sx={{ gridColumn: 'span 12' }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{mb: 2}}>Recent Logs</Typography>
                    <List disablePadding>
                        {recentLogs.map((log, index) => (
                            <React.Fragment key={log._id}>
                                <ListItem>
                                    <ListItemIcon sx={{minWidth: 40}}>
                                        {getLevelIcon(log.level)}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={
                                            <Typography variant="body2" sx={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                                                <Chip label={log.service} size="small" sx={{mr: 1.5, fontWeight: 500}}/>
                                                <Box component="span" sx={{ fontFamily: "'Fira Code', 'Menlo', 'monospace'" }}>
                                                    {log.message}
                                                </Box>
                                            </Typography>
                                        } 
                                        secondary={format(parseISO(log.timestamp), 'MMM dd, yyyy, HH:mm:ss')} 
                                        secondaryTypographyProps={{ sx: { fontSize: '18px', pt: 0.5 } }}
                                    />
                                </ListItem>
                                {index < recentLogs.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            </Box>
        </Box>
    );
};

export default Dashboard; 