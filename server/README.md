# Observo Log Service

A Node.js service that consumes logs from Kafka topics and stores them in MongoDB, providing REST APIs for log retrieval and analytics.

## Features

- 🚀 Kafka consumer for multiple topics
- 📊 MongoDB storage with optimized indexes
- 🔍 RESTful APIs for log retrieval
- 📈 Dashboard statistics and analytics
- 🎯 Advanced filtering and pagination
- 🗑️ Log cleanup capabilities

## Prerequisites

- Node.js 18+ 
- MongoDB (via Docker or local installation)
- Kafka broker running (from log-agent setup)

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Setup

Copy the environment file and configure it:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Kafka Configuration (matching log-agent setup)
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_PREFIX=testing-logs
KAFKA_TOPICS=testing-logs.output,testing-logs.error,testing-logs.access
KAFKA_GROUP_ID=observo-log-consumer-group
KAFKA_CLIENT_ID=observo-log-service

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=observo
MONGODB_COLLECTION=logs
```

### 3. Start MongoDB (Optional)

If you don't have MongoDB running, use Docker:

```bash
docker-compose up mongodb -d
```

### 4. Start the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will:
- Connect to MongoDB
- Start consuming logs from Kafka topics
- Start the REST API server

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Health Check
```http
GET /health
```

### Get Logs
```http
GET /api/logs
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)
- `level` (string): Filter by log level (error, warn, info, debug)
- `service` (string): Filter by service/server_id
- `host` (string): Filter by host
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `search` (string): Search in message, service, or host
- `sortBy` (string): Sort field (timestamp, level, service)
- `sortOrder` (string): Sort order (asc, desc)

**Example:**
```http
GET /api/logs?page=1&limit=20&level=error&startDate=2024-01-01T00:00:00Z
```

**Response:**
```json
{
  "logs": [
    {
      "_id": "...",
      "timestamp": "2024-01-01T10:30:00.000Z",
      "level": "error",
      "message": "Database connection failed",
      "service": "my-server-1",
      "tag": "output",
      "metadata": {
        "host": "my-server-1",
        "topic": "testing-logs.output"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "filters": {
    "level": "error",
    "startDate": "2024-01-01T00:00:00Z"
  }
}
```

### Get Log Statistics
```http
GET /api/logs/stats
```

**Query Parameters:**
- `startDate` (string): Start date for statistics
- `endDate` (string): End date for statistics

**Response:**
```json
{
  "totalLogs": 1500,
  "recentLogs": 45,
  "logsByLevel": [
    { "_id": "info", "count": 800 },
    { "_id": "error", "count": 50 },
    { "_id": "warn", "count": 30 }
  ],
  "logsByService": [
    { "_id": "my-server-1", "count": 750 },
    { "_id": "my-server-2", "count": 450 }
  ],
  "logsByHost": [
    { "_id": "my-server-1", "count": 750 },
    { "_id": "my-server-2", "count": 450 }
  ],
  "logsPerHour": [
    {
      "_id": { "year": 2024, "month": 1, "day": 1, "hour": 10 },
      "count": 25
    }
  ]
}
```

### Get Specific Log
```http
GET /api/logs/:id
```

**Response:**
```json
{
  "_id": "...",
  "timestamp": "2024-01-01T10:30:00.000Z",
  "level": "error",
  "message": "Database connection failed",
  "service": "my-server-1",
  "tag": "output",
  "metadata": {
    "host": "my-server-1",
    "topic": "testing-logs.output"
  },
  "kafkaMetadata": {
    "topic": "testing-logs.output",
    "partition": 0,
    "offset": 12345,
    "receivedAt": "2024-01-01T10:30:01.000Z"
  }
}
```

### Delete Logs
```http
DELETE /api/logs
```

**Query Parameters:**
- `level` (string): Delete logs by level
- `service` (string): Delete logs by service
- `host` (string): Delete logs by host
- `startDate` (string): Delete logs from start date
- `endDate` (string): Delete logs until end date

**Example:**
```http
DELETE /api/logs?level=debug&startDate=2024-01-01T00:00:00Z
```

**Response:**
```json
{
  "message": "Deleted 25 logs",
  "deletedCount": 25
}
```

## Kafka Topics

The service consumes from topics with the pattern: `{prefix}.{tag}`

**Default Configuration:**
- Topic Prefix: `testing-logs`
- Topics: `testing-logs.output`, `testing-logs.error`, `testing-logs.access`

**Log Message Format:**
```json
{
  "timestamp": "2024-01-01T10:30:00.000Z",
  "log": "Database connection failed",
  "server_id": "my-server-1",
  "tag": "output"
}
```

## MongoDB Schema

```json
{
  "_id": "ObjectId",
  "timestamp": "Date",
  "level": "String (error|warn|info|debug)",
  "message": "String",
  "service": "String",
  "tag": "String",
  "metadata": {
    "host": "String",
    "topic": "String",
    "partition": "Number",
    "offset": "Number"
  },
  "kafkaMetadata": {
    "topic": "String",
    "partition": "Number",
    "offset": "Number",
    "receivedAt": "Date"
  },
  "raw": "Object (original log data)"
}
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
See `env.example` for all available configuration options.

### Logs
The service logs to console with emojis for easy identification:
- 🚀 Server startup
- ✅ Success operations
- ❌ Error operations
- 📥 Kafka subscriptions
- 📝 MongoDB operations

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure proper MongoDB connection string
3. Set up proper Kafka broker addresses
4. Use a process manager like PM2
5. Set up proper logging and monitoring

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify connection string in `.env`

2. **Kafka Connection Failed**
   - Ensure Kafka broker is running
   - Check broker addresses in `.env`
   - Verify topics exist

3. **No Logs Being Consumed**
   - Check if log-agent is producing logs
   - Verify topic names match configuration
   - Check Kafka consumer group settings

### Logs
Check console output for detailed error messages and operation status. 