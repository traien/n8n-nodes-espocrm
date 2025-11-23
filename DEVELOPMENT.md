# Installing EspoCRM Nodes for Development

## The Problem
n8n doesn't automatically load community packages from `node_modules`. They must be registered in n8n's database through the UI.

## Solution: Install via n8n UI

### 1. Start n8n (if not already running)
```bash
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

### 2. Build and pack your package
```bash
npm run build
npm pack
# Creates: traien-n8n-nodes-espocrm-X.X.X.tgz
```

### 3. Install via n8n UI
1. Open http://localhost:5678
2. Go to **Settings > Community Nodes**
3. Click **Install a community node**
4. Enter package name: `@traien/n8n-nodes-espocrm`
5. n8n will download from npm (if published) OR...

### 3b. Install from local file (for development)
Since your package isn't on npm yet, you need to publish it OR use a local npm registry.

**Temporary workaround for testing:**
1. Upload to GitHub releases
2. Install from GitHub URL in n8n UI

**OR use npm link (requires access to n8n's filesystem):**
```bash
# In your project
npm link

# In n8n container
docker exec -it n8n sh
cd /usr/local/lib/node_modules/n8n
npm link @traien/n8n-nodes-espocrm
```

## Current Status
Your validation fixes are built and ready in `dist/`. Once properly installed, n8n will use the new code with input validation.

## Recommended: Publish to npm
The easiest way for testing is to publish your package to npm (even as a pre-release):
```bash
npm publish --tag beta
```

Then install in n8n UI using: `@traien/n8n-nodes-espocrm@beta`
