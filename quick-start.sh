#!/bin/bash

echo "🚀 Observo - Quick Start"
echo "========================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Pull latest images
echo "📥 Pulling latest Observo images..."
docker-compose pull

# Start services
echo "🚀 Starting Observo services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Observo is now running!"
echo ""
echo "🌐 Dashboard: http://localhost"
echo "🔧 API: http://localhost:3000/api"
echo "🗄️ MongoDB: localhost:27017"
echo "📨 Kafka: localhost:9092"
echo ""
echo "📦 To install the log agent:"
echo "   npm install -g @observo/log-agent"
echo ""
echo "📖 For more information:"
echo "   https://github.com/daddycoder007/Observo"
echo ""
echo "🛑 To stop Observo:"
echo "   docker-compose down" 