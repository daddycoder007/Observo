import { getDatabase, getCollection } from './mongoClient.js';
import logger from '../logger.js';

// Default settings structure
const DEFAULT_SETTINGS = {
  dashboard: {
    refreshInterval: 30,
    defaultTimeRange: '24h',
    widgets: [
      { id: 'log-stats', enabled: true, position: 0 },
      { id: 'error-rate', enabled: true, position: 1 },
      { id: 'service-performance', enabled: true, position: 2 },
      { id: 'recent-logs', enabled: true, position: 3 }
    ]
  },
  alerts: {
    errorRateThreshold: 5.0,
    logVolumeThreshold: 1000,
    enabled: true,
    notifications: {
      email: false,
      emails: [],
      webhook: false,
      webhookUrl: '',
      slack: false,
      slackWebhookUrl: ''
    }
  },
  dataRetention: {
    enabled: true,
    days: 30,
    autoDelete: true
  },
  api: {
    rateLimit: 1000,
    maxResults: 1000
  },
  user: {
    theme: 'dark',
    timezone: 'UTC',
    language: 'en'
  },
  systemCheck: {
    enabled: false,
    intervalSeconds: 60,
    endpoints: [] // array of { url: string, name: string }
  }
};

// Settings validation schemas
const SETTINGS_VALIDATION = {
  dashboard: {
    refreshInterval: (value) => typeof value === 'number' && value >= 5 && value <= 300,
    defaultTimeRange: (value) => ['1h', '6h', '12h', '24h', '7d', '30d'].includes(value),
    widgets: (value) => Array.isArray(value) && value.every(widget => 
      typeof widget.id === 'string' && 
      typeof widget.enabled === 'boolean' && 
      typeof widget.position === 'number'
    )
  },
  alerts: {
    errorRateThreshold: (value) => typeof value === 'number' && value >= 0 && value <= 100,
    logVolumeThreshold: (value) => typeof value === 'number' && value >= 0,
    enabled: (value) => typeof value === 'boolean',
    notifications: (value) => typeof value === 'object' && 
      typeof value.email === 'boolean' && 
      Array.isArray(value.emails) && value.emails.every(e => typeof e === 'string') &&
      typeof value.webhook === 'boolean' && 
      typeof value.webhookUrl === 'string' &&
      typeof value.slack === 'boolean' &&
      typeof value.slackWebhookUrl === 'string'
  },
  dataRetention: {
    enabled: (value) => typeof value === 'boolean',
    days: (value) => typeof value === 'number' && value >= 1 && value <= 365,
    autoDelete: (value) => typeof value === 'boolean'
  },
  api: {
    rateLimit: (value) => typeof value === 'number' && value >= 10 && value <= 10000,
    maxResults: (value) => typeof value === 'number' && value >= 10 && value <= 10000
  },
  user: {
    theme: (value) => ['light', 'dark', 'auto'].includes(value),
    timezone: (value) => typeof value === 'string' && value.length > 0,
    language: (value) => ['en', 'es', 'fr', 'de', 'ja', 'zh'].includes(value)
  },
  systemCheck: {
    enabled: (value) => typeof value === 'boolean',
    intervalSeconds: (value) => typeof value === 'number' && value >= 10 && value <= 3600,
    endpoints: (value) => Array.isArray(value) && value.every(e => typeof e.url === 'string' && typeof e.name === 'string')
  }
};

class SettingsService {
  constructor() {
    this.db = null;
    this.settingsCollection = null;
    this.cache = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  async initialize() {
    try {
      this.db = getDatabase();
      this.settingsCollection = this.db.collection('settings');
      
      // Create indexes for settings collection
      await this.settingsCollection.createIndex({ key: 1 }, { unique: true });
      await this.settingsCollection.createIndex({ updatedAt: -1 });
      
      // Initialize default settings if they don't exist
      await this.initializeDefaultSettings();
      
      logger.info('✅ Settings service initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize settings service:', error);
      throw error;
    }
  }

  async initializeDefaultSettings() {
    try {
      // Check if default settings exist
      const existingSettings = await this.settingsCollection.findOne({ key: 'global' });
      
      if (!existingSettings) {
        const defaultSettings = {
          key: 'global',
          data: DEFAULT_SETTINGS,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0'
        };
        
        await this.settingsCollection.insertOne(defaultSettings);
        logger.info('✅ Default settings initialized');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize default settings:', error);
      throw error;
    }
  }

  async getSettings() {
    try {
      // Check cache first
      if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        return this.cache;
      }

      const settingsDoc = await this.settingsCollection.findOne({ key: 'global' });
      
      if (!settingsDoc) {
        // Initialize default settings if not found
        await this.initializeDefaultSettings();
        const newSettingsDoc = await this.settingsCollection.findOne({ key: 'global' });
        this.cache = newSettingsDoc.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return newSettingsDoc.data;
      }

      // Update cache
      this.cache = settingsDoc.data;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      
      return settingsDoc.data;
    } catch (error) {
      logger.error('❌ Failed to get settings:', error);
      throw new Error('Failed to retrieve settings');
    }
  }

  async getSection(section) {
    try {
      const settings = await this.getSettings();
      return settings[section] || null;
    } catch (error) {
      logger.error(`❌ Failed to get ${section} settings:`, error);
      throw new Error(`Failed to retrieve ${section} settings`);
    }
  }

  async updateSettings(newSettings) {
    try {
      // Validate the new settings
      const validationResult = this.validateSettings(newSettings);
      if (!validationResult.isValid) {
        throw new Error(`Settings validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Get current settings and merge
      const currentSettings = await this.getSettings();
      const mergedSettings = this.deepMerge(currentSettings, newSettings);

      // Update in database
      const result = await this.settingsCollection.updateOne(
        { key: 'global' },
        {
          $set: {
            data: mergedSettings,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      // Clear cache
      this.cache = null;
      this.cacheExpiry = null;

      logger.info('✅ Settings updated successfully');
      return mergedSettings;
    } catch (error) {
      logger.error('❌ Failed to update settings:', error);
      throw error;
    }
  }

  async updateSection(section, sectionData) {
    try {
      // Validate the section
      const validationResult = this.validateSection(section, sectionData);
      if (!validationResult.isValid) {
        throw new Error(`Section validation failed: ${validationResult.errors.join(', ')}`);
      }

      const updateData = { [section]: sectionData };
      return await this.updateSettings(updateData);
    } catch (error) {
      logger.error(`❌ Failed to update ${section} settings:`, error);
      throw error;
    }
  }

  validateSettings(settings) {
    const errors = [];
    
    for (const [section, sectionData] of Object.entries(settings)) {
      if (!SETTINGS_VALIDATION[section]) {
        errors.push(`Unknown section: ${section}`);
        continue;
      }

      const sectionValidation = this.validateSection(section, sectionData);
      if (!sectionValidation.isValid) {
        errors.push(...sectionValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateSection(section, sectionData) {
    const errors = [];
    const validators = SETTINGS_VALIDATION[section];

    if (!validators) {
      return { isValid: false, errors: [`Unknown section: ${section}`] };
    }

    for (const [key, validator] of Object.entries(validators)) {
      if (sectionData.hasOwnProperty(key)) {
        if (!validator(sectionData[key])) {
          errors.push(`${section}.${key}: Invalid value`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  async getSettingsHistory(limit = 10) {
    try {
      const history = await this.settingsCollection
        .find({ key: 'global' })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

      return history.map(item => ({
        version: item.version,
        updatedAt: item.updatedAt,
        changes: item.changes || []
      }));
    } catch (error) {
      logger.error('❌ Failed to get settings history:', error);
      throw new Error('Failed to retrieve settings history');
    }
  }

  async resetToDefaults() {
    try {
      await this.settingsCollection.updateOne(
        { key: 'global' },
        {
          $set: {
            data: DEFAULT_SETTINGS,
            updatedAt: new Date(),
            version: '1.0.0'
          }
        },
        { upsert: true }
      );

      // Clear cache
      this.cache = null;
      this.cacheExpiry = null;

      logger.info('✅ Settings reset to defaults');
      return DEFAULT_SETTINGS;
    } catch (error) {
      logger.error('❌ Failed to reset settings:', error);
      throw new Error('Failed to reset settings to defaults');
    }
  }

  async exportSettings() {
    try {
      const settings = await this.getSettings();
      return {
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      logger.error('❌ Failed to export settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  async importSettings(importData) {
    try {
      if (!importData.settings || typeof importData.settings !== 'object') {
        throw new Error('Invalid import data format');
      }

      // Validate imported settings
      const validationResult = this.validateSettings(importData.settings);
      if (!validationResult.isValid) {
        throw new Error(`Import validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Update settings with imported data
      const result = await this.updateSettings(importData.settings);
      
      logger.info('✅ Settings imported successfully');
      return result;
    } catch (error) {
      logger.error('❌ Failed to import settings:', error);
      throw error;
    }
  }
}

// Create singleton instance
const settingsService = new SettingsService();

export { settingsService, DEFAULT_SETTINGS }; 