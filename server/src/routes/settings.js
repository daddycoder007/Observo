import express from 'express';
import { getCollection, getDatabase } from '../database/mongoClient.js';
import { settingsService } from '../database/settingsService.js';

const router = express.Router();

// Initialize settings service when routes are loaded
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await settingsService.initialize();
    isInitialized = true;
  }
}

function getFriendlyPlatformName(platform) {
  switch (platform) {
    case 'darwin':
      return 'macOS';
    case 'win32':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      return platform;
  }
}

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    await ensureInitialized();
    const settings = await settingsService.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings',
      message: error.message 
    });
  }
});

// PUT /api/settings - Update all settings
router.put('/', async (req, res) => {
  try {
    await ensureInitialized();
    const newSettings = req.body;
    
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    const updatedSettings = await settingsService.updateSettings(newSettings);
    
    res.json({ 
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(400).json({ 
      error: 'Failed to update settings',
      message: error.message 
    });
  }
});

// GET /api/settings/dashboard - Get dashboard settings
router.get('/dashboard', async (req, res) => {
  try {
    await ensureInitialized();
    const dashboardSettings = await settingsService.getSection('dashboard');
    
    if (!dashboardSettings) {
      return res.status(404).json({ error: 'Dashboard settings not found' });
    }

    res.json(dashboardSettings);
  } catch (error) {
    console.error('Error fetching dashboard settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard settings',
      message: error.message 
    });
  }
});

// PUT /api/settings/dashboard - Update dashboard settings
router.put('/dashboard', async (req, res) => {
  try {
    await ensureInitialized();
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid dashboard settings format' });
    }

    const updatedSettings = await settingsService.updateSection('dashboard', settings);
    
    res.json({ 
      message: 'Dashboard settings updated successfully',
      settings: updatedSettings.dashboard
    });
  } catch (error) {
    console.error('Error updating dashboard settings:', error);
    res.status(400).json({ 
      error: 'Failed to update dashboard settings',
      message: error.message 
    });
  }
});

// GET /api/settings/alerts - Get alert settings
router.get('/alerts', async (req, res) => {
  try {
    await ensureInitialized();
    const alertSettings = await settingsService.getSection('alerts');
    
    if (!alertSettings) {
      return res.status(404).json({ error: 'Alert settings not found' });
    }

    res.json(alertSettings);
  } catch (error) {
    console.error('Error fetching alert settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch alert settings',
      message: error.message 
    });
  }
});

// PUT /api/settings/alerts - Update alert settings
router.put('/alerts', async (req, res) => {
  try {
    await ensureInitialized();
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid alert settings format' });
    }

    const updatedSettings = await settingsService.updateSection('alerts', settings);
    
    res.json({ 
      message: 'Alert settings updated successfully',
      settings: updatedSettings.alerts
    });
  } catch (error) {
    console.error('Error updating alert settings:', error);
    res.status(400).json({ 
      error: 'Failed to update alert settings',
      message: error.message 
    });
  }
});

// GET /api/settings/retention - Get data retention settings
router.get('/retention', async (req, res) => {
  try {
    await ensureInitialized();
    const retentionSettings = await settingsService.getSection('dataRetention');
    
    if (!retentionSettings) {
      return res.status(404).json({ error: 'Retention settings not found' });
    }

    res.json(retentionSettings);
  } catch (error) {
    console.error('Error fetching retention settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch retention settings',
      message: error.message 
    });
  }
});

// PUT /api/settings/retention - Update data retention settings
router.put('/retention', async (req, res) => {
  try {
    await ensureInitialized();
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid retention settings format' });
    }

    const updatedSettings = await settingsService.updateSection('dataRetention', settings);
    
    res.json({ 
      message: 'Retention settings updated successfully',
      settings: updatedSettings.dataRetention
    });
  } catch (error) {
    console.error('Error updating retention settings:', error);
    res.status(400).json({ 
      error: 'Failed to update retention settings',
      message: error.message 
    });
  }
});

// POST /api/settings/retention/cleanup - Trigger data cleanup
router.post('/retention/cleanup', async (req, res) => {
  try {
    await ensureInitialized();
    const { days } = req.body;
    const collection = getCollection();
    
    // Get retention settings
    const retentionSettings = await settingsService.getSection('dataRetention');
    const retentionDays = days || retentionSettings?.days || 30;
    
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await collection.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      message: `Data cleanup completed`,
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays
    });
  } catch (error) {
    console.error('Error during data cleanup:', error);
    res.status(500).json({ 
      error: 'Failed to perform data cleanup',
      message: error.message 
    });
  }
});

// GET /api/settings/user - Get user preferences
router.get('/user', async (req, res) => {
  try {
    await ensureInitialized();
    const userSettings = await settingsService.getSection('user');
    
    if (!userSettings) {
      return res.status(404).json({ error: 'User settings not found' });
    }

    res.json(userSettings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user settings',
      message: error.message 
    });
  }
});

// PUT /api/settings/user - Update user preferences
router.put('/user', async (req, res) => {
  try {
    await ensureInitialized();
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid user settings format' });
    }

    const updatedSettings = await settingsService.updateSection('user', settings);
    
    res.json({ 
      message: 'User settings updated successfully',
      settings: updatedSettings.user
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(400).json({ 
      error: 'Failed to update user settings',
      message: error.message 
    });
  }
});

// GET /api/settings/system - Get system information
router.get('/system', async (req, res) => {
  try {
    await ensureInitialized();
    const db = getDatabase();
    const collection = getCollection();
    
    // Get database stats
    const dbStats = await db.stats();
    
    // Get log statistics
    const totalLogs = await collection.countDocuments();
    const uniqueServices = await collection.distinct('service');
    const uniqueHosts = await collection.distinct('metadata.host');
    
    // Get oldest and newest logs
    const oldestLog = await collection.findOne({}, { sort: { timestamp: 1 } });
    const newestLog = await collection.findOne({}, { sort: { timestamp: -1 } });
    
    // Get settings info
    const settings = await settingsService.getSettings();
    
    // Get system info
    const systemInfo = {
      database: {
        name: dbStats.db,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSizes
      },
      logs: {
        total: totalLogs,
        uniqueServices: uniqueServices.length,
        uniqueHosts: uniqueHosts.length,
        oldest: oldestLog?.timestamp,
        newest: newestLog?.timestamp
      },
      settings: {
        sections: Object.keys(settings),
        lastUpdated: new Date().toISOString()
      },
      system: {
        nodeVersion: process.version,
        platform: getFriendlyPlatformName(process.platform),
        uptime: process.uptime(),
        memory: {
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss
        }
      }
    };

    res.json(systemInfo);
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system info',
      message: error.message 
    });
  }
});

// POST /api/settings/reset - Reset settings to defaults
router.post('/reset', async (req, res) => {
  try {
    await ensureInitialized();
    const defaultSettings = await settingsService.resetToDefaults();
    
    res.json({
      message: 'Settings reset to defaults successfully',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ 
      error: 'Failed to reset settings',
      message: error.message 
    });
  }
});

// GET /api/settings/export - Export settings
router.get('/export', async (req, res) => {
  try {
    await ensureInitialized();
    const exportData = await settingsService.exportSettings();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="observo-settings-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({ 
      error: 'Failed to export settings',
      message: error.message 
    });
  }
});

// POST /api/settings/import - Import settings
router.post('/import', async (req, res) => {
  try {
    await ensureInitialized();
    const importData = req.body;
    
    if (!importData) {
      return res.status(400).json({ error: 'No import data provided' });
    }

    const updatedSettings = await settingsService.importSettings(importData);
    
    res.json({
      message: 'Settings imported successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error importing settings:', error);
    res.status(400).json({ 
      error: 'Failed to import settings',
      message: error.message 
    });
  }
});

// GET /api/settings/history - Get settings history
router.get('/history', async (req, res) => {
  try {
    await ensureInitialized();
    const limit = parseInt(req.query.limit) || 10;
    const history = await settingsService.getSettingsHistory(limit);
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching settings history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch settings history',
      message: error.message 
    });
  }
});

// GET /api/settings/system-check - Get system check settings
router.get('/system-check', async (req, res) => {
  try {
    await ensureInitialized();
    const systemCheckSettings = await settingsService.getSection('systemCheck');
    console.log('systemCheckSettings', systemCheckSettings);
    if (!systemCheckSettings) {
      return res.status(404).json({ error: 'System check settings not found' });
    }
    res.json(systemCheckSettings);
  } catch (error) {
    console.error('Error fetching system check settings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system check settings',
      message: error.message 
    });
  }
});

// PUT /api/settings/system-check - Update system check settings
router.put('/system-check', async (req, res) => {
  try {
    await ensureInitialized();
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid system check settings format' });
    }
    const updatedSettings = await settingsService.updateSection('systemCheck', settings);
    res.json({ 
      message: 'System check settings updated successfully',
      settings: updatedSettings.systemCheck
    });
  } catch (error) {
    console.error('Error updating system check settings:', error);
    res.status(400).json({ 
      error: 'Failed to update system check settings',
      message: error.message 
    });
  }
});

export { router as settingsRoutes }; 