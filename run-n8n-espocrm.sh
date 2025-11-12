#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Cleaning old build…"
rm -rf "${ROOT_DIR}/dist"

echo "Building TypeScript sources…"
npm run build

echo "Starting n8n with repo mounted as community package…"
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  -e N8N_RUNNERS_ENABLED=true \
  -e N8N_LOG_LEVEL=debug \
  -e N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true \
  -v n8n_data:/home/node/.n8n \
  -v "${ROOT_DIR}:/home/node/.n8n/custom/n8n-espocrm" \
  n8nio/n8n
