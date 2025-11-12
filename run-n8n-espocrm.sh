#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Cleaning old build…"
rm -rf "${ROOT_DIR}/dist"

echo "==> Building TypeScript sources…"
npm run build

echo "==> Creating npm package…"
PKG_FILE=$(npm pack --silent)

echo "==> Starting n8n container…"
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_LOG_LEVEL=debug \
  -e N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n

echo "==> Waiting for n8n to initialize (15s)…"
sleep 15

echo "==> Installing EspoCRM community package…"
docker cp "${PKG_FILE}" n8n:/tmp/
docker exec n8n npm install --prefix /home/node/.n8n "/tmp/${PKG_FILE}"

echo "==> Restarting n8n to load the package…"
docker restart n8n

echo ""
echo "✓ Done! n8n is starting with EspoCRM nodes installed."
echo "  Access n8n at: http://localhost:5678"
echo ""
echo "To rebuild and reinstall after code changes, run this script again."
echo "To view logs: docker logs -f n8n"
echo "To stop n8n: docker stop n8n && docker rm n8n"
