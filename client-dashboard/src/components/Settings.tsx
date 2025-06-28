import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Paper,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemIcon,
} from '@mui/material';
import {
  Dashboard,
  Notifications,
  Storage,
  Person,
  Settings as SettingsIcon,
  ExpandMore,
  Refresh,
  Save,
  Delete,
  Warning,
  Info,
  CheckCircle,
  Error,
  Add,
  Link as LinkIcon,
  CloudOff,
} from '@mui/icons-material';
import { apiService, DashboardSettings, AlertSettings, RetentionSettings, UserSettings, SystemInfo } from '../services/api';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Settings states
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings | null>(null);
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [retentionSettings, setRetentionSettings] = useState<RetentionSettings | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  
  // Dialog states
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // System check state
  const [systemCheckSettings, setSystemCheckSettings] = useState<any>(null);
  const [systemCheckLoading, setSystemCheckLoading] = useState(true);
  const [systemCheckSaving, setSystemCheckSaving] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({ name: '', url: '' });

  useEffect(() => {
    loadSettings();
    loadSystemCheckSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [dashboard, alerts, retention, user, system] = await Promise.all([
        apiService.getDashboardSettings(),
        apiService.getAlertSettings(),
        apiService.getRetentionSettings(),
        apiService.getUserSettings(),
        apiService.getSystemInfo(),
      ]);
      
      setDashboardSettings(dashboard);
      setAlertSettings(alerts);
      setRetentionSettings(retention);
      setUserSettings(user);
      setSystemInfo(system);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemCheckSettings = async () => {
    setSystemCheckLoading(true);
    try {
      const settings = await apiService.getSystemCheckSettings();
      setSystemCheckSettings(settings);
    } catch (err) {
      setError('Failed to load system check settings');
    } finally {
      setSystemCheckLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const saveDashboardSettings = async () => {
    if (!dashboardSettings) return;
    
    setSaving(true);
    try {
      await apiService.updateDashboardSettings(dashboardSettings);
      setSuccess('Dashboard settings saved successfully');
    } catch (err) {
      setError('Failed to save dashboard settings');
    } finally {
      setSaving(false);
    }
  };

  const saveAlertSettings = async () => {
    if (!alertSettings) return;
    
    setSaving(true);
    try {
      await apiService.updateAlertSettings(alertSettings);
      setSuccess('Alert settings saved successfully');
    } catch (err) {
      setError('Failed to save alert settings');
    } finally {
      setSaving(false);
    }
  };

  const saveRetentionSettings = async () => {
    if (!retentionSettings) return;
    
    setSaving(true);
    try {
      await apiService.updateRetentionSettings(retentionSettings);
      setSuccess('Retention settings saved successfully');
    } catch (err) {
      setError('Failed to save retention settings');
    } finally {
      setSaving(false);
    }
  };

  const saveUserSettings = async () => {
    if (!userSettings) return;
    
    setSaving(true);
    try {
      await apiService.updateUserSettings(userSettings);
      setSuccess('User settings saved successfully');
    } catch (err) {
      setError('Failed to save user settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDataCleanup = async () => {
    setCleanupLoading(true);
    try {
      const result = await apiService.triggerDataCleanup();
      setSuccess(`Data cleanup completed. Deleted ${result.deletedCount} logs.`);
      setCleanupDialogOpen(false);
      // Reload system info to update stats
      const system = await apiService.getSystemInfo();
      setSystemInfo(system);
    } catch (err) {
      setError('Failed to perform data cleanup');
    } finally {
      setCleanupLoading(false);
    }
  };

  const saveSystemCheckSettings = async () => {
    if (!systemCheckSettings) return;
    setSystemCheckSaving(true);
    try {
      await apiService.updateSystemCheckSettings(systemCheckSettings);
      setSuccess('System check settings saved successfully');
    } catch (err) {
      setError('Failed to save system check settings');
    } finally {
      setSystemCheckSaving(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const renderDashboardSettings = () => {
    if (!dashboardSettings) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dashboard Configuration
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Refresh Interval (seconds)</InputLabel>
                <Select
                  value={dashboardSettings.refreshInterval}
                  label="Refresh Interval (seconds)"
                  onChange={(e) => setDashboardSettings({
                    ...dashboardSettings,
                    refreshInterval: e.target.value as number
                  })}
                >
                  <MenuItem value={10}>10 seconds</MenuItem>
                  <MenuItem value={30}>30 seconds</MenuItem>
                  <MenuItem value={60}>1 minute</MenuItem>
                  <MenuItem value={300}>5 minutes</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Default Time Range</InputLabel>
                <Select
                  value={dashboardSettings.defaultTimeRange}
                  label="Default Time Range"
                  onChange={(e) => setDashboardSettings({
                    ...dashboardSettings,
                    defaultTimeRange: e.target.value
                  })}
                >
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Widget Configuration
            </Typography>
            <List>
              {dashboardSettings.widgets.map((widget) => (
                <ListItem key={widget.id}>
                  <ListItemText
                    primary={widget.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    secondary={`Position: ${widget.position}`}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={widget.enabled}
                      onChange={(e) => {
                        const updatedWidgets = dashboardSettings.widgets.map(w =>
                          w.id === widget.id ? { ...w, enabled: e.target.checked } : w
                        );
                        setDashboardSettings({
                          ...dashboardSettings,
                          widgets: updatedWidgets
                        });
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={saveDashboardSettings}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Saving...' : 'Save Dashboard Settings'}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderAlertSettings = () => {
    if (!alertSettings) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Alert Configuration
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={alertSettings.enabled}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      enabled: e.target.checked
                    })}
                  />
                }
                label="Enable Alerts"
              />

              <TextField
                fullWidth
                type="number"
                label="Error Rate Threshold (%)"
                value={alertSettings.errorRateThreshold}
                onChange={(e) => setAlertSettings({
                  ...alertSettings,
                  errorRateThreshold: parseFloat(e.target.value)
                })}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                helperText="Alert when error rate exceeds this percentage"
              />

              <TextField
                fullWidth
                type="number"
                label="Log Volume Threshold"
                value={alertSettings.logVolumeThreshold}
                onChange={(e) => setAlertSettings({
                  ...alertSettings,
                  logVolumeThreshold: parseInt(e.target.value)
                })}
                inputProps={{ min: 0 }}
                helperText="Alert when log volume exceeds this number per hour"
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={alertSettings.notifications.email}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      notifications: {
                        ...alertSettings.notifications,
                        email: e.target.checked
                      }
                    })}
                  />
                }
                label="Email Notifications"
              />

              {alertSettings.notifications.email && (
                <TextField
                  fullWidth
                  label="Email Addresses (comma separated)"
                  value={alertSettings.notifications.emails?.join(', ') || ''}
                  onChange={(e) => setAlertSettings({
                    ...alertSettings,
                    notifications: {
                      ...alertSettings.notifications,
                      emails: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="user@example.com, team@example.com"
                />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={alertSettings.notifications.slack}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      notifications: {
                        ...alertSettings.notifications,
                        slack: e.target.checked
                      }
                    })}
                  />
                }
                label="Slack Notifications"
              />

              {alertSettings.notifications.slack && (
                <TextField
                  fullWidth
                  label="Slack Webhook URL"
                  value={alertSettings.notifications.slackWebhookUrl || ''}
                  onChange={(e) => setAlertSettings({
                    ...alertSettings,
                    notifications: {
                      ...alertSettings.notifications,
                      slackWebhookUrl: e.target.value
                    }
                  })}
                  placeholder="https://hooks.slack.com/services/..."
                />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={alertSettings.notifications.webhook}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      notifications: {
                        ...alertSettings.notifications,
                        webhook: e.target.checked
                      }
                    })}
                  />
                }
                label="Webhook Notifications"
              />

              {alertSettings.notifications.webhook && (
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={alertSettings.notifications.webhookUrl}
                  onChange={(e) => setAlertSettings({
                    ...alertSettings,
                    notifications: {
                      ...alertSettings.notifications,
                      webhookUrl: e.target.value
                    }
                  })}
                  placeholder="https://your-webhook-url.com/endpoint"
                />
              )}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={saveAlertSettings}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Saving...' : 'Save Alert Settings'}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderRetentionSettings = () => {
    if (!retentionSettings) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Retention Policy
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={retentionSettings.enabled}
                    onChange={(e) => setRetentionSettings({
                      ...retentionSettings,
                      enabled: e.target.checked
                    })}
                  />
                }
                label="Enable Data Retention"
              />

              <TextField
                fullWidth
                type="number"
                label="Retention Period (days)"
                value={retentionSettings.days}
                onChange={(e) => setRetentionSettings({
                  ...retentionSettings,
                  days: parseInt(e.target.value)
                })}
                inputProps={{ min: 1, max: 365 }}
                helperText="Logs older than this will be automatically deleted"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={retentionSettings.autoDelete}
                    onChange={(e) => setRetentionSettings({
                      ...retentionSettings,
                      autoDelete: e.target.checked
                    })}
                  />
                }
                label="Auto-delete old logs"
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Manual Data Cleanup
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Manually trigger data cleanup to remove logs older than the retention period.
            </Typography>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setCleanupDialogOpen(true)}
              startIcon={<Delete />}
            >
              Trigger Data Cleanup
            </Button>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={saveRetentionSettings}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Saving...' : 'Save Retention Settings'}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderUserSettings = () => {
    if (!userSettings) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Preferences
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={userSettings.theme}
                  label="Theme"
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    theme: e.target.value as 'light' | 'dark'
                  })}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={userSettings.timezone}
                  label="Timezone"
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    timezone: e.target.value
                  })}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                  <MenuItem value="America/Chicago">Central Time</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  <MenuItem value="Europe/London">London</MenuItem>
                  <MenuItem value="Europe/Paris">Paris</MenuItem>
                  <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={userSettings.language}
                  label="Language"
                  onChange={(e) => setUserSettings({
                    ...userSettings,
                    language: e.target.value
                  })}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={saveUserSettings}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Saving...' : 'Save User Settings'}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderSystemInfo = () => {
    if (!systemInfo) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Database Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Database Name</Typography>
                <Typography variant="body1">{systemInfo.database.name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Collections</Typography>
                <Typography variant="body1">{systemInfo.database.collections}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Data Size</Typography>
                <Typography variant="body1">{formatBytes(systemInfo.database.dataSize)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Storage Size</Typography>
                <Typography variant="body1">{formatBytes(systemInfo.database.storageSize)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Indexes</Typography>
                <Typography variant="body1">{systemInfo.database.indexes}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Index Size</Typography>
                <Typography variant="body1">{formatBytes(systemInfo.database.indexSize)}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Log Statistics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Total Logs</Typography>
                <Typography variant="body1">{systemInfo.logs.total.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Unique Services</Typography>
                <Typography variant="body1">{systemInfo.logs.uniqueServices}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Unique Hosts</Typography>
                <Typography variant="body1">{systemInfo.logs.uniqueHosts}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Oldest Log</Typography>
                <Typography variant="body1">
                  {systemInfo.logs.oldest ? new Date(systemInfo.logs.oldest).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Newest Log</Typography>
                <Typography variant="body1">
                  {systemInfo.logs.newest ? new Date(systemInfo.logs.newest).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Node Version</Typography>
                <Typography variant="body1">{systemInfo.system.nodeVersion}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Platform</Typography>
                <Typography variant="body1">{systemInfo.system.platform}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Uptime</Typography>
                <Typography variant="body1">{formatUptime(systemInfo.system.uptime)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Memory Usage</Typography>
                <Typography variant="body1">{formatBytes(systemInfo.system.memory.heapUsed)}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={loadSettings}
            startIcon={<Refresh />}
          >
            Refresh System Info
          </Button>
        </Box>
      </Box>
    );
  };

  // System Check Tab UI
  const renderSystemCheckSettings = () => {
    if (systemCheckLoading) return <CircularProgress />;
    if (!systemCheckSettings) return null;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Check Configuration
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemCheckSettings.enabled}
                    onChange={(e) => setSystemCheckSettings({
                      ...systemCheckSettings,
                      enabled: e.target.checked
                    })}
                  />
                }
                label="Enable System Check"
              />
              <TextField
                fullWidth
                type="number"
                label="Ping Interval (seconds)"
                value={systemCheckSettings.intervalSeconds}
                onChange={(e) => setSystemCheckSettings({
                  ...systemCheckSettings,
                  intervalSeconds: parseInt(e.target.value)
                })}
                inputProps={{ min: 10, max: 3600 }}
                helperText="How often to ping endpoints (10-3600 seconds)"
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Endpoints to Monitor</Typography>
              <List>
                {systemCheckSettings.endpoints.map((ep: any, idx: number) => (
                  <ListItem key={idx}>
                    <ListItemIcon><LinkIcon /></ListItemIcon>
                    <ListItemText
                      primary={ep.name}
                      secondary={ep.url}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" color="error" onClick={() => {
                        setSystemCheckSettings({
                          ...systemCheckSettings,
                          endpoints: systemCheckSettings.endpoints.filter((_: any, i: number) => i !== idx)
                        });
                      }}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                <ListItem>
                  <TextField
                    label="Name"
                    value={newEndpoint.name}
                    onChange={e => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                    sx={{ mr: 1, width: 120 }}
                  />
                  <TextField
                    label="URL"
                    value={newEndpoint.url}
                    onChange={e => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                    sx={{ mr: 1, flex: 1 }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => {
                      if (newEndpoint.name && newEndpoint.url) {
                        setSystemCheckSettings({
                          ...systemCheckSettings,
                          endpoints: [...systemCheckSettings.endpoints, { ...newEndpoint }]
                        });
                        setNewEndpoint({ name: '', url: '' });
                      }
                    }}
                  >
                    <Add />
                  </IconButton>
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={saveSystemCheckSettings}
            disabled={systemCheckSaving}
            startIcon={systemCheckSaving ? <CircularProgress size={20} /> : <Save />}
          >
            {systemCheckSaving ? 'Saving...' : 'Save System Check Settings'}
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Dashboard />} label="Dashboard" />
          <Tab icon={<Notifications />} label="Alerts" />
          <Tab icon={<Storage />} label="Retention" />
          <Tab icon={<Person />} label="User" />
          <Tab icon={<SettingsIcon />} label="System" />
          <Tab icon={<CloudOff />} label="System Check" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {renderDashboardSettings()}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderAlertSettings()}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              {renderRetentionSettings()}
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              {renderUserSettings()}
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              {renderSystemInfo()}
            </TabPanel>
            <TabPanel value={tabValue} index={5}>
              {renderSystemCheckSettings()}
            </TabPanel>
          </>
        )}
      </Paper>

      {/* Data Cleanup Dialog */}
      <Dialog open={cleanupDialogOpen} onClose={() => setCleanupDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Confirm Data Cleanup
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all logs older than {retentionSettings?.days} days. 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDataCleanup}
            color="warning"
            variant="contained"
            disabled={cleanupLoading}
            startIcon={cleanupLoading ? <CircularProgress size={20} /> : <Delete />}
          >
            {cleanupLoading ? 'Cleaning...' : 'Delete Old Logs'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 