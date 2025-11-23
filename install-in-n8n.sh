#!/usr/bin/env bash
set -euo pipefail

echo "This script installs the local n8n-nodes-espocrm package into a running n8n container"
echo ""

# Get the running n8n container ID
CONTAINER_ID=$(docker ps --filter "ancestor=n8nio/n8n" --format "{{.ID}}" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
    echo "Error: No running n8n container found"
    echo "Please start n8n first with: ./run-n8n-espocrm.sh"
    exit 1
fi

echo "Found n8n container: $CONTAINER_ID"
echo ""

# Build the package
echo "Building package..."
npm run build

# Copy the built package into the container
echo "Copying package to container..."
docker exec $CONTAINER_ID mkdir -p /tmp/espocrm-install
docker cp package.json $CONTAINER_ID:/tmp/espocrm-install/
docker cp index.js $CONTAINER_ID:/tmp/espocrm-install/
docker cp dist $CONTAINER_ID:/tmp/espocrm-install/

# Install the package inside the container
echo "Installing package in n8n..."
docker exec -w /usr/local/lib/node_modules/n8n $CONTAINER_ID npm install /tmp/espocrm-install

echo ""
echo "Package installed successfully!"
echo "Please restart the n8n container for changes to take effect:"
echo "  docker restart $CONTAINER_ID"
