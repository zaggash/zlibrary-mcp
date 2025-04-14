# Product Context
<!-- Entries below should be added reverse chronologically (newest first) -->

# System Patterns
<!-- Entries below should be added reverse chronologically (newest first) -->
### Pattern: RAG Document Processing Pipeline - [2025-04-14 11:41:55]
- **Context**: Enabling AI agents to use documents from Z-Library for Retrieval-Augmented Generation (RAG).
- **Problem**: Agents need a way to extract usable text content from downloaded book files (EPUB, TXT initially).
- **Solution**: Extend the `zlibrary-mcp` server. Agents use existing tools to download a file, then call a new MCP tool (`process_document_for_rag`). This tool triggers a Python function (via the existing bridge) that detects the file type, uses appropriate libraries (e.g., `ebooklib`) to extract text, performs basic cleaning, and returns the plain text content to the agent.
- **Components**: New MCP tool (`process_document_for_rag`), modifications to `lib/zlibrary-api.js` (Node.js), new processing function in `lib/python-bridge.py` (Python), new Python dependencies (e.g., `ebooklib`).
- **Data Flow**: Agent -> `download_book_to_file` -> Server (Node -> Python -> Disk) -> Agent -> `process_document_for_rag` -> Server (Node -> Python -> Node) -> Agent (receives text).
- **Extensibility**: Python bridge allows easy addition of new format handlers (e.g., PDF) by adding libraries and conditional logic in `python-bridge.py`.
- **Related**: Decision-RAGProcessorTech-01, MCPTool-ProcessDocRAG-01


### Pattern: Managed Python Virtual Environment for NPM Package - [2025-04-14 03:29:08]
- **Context**: Providing a reliable Python dependency environment for a globally installed Node.js package (`zlibrary-mcp`).
- **Problem**: Global Python installations are inconsistent; relying on `PATH` or global `pip` is fragile.
- **Solution**: Automate the creation and management of a dedicated Python virtual environment (`venv`) within a user-specific cache directory during a post-install script or first run. Install required Python packages (`zlibrary`) into this venv. Explicitly use the absolute path to the venv's Python interpreter when executing Python scripts from Node.js (`python-shell` or `child_process`).
- **Components**: New setup script/logic, `lib/zlibrary-api.js` (modified to use venv path).
- **Tradeoffs**: Requires Python 3 pre-installed by user. Adds one-time setup step. Avoids package bloat (bundling) and fragility (detection).
- **Related**: Decision-PythonEnvStrategy-01, Issue-GlobalExecFail-01

# Decision Log
<!-- Entries below should be added reverse chronologically (newest first) -->
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
- **Related**: Pattern-ManagedVenv-01, Issue-GlobalExecFail-01
- **Specification**: See SpecPseudo MB entry [2025-04-14 03:31:01]

# Progress
<!-- Entries below should be added reverse chronologically (newest first) -->
### Feature: Global Execution Fix - [2025-04-14 10:20:37]
- **Status**: Integration Complete (Server Starts). `index.js` tests failing due to SDK refactoring.
- **Details**: Integrated `lib/venv-manager.js` changes. Refactored `index.js` to use correct MCP SDK v1.8.0 imports (`Server`, `StdioServerTransport`, types), instantiation (`new Server`), connection (`server.connect`), and tool registration (`tools/list`, `tools/call` handlers with Zod schemas). Manual tests confirm venv creation/validation and server startup. `index.js` tests require updates to match refactored SDK usage.
- **Related**: SpecPseudo [2025-04-14 03:31:01], TDD Red [2025-04-14 03:35:45], TDD Green [2025-04-14 04:11:16], TDD Refactor [2025-04-14 04:15:38], Debug [2025-04-14 10:18:16], Integration [2025-04-14 10:20:18]


### Feature: Global Execution Fix - [2025-04-14 04:11:38]
- **Status**: TDD Refactor Phase Complete.
- **Details**: Implemented `lib/venv-manager.js` and updated `index.js`, `lib/zlibrary-api.js` to use managed venv. Corrected Node SDK import. Removed obsolete `lib/python-env.js`. Added `env-paths` dependency. Refactored `venv-manager.js`, `index.js`, `zlibrary-api.js` for clarity and consistency. Updated tests in `__tests__/zlibrary-api.test.js`. All tests pass.
- **Related**: SpecPseudo [2025-04-14 03:31:01], TDD Red [2025-04-14 03:35:45], TDD Green [2025-04-14 04:11:16], TDD Refactor [2025-04-14 04:15:38]
