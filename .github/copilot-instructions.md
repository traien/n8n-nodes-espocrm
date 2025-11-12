# EspoCRM n8n Node Development Guide

## Architecture Overview

This is a community n8n node package providing EspoCRM REST API integration through three main node types:

1. **EspoCRM Node** (`nodes/EspoCRM/`): Standard n8n node for manual workflow building with CRUD operations on EspoCRM entities
2. **EspoCRM Tool Node** (`nodes/EspoCRMTool/`): AI agent tooling that exposes EspoCRM operations as LangChain `DynamicStructuredTool` for n8n AI agents
3. **EspoCRM Trigger Node** (`nodes/EspoCRMTrigger/`): Webhook trigger that registers/manages EspoCRM webhooks with HMAC signature verification

### Key Design Patterns

#### Handler + Operation Split
Entity logic follows a consistent two-layer pattern:
- **Operations files** (`operations/{entity}/{entity}.operations.ts`): Export n8n UI field definitions as `{entity}Operations` and `{entity}Fields` arrays
- **Handler classes** (`handlers/{Entity}Handler.ts`): Implement `EntityHandler` interface with `create|get|update|delete|getAll` methods containing runtime execution logic
- **Factory pattern**: `HandlerFactory.getHandler(resource)` dispatches to the correct handler based on node parameters

Example: `ContactHandler` implements business logic; `contact.operations.ts` defines UI fields. Both imported into `EspoCRM.node.ts`.

#### Metadata-Driven Dynamic Fields
`MetadataService` fetches EspoCRM's `/Metadata` endpoint to:
- Populate entity dropdowns at load time via `ILoadOptionsFunctions`
- Generate field definitions for custom entities dynamically
- Map EspoCRM field types (varchar, enum, link, etc.) to n8n types (string, options, etc.)

This keeps the node in sync with custom fields added in EspoCRM without code changes.

#### Centralized API Wrapper
All HTTP calls flow through `GenericFunctions.ts`:
- `espoApiRequest()`: Single authenticated request with HMAC/API-key auth, URL validation, and error normalization
- `espoApiRequestAllItems()`: Pagination wrapper that auto-fetches all pages when `returnAll: true`
- **Critical**: URL construction uses `resolveBaseUrl()` + `joinUrl()` to handle trailing slashes and protocol prefix variations

Never inline HTTP requests—extend these helpers to maintain auth consistency.

## Development Workflow

### Build & Test
```bash
npm install              # Install n8n-workflow, TypeScript, gulp, zod, @langchain/core
npm run build            # Compile TypeScript + copy SVG icons via gulp
npm run dev              # Watch mode for active development
npm run lintfix          # Auto-fix ESLint issues before committing
```

**Output**: `dist/` folder consumed by n8n (not version-controlled)

### Local n8n Testing
Mount the built package into n8n:
```bash
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd):/home/node/.n8n/custom/n8n-espocrm \
  n8nio/n8n
```
Or symlink into global n8n: `~/.n8n/nodes/@traien/n8n-nodes-espocrm -> /path/to/repo/dist`

### Adding New Entity Support
1. Create handler: `handlers/{Entity}Handler.ts` implementing `EntityHandler` interface
2. Create operations: `operations/{entity}/{entity}.operations.ts` exporting `{entity}Operations` + `{entity}Fields`
3. Register in `HandlerFactory.getHandler()` switch statement
4. Import both into `EspoCRM.node.ts` and append to `properties` array
5. Update `EspoCRMTool.node.ts` default allowed entity list if exposing to agents

## Critical Implementation Details

### Authentication Modes
Credentials (`credentials/EspoCRMApi.credentials.ts`) support two modes:
- **API Key**: Header-based `X-Api-Key: {apiKey}` (simpler, recommended)
- **HMAC**: Request signing with `X-Hmac-Authorization` header using SHA256 digest of `{method} {endpoint}` + secret key

### Attachment/Binary Handling
Attachments use a **two-step upload pattern**:
1. Upload binary to `/Attachment` with `Content-Type: multipart/form-data`
2. Link returned attachment ID to parent entity via `parentId`/`parentType` fields

Binary data expected on `item.binary[binaryProperty]` in n8n workflow context.

### Webhook Signature Verification
Trigger node verifies incoming webhooks via:
- Query param `?secretKey={stored}` comparison for API key auth
- HMAC signature validation: `X-Signature` header must match `HMAC-SHA256(request_body, secretKey)`

Stored `webhookId` + `secretKey` live in workflow static data for lifecycle management.

### AI Tool Node URL Construction & Debugging
The `EspoCRMTool.node.ts` "Invalid URL" error (ERR_INVALID_URL) occurs during URL construction in `GenericFunctions.ts`:

**Common causes**:
1. **Malformed Base URL in credentials**: Missing `https://` protocol, contains spaces, or has invalid characters
2. **Entity type issues**: Contains spaces, special characters, or non-ASCII characters from AI agent
3. **Record ID issues**: Spaces, quotes, or URL-unsafe characters passed by agent
4. **Empty/undefined values**: entityType or recordId being empty string or whitespace-only

**Debugging workflow**:
1. Check `espoApiRequest()` logs for `credentialBase`, `normalizedBase`, `apiBase`, `endpoint`, and `final` URL values
2. Verify credentials: Test base URL by pasting into browser (should resolve without errors)
3. Add validation in `EspoCRMTool.node.ts` before calling `espoApiRequest()`:
   ```typescript
   if (!entityType || !/^[a-zA-Z0-9_-]+$/.test(entityType)) {
     throw new NodeOperationError(ctx.getNode(), `Invalid entityType: "${entityType}"`);
   }
   if (recordId && !/^[a-zA-Z0-9_-]+$/.test(recordId)) {
     throw new NodeOperationError(ctx.getNode(), `Invalid recordId: "${recordId}"`);
   }
   ```
4. Check AI agent input: Log `input` object to see exact values passed by agent (may have hidden whitespace/quotes)

**Fix locations**:
- **Credential validation**: `credentials/EspoCRMApi.credentials.ts` - add URL format validation
- **Input sanitization**: `EspoCRMTool.node.ts` line ~295-310 - validate entityType/recordId before encoding
- **Early failure**: `GenericFunctions.ts` line ~75-85 - current validation location (improve error message context)

## Project Constraints

- **Node version**: >= 18.10 (defined in `package.json` engines)
- **n8n compatibility**: Targets n8n-workflow 1.117.0 API
- **No automated tests**: Integration testing done manually via Docker workflow execution
- **Known vulnerabilities**: `npm audit` reports 14 issues (mostly transitive deps); evaluate before major releases

## Common Pitfalls

❌ **Don't** mutate `INodeTypeDescription.properties` after initial definition—append operations/fields during imports
❌ **Don't** call EspoCRM API directly—always use `espoApiRequest()` wrapper for auth consistency
❌ **Don't** assume entity fields are static—use `MetadataService` for dynamic/custom entities
❌ **Don't** forget to update `package.json` version and run `npm run build` before publishing
❌ **Don't** pass unvalidated user/agent input directly to URL construction—sanitize entityType and recordId first

✅ **Do** keep README feature matrix updated when adding entity modules
✅ **Do** test webhook signature verification with real EspoCRM instance (signature calculation is finicky)
✅ **Do** validate URLs early in handlers to provide actionable error messages
✅ **Do** use `this.logger.debug()` in API wrappers for troubleshooting credential/URL issues
✅ **Do** validate AI agent inputs before passing to API layer—check for whitespace, special chars, empty strings

## File References

- Entity handler interface: `nodes/EspoCRM/handlers/EntityHandler.ts`
- Example complete entity: `nodes/EspoCRM/operations/contact/` + `handlers/ContactHandler.ts`
- Auth/pagination logic: `nodes/EspoCRM/GenericFunctions.ts`
- Dynamic field generation: `nodes/EspoCRM/services/MetadataService.ts`
- AI tool schema: `nodes/EspoCRMTool/EspoCRMTool.node.ts` (uses Zod for input validation)
