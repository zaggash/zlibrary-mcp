# Debugger Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
## Issue History
### Issue: Issue-MCP-SDK-CJS-Import - MCP SDK import/usage issues in CommonJS - [Status: Resolved] - [2025-04-14 10:16:36]
- **Reported**: 2025-04-14 10:08:20 / **Severity**: Medium / **Symptoms**: 1. `ToolsListRequestSchema`/`ToolsCallRequestSchema` undefined when imported via `require('@modelcontextprotocol/sdk/types.js')`. 2. `TypeError: this._stdin.on is not a function` when starting `StdioServerTransport`.
- **Investigation**: 1. Logged imported `mcpTypes` object, found correct names are `ListToolsRequestSchema`/`CallToolRequestSchema`. 2. Tried various `StdioServerTransport` constructor arguments (positional, options object with/without streams). 3. Searched web for SDK usage examples. 4. Found `dev.to` article showing `new StdioServerTransport()` and `server.connect(transport)` pattern.
- **Root Cause**: 1. Incorrect schema names used. 2. Incorrect instantiation/starting method for `StdioServerTransport` in CJS context (likely due to ESM/CJS interop differences in the SDK build).
- **Fix Applied**: 1. Corrected schema names to `ListToolsRequestSchema` and `CallToolRequestSchema`. 2. Changed `StdioServerTransport` usage to `const transport = new StdioServerTransport(); await server.connect(transport);` - [2025-04-14 10:14:32]
- **Verification**: `node index.js` now starts the server successfully without errors. - [2025-04-14 10:16:14]
- **Related Issues**: None

<!-- Append new issue details using the format below -->

### Issue: Issue-GlobalExecFail-01 - zlibrary-mcp global execution failure - [Status: Open] - [2025-04-14 03:26:00]
- **Reported**: 2025-04-14 03:24:49 / **Severity**: High / **Symptoms**: Node.js ERR_PACKAGE_PATH_NOT_EXPORTED, Python MODULE_NOT_FOUND when run via npx or as dependency.
- **Investigation**: 1. Reviewed package.json (exports, bin, deps) - [2025-04-14 03:25:29] 2. Reviewed index.js (line 4 require) - [2025-04-14 03:25:35] 3. Reviewed zlibrary-api.js (pythonPath) - [2025-04-14 03:25:45] 4. Reviewed python-env.js (pip usage) - [2025-04-14 03:25:55] 5. Reviewed python-bridge.py (imports) - [2025-04-14 03:26:02]
- **Root Cause**: 1. Improper Node.js import of internal SDK path (`index.js:4`). 2. Unreliable Python env management using global `pip`/`python3`. - [2025-04-14 03:26:02] / **Fix Applied**: None yet / **Verification**: N/A
- **Related Issues**: None

## Recurring Bug Patterns
<!-- Append new patterns using the format below -->

### Pattern: Improper Node.js Internal Import - [2025-04-14 03:26:00]
- **Identification**: Via ERR_PACKAGE_PATH_NOT_EXPORTED in zlibrary-mcp global execution.
- **Causes**: Using `require()` on internal paths not exposed via package `exports`.
- **Components**: `index.js`
- **Resolution**: Only import from paths defined in the dependency's `exports` (usually the main entry point).
- **Related**: Issue-GlobalExecFail-01
- **Last Seen**: 2025-04-14 03:26:00

### Pattern: Unreliable Python Environment Management - [2025-04-14 03:26:00]
- **Identification**: Via Python MODULE_NOT_FOUND in zlibrary-mcp global execution.
- **Causes**: Relying on globally resolved `pip` and `python3` commands without ensuring they belong to the same environment.
- **Components**: `lib/python-env.js`, `lib/zlibrary-api.js`
- **Resolution**: Use absolute paths to Python/pip within a managed environment (e.g., venv), bundle dependencies, or implement robust environment detection.
- **Related**: Issue-GlobalExecFail-01
- **Last Seen**: 2025-04-14 03:26:00

## Debugging Tools & Techniques
<!-- Append tool notes using the format below -->

## Performance Observations
<!-- Append performance notes using the format below -->

## Environment-Specific Notes
<!-- Append environment notes using the format below -->