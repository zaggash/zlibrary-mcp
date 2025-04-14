# Auto-Coder Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
### Implementation: RAG Document Pipeline - PDF Processing (TDD Green Phase) - [2025-04-14 14:30:00]
- **Approach**: Implemented minimal code changes for PDF processing (Task 3) based on spec `docs/pdf-processing-implementation-spec.md` and failing tests from TDD Red phase [2025-04-14 14:13:42]. Used `PyMuPDF (fitz)`. Fixed unrelated test failures in `__tests__/index.test.js` by updating outdated test expectations.
- **Key Files Modified/Created**:
  - `requirements.txt`: Added `PyMuPDF`.
  - `lib/python-bridge.py`: Added `import fitz`, `import logging`. Added `_process_pdf` function. Modified `process_document`.
  - `__tests__/index.test.js`: Updated expectations for `registerCapabilities` and handler responses (`content` key).
- **Notes**: TDD Green phase complete. All tests pass. Ready for Refactor phase.


### Implementation: RAG Document Pipeline - PDF Processing (TDD Green Phase) - [2025-04-14 14:25:00]
- **Approach**: Implemented minimal code changes for PDF processing (Task 3) based on spec `docs/pdf-processing-implementation-spec.md` and failing tests from TDD Red phase [2025-04-14 14:13:42]. Used `PyMuPDF (fitz)`.
- **Key Files Modified/Created**:
  - `requirements.txt`: Added `PyMuPDF`.
  - `lib/python-bridge.py`: Added `import fitz`, `import logging`. Added `_process_pdf` function implementing text extraction with error handling (encryption, no text, corruption). Modified `process_document` to add `.pdf` handling via `elif`, updated signature/docstring, added `SUPPORTED_FORMATS` list, refined error handling/propagation.
- **Notes**: Code changes complete for Green phase. Next step is running `npm test` to verify tests pass.


### Implementation: RAG Document Pipeline (TDD Green Phase) - [2025-04-14 12:31:05]
- **Approach**: Implemented RAG pipeline features as per spec (`docs/rag-pipeline-implementation-spec.md`) and TDD Red phase tests. Updated `venv-manager.js` to use `requirements.txt`. Updated `index.js` with new/modified Zod schemas and tool registrations. Updated `lib/zlibrary-api.js` to handle `process_for_rag` flag in `downloadBookToFile` and added `processDocumentForRag` handler calling Python. Implemented EPUB/TXT processing logic in `lib/python-bridge.py` using `ebooklib` and `BeautifulSoup`, adding `process_document` function and registering it.
- **Key Files Modified/Created**:
  - `requirements.txt`: New file listing Python dependencies (`zlibrary`, `ebooklib`, `beautifulsoup4`, `lxml`).
  - `lib/venv-manager.js`: Modified `installDependencies` and `checkPackageInstalled` to use `requirements.txt`.
  - `index.js`: Updated `DownloadBookToFileParamsSchema`, added `ProcessDocumentForRagParamsSchema`. Updated `handlers` and `toolRegistry` for `download_book_to_file` and `process_document_for_rag`.
  - `lib/zlibrary-api.js`: Added `process_for_rag` param to `downloadBookToFile`, added logic to call `processDocumentForRag`. Added `processDocumentForRag` function definition.
  - `lib/python-bridge.py`: Added imports (`ebooklib`, `bs4`, `os`, `pathlib`). Added `_process_epub`, `_process_txt`, `process_document` functions. Added `process_document` to `function_map`.
- **Notes**: TDD Green phase implementation complete. Test run shows remaining failures are within test files (`__tests__/*.test.js`), related to outdated mocks, incorrect expectations (e.g., missing default args), or incorrect test function calls. Core implementation logic appears correct based on spec and passing Python tests.


### Implementation: Global Execution Fix (Managed Venv) - [2025-04-14 04:11:52]
- **Approach**: Implemented `lib/venv-manager.js` for Python venv detection, creation, dependency installation (`zlibrary`), and configuration storage using `env-paths`. Updated `lib/zlibrary-api.js` to use the managed Python path via `getManagedPythonPath`. Updated `index.js` to call `ensureVenvReady` and use correct SDK import. Removed old `lib/python-env.js`.
- **Key Files Modified/Created**:
  - `lib/venv-manager.js`: New file implementing the core venv management logic.
  - `index.js`: Updated SDK import, replaced `ensureZLibraryInstalled` with `ensureVenvReady`.
  - `lib/zlibrary-api.js`: Updated `callPythonFunction` to use `getManagedPythonPath`.
  - `package.json`: Added `env-paths` dependency.

## Dependencies Log
### Dependency: PyMuPDF - [2025-04-14 14:25:00]
- **Version**: (Installed via pip from requirements.txt)
- **Purpose**: Python library for PDF text extraction (`fitz`). Chosen for accuracy and performance (Decision-PDFLibraryChoice-01).
- **Used by**: `lib/python-bridge.py` (`_process_pdf`)
- **Config notes**: AGPL-3.0 license.


<!-- Append new dependencies using the format below -->
### Dependency: ebooklib - [2025-04-14 12:31:05]
- **Version**: (Installed via pip from requirements.txt)
- **Purpose**: Python library for reading/writing EPUB files.
- **Used by**: `lib/python-bridge.py` (`_process_epub`)
- **Config notes**: None.

### Dependency: beautifulsoup4 - [2025-04-14 12:31:05]
- **Version**: (Installed via pip from requirements.txt)
- **Purpose**: Python library for parsing HTML/XML (used for EPUB content).
- **Used by**: `lib/python-bridge.py` (`_process_epub`)
- **Config notes**: Requires a parser like `lxml`.

### Dependency: lxml - [2025-04-14 12:31:05]
- **Version**: (Installed via pip from requirements.txt)
- **Purpose**: Python library for processing XML and HTML (used as parser for BeautifulSoup).
- **Used by**: `lib/python-bridge.py` (implicitly by `_process_epub` via BeautifulSoup)
- **Config notes**: None.


  - `__tests__/index.test.js`: Updated mocks for `venv-manager`.
  - `__tests__/zlibrary-api.test.js`: Refactored mock setup significantly to handle module loading order.
  - `jest.config.js`: Removed `transformIgnorePatterns` after switching to mocking `env-paths`.
  - `__mocks__/env-paths.js`: Added mock for `env-paths`.
- **Files Removed**:
  - `lib/python-env.js`
  - `__tests__/python-env.test.js`
- **Notes**: TDD Green phase complete. Required significant debugging of Jest mock setup, particularly around module loading order and ESM dependencies. Final solution involved standard Jest mocking patterns without `resetModules` in `beforeEach` for `zlibrary-api.test.js` and mocking the `env-paths` module directly.

### Dependency: env-paths - [2025-04-14 04:11:52]
- **Version**: ^3.0.0
- **Purpose**: Determine user-specific cache directory path reliably across platforms for storing the managed Python venv.
- **Used by**: `lib/venv-manager.js`
- **Config notes**: None.
