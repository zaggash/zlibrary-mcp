# System Integrator Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
## Integration Issues Log
<!-- Append issues using the format below -->
### Issue: INT-001 - Client ZodError on Tool Call - Status: Open - [2025-04-14 13:16:12]
- **Identified**: [2025-04-14 13:10:48]
- **Components**: MCP Client (RooCode), zlibrary-mcp Server
- **Symptoms**: Client throws `ZodError: Expected array, received undefined` at path `content` when parsing `CallToolResponse` from `zlibrary-mcp`, even for tools returning objects (e.g., `get_download_limits`, `search`).
- **Root Cause**: Suspected client-side parsing logic incorrectly expects the `content` field in the response to *always* be an array, failing validation when it's an object.
- **Resolution**: Paused integration task. Needs investigation of client-side parsing code or MCP specification regarding `CallToolResponse` structure. **Blocked Task 3 (PDF Integration) verification [2025-04-14 14:50:58].**
- **Resolved Date**: N/A


## Integration Test Scenarios
<!-- Append test scenarios using the format below -->
### Scenario: PDF Processing (Task 3) - [2025-04-14 14:50:58]
- **Components**: [zlibrary-mcp: download_book_to_file, process_document_for_rag], [lib/python-bridge.py: _process_pdf]
- **Steps**: 1. Combined Workflow (Std PDF) 2. Separate Workflow (Std PDF) 3. Error Handling (Encrypted) 4. Error Handling (Image) 5. Error Handling (Not Found)
- **Expected**: Success with text/path for standard, specific errors for error cases.
- **Status**: Blocked
- **Last Run**: N/A - Blocked by client issue INT-001 preventing acquisition of test Book IDs.


### Integration: Global Execution Fix - [2025-04-14 10:20:48]
- **Components Integrated**: `lib/venv-manager.js`, `index.js`, `lib/zlibrary-api.js`.
- **Verification**: Manual run (`rm -rf ~/.cache/zlibrary-mcp && node index.js`) confirmed successful venv creation, dependency installation (`zlibrary`), and server startup via Stdio transport. Core logic (`ensureVenvReady`, `getManagedPythonPath`) functions correctly.
- **Issues Encountered**: 
    - Multiple SDK import errors (`ERR_PACKAGE_PATH_NOT_EXPORTED`, `TypeError: createServer is not a function`, `TypeError: server.start is not a function`) due to SDK structure and CommonJS interop. Resolved by using correct import paths (`@modelcontextprotocol/sdk/server/index.js`, `@modelcontextprotocol/sdk/server/stdio.js`, `@modelcontextprotocol/sdk/types.js`), instantiating `Server` class, and using `StdioServerTransport` with `server.connect()`.
    - `ERR_REQUIRE_ESM` for `env-paths`. Resolved by using dynamic `import()` in `lib/venv-manager.js` and making dependent functions async.
    - SDK schema loading issue (`TypeError: Cannot read properties of undefined (reading 'shape')`) for `ListToolsRequestSchema`/`CallToolRequestSchema`. Debugged via separate task (`Issue-MCP-SDK-CJS-Import`), root cause identified as incorrect schema names in `index.js` (`ToolsList...` vs `ListTools...`). Corrected names.
- **Test Status**: `npm test` shows failures in `__tests__/index.test.js` due to necessary SDK refactoring (mocks need updating). Other test suites pass. Tests hung after completion (requires separate investigation).
- **Dependency Map**: No changes to inter-service dependencies. Updated internal dependency on `@modelcontextprotocol/sdk` v1.8.0, `zod`, `zod-to-json-schema`.
- **Integration Points**: 
    - `index.js` -> `lib/venv-manager.js` (`ensureVenvReady`)
    - `lib/zlibrary-api.js` -> `lib/venv-manager.js` (`getManagedPythonPath`)
    - `index.js` -> `@modelcontextprotocol/sdk` (Server, StdioTransport, Types)
    - `index.js` -> `lib/zlibrary-api.js` (Tool handlers)

