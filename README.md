# Observo - Self-Hosted Log Monitoring System

🚀 **Observo** is a complete self-hosted log monitoring and analytics platform that provides real-time log aggregation, storage, and visualization.

## 🚀 Quick Start (No Repository Clone Required!)

### Option 1: One-Command Installation
```bash
curl -sSL https://raw.githubusercontent.com/daddycoder007/Observo/main/get-observo.sh | bash
cd observo
./quick-start.sh
```

### Option 2: Manual Setup
```bash
# Create directory and download files
mkdir observo && cd observo
curl -o docker-compose.yml https://raw.githubusercontent.com/daddycoder007/Observo/main/docker-compose.yml
curl -o quick-start.sh https://raw.githubusercontent.com/daddycoder007/Observo/main/quick-start.sh
chmod +x quick-start.sh

# Start Observo
./quick-start.sh
```

### Option 3: Direct Docker Compose
```bash
# Download and run
curl -o docker-compose.yml https://raw.githubusercontent.com/daddycoder007/Observo/main/docker-compose.yml
docker-compose up -d
```

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Log Files  │───▶│ Log Agent   │───▶│   Kafka     │───▶│   Server    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Dashboard │◀───│   Web UI    │◀───│   REST API  │◀───│  MongoDB    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 📦 Components

### 1. Log Agent (`@observo/log-agent`)
Install the log agent to start monitoring your log files:

```bash
npm install -g @observo/log-agent
```

Create a configuration file:
```yaml
kafka:
  brokers: localhost:9092
  clientId: my-log-agent

files:
  - path: /var/log/myapp.log
    topic: myapp-logs
    tag: output
  - path: /var/log/error.log
    topic: myapp-logs
    tag: error
```

Start monitoring:
```bash
observo-agent config.yaml
```

### 2. Observo Server (Published Docker Image)
- **Image**: `observo/server:latest`
- **Port**: 3000
- **Features**: Kafka consumer, MongoDB storage, REST API, WebSocket

### 3. Observo Dashboard (Published Docker Image)
- **Image**: `observo/dashboard:latest`
- **Port**: 80
- **Features**: React-based web interface, real-time logs, analytics

## ⚙️ Configuration

### Environment Variables (.env file)
```env
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password123
MONGO_DATABASE=observo
MONGO_PORT=27017

# Kafka Configuration
KAFKA_TOPIC_PREFIX=observo-logs
KAFKA_PORT=9092

# Server Configuration
SERVER_PORT=3000
DASHBOARD_PORT=80

# Kafka Topics
KAFKA_TOPICS=observo-logs.output,observo-logs.error,observo-logs.access
```

## 🐳 Docker Images

All images are automatically published to Docker Hub:

- **daddycoder007/observo-server**: `docker pull daddycoder007/observo-server:latest`
- **daddycoder007/observo-dashboard**: `docker pull daddycoder007/observo-dashboard:latest`

### Available Tags
- `latest` - Latest stable version
- `v1.0.0` - Specific version
- `main` - Latest from main branch

## 📊 Access Points

After starting Observo:

- **Dashboard**: http://localhost
- **API**: http://localhost:3000/api
- **MongoDB**: localhost:27017
- **Kafka**: localhost:9092

## 🛠️ Management Commands

```bash
# Start Observo
./quick-start.sh

# Stop Observo
./stop.sh

# View logs
./logs.sh

# Update to latest version
docker-compose pull
docker-compose up -d
```

## 📊 API Documentation

### Base URL: `http://localhost:3000/api`

#### Get Logs
```http
GET /api/logs?page=1&limit=50&level=error
```

#### Get Statistics
```http
GET /api/logs/stats?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Analytics
```http
GET /api/analytics?startDate=2024-01-01&endDate=2024-01-31
```

## 🔒 Security

### Production Deployment
1. Change default passwords in `.env`
2. Use environment variables for sensitive data
3. Configure firewall rules
4. Enable HTTPS (use reverse proxy)
5. Use Kafka authentication if needed

### Example Production .env
```env
MONGO_ROOT_USERNAME=observo_admin
MONGO_ROOT_PASSWORD=your_secure_password_here
KAFKA_TOPIC_PREFIX=your-company-logs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://github.com/daddycoder007/Observo/wiki)
- 🐛 [Issues](https://github.com/daddycoder007/Observo/issues)
- 💬 [Discussions](https://github.com/daddycoder007/Observo/discussions) 