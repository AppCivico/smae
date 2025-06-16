#!/bin/bash

set -e

echo "Building multi-service container..."

# Make sure we're in the right directory (smae root)
if [ ! -d "vendor/backend-transfere-gov" ] || [ ! -d "vendor/backend-transfere-gov-especiais" ]; then
    echo "Error: vendor não encontrado. Execute do diretório root"
    exit 1
fi

# Build the Docker image
docker build -f backend-transfere-gov/Dockerfile -t smae/multi-service:latest .

echo "Build completou"
echo "Suba com: docker run -p 8080:80 smae/multi-service:latest"

