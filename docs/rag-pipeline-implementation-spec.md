# RAG Document Processing Pipeline: Implementation Specification

**Version:** 1.0
**Date:** 2025-04-14

## 1. Overview

This document details the implementation specifics for the RAG (Retrieval-Augmented Generation) document processing pipeline within the `zlibrary-mcp` server. It covers the necessary changes to MCP tools, Node.js handlers, and the Python bridge to enable downloading and processing of EPUB and TXT files for RAG workflows.

Refer to the [RAG Pipeline Architecture](./architecture/rag-pipeline.md) document for the high-level design and data flow.

## 2. MCP Tool Definitions

### 2.1. `download_book_to_file` (Updated)

*   **Description:** Downloads a book file from Z-Library and optionally processes its content for RAG.
*   **Input Schema (Zod):**
    ```typescript
    import { z } from 'zod';

    const DownloadBookToFileInputSchema = z.object({
      bookId: z.string().describe("The Z-Library book ID"),
      outputDir: z.string().optional().describe("Directory to save the file (relative to project root or absolute)"),
      outputFilename: z.string().optional().describe("Desired filename (extension will be added automatically)"),
      process_for_rag: z.boolean().optional().default(false).describe("If true, process content for RAG and return text") // New field
    });
    ```
*   **Output Schema (Zod):**
    ```typescript
    // Output depends on the 'process_for_rag' flag
    const DownloadBookToFileOutputSchema = z.object({
        file_path: z.string().describe("The absolute path to the downloaded file"),
        processed_text: z.string().optional().describe("The extracted plain text content (only if process_for_rag was true)") // New optional field
    });
    ```

### 2.2. `process_document_for_rag` (New)

*   **Description:** Processes an existing local document file (EPUB, TXT) to extract plain text content for RAG.
*   **Input Schema (Zod):**
    ```typescript
    import { z } from 'zod';

    const ProcessDocumentForRagInputSchema = z.object({
      file_path: z.string().describe("The absolute path to the document file to process")
    });
    ```
*   **Output Schema (Zod):**
    ```typescript
    const ProcessDocumentForRagOutputSchema = z.object({
      processed_text: z.string().describe("The extracted plain text content")
    });
    ```

## 3. Tool Registration (`index.js`)

The tools are registered within `index.js` using the MCP SDK v1.8.0 pattern. Handlers map tool names to implementation functions in `lib/zlibrary-api.js` and use the Zod schemas for validation.

```javascript
// File: index.js (Conceptual Snippet)
// ... imports (Server, StdioServerTransport, z, zlibraryApi, schemas) ...

// Assume schemas are defined or imported from e.g., './lib/schemas'
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
        // Optional: DownloadBookToFileOutputSchema.parse(result);
        return result;
      }
      if (request.tool_name === 'process_document_for_rag') { // New
        const validatedArgs = ProcessDocumentForRagInputSchema.parse(request.arguments);
        const result = await zlibraryApi.processDocumentForRag(validatedArgs);
        // Optional: ProcessDocumentForRagOutputSchema.parse(result);
        return result;
      }
      throw new Error(`Tool not found: ${request.tool_name}`);
    },
  },
});

// ... transport setup and server.connect() ...
```

## 4. Node.js Handlers (`lib/zlibrary-api.js`)

This module contains the JavaScript functions that orchestrate calls to the Python bridge.

```pseudocode
// File: lib/zlibrary-api.js
// Dependencies: ./python-bridge, path

IMPORT callPythonFunction FROM './python-bridge' // Assumes this handles calling Python and parsing JSON response/error
IMPORT path

// --- Updated Function ---

ASYNC FUNCTION downloadBookToFile(args):
  // args = { bookId, outputDir, outputFilename, process_for_rag }
  LOG `Downloading book ${args.bookId}, process_for_rag=${args.process_for_rag}`

  // Prepare arguments for Python script
  pythonArgs = {
    book_id: args.bookId,
    output_dir: args.outputDir,
    output_filename: args.outputFilename,
    process_for_rag: args.process_for_rag // Pass the flag
  }

  TRY
    // Call the Python bridge function
    resultJson = AWAIT callPythonFunction('download_book', pythonArgs)

    // Basic validation of Python response (callPythonFunction might do more)
    IF NOT resultJson OR NOT resultJson.file_path THEN
      THROW Error("Invalid response from Python bridge during download.")
    ENDIF

    // Construct the response object based on the schema
    response = {
      file_path: resultJson.file_path
    }
    // Include processed_text only if requested and successfully returned
    IF args.process_for_rag AND resultJson.processed_text IS NOT NULL THEN
      response.processed_text = resultJson.processed_text
    ELSE IF args.process_for_rag AND resultJson.processed_text IS NULL THEN
      // Log a warning if processing was requested but failed in Python
      LOG `Warning: process_for_rag was true but Python bridge did not return processed_text for ${resultJson.file_path}`
    ENDIF

    RETURN response

  CATCH error
    LOG `Error in downloadBookToFile: ${error.message}`
    // Propagate a user-friendly error
    THROW Error(`Failed to download/process book ${args.bookId}: ${error.message}`)
  ENDTRY
END FUNCTION

// --- New Function ---

ASYNC FUNCTION processDocumentForRag(args):
  // args = { file_path }
  LOG `Processing document for RAG: ${args.file_path}`

  // Resolve to absolute path before sending to Python
  absolutePath = path.resolve(args.file_path)

  pythonArgs = {
    file_path: absolutePath
  }

  TRY
    // Call the new Python bridge function
    resultJson = AWAIT callPythonFunction('process_document', pythonArgs)

    // Basic validation of Python response
    IF NOT resultJson OR resultJson.processed_text IS NULL THEN
      THROW Error("Invalid response from Python bridge during processing. Missing processed_text.")
    ENDIF

    // Return the result object matching the schema
    RETURN {
      processed_text: resultJson.processed_text
    }

  CATCH error
    LOG `Error in processDocumentForRag: ${error.message}`
    // Propagate a user-friendly error
    THROW Error(`Failed to process document ${args.file_path}: ${error.message}`)
  ENDTRY
END FUNCTION

// --- Export Functions ---
EXPORT { downloadBookToFile, processDocumentForRag /*, ... other functions */ }
```

## 5. Python Bridge (`lib/python-bridge.py`)

This script handles the core logic for downloading and processing files.

```python
# File: lib/python-bridge.py
# Dependencies: zlibrary, ebooklib, beautifulsoup4, lxml
# Standard Libs: json, sys, os, argparse, logging
import json
import sys
import os
import argparse
import logging
from zlibrary import ZLibrary # Assumed installed via venv

# --- Attempt to import processing libraries ---
try:
    import ebooklib
    from ebooklib import epub
    from bs4 import BeautifulSoup
    EBOOKLIB_AVAILABLE = True
except ImportError:
    EBOOKLIB_AVAILABLE = False

# --- Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
SUPPORTED_FORMATS = ['.epub', '.txt']

# --- Helper Functions for Processing ---

def _html_to_text(html_content):
    """Extracts plain text from HTML using BeautifulSoup."""
    # Use 'lxml' for potentially better performance and handling of malformed HTML
    soup = BeautifulSoup(html_content, 'lxml')
    # Remove script and style elements
    for script_or_style in soup(["script", "style"]):
        script_or_style.decompose()
    # Get text, strip whitespace, handle multiple lines/paragraphs
    lines = (line.strip() for line in soup.get_text().splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = '\n'.join(chunk for chunk in chunks if chunk)
    return text

def _process_epub(file_path):
    """Processes an EPUB file to extract plain text."""
    if not EBOOKLIB_AVAILABLE:
        raise ImportError("Required library 'ebooklib' is not installed. Cannot process EPUB files.")

    logging.info(f"Processing EPUB file: {file_path}")
    book = epub.read_epub(file_path)
    all_text = []

    # Iterate through EPUB document items
    items = book.get_items_of_type(ebooklib.ITEM_DOCUMENT)
    for item in items:
        content = item.get_content()
        if content:
            try:
                # Decode content (UTF-8 is common)
                html_content = content.decode('utf-8', errors='ignore')
                text = _html_to_text(html_content)
                if text:
                    all_text.append(text)
            except Exception as e:
                logging.warning(f"Could not decode or process content from item {item.get_name()} in {file_path}: {e}")

    # Join text from all items with paragraph breaks
    full_text = "\n\n".join(all_text)
    logging.info(f"Finished processing EPUB: {file_path}. Extracted {len(full_text)} characters.")
    return full_text

def _process_txt(file_path):
    """Processes a TXT file, attempting UTF-8 then Latin-1 encoding."""
    logging.info(f"Processing TXT file: {file_path}")
    try:
        # Try reading as UTF-8 first
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        logging.info(f"Finished processing TXT (UTF-8): {file_path}. Extracted {len(text)} characters.")
        return text
    except UnicodeDecodeError:
        logging.warning(f"UTF-8 decoding failed for {file_path}. Trying 'latin-1'.")
        try:
            # Fallback to Latin-1
            with open(file_path, 'r', encoding='latin-1') as f:
                text = f.read()
            logging.info(f"Finished processing TXT (latin-1): {file_path}. Extracted {len(text)} characters.")
            return text
        except Exception as e:
            logging.error(f"Failed to read TXT file {file_path} even with latin-1: {e}")
            raise # Re-raise the exception after logging
    except Exception as e:
        logging.error(f"Failed to read TXT file {file_path}: {e}")
        raise # Re-raise other file reading errors

# --- Core Bridge Functions ---

def process_document(file_path):
    """
    Detects file type and calls the appropriate processing function.
    Returns the extracted plain text.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    _, ext = os.path.splitext(file_path)
    ext = ext.lower()

    if ext == '.epub':
        return _process_epub(file_path)
    elif ext == '.txt':
        return _process_txt(file_path)
    else:
        # Raise error for unsupported formats
        raise ValueError(f"Unsupported file format: {ext}. Supported formats: {SUPPORTED_FORMATS}")

def download_book(book_id, output_dir=None, output_filename=None, process_for_rag=False):
    """
    Downloads a book using the zlibrary lib and optionally processes it.
    Returns a dictionary containing file_path and optionally processed_text.
    """
    # Initialize ZLibrary client (adjust based on actual library usage)
    zl = ZLibrary()

    logging.info(f"Attempting download for book_id: {book_id}")
    # Perform the download
    download_result_path = zl.download_book(
        book_id=book_id,
        output_dir=output_dir,
        output_filename=output_filename
    )

    if not download_result_path or not os.path.exists(download_result_path):
        raise RuntimeError(f"Download failed or file not found for book_id: {book_id}")

    logging.info(f"Book downloaded successfully to: {download_result_path}")

    result = {"file_path": download_result_path}

    # Process immediately if requested
    if process_for_rag:
        logging.info(f"Processing downloaded file for RAG: {download_result_path}")
        try:
            processed_text = process_document(download_result_path)
            result["processed_text"] = processed_text
        except Exception as e:
            # Log processing errors but don't fail the download result
            logging.error(f"Failed to process document after download for {download_result_path}: {e}")
            result["processed_text"] = None # Indicate processing failure

    return result

# --- Main Execution Block (Handles calls from Node.js) ---

if __name__ == "__main__":
    # Setup argument parser for command-line invocation
    parser = argparse.ArgumentParser(description='Z-Library MCP Python Bridge')
    parser.add_argument('function_name', type=str, help='Name of the function to call (e.g., download_book, process_document)')
    parser.add_argument('json_args', type=str, help='JSON string containing function arguments')

    cli_args = parser.parse_args()

    try:
        # Parse JSON arguments passed from Node.js
        args_dict = json.loads(cli_args.json_args)

        # Route to the appropriate function based on function_name
        if cli_args.function_name == 'download_book':
            book_id = args_dict.get('book_id')
            if not book_id:
                 raise ValueError("Missing required argument 'book_id' for download_book")
            response = download_book(
                book_id,
                args_dict.get('output_dir'),
                args_dict.get('output_filename'),
                args_dict.get('process_for_rag', False) # Default to False
            )
        elif cli_args.function_name == 'process_document':
            file_path = args_dict.get('file_path')
            if not file_path:
                 raise ValueError("Missing required argument 'file_path' for process_document")
            processed_text = process_document(file_path)
            response = {"processed_text": processed_text}
        # Add handlers for other Python functions if needed
        # elif cli_args.function_name == 'search_books': ...
        else:
            raise ValueError(f"Unknown function name: {cli_args.function_name}")

        # Print the successful JSON response to stdout for Node.js
        print(json.dumps(response))
        sys.stdout.flush()

    except Exception as e:
        # Log the full error traceback to stderr (for debugging)
        logging.exception("Python bridge encountered an error")
```

## 6. Python Dependency Management

The RAG processing requires additional Python libraries. These must be managed within the project's virtual environment.

1.  **Required Libraries:**
    *   `ebooklib`: For parsing EPUB files.
    *   `beautifulsoup4`: For cleaning HTML content extracted from EPUBs.
    *   `lxml`: Recommended HTML parser for `beautifulsoup4`.

2.  **Update `requirements.txt`:** Add these libraries to `requirements.txt` (create the file in the project root if it doesn't exist):
    ```text
    # requirements.txt
    zlibrary # Or the specific version used
    ebooklib
    beautifulsoup4
    lxml
    ```

3.  **Update `lib/venv-manager.js`:** The `installDependencies` function within the virtual environment manager needs to install packages from `requirements.txt`.

    ```pseudocode
    // File: lib/venv-manager.js (Conceptual Snippet for installDependencies)

    FUNCTION installDependencies(venvDirPath):
      pipPath = getPlatformPipPath(venvDirPath) // Get path to venv pip
      // Resolve path to requirements.txt relative to project root
      requirementsPath = path.resolve(__dirname, '..', 'requirements.txt')

      IF NOT fs.existsSync(requirementsPath):
          LOG `requirements.txt not found at ${requirementsPath}, skipping dependency installation.`
          RETURN
      ENDIF

      LOG `Installing/updating dependencies from requirements.txt using: ${pipPath}`
      // Use '-r' to install from file and '--upgrade' to update existing
      command = `"${pipPath}" install --upgrade -r "${requirementsPath}"`
      TRY
        // Execute the pip command synchronously
        EXECUTE command synchronously // e.g., using child_process.execSync
        LOG "Dependencies installed/updated successfully."
      CATCH error
        // Throw a detailed error if installation fails
        THROW Error(`Failed to install Python dependencies from requirements.txt: ${error.message}`)
      ENDTRY
    END FUNCTION
    ```

    Ensure the `ensureVenvReady` function (or equivalent setup logic) calls `installDependencies` to apply these changes when the server starts or the environment is checked.

## 7. TDD Anchors

This section outlines key areas for Test-Driven Development to ensure the robustness of the implementation.

1.  **Tool Schemas (`index.js` / `lib/schemas.js`):**
    *   Verify `DownloadBookToFileInputSchema` accepts `process_for_rag` (optional boolean).
    *   Verify `DownloadBookToFileOutputSchema` includes optional `processed_text`.
    *   Verify `ProcessDocumentForRagInputSchema` requires `file_path`.
    *   Verify `ProcessDocumentForRagOutputSchema` requires `processed_text`.

2.  **Tool Registration (`index.js`):**
    *   Test that `tools/list` includes both `download_book_to_file` (updated description/schema) and `process_document_for_rag`.
    *   Test that `tools/call` correctly routes requests for both tools to the respective `zlibrary-api.js` functions.
    *   Test input validation using the Zod schemas within the `tools/call` handler.

3.  **Node.js Handlers (`lib/zlibrary-api.js`):**
    *   `downloadBookToFile`: Mock `callPythonFunction`. Test that `process_for_rag` flag is correctly passed in `pythonArgs`. Test handling of responses with and without `processed_text`. Test error handling.
    *   `processDocumentForRag`: Mock `callPythonFunction`. Test that `file_path` is correctly passed. Test handling of successful response and error response from Python.

4.  **Python Bridge - `download_book` (`lib/python-bridge.py`):**
    *   Mock the `zlibrary.download_book` call.
    *   Test case: `process_for_rag=False` -> Returns only `file_path`.
    *   Test case: `process_for_rag=True` -> Calls `process_document` internally.
    *   Test case: `process_for_rag=True` (Successful Processing) -> Returns `file_path` and `processed_text`.
    *   Test case: `process_for_rag=True` (Processing Fails) -> Returns `file_path` and `processed_text: None` (or includes error info).
    *   Test download failure handling.

5.  **Python Bridge - `process_document` (`lib/python-bridge.py`):**
    *   Test file type detection (EPUB, TXT, unsupported).
    *   Test routing to `_process_epub` and `_process_txt`.
    *   Test handling of `FileNotFoundError`.
    *   Test handling of `ValueError` for unsupported formats.

6.  **Python Bridge - `_process_epub` (`lib/python-bridge.py`):**
    *   Test with a sample EPUB file. Verify text extraction.
    *   Test HTML cleaning (`_html_to_text`).
    *   Test handling of missing `ebooklib` library (`ImportError`).
    *   Test handling of corrupted/malformed EPUBs (e.g., `epub.read_epub` error).
    *   Test handling of item decoding errors.

7.  **Python Bridge - `_process_txt` (`lib/python-bridge.py`):**
    *   Test with a sample UTF-8 TXT file.
    *   Test with a sample non-UTF-8 (e.g., latin-1) TXT file. Verify fallback works.
    *   Test handling of file read errors (permissions, etc.).

8.  **Python Bridge - Main Execution (`lib/python-bridge.py`):**
    *   Test argument parsing (`argparse`).
    *   Test routing to `download_book` and `process_document` based on `function_name`.
    *   Test JSON argument parsing.
    *   Test successful JSON output format.
    *   Test error JSON output format on exceptions.

9.  **Dependency Management (`lib/venv-manager.js`):**
    *   Test that `installDependencies` correctly reads `requirements.txt`.
    *   Test that `pip install -r requirements.txt` command is executed.
    *   Test error handling during dependency installation.

        # Print a JSON error structure to stdout for Node.js to handle gracefully
        error_response = {
            "error": type(e).__name__, # e.g., "FileNotFoundError", "ValueError"
            "message": str(e)
        }
        print(json.dumps(error_response))
        sys.stdout.flush()
        sys.exit(1) # Exit with a non-zero code to signal failure