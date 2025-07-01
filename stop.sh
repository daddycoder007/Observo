#!/bin/bash

echo "🛑 Stopping Observo..."

if [ -f docker-compose.yml ]; then
    docker-compose down
    echo "✅ Observo services stopped"
else
    echo "❌ docker-compose.yml not found"
    echo "   Make sure you're in the correct directory"
fi 