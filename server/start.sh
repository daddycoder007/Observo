#!/bin/bash

# Observo Log Service Startup Script

echo "🚀 Starting Observo Log Service..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "✅ Created .env file. Please review and update configuration if needed."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the service
echo "🎯 Starting service..."
npm start 