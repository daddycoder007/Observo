# Observo Settings System

This document describes the production-ready settings system for the Observo log management platform.

## Overview

The settings system provides a robust, database-backed configuration management solution with:

- **Database Persistence**: All settings are stored in MongoDB
- **Validation**: Comprehensive validation for all settings
- **Caching**: In-memory caching for performance
- **Versioning**: Settings history tracking
- **Import/Export**: Backup and restore functionality
- **Section-based Management**: Organized settings by category

## Database Schema

Settings are stored in a `settings` collection with the following structure:

```javascript
{
  key: 'global',                    // Unique identifier
  data: {                          // Actual settings data
    dashboard: { ... },
    alerts: { ... },
    dataRetention: { ... },
    api: { ... },
    user: { ... }
  },
  createdAt: Date,                 // Creation timestamp
  updatedAt: Date,                 // Last update timestamp
  version: '1.0.0'                // Settings version
}
```

## Settings Structure

### Dashboard Settings
```javascript
{
  refreshInterval: 30,             // Refresh interval in seconds (5-300)
  defaultTimeRange: '24h',         // Default time range (1h, 6h, 12h, 24h, 7d, 30d)
  widgets: [                       // Dashboard widgets configuration
    {
      id: 'log-stats',
      enabled: true,
      position: 0
    }
  ]
}
```

### Alert Settings
```javascript
{
  errorRateThreshold: 5.0,         // Error rate threshold percentage (0-100)
  logVolumeThreshold: 1000,        // Log volume threshold (0+)
  enabled: true,                   // Alerts enabled/disabled
  notifications: {
    email: false,                  // Email notifications
    webhook: false,                // Webhook notifications
    webhookUrl: ''                 // Webhook URL
  }
}
```

### Data Retention Settings
```javascript
{
  enabled: true,                   // Retention enabled/disabled
  days: 30,                       // Retention period in days (1-365)
  autoDelete: true                // Auto-delete old logs
}
```

### API Settings
```javascript
{
  rateLimit: 1000,                // API rate limit (10-10000)
  maxResults: 1000                // Maximum results per query (10-10000)
}
```

### User Settings
```javascript
{
  theme: 'dark',                  // UI theme (light, dark, auto)
  timezone: 'UTC',                // User timezone
  language: 'en'                  // Language (en, es, fr, de, ja, zh)
}
```

## API Endpoints

### Get All Settings
```http
GET /api/settings
```

**Response:**
```json
{
  "dashboard": { ... },
  "alerts": { ... },
  "dataRetention": { ... },
  "api": { ... },
  "user": { ... }
}
```

### Update All Settings
```http
PUT /api/settings
Content-Type: application/json

{
  "dashboard": {
    "refreshInterval": 60
  }
}
```

### Get Section Settings
```http
GET /api/settings/{section}
```

Sections: `dashboard`, `alerts`, `retention`, `user`

### Update Section Settings
```http
PUT /api/settings/{section}
Content-Type: application/json

{
  "refreshInterval": 60,
  "defaultTimeRange": "12h"
}
```

### Reset to Defaults
```http
POST /api/settings/reset
```

### Export Settings
```http
GET /api/settings/export
```

**Response:** JSON file download with settings backup

### Import Settings
```http
POST /api/settings/import
Content-Type: application/json

{
  "settings": { ... },
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Get Settings History
```http
GET /api/settings/history?limit=10
```

### Data Cleanup
```http
POST /api/settings/retention/cleanup
Content-Type: application/json

{
  "days": 30
}
```

### System Information
```http
GET /api/settings/system
```

## Validation Rules

### Dashboard
- `refreshInterval`: Number between 5-300 seconds
- `defaultTimeRange`: Must be one of ['1h', '6h', '12h', '24h', '7d', '30d']
- `widgets`: Array of objects with `id` (string), `enabled` (boolean), `position` (number)

### Alerts
- `errorRateThreshold`: Number between 0-100
- `logVolumeThreshold`: Number >= 0
- `enabled`: Boolean
- `notifications`: Object with `email` (boolean), `webhook` (boolean), `webhookUrl` (string)

### Data Retention
- `enabled`: Boolean
- `days`: Number between 1-365
- `autoDelete`: Boolean

### API
- `rateLimit`: Number between 10-10000
- `maxResults`: Number between 10-10000

### User
- `theme`: Must be one of ['light', 'dark', 'auto']
- `timezone`: Non-empty string
- `language`: Must be one of ['en', 'es', 'fr', 'de', 'ja', 'zh']

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found (section not found)
- `500`: Internal Server Error

## Caching

The settings system uses in-memory caching with a 5-minute TTL for improved performance. Cache is automatically invalidated when settings are updated.

## Usage Examples

### JavaScript/Node.js
```javascript
// Get all settings
const response = await fetch('/api/settings');
const settings = await response.json();

// Update dashboard settings
const updateResponse = await fetch('/api/settings/dashboard', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshInterval: 60,
    defaultTimeRange: '12h'
  })
});

// Export settings
const exportResponse = await fetch('/api/settings/export');
const exportData = await exportResponse.json();
```

### cURL
```bash
# Get all settings
curl -X GET http://localhost:8000/api/settings

# Update alerts
curl -X PUT http://localhost:8000/api/settings/alerts \
  -H "Content-Type: application/json" \
  -d '{"errorRateThreshold": 10.0, "enabled": true}'

# Reset to defaults
curl -X POST http://localhost:8000/api/settings/reset

# Export settings
curl -X GET http://localhost:8000/api/settings/export -o settings-backup.json
```

## Production Considerations

1. **Backup**: Regularly export settings using the export endpoint
2. **Monitoring**: Monitor the `/api/settings/system` endpoint for system health
3. **Validation**: Always validate settings before updating
4. **Caching**: The system automatically handles caching, but monitor cache hit rates
5. **Security**: Implement proper authentication and authorization for settings endpoints
6. **Logging**: All settings operations are logged for audit purposes

## Migration from In-Memory Settings

If migrating from the old in-memory settings system:

1. The system automatically initializes default settings on first run
2. Use the import endpoint to restore any custom settings
3. Verify settings after migration using the system endpoint

## Troubleshooting

### Common Issues

1. **Settings not persisting**: Check MongoDB connection and permissions
2. **Validation errors**: Review the validation rules for each setting
3. **Cache issues**: Settings are automatically refreshed, but you can restart the service
4. **Import failures**: Ensure the import data matches the expected format

### Debug Endpoints

- `/api/settings/system`: Check system health and settings status
- `/api/settings/history`: View recent settings changes
- `/health`: Overall service health check 