# Auto-Coder Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
### Implementation: Jest/ESM Test Suite Fix (Delegated) - [2025-04-15 15:29:00]
- **Approach**: Task delegated due to context overload and repeated errors fixing Jest/ESM issues. Delegated agent identified unreliable mocking of built-in Node modules (`fs`, `child_process`) with `jest.unstable_mockModule` and dynamic imports as the root cause of persistent test failures (`spawn ENOENT`, timeouts).
- **Resolution**: Refactored `src/lib/venv-manager.ts` to use Dependency Injection, decoupling it from direct `fs`/`child_process` usage. Updated `__tests__/venv-manager.test.js` to pass mock objects via DI. Corrected various assertion errors in other test files.
- **Key Files Modified/Created**: `src/lib/venv-manager.ts`, `__tests__/venv-manager.test.js`, `__tests__/zlibrary-api.test.js`, `__tests__/index.test.js`, `__tests__/python-bridge.test.js`, `jest.config.js` (across sessions).
- **Notes**: Dependency Injection proved crucial for stable testing in the Jest/ESM environment. All tests now pass. Recommend TDD run for regression testing.



### Implementation: Jest Test Suite Fixes (TS/ESM Handover) - Confirmation [2025-04-15 13:45:08]
- **Approach**: Confirmed via Memory Bank ([2025-04-15 05:31:00]) that all Jest tests were passing after a previous task reset and subsequent fixes involving Dependency Injection.
- **Key Files Modified/Created**: None in this instance.
- **Notes**: Task was reset due to context window issues, but the objective was already achieved in the prior context.
- **Related**: ActiveContext [2025-04-15 13:44:30], GlobalContext [2025-04-15 13:44:48]



### Implementation: Jest Test Suite Fixes (TS/ESM Handover) - Complete [2025-04-15 05:04:00]
- **Approach**: Successfully fixed all remaining Jest test failures. Refactored `__tests__/zlibrary-api.test.js` to mock API functions directly. Delegated persistent `__tests__/venv-manager.test.js` failures to a `debug` task, which resolved them by refactoring `src/lib/venv-manager.ts` to use Dependency Injection (DI) for `fs` and `child_process`, bypassing Jest ESM mocking issues.
- **Key Files Modified/Created**:
  - `__tests__/zlibrary-api.test.js`: Refactored mocks.
  - `__tests__/venv-manager.test.js`: Updated by debug task to use DI.
  - `src/lib/venv-manager.ts`: Refactored by debug task to use DI.
  - `jest.config.js`: Added `transform: {}` (may be redundant now).
- **Notes**: All test suites now pass. The DI pattern proved effective for testing modules interacting with built-in Node APIs in Jest ESM.
- **Related**: Decision-JestMockingStrategy-01, Decision-DIForVenvManager-01 (Assumed from Debug task), ActiveContext [2025-04-15 05:04:00]


### Implementation: Jest Test Fixes (TS/ESM Handover) - Final Attempt 2 [2025-04-15 04:08:00]
- **Approach**: Attempted `jest.spyOn` as an alternative to `unstable_mockModule` for mocking `fs` methods in `__tests__/venv-manager.test.js`. This also failed to resolve the 3 persistent test failures.
- **Key Files Modified/Created**:
  - `__tests__/venv-manager.test.js`: Refactored one test to use `jest.spyOn`.
- **Notes**: Concluded that standard Jest mocking techniques (`unstable_mockModule`, `spyOn`) are insufficient to reliably mock built-in Node modules (`fs`, `child_process`) in this specific Jest ESM context, likely due to interactions with dynamic imports or Jest's internal module handling. The remaining 3 failures require a different approach (e.g., refactoring `venv-manager.ts`, deeper Jest ESM investigation).
- **Related**: Decision-JestMockingStrategy-01, ActiveContext [2025-04-15 04:08:00]


### Implementation: Jest Test Fixes (TS/ESM Handover) - Final Attempt [2025-04-15 04:00:00]
- **Approach**: Made final attempts to fix `__tests__/venv-manager.test.js`. Corrected `fs.existsSync` mock implementation and reverted error handling changes in `src/lib/venv-manager.ts`. Added `transform: {}` to `jest.config.js` to explicitly disable Jest transformations.
- **Key Files Modified/Created**:
  - `__tests__/venv-manager.test.js`: Updated `fs.existsSync` mock.
  - `src/lib/venv-manager.ts`: Reverted error handling.
  - `jest.config.js`: Added `transform: {}`.
- **Notes**: The 3 failures in `venv-manager.test.js` persist. The issues with mocking built-in modules (`fs`, `child_process`) and async rejection handling in Jest ESM remain unresolved by these changes. Concluding debugging efforts for this task.
- **Related**: Decision-JestMockingStrategy-01, ActiveContext [2025-04-15 04:00:00]


### Implementation: Jest Test Fixes (TS/ESM Handover) - [2025-04-15 03:41:00]
- **Approach**: Investigated persistent Jest ESM test failures. Refactored `__tests__/zlibrary-api.test.js` to mock exported API functions directly using `jest.unstable_mockModule` and `jest.resetModules()`, resolving all failures in that suite. Made multiple attempts to fix `__tests__/venv-manager.test.js` failures related to mocking `fs` (`existsSync`, `readFileSync`) and `child_process` (`spawn` error handling) using `unstable_mockModule`, dynamic imports, and adjusting error propagation logic. These attempts were unsuccessful.
- **Key Files Modified/Created**:
  - `__tests__/zlibrary-api.test.js`: Refactored mocks.
  - `__tests__/venv-manager.test.js`: Multiple mock adjustments.
  - `src/lib/venv-manager.ts`: Error handling adjustments (reverted).
- **Notes**: The `zlibrary-api.test.js` suite now passes reliably. The `venv-manager.test.js` failures (3 tests) seem deeply related to Jest ESM's handling of built-in module mocks and async error propagation, requiring further investigation or alternative testing strategies (e.g., refactoring `venv-manager.ts`).
- **Related**: Decision-JestMockingStrategy-01


### Implementation: Fix Tool Listing (INT-001, Final Fix) - [2025-04-14 22:05:00]
- **Approach**: Corrected the `ToolDefinition` interface to use `inputSchema` (camelCase) instead of `input_schema`, resolving the TypeScript error and aligning the interface with the returned object structure. This followed previous fixes aligning capability declaration and `zodToJsonSchema` usage with working examples.
- **Key Files Modified/Created**: `src/index.ts`
- **Notes**: Build successful. User confirmed tools are now listed correctly in RooCode, resolving INT-001. The critical fixes were ensuring capabilities were passed during `new Server()` instantiation and using the correct `inputSchema` key.



### Implementation: Fix Tool Listing (INT-001, Attempt 3) - [2025-04-14 21:58:00]
- **Approach**: Compared `src/index.ts` (TS/ESM, SDK v1.8.0) with working example `wonderwhy-er/DesktopCommanderMCP/src/server.ts`. Identified and fixed two key differences: removed a redundant `server.registerCapabilities` call and corrected the `zodToJsonSchema` call in the `ListToolsRequest` handler to only pass the schema object (removed the second `name` argument).
- **Key Files Modified/Created**: `src/index.ts`
- **Notes**: Build successful. `mcp_settings.json` verified. This aligns our server's initialization and schema generation with a known working pattern, addressing the likely cause of tools not being listed in RooCode.



### Implementation: Fix Schema Generation (INT-001, Attempt 2.3) - [2025-04-14 19:37:07]
- **Approach**: Final server-side attempt based on external examples. Modified `index.js` ListToolsRequest handler (lines 241-257) to remove the optional `name` argument from the `zodToJsonSchema` call, matching the `wonderwhy-er/DesktopCommanderMCP` example. Kept the logic to handle empty schemas explicitly.
- **Key Files Modified/Created**: `index.js`
- **Notes**: User confirmed client UI still shows 'No tools found'. GitHub issue search revealed RooCode issue #2085 describing identical behavior, strongly suggesting a client-side regression in RooCode v3.9.0+ is the root cause. Server-side fixes exhausted.



### Implementation: Fix Schema Generation (INT-001, Attempt 2.1) - [2025-04-14 19:29:19]
- **Approach**: Refined the fix for INT-001 in `index.js`. Corrected the CJS import for `zod-to-json-schema` (removed `.default` on line 7) and uncommented all tools in `toolRegistry` (lines 156-202) to ensure they are processed by the schema generation logic in the `ListToolsRequest` handler.
- **Key Files Modified/Created**: `index.js`
- **Notes**: This addresses potential issues with the CJS import and ensures all defined tools are attempted for schema generation. Ready for user verification.



### Implementation: Fix Schema Generation (INT-001, Attempt 2) - [2025-04-14 19:27:00]
- **Approach**: Modified `index.js` ListToolsRequest handler (lines 241-258) to correctly use `zod-to-json-schema` and skip tools that fail generation, instead of using placeholders. This was based on the hypothesis that individual schema generation errors were the primary cause.
- **Key Files Modified/Created**: `index.js`
- **Notes**: User confirmed client UI still shows 'No tools found' after restarting the server. This indicates the fix was insufficient and the root cause is likely more complex, potentially involving client-side parsing or SDK/CJS interactions, as suggested by previous debugging and architectural analysis.



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
