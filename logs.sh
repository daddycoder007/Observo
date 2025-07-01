#!/bin/bash

echo "📋 Observo Logs"
echo "==============="

if [ -f docker-compose.yml ]; then
    docker-compose logs -f
else
    echo "❌ docker-compose.yml not found"
    echo "   Make sure you're in the correct directory"
fi 