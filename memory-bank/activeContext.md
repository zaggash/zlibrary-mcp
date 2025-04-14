# Active Context
<!-- Entries below should be added reverse chronologically (newest first) -->
[2025-04-14 11:37:48] - TDD - Resolved - Fixed failing tests in `__tests__/index.test.js` (`MCP Server` suite). Used `jest.resetModules()` + `jest.doMock()` targeting specific SDK sub-paths inside tests, required `index.js` after mocks. Added `globalTeardown` script (`jest.teardown.js`) calling `process.exit(0)` to force Jest exit. All tests in `__tests__/index.test.js` and full suite (`npm test`) now pass.

[2025-04-14 10:20:18] - Integration - Verified - Global Execution Fix integrated. Server starts successfully using `new Server`, `StdioServerTransport`, and `server.connect`. Venv creation/validation works. `index.js` tests fail due to required SDK refactoring (createServer -> new Server, registerTool -> tools/list+call handlers). Tests in `__tests__/index.test.js` need updating.

[2025-04-14 10:16:20] - Debug - Resolved - Fixed MCP SDK import issues in CommonJS (`index.js`). Corrected schema names (`ListToolsRequestSchema`, `CallToolRequestSchema`) and `StdioServerTransport` instantiation/connection (`new StdioServerTransport()`, `server.connect(transport)`). Server now starts successfully.

[2025-04-14 04:15:38] - TDD - Refactor Phase - Refactored `lib/venv-manager.js` (extracted `runCommand`), `index.js` (removed comments), `lib/zlibrary-api.js` (simplified `callPythonFunction`, improved `downloadBookToFile` error handling). Updated tests in `__tests__/zlibrary-api.test.js`. All tests pass.

[2025-04-14 04:11:16] - Code - TDD Green Phase - Implemented global execution fix (Node import, VenvManager, API integration). Tests pass.

[2025-04-14 03:35:45] - TDD - Red Phase - Wrote failing tests for global execution fix (Node import, VenvManager, API integration). Tests fail as expected.
[2025-04-14 03:31:01] - SpecPseudo - Generating - Created specification, pseudocode, and TDD anchors for global execution fix (Node import, Managed Python Venv).

[2025-04-14 03:28:24] - Architect - Designing - Evaluated Python environment strategies for global NPM package.
[2025-04-14 03:26:00] - Debug - Investigating - Diagnosing zlibrary-mcp global execution failure (Node ERR_PACKAGE_PATH_NOT_EXPORTED, Python MODULE_NOT_FOUND).