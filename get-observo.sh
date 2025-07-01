#!/bin/bash

echo "🚀 Getting Observo..."
echo "===================="

# Create observo directory
mkdir -p observo
cd observo

# Download docker-compose.yml
echo "📥 Downloading docker-compose.yml..."
curl -o docker-compose.yml https://raw.githubusercontent.com/daddycoder007/Observo/main/docker-compose.yml

# Download quick-start script
echo "📥 Downloading quick-start script..."
curl -o quick-start.sh https://raw.githubusercontent.com/daddycoder007/Observo/main/quick-start.sh
chmod +x quick-start.sh

# Download stop script
echo "📥 Downloading stop script..."
curl -o stop.sh https://raw.githubusercontent.com/daddycoder007/Observo/main/stop.sh
chmod +x stop.sh

# Download logs script
echo "📥 Downloading logs script..."
curl -o logs.sh https://raw.githubusercontent.com/daddycoder007/Observo/main/logs.sh
chmod +x logs.sh

# Create .env file
echo "⚙️ Creating .env file..."
cat > .env << EOF
# Observo Configuration
OBSERVO_VERSION=1.0.0

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

# Kafka Topics (comma-separated)
KAFKA_TOPICS=observo-logs.output,observo-logs.error,observo-logs.access

# Kafka Group and Client IDs
KAFKA_GROUP_ID=observo-log-consumer-group
KAFKA_CLIENT_ID=observo-log-service

# MongoDB Collection
MONGODB_COLLECTION=logs
EOF

echo ""
echo "✅ Observo files downloaded successfully!"
echo ""
echo "🚀 To start Observo:"
echo "   ./quick-start.sh"
echo ""
echo "🛑 To stop Observo:"
echo "   ./stop.sh"
echo ""
echo "📋 To view logs:"
echo "   ./logs.sh" 