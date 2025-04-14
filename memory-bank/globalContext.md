# Product Context
<!-- Entries below should be added reverse chronologically (newest first) -->

# System Patterns
<!-- Entries below should be added reverse chronologically (newest first) -->
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
- **Details**: Added `PyMuPDF` to `requirements.txt`. Implemented `_process_pdf` function and integrated it into `process_document` in `lib/python-bridge.py`. Fixed unrelated test failures in `__tests__/index.test.js` by updating outdated expectations. All tests pass (`npm test`).
- **Related**: SpecPseudo [2025-04-14 14:08:30], TDD Red [2025-04-14 14:13:42], Code Green [2025-04-14 14:30:00]


- **Related**: Pattern-ManagedVenv-01, Issue-GlobalExecFail-01
- **Specification**: See SpecPseudo MB entry [2025-04-14 03:31:01]

# Progress
<!-- Entries below should be added reverse chronologically (newest first) -->
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
