# Specification: PDF Processing Implementation for RAG Pipeline

**Date:** 2025-04-14
**Version:** 1.0
**Related Architecture:** `docs/architecture/pdf-processing-integration.md`

## 1. Overview

This document provides the detailed specification and pseudocode for implementing PDF processing capabilities within the `zlibrary-mcp` server's RAG pipeline, based on the approved architecture. The implementation leverages the `PyMuPDF (fitz)` library within the existing Python bridge (`lib/python-bridge.py`).

## 2. Affected Components

*   **`lib/python-bridge.py`:** Requires modification to handle PDF files and addition of a new helper function.
*   **`requirements.txt`:** Requires addition of the `PyMuPDF` dependency.
*   **`lib/venv-manager.js`:** No changes required, but its functionality is relied upon.

## 3. Specification Details

### 3.1. `lib/python-bridge.py`

*   **Import:** Add `import fitz` at the beginning of the file.
*   **New Helper Function (`_process_pdf`):**
    *   Implement a function `_process_pdf(file_path: str) -> str`.
    *   This function will use `fitz.open()` to open the PDF specified by `file_path`.
    *   **Error Handling:**
        *   Immediately after opening, check `doc.is_encrypted`. If true, raise `ValueError("PDF is encrypted")`.
        *   Wrap `fitz.open()` and page processing loops in `try...except` blocks to catch potential `fitz.Exception` or other exceptions indicating corruption or processing issues. Raise `RuntimeError("Error opening or processing PDF: [details]")` on failure.
        *   Iterate through all pages using `doc.load_page(page_num)`.
        *   Extract text from each page using `page.get_text("text")`.
        *   Aggregate non-empty text extracted from all pages.
        *   After processing all pages, check if the aggregated text is empty or whitespace-only. If so, raise `ValueError("PDF contains no extractable text layer (possibly image-based)")`.
    *   **Return Value:** Return the concatenated, cleaned plain text content as a single string.
    *   Ensure the `fitz` document object is closed (`doc.close()`) using a `finally` block or context manager if applicable.
*   **`process_document` Function Modification:**
    *   Locate the existing `if/elif` block checking file extensions (`ext`).
    *   Add a new condition: `elif ext == '.pdf': processed_text = _process_pdf(file_path_str)`.
    *   Ensure the `SUPPORTED_FORMATS` list (if used) is updated to include `.pdf`.

### 3.2. `requirements.txt`

*   Add the following line to the file:
    ```
    PyMuPDF
    ```

### 3.3. `lib/venv-manager.js`

*   No functional changes are required. The existing logic in `installDependencies` which uses `pip install -r requirements.txt` will automatically pick up and install `PyMuPDF` when the virtual environment is created or updated.

## 4. Pseudocode

### 4.1. `lib/python-bridge.py` - New `_process_pdf` Function

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
        ImportError: If fitz (PyMuPDF) is not installed.
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

### 4.2. `lib/python-bridge.py` - `process_document` Modification

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
            processed_text = _process_pdf(file_path_str) # <-- Call new function
        else:
            # Use the updated SUPPORTED_FORMATS list in the error message
            raise ValueError(f"Unsupported file format: {ext}. Supported: {SUPPORTED_FORMATS}")

        if processed_text is None:
             # This case might occur if a processing function returns None instead of raising error
             raise RuntimeError(f"Processing function returned None for {file_path_str}")

        return processed_text

    except ImportError as imp_err:
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

## 5. TDD Anchors

The following test cases should be implemented to ensure the functionality and robustness of the PDF processing integration:

1.  **Successful Extraction:** Test `_process_pdf` with a standard, unencrypted PDF containing text. Verify the extracted text matches expected content.
2.  **Encrypted PDF:** Test `_process_pdf` with an encrypted PDF. Verify it raises `ValueError("PDF is encrypted")`.
3.  **Corrupted PDF:** Test `_process_pdf` with a corrupted/malformed PDF file. Verify it raises `RuntimeError` indicating processing failure.
4.  **Image-Based PDF:** Test `_process_pdf` with a PDF containing only images (no text layer). Verify it raises `ValueError("PDF contains no extractable text layer...")`.
5.  **Empty PDF:** Test `_process_pdf` with a valid but empty PDF. Verify it raises `ValueError("PDF contains no extractable text layer...")`.
6.  **`process_document` Routing:** Test `process_document` with a `.pdf` file path. Verify it correctly calls `_process_pdf`.
7.  **`process_document` Error Propagation:** Test `process_document` with a PDF that causes `_process_pdf` to raise an error (e.g., encrypted). Verify the error is correctly propagated or wrapped.
8.  **Dependency Installation:** Test the `venv-manager.js` setup process. After setup, verify that `import fitz` succeeds within a test Python script executed using the managed venv's Python interpreter.
9.  **File Not Found:** Test `_process_pdf` and `process_document` with a non-existent file path. Verify `FileNotFoundError` is raised.
10. **Import Error:** Test `_process_pdf` in an environment where `fitz` is not installed (mocking might be needed). Verify `ImportError` or a `RuntimeError` wrapping it is raised appropriately.

## 6. Modularity

The pseudocode maintains modularity:
*   PDF-specific logic is encapsulated within `_process_pdf`.
*   The `process_document` function acts as a router based on file type.
*   Each function has a clear responsibility.
*   The provided pseudocode for `_process_pdf` is well under the 500-line guideline.