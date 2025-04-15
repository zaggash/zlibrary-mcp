# Product Context
<!-- Entries below should be added reverse chronologically (newest first) -->

# System Patterns
<!-- Entries below should be added reverse chronologically (newest first) -->
### Pattern: MCP Server Implementation (CJS/SDK 1.8.0) - [2025-04-14 17:50:25]
- **Context**: Documenting and comparing MCP server implementations, focusing on CJS projects using SDK v1.8.0.
- **Findings (zlibrary-mcp)**: Uses correct SDK paths/instantiation. Tool listing currently uses dummy schemas, potentially causing client error INT-001 despite valid response structure.
- **Documentation**: See comparison report `docs/mcp-server-comparison-report.md`.
- **Related**: Issue INT-001


### Pattern: RAG Document Processing Pipeline - [2025-04-14 14:25:00] (Implementation Update)
- **Implementation Detail**: PDF processing implemented using `PyMuPDF (fitz)` library within `lib/python-bridge.py`'s `_process_pdf` function, called from `process_document`.
- **Related**: Pattern-RAGPipeline-01 (Updated), Decision-PDFLibraryChoice-01


### Pattern: RAG Document Processing Pipeline - [2025-04-14 13:50:00] (Updated)
- **Context**: Enabling AI agents to use documents from Z-Library for Retrieval-Augmented Generation (RAG).
- **Problem**: Agents need efficient ways to extract usable text content from downloaded book files (EPUB, TXT, **PDF**).
- **Solution**: Extend the `zlibrary-mcp` server with two workflows:
    1.  **Combined:** Add an optional `process_for_rag: boolean` flag to the existing `download_book_to_file` tool. If true, the tool downloads the file, immediately processes it via the Python bridge (EPUB/TXT/**PDF**), and returns both the `file_path` and `processed_text`.
    2.  **Separate:** Keep the dedicated `process_document_for_rag` tool to process already downloaded files. This tool takes a `file_path` and returns `processed_text`.
- **Components**: Updated `download_book_to_file` tool, new `process_document_for_rag` tool, modifications to `lib/zlibrary-api.js` (Node.js), updated download function and new processing function in `lib/python-bridge.py` (Python), new Python dependencies (e.g., `ebooklib`, **`PyMuPDF`**).
- **Data Flow (Combined)**: Agent -> `download_book_to_file(process_for_rag=true)` -> Server (Node -> Python: Download -> Process -> Node) -> Agent (receives path & text).
- **Data Flow (Separate)**: Agent -> `download_book_to_file` -> Server (Node -> Python -> Disk) -> Agent -> `process_document_for_rag` -> Server (Node -> Python -> Node) -> Agent (receives text).
- **Extensibility**: Python bridge allows easy addition of new format handlers.
- **Related**: Decision-RAGProcessorTech-01, Decision-CombineDownloadProcess-01, **Decision-PDFLibraryChoice-01**, MCPTool-ProcessDocRAG-01, MCPTool-DownloadBook-01 (Updated)


### Pattern: RAG Document Processing Pipeline - [2025-04-14 12:07:50] (Updated)
- **Context**: Enabling AI agents to use documents from Z-Library for Retrieval-Augmented Generation (RAG).
- **Problem**: Agents need efficient ways to extract usable text content from downloaded book files (EPUB, TXT initially).
- **Solution**: Extend the `zlibrary-mcp` server with two workflows:
    1.  **Combined:** Add an optional `process_for_rag: boolean` flag to the existing `download_book_to_file` tool. If true, the tool downloads the file, immediately processes it via the Python bridge (EPUB/TXT), and returns both the `file_path` and `processed_text`.
    2.  **Separate:** Keep the dedicated `process_document_for_rag` tool to process already downloaded files. This tool takes a `file_path` and returns `processed_text`.
- **Components**: Updated `download_book_to_file` tool, new `process_document_for_rag` tool, modifications to `lib/zlibrary-api.js` (Node.js), updated download function and new processing function in `lib/python-bridge.py` (Python), new Python dependencies (e.g., `ebooklib`).
- **Data Flow (Combined)**: Agent -> `download_book_to_file(process_for_rag=true)` -> Server (Node -> Python: Download -> Process -> Node) -> Agent (receives path & text).
- **Data Flow (Separate)**: Agent -> `download_book_to_file` -> Server (Node -> Python -> Disk) -> Agent -> `process_document_for_rag` -> Server (Node -> Python -> Node) -> Agent (receives text).
- **Extensibility**: Python bridge allows easy addition of new format handlers (e.g., PDF).
- **Related**: Decision-RAGProcessorTech-01, Decision-CombineDownloadProcess-01, MCPTool-ProcessDocRAG-01, MCPTool-DownloadBook-01 (Updated)


### Pattern: Managed Python Virtual Environment for NPM Package - [2025-04-14 03:29:08]
- **Context**: Providing a reliable Python dependency environment for a globally installed Node.js package (`zlibrary-mcp`).
- **Problem**: Global Python installations are inconsistent; relying on `PATH` or global `pip` is fragile.
- **Solution**: Automate the creation and management of a dedicated Python virtual environment (`venv`) within a user-specific cache directory during a post-install script or first run. Install required Python packages (`zlibrary`) into this venv. Explicitly use the absolute path to the venv's Python interpreter when executing Python scripts from Node.js (`python-shell` or `child_process`).
- **Components**: New setup script/logic, `lib/zlibrary-api.js` (modified to use venv path).
- **Tradeoffs**: Requires Python 3 pre-installed by user. Adds one-time setup step. Avoids package bloat (bundling) and fragility (detection).
- **Related**: Decision-PythonEnvStrategy-01, Issue-GlobalExecFail-01

# Decision Log
<!-- Entries below should be added reverse chronologically (newest first) -->
### Decision-VenvManagerDI-01 - [2025-04-15 04:27:00]
- **Decision**: Refactor `src/lib/venv-manager.ts` to use dependency injection for `fs` and `child_process` modules.
- **Rationale**: Persistent failures in Jest tests (`__tests__/venv-manager.test.js`) when mocking built-in modules (`fs`, `child_process`) using `jest.unstable_mockModule` or `jest.spyOn` in an ESM context. Dependency injection provides a reliable way to supply mocks during testing, bypassing ESM mocking complexities for built-ins.
- **Alternatives Considered**: Further attempts at `unstable_mockModule` (failed), `jest.spyOn` (failed), skipping tests (undesirable).
- **Implementation**: Modified `venv-manager.ts` functions to accept a `deps` object; updated tests to pass mock objects.
- **Related**: Progress [2025-04-15 04:31:00]


### Decision-JestMockingStrategy-01 - [2025-04-15 03:33:00]
- **Decision**: Refactor `__tests__/zlibrary-api.test.js` to mock the exported API functions directly using `jest.unstable_mockModule` and `jest.resetModules()`, instead of mocking the lower-level `python-shell`. For `__tests__/venv-manager.test.js`, continue attempting to fix `fs`/`child_process` mocks using `unstable_mockModule` and dynamic imports.
- **Rationale**: Mocking `python-shell` proved unreliable with `unstable_mockModule` and inconsistent `jest.resetModules()` usage, causing state bleed. Mocking the higher-level API provides better isolation and control for `zlibrary-api.test.js`. The `venv-manager.test.js` issues seemed closer to resolution with the existing `unstable_mockModule` approach, warranting further refinement attempts.
- **Alternatives Considered**: Persisting with `python-shell` mock (failed), using `spyOn` (less suitable for full module replacement in ESM), skipping tests (undesirable).
- **Related**: Progress [2025-04-15 03:41:00]


### Decision-MigrationStrategy-INT001 - [2025-04-14 18:31:26]
- **Decision**: Recommend fixing `zod-to-json-schema` implementation first within current CJS/SDK 1.8.0 setup as the primary approach to resolve INT-001. If unsuccessful, or for modernization, recommend migrating to ESM while keeping SDK 1.8.0 (Option 2), ensuring the schema fix is included.
- **Rationale**: Comparison report indicates incorrect schema generation (bypassed `zod-to-json-schema`) is the most likely cause of INT-001, not SDK version or module type alone. Fixing schema generation directly targets this. ESM migration aligns with modern standards and other examples, removing CJS/ESM interop as a variable, and is compatible with SDK 1.8.0 + `zod-to-json-schema`.
- **Alternatives Considered**: SDK Downgrade (doesn't target root cause, poor maintainability), ESM + SDK Downgrade (overly complex, highest risk).
- **Implementation (Recommended Path)**: 1. Fix `zod-to-json-schema` in `index.js`. 2. Test. 3. (If needed/desired) Migrate to ESM (update package.json, convert imports/exports, handle CJS deps, update Jest config). 4. Test thoroughly.
- **Related**: Issue INT-001, `docs/mcp-server-comparison-report.md`


### Decision-PDFLibraryChoice-01 - [2025-04-14 13:50:00]
- **Decision**: Recommend using `PyMuPDF (fitz)` for PDF text extraction within the Python bridge.
- **Rationale**: Offers superior accuracy and speed compared to `PyPDF2` and `pdfminer.six`, crucial for RAG quality. Handles complex layouts well. AGPL-3.0 license is manageable within the server-side context.
- **Alternatives Considered**: `PyPDF2` (simpler, less accurate), `pdfminer.six` (accurate, potentially more complex API).
- **Implementation**: Add `PyMuPDF` to `requirements.txt`. Implement PDF handling in `lib/python-bridge.py` using `fitz`.
- **Related**: Pattern-RAGPipeline-01 (Updated), ComponentSpec-RAGProcessorPython (Updated)


### Decision-CombineDownloadProcess-01 - [2025-04-14 12:07:50]
- **Decision**: Offer both a combined download-and-process workflow and separate download/process steps for RAG document preparation.
- **Rationale**: Provides flexibility. The combined workflow (via an option in `download_book_to_file`) is efficient for immediate use. The separate `process_document_for_rag` tool allows processing of already downloaded or existing files. Addresses user feedback for efficiency while retaining modularity.
- **Implementation**: Add `process_for_rag: boolean` parameter to `download_book_to_file`. Modify its return value to optionally include `processed_text`. Keep `process_document_for_rag` as a separate tool. Update Python bridge to handle the optional processing during download.
- **Related**: Pattern-RAGPipeline-01 (Updated), MCPTool-ProcessDocRAG-01, MCPTool-DownloadBook-01 (Updated)

### Decision-RAGProcessorTech-01 - [2025-04-14 11:41:55]
- **Decision**: Implement the RAG document content extraction/processing logic within the existing Python bridge (`lib/python-bridge.py`).
- **Rationale**: Leverages the established Python virtual environment and bridge mechanism. Python offers superior library support for diverse document formats (EPUB, TXT, future PDF) compared to Node.js. Consolidates Python-related logic.
- **Alternatives Considered**: Node.js implementation (less mature libraries for formats like EPUB), separate microservice (overkill for this stage).
- **Implementation**: Add new function(s) to `python-bridge.py` using libraries like `ebooklib`. Add corresponding calling logic in `lib/zlibrary-api.js`. Add new Python dependencies to `requirements.txt` (or equivalent).
- **Related**: Pattern-RAGPipeline-01, MCPTool-ProcessDocRAG-01


### Decision-PythonEnvStrategy-01 - [2025-04-14 03:29:29]
- **Decision**: Adopt the 'Managed Virtual Environment' strategy for handling the Python dependency (`zlibrary`) in the globally installed `zlibrary-mcp` NPM package.
- **Rationale**: Offers the best balance of reliability (isolated venv), user experience (automated setup post Python 3 install), maintainability, and package size compared to bundling, smarter detection, or rewriting.
- **Alternatives Considered**: Bundling (too large/complex build), Smarter Detection (too fragile), Rewrite in Node.js (high effort, feasibility uncertain), Migrate to Python (out of scope).
- **Implementation**: Node.js logic (post-install/first run) to detect Python 3, create/manage a venv in a cache dir, install `zlibrary` via venv pip, and use the absolute path to venv Python for `python-shell`.
### Feature: RAG Document Pipeline - PDF Processing (Task 3) - [2025-04-14 14:30:00]
- **Status**: TDD Green Phase Complete.
### Jest Test Suite Fix (TS/ESM) - [2025-04-15 05:31:00]
- **Status**: Complete.
- **Details**: All Jest test suites now pass after resolving complex mocking issues in the ESM environment. This involved multiple attempts, delegation to `debug` mode (which implemented Dependency Injection for `venv-manager`), and verification/additions by `tdd` mode.
- **Related**: ADR-001-Jest-ESM-Migration, ActiveContext [2025-04-15 05:31:00]



### Feature: Jest Test Suite Fixes (TS/ESM) - [2025-04-15 05:04:00]
- **Status**: Complete.
- **Details**: Resolved all failures in `__tests__/zlibrary-api.test.js` by refactoring mocks. Failures in `__tests__/venv-manager.test.js` were resolved by a delegated `debug` task, which refactored `src/lib/venv-manager.ts` to use Dependency Injection, bypassing Jest ESM mocking issues for built-in modules. All test suites now pass.
- **Related**: Decision-JestMockingStrategy-01, Decision-DIForVenvManager-01 (Assumed from Debug task), ActiveContext [2025-04-15 05:04:00]


- **Details**: Added `PyMuPDF` to `requirements.txt`. Implemented `_process_pdf` function and integrated it into `process_document` in `lib/python-bridge.py`. Fixed unrelated test failures in `__tests__/index.test.js` by updating outdated expectations. All tests pass (`npm test`).
- **Related**: SpecPseudo [2025-04-14 14:08:30], TDD Red [2025-04-14 14:13:42], Code Green [2025-04-14 14:30:00]
### Issue: INT-001 - Client ZodError / No Tools Found - [2025-04-14 18:23:58]
- **Status**: Debugging Halted; Root Cause Unconfirmed (Server-Side Suspected).
- **Details**: Extensive debugging (response format changes, SDK downgrade, logging, schema isolation) failed to resolve the 'No tools found' error in the client UI, despite server logs indicating ListToolsResponse generation starts. Strong suspicion of incompatibility within `zlibrary-mcp` (SDK v1.8.0/CJS/zodToJsonSchema interaction). User directed halt to debugging.
- **Related**: ActiveContext [2025-04-14 18:19:43], Debug Issue History INT-001


### Feature: Jest Test Suite Fixes (TS/ESM) - [2025-04-15 04:08:00]
- **Status**: Partially Complete.
- **Details**: Resolved all failures in `__tests__/zlibrary-api.test.js`. Failures in `__tests__/venv-manager.test.js` persist despite multiple attempts using `unstable_mockModule` and `jest.spyOn` for `fs`/`child_process` mocks, adjusting error handling, and disabling Jest transforms. Root cause likely complex interaction between Jest ESM, built-in module mocking, and async rejection handling.
- **Related**: Decision-JestMockingStrategy-01, ActiveContext [2025-04-15 04:08:00]


### Feature: Jest Test Suite Fixes (TS/ESM) - [2025-04-15 04:00:00]
- **Status**: Partially Complete.
- **Details**: Resolved all failures in `__tests__/zlibrary-api.test.js` by refactoring mocks. Failures in `__tests__/venv-manager.test.js` persist despite multiple attempts (correcting `fs` mocks, adjusting error handling, disabling Jest transforms). Root cause likely complex interaction between Jest ESM, built-in module mocking (`fs`, `child_process`), and async rejection handling.
- **Related**: Decision-JestMockingStrategy-01, ActiveContext [2025-04-15 04:00:00]




- **Related**: Pattern-ManagedVenv-01, Issue-GlobalExecFail-01
- **Specification**: See SpecPseudo MB entry [2025-04-14 03:31:01]

# Progress
<!-- Entries below should be added reverse chronologically (newest first) -->
### Jest Test Suite Fix (TS/ESM) - Confirmation [2025-04-15 13:44:48]
- **Status**: Confirmed Complete.
- **Details**: After a task reset due to context window issues, confirmed via Memory Bank that all Jest tests were previously fixed and passing as of [2025-04-15 05:31:00].
- **Related**: ActiveContext [2025-04-15 13:44:30]



### Feature: Jest Test Suite Fixes (TS/ESM - venv-manager) - [2025-04-15 04:31:00]
- **Status**: Resolved.
- **Details**: Fixed 3 persistent failing tests in `__tests__/venv-manager.test.js`. Refactored `src/lib/venv-manager.ts` for dependency injection (DI) of `fs`/`child_process`, updated tests to use DI mocks, corrected `requirements.txt` path logic, and ensured clean build/cache. All tests now pass.
- **Related**: Decision-VenvManagerDI-01, ActiveContext [2025-04-15 04:31:00]


### Feature: Jest Test Suite Fixes (TS/ESM) - [2025-04-15 03:41:00]
- **Status**: Partially Complete.
- **Details**: Resolved all failures in `__tests__/zlibrary-api.test.js` by refactoring mocks to target API functions directly instead of `python-shell`. Failures in `__tests__/venv-manager.test.js` persist despite multiple attempts to fix `fs` and `child_process` mocks using `unstable_mockModule` and adjusting error handling. Root cause likely complex interaction between Jest ESM, built-in module mocking, and dynamic imports.
- **Related**: Decision-JestMockingStrategy-01


### Issue: INT-001 - Client ZodError / No Tools Found - [2025-04-14 19:36:54]
- **Status**: Investigation Concluded; Likely Client-Side Issue.
- **Details**: Exhausted server-side fixes for `index.js` based on analysis reports and external examples (correcting `zodToJsonSchema` usage, CJS import, handling empty schemas, removing try-catch). Issue persists. GitHub issue search revealed RooCode issue #2085 describing identical behavior, suggesting a regression in RooCode v3.9.0+ affecting MCP server discovery/display.
- **Related**: ActiveContext [2025-04-14 19:36:24], `docs/mcp-client-tool-failure-analysis.md`, `docs/mcp-server-comparison-report.md`, RooCode Issue #2085



### Issue: INT-001 - Client ZodError / No Tools Found - [2025-04-14 19:29:08]
- **Status**: Refining Fix Attempt (Attempt 2.1).
- **Details**: Based on analysis reports confirming dummy schemas as the likely root cause, refined the previous fix in `index.js`. Corrected the CJS import for `zod-to-json-schema` (removed `.default`) and uncommented all tools in the `toolRegistry` to ensure they are processed by the schema generation logic.
- **Related**: ActiveContext [2025-04-14 19:28:55], `docs/mcp-client-tool-failure-analysis.md`, `docs/mcp-server-comparison-report.md`



### Issue: INT-001 - Client ZodError / No Tools Found - [2025-04-14 19:26:45]
- **Status**: Fix Attempt Failed (Attempt 2).
- **Details**: Modified `index.js` ListToolsRequest handler to correctly use `zod-to-json-schema` and skip tools that fail generation. User confirmed client UI still shows 'No tools found'. The fix targeting schema generation alone was insufficient.
- **Related**: ActiveContext [2025-04-14 19:26:32], Decision-MigrationStrategy-INT001



### Documentation: MCP Server Comparison Report - [2025-04-14 17:50:25]
- **Status**: Draft Complete (Awaiting Comparison Data).
- **Details**: Created initial draft of `docs/mcp-server-comparison-report.md`. Analyzed `zlibrary-mcp` implementation (SDK v1.8.0, CJS, tool registration, schema handling). Identified dummy schema usage as potential issue related to INT-001. Report includes placeholders for comparison data from other servers.
- **Related**: ActiveContext [2025-04-14 17:49:54]


### Feature: RAG Document Pipeline - PDF Processing (Task 3) - [2025-04-14 14:50:58]
- **Status**: Integration Verification Blocked.
- **Details**: Code review confirmed `PyMuPDF` dependency and correct logic in `lib/python-bridge.py`. Dependency installation assumed correct based on prior tests. End-to-end verification (manual/automated tests) blocked by client-side ZodError (INT-001) preventing tool calls needed to obtain test data (Book IDs).
- **Related**: ActiveContext [2025-04-14 14:50:58], Issue INT-001


### Feature: RAG Document Pipeline - PDF Processing (Task 3) - [2025-04-14 14:25:00]
- **Status**: TDD Green Phase Implementation Complete.
- **Details**: Added `PyMuPDF` to `requirements.txt`. Implemented `_process_pdf` function and integrated it into `process_document` in `lib/python-bridge.py` following `docs/pdf-processing-implementation-spec.md`. Ready for test execution (`npm test`).
- **Related**: SpecPseudo [2025-04-14 14:08:30], TDD Red [2025-04-14 14:13:42], Code Green [2025-04-14 14:25:00]


### Feature: RAG Document Pipeline - PDF Processing (Task 3) - [2025-04-14 14:08:30]
- **Status**: Specification Complete.
- **Details**: Generated detailed specification and pseudocode for integrating PDF processing using PyMuPDF into the Python bridge, based on architecture doc. Saved to `docs/pdf-processing-implementation-spec.md`.
- **Related**: SpecPseudo [2025-04-14 14:08:30], Architecture `docs/architecture/pdf-processing-integration.md`


### Feature: RAG Document Pipeline (Task 2) - Integration - [2025-04-14 13:15:49]
- **Status**: Paused.
- **Details**: Integration paused due to persistent client-side ZodError ('Expected array, received undefined' at path 'content') when calling tools on zlibrary-mcp server. Error occurs even for tools returning objects. Suspected issue in client response parsing logic. Requires investigation of client-side code or MCP specification.
- **Related**: ActiveContext [2025-04-14 13:15:36]


### Feature: RAG Document Pipeline (Task 2) - [2025-04-14 12:58:00]
- **Status**: TDD Refactor Phase Complete.
- **Details**: Refactored Python bridge (`_parse_enums` helper, removed dead code) and Node API (`processDocumentForRag` argument handling, error check). Fixed associated test mocks and assertions. All tests pass.
- **Related**: SpecPseudo [2025-04-14 12:13:00], TDD Red [2025-04-14 12:23:43], Code Green [2025-04-14 12:30:35], TDD Refactor [2025-04-14 12:58:00]


### Feature: RAG Document Pipeline (Task 2) - [2025-04-14 12:30:55]
- **Status**: TDD Green Phase Implementation Complete.
- **Details**: Implemented dual workflow (combined/separate download & process) via `download_book_to_file` update and new `process_document_for_rag` tool. Updated Node.js handlers (`lib/zlibrary-api.js`) and Python bridge (`lib/python-bridge.py`) with EPUB/TXT processing logic using `ebooklib` and `BeautifulSoup`. Updated `lib/venv-manager.js` to install dependencies (`ebooklib`, `beautifulsoup4`, `lxml`) from `requirements.txt`. Test run (`npm test`) shows remaining failures are within test files (mocks, expectations), not implementation logic.
- **Related**: SpecPseudo [2025-04-14 12:13:00], TDD Red [2025-04-14 12:23:43], Code Green [2025-04-14 12:30:35]


### Feature: Global Execution Fix - [2025-04-14 10:20:37]
- **Status**: Integration Complete (Server Starts). `index.js` tests failing due to SDK refactoring.
- **Details**: Integrated `lib/venv-manager.js` changes. Refactored `index.js` to use correct MCP SDK v1.8.0 imports (`Server`, `StdioServerTransport`, types), instantiation (`new Server`), connection (`server.connect`), and tool registration (`tools/list`, `tools/call` handlers with Zod schemas). Manual tests confirm venv creation/validation and server startup. `index.js` tests require updates to match refactored SDK usage.
- **Related**: SpecPseudo [2025-04-14 03:31:01], TDD Red [2025-04-14 03:35:45], TDD Green [2025-04-14 04:11:16], TDD Refactor [2025-04-14 04:15:38], Debug [2025-04-14 10:18:16], Integration [2025-04-14 10:20:18]


### Feature: Global Execution Fix - [2025-04-14 04:11:38]
- **Status**: TDD Refactor Phase Complete.
- **Details**: Implemented `lib/venv-manager.js` and updated `index.js`, `lib/zlibrary-api.js` to use managed venv. Corrected Node SDK import. Removed obsolete `lib/python-env.js`. Added `env-paths` dependency. Refactored `venv-manager.js`, `index.js`, `zlibrary-api.js` for clarity and consistency. Updated tests in `__tests__/zlibrary-api.test.js`. All tests pass.
- **Related**: SpecPseudo [2025-04-14 03:31:01], TDD Red [2025-04-14 03:35:45], TDD Green [2025-04-14 04:11:16], TDD Refactor [2025-04-14 04:15:38]
