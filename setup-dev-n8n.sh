#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Stopping any existing n8n containers…"
docker stop n8n 2>/dev/null || true
docker rm n8n 2>/dev/null || true

echo "==> Building package…"
rm -rf "${ROOT_DIR}/dist"
npm run build
PKG_FILE=$(npm pack --silent)
echo "    Created: ${PKG_FILE}"

echo ""
echo "==> Starting fresh n8n container…"
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_LOG_LEVEL=info \
  -e N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true \
  -v n8n_dev:/home/node/.n8n \
  -v "${ROOT_DIR}/${PKG_FILE}:/tmp/${PKG_FILE}:ro" \
  n8nio/n8n

echo "==> Waiting for n8n to start (20s)…"
sleep 20

echo "==> Installing package in n8n…"
docker exec n8n npm install --prefix /home/node/.n8n "/tmp/${PKG_FILE}"

echo "==> Restarting to load nodes…"
docker restart n8n
sleep 15

echo ""
echo "✓ Setup complete!"
echo ""
echo "  n8n is running at: http://localhost:5678"
echo "  EspoCRM nodes should now be available"
echo ""
echo "NOTE: If nodes don't appear, you need to install via n8n UI:"
echo "  1. Go to Settings > Community Nodes"
echo "  2. Install package: @traien/n8n-nodes-espocrm"
echo "  3. Use version or path: /tmp/${PKG_FILE}"
echo ""
echo "Commands:"
echo "  View logs:  docker logs -f n8n"
echo "  Stop n8n:   docker stop n8n"
echo "  Shell:      docker exec -it n8n sh"
