# Specification Writer Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
## Functional Requirements
<!-- Append new requirements using the format below -->

### Feature: PDF Processing Integration (RAG Pipeline - Task 3)
- Added: 2025-04-14 14:08:30
- Description: Integrate PDF text extraction into the RAG pipeline using PyMuPDF (fitz) within `lib/python-bridge.py`. This involves adding a new `_process_pdf` helper function, updating the `process_document` function to route `.pdf` files to the new helper, and adding `PyMuPDF` to `requirements.txt`.
- Acceptance criteria: 1. `process_document` successfully extracts text from standard PDFs. 2. `process_document` raises appropriate errors for encrypted, corrupted, or image-based PDFs. 3. `PyMuPDF` dependency is installed correctly via `venv-manager.js`. 4. `_process_pdf` handles file not found errors. 5. `_process_pdf` handles `fitz` import errors gracefully.
- Dependencies: Python (`PyMuPDF`), Existing Python bridge structure, Managed Python Venv.
- Status: Draft (Specification Complete)


### Feature: RAG Document Processing Pipeline
- Added: 2025-04-14 12:13:00
- Description: Implement a pipeline to download (EPUB, TXT) and/or process documents for RAG. Includes updating `download_book_to_file` tool (add `process_for_rag` flag, update output schema) and creating `process_document_for_rag` tool (input `file_path`, output `processed_text`). Requires changes in `index.js` (tool registration/schemas), `lib/zlibrary-api.js` (handlers calling Python), and `lib/python-bridge.py` (updated download logic, new processing logic using `ebooklib`, `beautifulsoup4`).
- Acceptance criteria: 1. `download_book_to_file` with `process_for_rag=false` downloads file and returns only `file_path`. 2. `download_book_to_file` with `process_for_rag=true` downloads file, processes it (EPUB/TXT), and returns `file_path` and `processed_text`. 3. `process_document_for_rag` processes an existing EPUB/TXT file and returns `processed_text`. 4. Python bridge correctly handles EPUB extraction via `ebooklib`. 5. Python bridge correctly handles TXT reading (UTF-8, fallback). 6. Python bridge handles file not found, unsupported format, and processing errors gracefully. 7. New Python dependencies (`ebooklib`, `beautifulsoup4`, `lxml`) are managed by `venv-manager.js`.
- Dependencies: Node.js (`zod`), Python (`ebooklib`, `beautifulsoup4`, `lxml`), Existing `zlibrary` Python lib, Managed Python Venv.
- Status: Draft

### Feature: Managed Python Virtual Environment
- Added: 2025-04-14 03:31:01
- Description: Implement automated creation and management of a dedicated Python virtual environment for the `zlibrary` dependency within a user cache directory. This includes Python 3 detection, venv creation, dependency installation (`zlibrary`), storing the venv Python path, and modifying `zlibrary-api.js` to use this path.
- Acceptance criteria: 1. `zlibrary-mcp` successfully executes Python scripts using the managed venv. 2. Setup handles Python 3 detection errors gracefully. 3. Setup handles venv creation errors gracefully. 4. Setup handles dependency installation errors gracefully. 5. Subsequent runs use the existing configured venv.
- Dependencies: Node.js (`env-paths`, `child_process`, `fs`, `path`), User system must have Python 3 installed.
- Status: Draft

### Feature: Node.js SDK Import Fix
- Added: 2025-04-14 03:31:01
- Description: Correct the `require` statement in `index.js` to properly import the `@modelcontextprotocol/sdk`.
- Acceptance criteria: 1. `index.js` successfully imports the SDK without `ERR_PACKAGE_PATH_NOT_EXPORTED` errors. 2. Core SDK functionality is accessible.
- Dependencies: `@modelcontextprotocol/sdk` package.
- Status: Draft


## System Constraints
<!-- Append new constraints using the format below -->

### Constraint: PyMuPDF Dependency and License
- Added: 2025-04-14 14:08:30
- Description: The project will depend on `PyMuPDF`. This library must be successfully installed into the managed Python environment. Its license is AGPL-3.0, which is deemed acceptable for this server-side use case but should be noted.
- Impact: PDF processing will fail if `PyMuPDF` cannot be installed or imported. License compliance must be maintained.
- Mitigation strategy: Ensure `requirements.txt` includes `PyMuPDF`. `venv-manager.js` must handle installation. Implement checks for `fitz` import within `python-bridge.py`.


### Constraint: Python RAG Libraries
- Added: 2025-04-14 12:13:00
- Description: The managed Python environment must successfully install `ebooklib`, `beautifulsoup4`, and `lxml` for EPUB processing.
- Impact: EPUB processing will fail if these libraries cannot be installed or imported.
- Mitigation strategy: Ensure `requirements.txt` is correct and `venv-manager.js` installs dependencies properly. Provide clear errors if import fails in `python-bridge.py`.

### Constraint: Python 3 Prerequisite
- Added: 2025-04-14 03:31:01
- Description: The user's system must have a functional Python 3 installation (version 3.6+ recommended for `venv`) accessible via the system's PATH or detectable by the chosen Node.js detection library.
- Impact: The managed venv setup will fail if Python 3 is not found.
- Mitigation strategy: Provide clear error messages guiding the user to install Python 3.


## Edge Cases
<!-- Append new edge cases using the format below -->

### Edge Case: PDF Processing - Encrypted PDF
- Identified: 2025-04-14 14:08:30
- Scenario: `_process_pdf` is called with a password-protected/encrypted PDF.
- Expected behavior: `fitz.open()` succeeds, but `doc.is_encrypted` returns true. `_process_pdf` raises `ValueError("PDF is encrypted")`.
- Testing approach: Obtain/create an encrypted PDF. Call `_process_pdf`. Verify the correct `ValueError`.

### Edge Case: PDF Processing - Corrupted PDF
- Identified: 2025-04-14 14:08:30
- Scenario: `_process_pdf` is called with a corrupted or malformed PDF file that `fitz` cannot open or process correctly.
- Expected behavior: `fitz.open()` or page processing methods raise an exception (e.g., `fitz.fitz.FitzError`, `RuntimeError`). `_process_pdf` catches this and raises `RuntimeError("Error opening or processing PDF: ...")`.
- Testing approach: Obtain/create a corrupted PDF. Call `_process_pdf`. Verify the correct `RuntimeError`.

### Edge Case: PDF Processing - Image-Based PDF
- Identified: 2025-04-14 14:08:30
- Scenario: `_process_pdf` is called with a PDF containing only scanned images without an OCR text layer.
- Expected behavior: `page.get_text("text")` returns empty strings for all pages. `_process_pdf` detects the empty `full_text` result and raises `ValueError("PDF contains no extractable text layer (possibly image-based)")`.
- Testing approach: Obtain/create an image-only PDF. Call `_process_pdf`. Verify the correct `ValueError`.

### Edge Case: PDF Processing - Empty PDF
- Identified: 2025-04-14 14:08:30
- Scenario: `_process_pdf` is called with a valid PDF file that contains no pages or no text content.
- Expected behavior: Similar to image-based PDF, no text is extracted. `_process_pdf` raises `ValueError("PDF contains no extractable text layer (possibly image-based)")`.
- Testing approach: Create an empty PDF. Call `_process_pdf`. Verify the correct `ValueError`.

### Edge Case: PDF Processing - `fitz` Import Error
- Identified: 2025-04-14 14:08:30
- Scenario: `python-bridge.py` attempts to `import fitz` but `PyMuPDF` is not installed in the venv.
- Expected behavior: An `ImportError` occurs. The calling function (`process_document`) should catch this and raise a user-friendly `RuntimeError` indicating a missing dependency.
- Testing approach: Mock the environment so `import fitz` fails. Call `process_document` with a PDF path. Verify the appropriate `RuntimeError`.


### Edge Case: RAG Processing - File Not Found
- Identified: 2025-04-14 12:13:00
- Scenario: `process_document_for_rag` is called with a `file_path` that does not exist.
- Expected behavior: Python bridge raises `FileNotFoundError`, Node.js handler catches it and returns an appropriate error to the agent.
- Testing approach: Call `process_document_for_rag` with a non-existent path. Verify the correct error is returned.

### Edge Case: RAG Processing - Unsupported Format
- Identified: 2025-04-14 12:13:00
- Scenario: `process_document_for_rag` (or internal processing via download) is called with a file format other than EPUB or TXT (e.g., PDF, DOCX).
- Expected behavior: Python bridge raises `ValueError` indicating unsupported format, Node.js handler catches it and returns an error.
- Testing approach: Create dummy files with unsupported extensions. Call processing functions. Verify `ValueError`.

### Edge Case: RAG Processing - EPUB Parsing Error
- Identified: 2025-04-14 12:13:00
- Scenario: `_process_epub` encounters a corrupted or malformed EPUB file that `ebooklib` cannot parse.
- Expected behavior: `ebooklib` raises an error, `_process_epub` catches it (or lets it propagate), logs the error, and the calling function (`process_document` or `download_book`) handles it (e.g., returns `None` for text, includes error info).
- Testing approach: Obtain or create a corrupted EPUB file. Call `_process_epub`. Verify error handling.

### Edge Case: RAG Processing - TXT Encoding Error
- Identified: 2025-04-14 12:13:00
- Scenario: `_process_txt` encounters a TXT file that is not UTF-8 or Latin-1, or has other read errors.
- Expected behavior: `_process_txt` attempts UTF-8, then Latin-1. If both fail, it raises the underlying `Exception`, which is caught, logged, and handled by the caller.
- Testing approach: Create TXT files with unusual encodings or trigger read errors (e.g., permissions). Verify fallback and error handling.

### Edge Case: Venv Management - Python Not Found
- Identified: 2025-04-14 03:31:01
- Scenario: The `findPythonExecutable` function fails to locate a compatible Python 3 installation on the user's system.
- Expected behavior: The setup process halts, and a clear error message is displayed instructing the user to install Python 3.
- Testing approach: Mock the Python detection library/logic to return 'not found'. Verify the correct error is thrown.

### Edge Case: Venv Management - Venv Creation Failure
- Identified: 2025-04-14 03:31:01
- Scenario: The `python3 -m venv <path>` command fails (e.g., due to permissions, disk space, corrupted Python installation).
- Expected behavior: The setup process halts, and an error message indicating venv creation failure is displayed.
- Testing approach: Mock `child_process.execSync`/`exec` to throw an error during the venv creation command. Verify the correct error is propagated.

### Edge Case: Venv Management - Dependency Installation Failure
- Identified: 2025-04-14 03:31:01
- Scenario: The `<venv_pip> install zlibrary` command fails (e.g., network issues, PyPI unavailable, incompatible `zlibrary` version).
- Expected behavior: The setup process halts, and an error message indicating dependency installation failure is displayed.
- Testing approach: Mock `child_process.execSync`/`exec` to throw an error during the pip install command. Verify the correct error is propagated.

### Edge Case: Venv Management - Corrupted Config File
- Identified: 2025-04-14 03:31:01
- Scenario: The `venv_config.json` file exists but is malformed or contains an invalid/non-executable Python path.
- Expected behavior: The `ensureVenvReady` function detects the invalid config, attempts to repair the venv (re-install dependencies, re-verify Python path), and saves a new valid config. If repair fails, an error is thrown.
- Testing approach: Create mock corrupted config files. Mock `fs` reads/writes and `child_process` calls. Verify the repair logic is triggered and succeeds/fails correctly.


## Pseudocode Library
<!-- Append new pseudocode blocks using the format below -->

### Pseudocode: Python Bridge (`lib/python-bridge.py`) - `_process_pdf`
- Created: 2025-04-14 14:08:30
- Updated: 2025-04-14 14:08:30
```python
# File: lib/python-bridge.py (Addition)
# Dependencies: fitz, os, logging

import fitz  # PyMuPDF
import os
import logging

# Assume logging is configured elsewhere

def _process_pdf(file_path: str) -> str:
    """
    Extracts text content from a PDF file using PyMuPDF (fitz).

    Args:
        file_path: The absolute path to the PDF file.

    Returns:
        The extracted plain text content.

    Raises:
        FileNotFoundError: If the file_path does not exist.
        ValueError: If the PDF is encrypted or contains no extractable text.
        RuntimeError: If there's an error opening or processing the PDF.
        ImportError: If fitz (PyMuPDF) is not installed (implicitly raised on import).
    """
    logging.info(f"Processing PDF: {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    doc = None  # Initialize doc to None for finally block
    try:
        # Attempt to open the PDF
        doc = fitz.open(file_path)

        # Check for encryption
        if doc.is_encrypted:
            logging.warning(f"PDF is encrypted: {file_path}")
            raise ValueError("PDF is encrypted")

        all_text = []
        # Iterate through pages
        for page_num in range(len(doc)):
            try:
                page = doc.load_page(page_num)
                text = page.get_text("text") # Extract plain text
                if text:
                    all_text.append(text.strip())
            except Exception as page_error:
                logging.warning(f"Could not process page {page_num + 1} in {file_path}: {page_error}")
                # Decide whether to continue or raise based on severity

        # Combine extracted text
        full_text = "\n\n".join(all_text).strip()

        # Check if any text was extracted
        if not full_text:
            logging.warning(f"No extractable text found in PDF (possibly image-based): {file_path}")
            raise ValueError("PDF contains no extractable text layer (possibly image-based)")

        logging.info(f"Finished PDF: {file_path}. Extracted length: {len(full_text)}")
        return full_text

    except fitz.fitz.FitzError as fitz_error: # Catch specific fitz errors if needed
        logging.error(f"PyMuPDF error processing {file_path}: {fitz_error}")
        raise RuntimeError(f"Error opening or processing PDF: {file_path} - {fitz_error}")
    except Exception as e:
        # Catch other potential errors during opening or processing
        logging.error(f"Unexpected error processing PDF {file_path}: {e}")
        # Re-raise specific errors if needed (like ValueError from checks)
        if isinstance(e, (ValueError, FileNotFoundError)):
             raise e
        raise RuntimeError(f"Error opening or processing PDF: {file_path} - {e}")
    finally:
        # Ensure the document is closed
        if doc:
            try:
                doc.close()
            except Exception as close_error:
                logging.error(f"Error closing PDF document {file_path}: {close_error}")

```
#### TDD Anchors:
- Test case 1: Successful extraction from standard PDF.
- Test case 2: Raises `ValueError` for encrypted PDF.
- Test case 3: Raises `RuntimeError` for corrupted PDF.
- Test case 4: Raises `ValueError` for image-based PDF.
- Test case 5: Raises `ValueError` for empty PDF.
- Test case 6: Raises `FileNotFoundError` for non-existent path.
- Test case 7: Handles page processing errors gracefully (logs warning).
- Test case 8: Ensures `doc.close()` is called in `finally` block.

### Pseudocode: Python Bridge (`lib/python-bridge.py`) - `process_document` Modification
- Created: 2025-04-14 14:08:30
- Updated: 2025-04-14 14:08:30
```python
# File: lib/python-bridge.py (Modification)

# Update SUPPORTED_FORMATS if it exists
SUPPORTED_FORMATS = ['.epub', '.txt', '.pdf'] # Added .pdf

# Inside the process_document function:
def process_document(file_path_str: str) -> str:
    """Processes a document file (EPUB, TXT, PDF) to extract text."""
    if not os.path.exists(file_path_str):
        raise FileNotFoundError(f"File not found: {file_path_str}")

    _, ext = os.path.splitext(file_path_str)
    ext = ext.lower()
    processed_text = None

    try:
        if ext == '.epub':
            # Ensure EBOOKLIB_AVAILABLE check happens here or in _process_epub
            processed_text = _process_epub(file_path_str)
        elif ext == '.txt':
            processed_text = _process_txt(file_path_str)
        elif ext == '.pdf': # <-- New condition
            # Ensure fitz import check happens here or in _process_pdf
            # Implicitly handles ImportError if fitz not installed
            processed_text = _process_pdf(file_path_str) # <-- Call new function
        else:
            # Use the updated SUPPORTED_FORMATS list in the error message
            raise ValueError(f"Unsupported file format: {ext}. Supported: {SUPPORTED_FORMATS}")

        if processed_text is None:
             # This case might occur if a processing function returns None instead of raising error
             raise RuntimeError(f"Processing function returned None for {file_path_str}")

        return processed_text

    except ImportError as imp_err:
         # Catch import errors for any format-specific library
         logging.error(f"Missing dependency for processing {ext} file {file_path_str}: {imp_err}")
         raise RuntimeError(f"Missing required library to process {ext} files. Please check installation.") from imp_err
    # Keep existing specific error handling (FileNotFoundError, ValueError)
    # Add or modify general exception handling if needed
    except Exception as e:
        logging.exception(f"Failed to process document {file_path_str}")
        # Re-raise specific errors if they weren't caught earlier
        if isinstance(e, (FileNotFoundError, ValueError)):
            raise e
        # Wrap unexpected errors
        raise RuntimeError(f"An unexpected error occurred during document processing: {e}") from e

```
#### TDD Anchors:
- Test case 1: Routes `.pdf` extension to `_process_pdf`.
- Test case 2: Routes `.epub`, `.txt` correctly.
- Test case 3: Raises `ValueError` for unsupported extensions.
- Test case 4: Propagates errors raised by `_process_pdf` (e.g., `ValueError`, `RuntimeError`).
- Test case 5: Catches `ImportError` (e.g., if `fitz` is missing) and raises `RuntimeError`.
- Test case 6: Raises `FileNotFoundError` if input path doesn't exist.


### Pseudocode: Tool Schemas (Zod)
- Created: 2025-04-14 12:13:00
- Updated: 2025-04-14 12:13:00
```typescript
// File: lib/schemas.js (or inline in index.js)
import { z } from 'zod';

// Updated Input for download_book_to_file
export const DownloadBookToFileInputSchema = z.object({
  bookId: z.string().describe("The Z-Library book ID"),
  outputDir: z.string().optional().describe("Directory to save the file (relative to project root or absolute)"),
  outputFilename: z.string().optional().describe("Desired filename (extension will be added automatically)"),
  process_for_rag: z.boolean().optional().default(false).describe("If true, process content for RAG and return text") // New field
});

// Updated Output for download_book_to_file
export const DownloadBookToFileOutputSchema = z.object({
    file_path: z.string().describe("The absolute path to the downloaded file"),
    processed_text: z.string().optional().describe("The extracted plain text content (only if process_for_rag was true)") // New optional field
});

// New Input for process_document_for_rag
export const ProcessDocumentForRagInputSchema = z.object({
  file_path: z.string().describe("The absolute path to the document file to process")
});

// New Output for process_document_for_rag
export const ProcessDocumentForRagOutputSchema = z.object({
  processed_text: z.string().describe("The extracted plain text content")
});
```
#### TDD Anchors:
- Test case 1: `DownloadBookToFileInputSchema` validation (accepts/rejects process_for_rag).
- Test case 2: `DownloadBookToFileOutputSchema` validation (accepts/rejects optional processed_text).
- Test case 3: `ProcessDocumentForRagInputSchema` validation (requires file_path).
- Test case 4: `ProcessDocumentForRagOutputSchema` validation (requires processed_text).

### Pseudocode: Tool Registration (`index.js` Snippet)
- Created: 2025-04-14 12:13:00
- Updated: 2025-04-14 12:13:00
```javascript
// File: index.js (Conceptual Snippet)
// ... imports (Server, StdioServerTransport, z, zlibraryApi, schemas) ...

// Assume schemas are defined or imported
const {
  DownloadBookToFileInputSchema,
  DownloadBookToFileOutputSchema,
  ProcessDocumentForRagInputSchema,
  ProcessDocumentForRagOutputSchema
} = require('./lib/schemas'); // Example path

const server = new Server({
  // ... other server options
  tools: {
    list: async () => {
      return [
        // ... other tools
        {
          name: 'download_book_to_file',
          description: 'Downloads a book file from Z-Library and optionally processes its content for RAG.',
          inputSchema: DownloadBookToFileInputSchema,
          outputSchema: DownloadBookToFileOutputSchema, // Updated
        },
        {
          name: 'process_document_for_rag', // New
          description: 'Processes an existing local document file (EPUB, TXT) to extract plain text content for RAG.',
          inputSchema: ProcessDocumentForRagInputSchema,
          outputSchema: ProcessDocumentForRagOutputSchema,
        },
      ];
    },
    call: async (request) => {
      // ... generic validation ...
      if (request.tool_name === 'download_book_to_file') {
        const validatedArgs = DownloadBookToFileInputSchema.parse(request.arguments);
        const result = await zlibraryApi.downloadBookToFile(validatedArgs);
        // DownloadBookToFileOutputSchema.parse(result); // Optional output validation
        return result;
      }
      if (request.tool_name === 'process_document_for_rag') { // New
        const validatedArgs = ProcessDocumentForRagInputSchema.parse(request.arguments);
        const result = await zlibraryApi.processDocumentForRag(validatedArgs);
        // ProcessDocumentForRagOutputSchema.parse(result); // Optional output validation
        return result;
      }
      throw new Error(`Tool not found: ${request.tool_name}`);
    },
  },
});
// ... transport setup and server.connect() ...
```
#### TDD Anchors:
- Test case 1: `tools/list` includes updated `download_book_to_file`.
- Test case 2: `tools/list` includes new `process_document_for_rag`.
- Test case 3: `tools/call` routes `download_book_to_file` correctly.
- Test case 4: `tools/call` routes `process_document_for_rag` correctly.
- Test case 5: `tools/call` performs input validation for both tools.

### Pseudocode: Node.js Handlers (`lib/zlibrary-api.js`)
- Created: 2025-04-14 12:13:00
- Updated: 2025-04-14 12:13:00
```pseudocode
// File: lib/zlibrary-api.js
// Dependencies: ./python-bridge, path

IMPORT callPythonFunction FROM './python-bridge'
IMPORT path

ASYNC FUNCTION downloadBookToFile(args):
  // args = { bookId, outputDir, outputFilename, process_for_rag }
  LOG `Downloading book ${args.bookId}, process_for_rag=${args.process_for_rag}`
  pythonArgs = {
    book_id: args.bookId,
    output_dir: args.outputDir,
    output_filename: args.outputFilename,
    process_for_rag: args.process_for_rag
  }
  TRY
    resultJson = AWAIT callPythonFunction('download_book', pythonArgs)
    IF NOT resultJson OR NOT resultJson.file_path THEN
      THROW Error("Invalid response from Python bridge during download.")
    ENDIF
    response = { file_path: resultJson.file_path }
    IF args.process_for_rag AND resultJson.processed_text IS NOT NULL THEN
      response.processed_text = resultJson.processed_text
    ELSE IF args.process_for_rag AND resultJson.processed_text IS NULL THEN
      LOG `Warning: process_for_rag was true but Python bridge did not return processed_text for ${resultJson.file_path}`
    ENDIF
    RETURN response
  CATCH error
    LOG `Error in downloadBookToFile: ${error.message}`
    THROW Error(`Failed to download/process book ${args.bookId}: ${error.message}`)
  ENDTRY
END FUNCTION

ASYNC FUNCTION processDocumentForRag(args):
  // args = { file_path }
  LOG `Processing document for RAG: ${args.file_path}`
  absolutePath = path.resolve(args.file_path)
  pythonArgs = { file_path: absolutePath }
  TRY
    resultJson = AWAIT callPythonFunction('process_document', pythonArgs)
    IF NOT resultJson OR resultJson.processed_text IS NULL THEN
      THROW Error("Invalid response from Python bridge during processing. Missing processed_text.")
    ENDIF
    RETURN { processed_text: resultJson.processed_text }
  CATCH error
    LOG `Error in processDocumentForRag: ${error.message}`
    THROW Error(`Failed to process document ${args.file_path}: ${error.message}`)
  ENDTRY
END FUNCTION

EXPORT { downloadBookToFile, processDocumentForRag /*, ... */ }
```
#### TDD Anchors:
- Test case 1: `downloadBookToFile` passes `process_for_rag` flag correctly.
- Test case 2: `downloadBookToFile` handles response with/without `processed_text`.
- Test case 3: `downloadBookToFile` handles Python errors.
- Test case 4: `processDocumentForRag` passes `file_path` correctly.
- Test case 5: `processDocumentForRag` handles successful response.
- Test case 6: `processDocumentForRag` handles Python errors.

### Pseudocode: Python Bridge (`lib/python-bridge.py`)
- Created: 2025-04-14 12:13:00
- Updated: 2025-04-14 12:13:00
```python
# File: lib/python-bridge.py
# Dependencies: zlibrary, ebooklib, beautifulsoup4, lxml
# Standard Libs: json, sys, os, argparse, logging
import json, sys, os, argparse, logging
from zlibrary import ZLibrary
try:
    import ebooklib
    from ebooklib import epub
    from bs4 import BeautifulSoup
    EBOOKLIB_AVAILABLE = True
except ImportError:
    EBOOKLIB_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
SUPPORTED_FORMATS = ['.epub', '.txt']

# --- Helper Functions ---
def _html_to_text(html_content):
    soup = BeautifulSoup(html_content, 'lxml') # Use lxml
    for script_or_style in soup(["script", "style"]):
        script_or_style.decompose()
    lines = (line.strip() for line in soup.get_text().splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = '\n'.join(chunk for chunk in chunks if chunk)
    return text

def _process_epub(file_path):
    if not EBOOKLIB_AVAILABLE:
        raise ImportError("Required library 'ebooklib' is not installed.")
    logging.info(f"Processing EPUB: {file_path}")
    book = epub.read_epub(file_path)
    all_text = []
    items = book.get_items_of_type(ebooklib.ITEM_DOCUMENT)
    for item in items:
        content = item.get_content()
        if content:
            try:
                html_content = content.decode('utf-8', errors='ignore')
                text = _html_to_text(html_content)
                if text:
                    all_text.append(text)
            except Exception as e:
                logging.warning(f"Could not process item {item.get_name()} in {file_path}: {e}")
    full_text = "\n\n".join(all_text)
    logging.info(f"Finished EPUB: {file_path}. Length: {len(full_text)}")
    return full_text

def _process_txt(file_path):
    logging.info(f"Processing TXT: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        logging.info(f"Finished TXT: {file_path}. Length: {len(text)}")
        return text
    except UnicodeDecodeError:
        logging.warning(f"UTF-8 failed for {file_path}. Trying 'latin-1'.")
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                text = f.read()
            logging.info(f"Finished TXT (latin-1): {file_path}. Length: {len(text)}")
            return text
        except Exception as e:
            logging.error(f"Failed reading {file_path} with latin-1: {e}")
            raise
    except Exception as e:
        logging.error(f"Failed reading {file_path}: {e}")
        raise

# --- Core Functions ---
def process_document(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    if ext == '.epub':
        return _process_epub(file_path)
    elif ext == '.txt':
        return _process_txt(file_path)
    else:
        raise ValueError(f"Unsupported format: {ext}. Supported: {SUPPORTED_FORMATS}")

def download_book(book_id, output_dir=None, output_filename=None, process_for_rag=False):
    zl = ZLibrary()
    logging.info(f"Downloading book_id: {book_id}")
    download_result_path = zl.download_book(
        book_id=book_id,
        output_dir=output_dir,
        output_filename=output_filename
    )
    if not download_result_path or not os.path.exists(download_result_path):
        raise RuntimeError(f"Download failed for book_id: {book_id}")
    logging.info(f"Downloaded to: {download_result_path}")
    result = {"file_path": download_result_path}
    if process_for_rag:
        logging.info(f"Processing for RAG: {download_result_path}")
        try:
            processed_text = process_document(download_result_path)
            result["processed_text"] = processed_text
        except Exception as e:
            logging.error(f"Processing failed after download for {download_result_path}: {e}")
            result["processed_text"] = None
    return result

# --- Main Execution ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('function_name', type=str)
    parser.add_argument('json_args', type=str)
    cli_args = parser.parse_args()
    try:
        args_dict = json.loads(cli_args.json_args)
        if cli_args.function_name == 'download_book':
            book_id = args_dict.get('book_id')
            if not book_id: raise ValueError("Missing 'book_id'")
            response = download_book(
                book_id,
                args_dict.get('output_dir'),
                args_dict.get('output_filename'),
                args_dict.get('process_for_rag', False)
            )
        elif cli_args.function_name == 'process_document':
            file_path = args_dict.get('file_path')
            if not file_path: raise ValueError("Missing 'file_path'")
            processed_text = process_document(file_path)
            response = {"processed_text": processed_text}
        else:
            raise ValueError(f"Unknown function: {cli_args.function_name}")
        print(json.dumps(response))
        sys.stdout.flush()
    except Exception as e:
        logging.exception("Python bridge error")
        error_response = {"error": type(e).__name__, "message": str(e)}
        print(json.dumps(error_response))
        sys.stdout.flush()
        sys.exit(1)
```
#### TDD Anchors:
- Test case 1: `download_book` with `process=False` returns only path.
- Test case 2: `download_book` with `process=True` calls `process_document`.
- Test case 3: `download_book` with `process=True` returns path and text (success).
- Test case 4: `download_book` with `process=True` returns path and None text (processing failure).
- Test case 5: `process_document` routes EPUB/TXT correctly.
- Test case 6: `process_document` handles FileNotFoundError.
- Test case 7: `process_document` handles unsupported format ValueError.
- Test case 8: `_process_epub` extracts text from sample EPUB.
- Test case 9: `_process_epub` handles ImportError if libs missing.
- Test case 10: `_process_epub` handles parsing errors.
- Test case 11: `_process_txt` reads UTF-8 file.
- Test case 12: `_process_txt` reads Latin-1 file (fallback).
- Test case 13: `_process_txt` handles read errors.
- Test case 14: Main execution block parses args, calls functions, returns JSON (success/error).

### Pseudocode: Venv Manager Update (`lib/venv-manager.js` Snippet)
- Created: 2025-04-14 12:13:00
- Updated: 2025-04-14 12:13:00
```pseudocode
// File: lib/venv-manager.js (Conceptual Snippet)
// ... other imports ...
IMPORT path from 'path'
IMPORT fs from 'fs'

FUNCTION installDependencies(venvDirPath):
  pipPath = getPlatformPipPath(venvDirPath)
  // Assumes requirements.txt is in the project root
  requirementsPath = path.resolve(__dirname, '..', 'requirements.txt')

  IF NOT fs.existsSync(requirementsPath):
      LOG "requirements.txt not found at ${requirementsPath}, skipping dependency installation."
      RETURN
  ENDIF

  LOG "Installing/updating dependencies from requirements.txt using: " + pipPath
  // Use '-r' flag to install from requirements file
  // Add '--upgrade' to ensure existing packages are updated if needed
  command = `"${pipPath}" install --upgrade -r "${requirementsPath}"`
  TRY
    EXECUTE command synchronously // Consider adding output logging
    LOG "Dependencies installed/updated successfully."
  CATCH error
    THROW Error("Failed to install Python dependencies from requirements.txt: " + error.message)
  ENDTRY
END FUNCTION
```
#### TDD Anchors:
- Test case 1: `installDependencies` correctly finds `requirements.txt`.
- Test case 2: `installDependencies` skips if `requirements.txt` is missing.
- Test case 3: `installDependencies` executes pip install command with `-r` and `--upgrade` flags.
- Test case 4: `installDependencies` handles errors during pip execution.

### Pseudocode: VenvManager - Core Logic
- Created: 2025-04-14 03:31:01
- Updated: 2025-04-14 03:31:01
```pseudocode
// File: lib/venv-manager.js
// Dependencies: env-paths, fs, path, child_process

CONSTANT VENV_DIR_NAME = "venv"
CONSTANT CONFIG_FILE_NAME = "venv_config.json"
CONSTANT PYTHON_DEPENDENCY = "zlibrary" // Add version if needed: "zlibrary==1.0.0"

FUNCTION getPythonPath():
  // Main function called by external modules (e.g., zlibrary-api.js)
  // Ensures venv is ready and returns the path to the venv's Python executable.
  TRY
    CALL ensureVenvReady()
    config = READ parseJsonFile(getConfigPath())
    IF config.pythonPath EXISTS AND isExecutable(config.pythonPath) THEN
      RETURN config.pythonPath
    ELSE
      THROW Error("Managed Python environment is configured but invalid.")
    ENDIF
  CATCH error
    LOG error
    THROW Error("Failed to get managed Python environment path: " + error.message)
  ENDTRY
END FUNCTION

FUNCTION ensureVenvReady():
  // Checks if venv is set up; creates/repairs if necessary.
  configPath = getConfigPath()
  venvDir = getVenvDir()

  IF fileExists(configPath) THEN
    config = READ parseJsonFile(configPath)
    IF config.pythonPath EXISTS AND isExecutable(config.pythonPath) THEN
      LOG "Managed Python environment found and valid."
      RETURN // Already ready
    ELSE
      LOG "Managed Python config found but invalid. Attempting repair..."
      // Proceed to setup/repair steps below
    ENDIF
  ELSE
      LOG "Managed Python config not found. Starting setup..."
      // Proceed to setup steps below
  ENDIF

  // Setup/Repair Steps
  IF NOT directoryExists(venvDir) THEN
      LOG "Creating venv directory..."
      pythonExe = CALL findPythonExecutable() // Throws if not found
      CALL createVenv(pythonExe, venvDir) // Throws on failure
  ELSE
      LOG "Venv directory exists."
  ENDIF

  // Always try to install/update dependencies in case venv exists but is incomplete
  LOG "Ensuring dependencies are installed..."
  CALL installDependencies(venvDir) // Throws on failure

  LOG "Saving venv configuration..."
  pythonVenvPath = getPlatformPythonPath(venvDir)
  IF NOT isExecutable(pythonVenvPath) THEN
      THROW Error("Venv Python executable not found or not executable after setup: " + pythonVenvPath)
  ENDIF
  CALL saveVenvConfig(configPath, pythonVenvPath) // Throws on failure

  LOG "Managed Python environment setup complete."
END FUNCTION

FUNCTION findPythonExecutable():
  // Finds a suitable Python 3 executable.
  // Uses a library or custom logic (e.g., check PATH for python3, python).
  // Return path to executable or throw error if not found.
  LOG "Searching for Python 3 executable..."
  // ... implementation using find-python-script or similar ...
  IF foundPath THEN
    LOG "Found Python 3 at: " + foundPath
    RETURN foundPath
  ELSE
    THROW Error("Python 3 installation not found. Please install Python 3 and ensure it's in your PATH.")
  ENDIF
END FUNCTION

FUNCTION createVenv(pythonExePath, venvDirPath):
  // Creates the virtual environment.
  LOG "Creating Python virtual environment at: " + venvDirPath
  command = `"${pythonExePath}" -m venv "${venvDirPath}"`
  TRY
    EXECUTE command synchronously // Use child_process.execSync or async equivalent
    LOG "Venv created successfully."
  CATCH error
    THROW Error("Failed to create Python virtual environment: " + error.message)
  ENDTRY
END FUNCTION

FUNCTION installDependencies(venvDirPath):
  // Installs Python dependencies using the venv's pip.
  pipPath = getPlatformPipPath(venvDirPath)
  IF NOT isExecutable(pipPath) THEN
      THROW Error("Venv pip executable not found or not executable: " + pipPath)
  ENDIF

  LOG "Installing dependencies using: " + pipPath
  command = `"${pipPath}" install ${PYTHON_DEPENDENCY}`
  TRY
    EXECUTE command synchronously // Use child_process.execSync or async equivalent
    LOG "Dependencies installed successfully."
  CATCH error
    THROW Error("Failed to install Python dependencies: " + error.message)
  ENDTRY
END FUNCTION

FUNCTION saveVenvConfig(configFilePath, pythonVenvPath):
  // Saves the venv Python path to the config file.
  configData = { pythonPath: pythonVenvPath }
  TRY
    WRITE JSON.stringify(configData) TO configFilePath
    LOG "Venv configuration saved to: " + configFilePath
  CATCH error
    THROW Error("Failed to write venv config file: " + error.message)
  ENDTRY
END FUNCTION

// --- Helper Functions ---

FUNCTION getConfigPath():
  paths = CALL envPaths('zlibrary-mcp', { suffix: '' })
  RETURN path.join(paths.cache, CONFIG_FILE_NAME)
END FUNCTION

FUNCTION getVenvDir():
  paths = CALL envPaths('zlibrary-mcp', { suffix: '' })
  RETURN path.join(paths.cache, VENV_DIR_NAME)
END FUNCTION

FUNCTION getPlatformPipPath(venvDirPath):
  IF OS is Windows THEN
    RETURN path.join(venvDirPath, 'Scripts', 'pip.exe')
  ELSE // Assume Unix-like
    RETURN path.join(venvDirPath, 'bin', 'pip')
  ENDIF
END FUNCTION

FUNCTION getPlatformPythonPath(venvDirPath):
  IF OS is Windows THEN
    RETURN path.join(venvDirPath, 'Scripts', 'python.exe')
  ELSE // Assume Unix-like
    RETURN path.join(venvDirPath, 'bin', 'python')
  ENDIF
END FUNCTION

FUNCTION isExecutable(filePath):
  // Checks if a file exists and is executable (using fs.accessSync or similar).
  TRY
    CALL fs.accessSync(filePath, fs.constants.X_OK)
    RETURN TRUE
  CATCH error
    RETURN FALSE
  ENDTRY
END FUNCTION

FUNCTION parseJsonFile(filePath):
  // Reads and parses a JSON file. Handles errors.
  TRY
    content = READ fs.readFileSync(filePath, 'utf8')
    RETURN JSON.parse(content)
  CATCH error
    LOG "Error reading/parsing JSON file: " + filePath + " - " + error.message
    RETURN {} // Return empty object on error
  ENDTRY
END FUNCTION

// ... other helpers like fileExists, directoryExists as needed ...
```
#### TDD Anchors:
- Test case 1: Python 3 detection (found/not found/error)
- Test case 2: Venv creation (success/failure)
- Test case 3: Dependency installation (success/failure)
- Test case 4: Config path generation and file I/O (read/write/error)
- Test case 5: Full `ensureVenvReady` lifecycle (initial setup, valid existing, repair invalid)
- Test case 6: `getPythonPath` returns correct path or throws error

### Pseudocode: ZLibraryAPI - Integration
- Created: 2025-04-14 03:31:01
- Updated: 2025-04-14 03:31:01
```pseudocode
// File: lib/zlibrary-api.js (Relevant Snippet)
// Dependencies: python-shell, ./venv-manager

IMPORT { PythonShell } from 'python-shell'
IMPORT venvManager from './venv-manager' // Or adjust path
IMPORT path from 'path'

ASYNC FUNCTION searchZlibrary(query):
  TRY
    // 1. Get the Python path from the venv manager
    pythonPath = AWAIT venvManager.getPythonPath() // Ensures venv is ready

    // 2. Define PythonShell options using the retrieved path
    options = {
      mode: 'text',
      pythonPath: pythonPath, // CRITICAL: Use the managed venv path
      pythonOptions: ['-u'],
      scriptPath: path.dirname(require.resolve('zlibrary/search')), // Adjust if needed
      args: [query]
    }

    // 3. Create and run PythonShell
    pyshell = new PythonShell('search', options) // Assuming 'search.py' is the script

    // ... (rest of the existing promise-based handling for pyshell.on('message'), .end(), .on('error')) ...

  CATCH error
    LOG "Error during Zlibrary search: " + error.message
    THROW error // Re-throw or handle appropriately
  ENDTRY
END FUNCTION
```
#### TDD Anchors:
- Test case 1: `venvManager.getPythonPath` is called before `PythonShell`
- Test case 2: `PythonShell` options include the correct `pythonPath`
- Test case 3: Errors from `getPythonPath` are handled

