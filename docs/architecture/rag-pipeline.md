# RAG Document Processing Pipeline Architecture

## 1. Overview

This document outlines the architecture for the Retrieval-Augmented Generation (RAG) document processing pipeline within the `zlibrary-mcp` server. The goal is to enable AI agents to download documents (initially EPUB and TXT) from Z-Library, extract their text content, and use this content for RAG workflows.

## 2. Data Flow

Two primary workflows are supported:

**Workflow 1: Combined Download & Process** (Efficient for immediate use)

1.  **Agent:** Uses `search_books` / `get_book_by_id` (existing tools) to find a document.
2.  **Agent:** Calls `download_book_to_file` (updated tool), specifying `book_id`, `download_path`, and setting `process_for_rag: true`.
3.  **Server (`zlibrary-mcp`):** Receives the request.
    *   Node.js layer calls the Python bridge.
    *   Python bridge downloads the file using `zlibrary`.
    *   Python bridge immediately processes the downloaded file (EPUB/TXT) to extract text.
    *   Python bridge returns both the `file_path` and `processed_text` to Node.js.
4.  **Server (`zlibrary-mcp`):** Returns the `file_path` and `processed_text` to the agent.
5.  **Agent:** Uses the received text for its RAG process.

**Workflow 2: Separate Download & Process** (Flexible for existing files)

1.  **Agent:** Uses `search_books` / `get_book_by_id` (existing tools).
2.  **Agent:** Calls `download_book_to_file` (updated tool), specifying `book_id` and `download_path` (leaving `process_for_rag` as `false` or omitting it).
3.  **Server (`zlibrary-mcp`):** Downloads the file via the Python bridge and returns only the `file_path` to the agent.
4.  **Agent:** (At a later time, or with an existing file) Calls `process_document_for_rag` (new tool), providing the `file_path`.
5.  **Server (`zlibrary-mcp`):** Receives the request.
    *   Node.js layer calls the Python bridge.
    *   Python bridge processes the specified file (EPUB/TXT) to extract text.
    *   Python bridge returns the `processed_text` to Node.js.
6.  **Server (`zlibrary-mcp`):** Returns the `processed_text` to the agent.
7.  **Agent:** Uses the received text for its RAG process.

## 3. Architecture Diagram

```mermaid
graph TD
    subgraph Agent Workflow
        A[Agent: Search/Select Book] --> B1(Agent: Call download_book_to_file);
        B1 -- process_for_rag=true --> C{zlibrary-mcp Server};
        C -- Result: Path & Text --> E[Agent: Use Text for RAG];

        A --> B2(Agent: Call download_book_to_file);
        B2 -- process_for_rag=false/omitted --> C;
        C -- Result: File Path --> D[Agent: Call process_document_for_rag];
        D --> C;
        C -- Result: Processed Text --> E;
    end

    subgraph "zlibrary-mcp Server (Node.js)"
        F[MCP Tool: download_book_to_file] --> G[lib/zlibrary-api.js: downloadBookToFile];
        G --> H(Python Bridge Call);
        I[MCP Tool: process_document_for_rag] --> J[lib/zlibrary-api.js: processDocumentForRag];
        J --> H;
        H -- Processed Text --> G; // Added path for combined flow
        H -- Processed Text --> J; // Existing path for separate flow
    end

    subgraph "Python Bridge (python-bridge.py in Venv)"
        K[Handle download_book] --> L[zlibrary lib: Download];
        L --> M[Save File to Disk];
        M -- If process_for_rag=true --> N[Call Handle process_document internally];
        N --> S[Return Processed Text];
        O[Handle process_document] --> P{Detect File Type};
        P -- EPUB --> Q[Use ebooklib];
        P -- TXT --> R[Read Text File];
        Q --> S;
        R --> S;
    end

    H -- download args (incl. process_flag) --> K;
    H -- process args --> O; // For separate tool call
    S -- processed text --> H;

    style Agent Workflow fill:#f9f,stroke:#333,stroke-width:2px
    style "zlibrary-mcp Server (Node.js)" fill:#ccf,stroke:#333,stroke-width:2px
    style "Python Bridge (python-bridge.py in Venv)" fill:#cfc,stroke:#333,stroke-width:2px
```

## 4. Components

*   **Node.js Layer (`index.js`, `lib/zlibrary-api.js`):** Handles MCP tool requests, orchestrates calls to the Python bridge, manages communication with the agent.
*   **Python Bridge (`lib/python-bridge.py`):** Executes Python-specific tasks: interacting with the `zlibrary` library for downloads and performing document content extraction/processing using relevant Python libraries. Runs within a managed virtual environment.

## 5. MCP Tools

### `download_book_to_file` (Updated)

*   **Description:** Downloads a specific book file from Z-Library to a local path. Optionally processes the content for RAG simultaneously.
*   **Input:** `{ "book_id": "string", "download_path": "string", "process_for_rag": "boolean (optional, default: false)" }`
*   **Output:**
    *   If `process_for_rag` is `false` or omitted: `{ "file_path": "string" }`
    *   If `process_for_rag` is `true`: `{ "file_path": "string", "processed_text": "string" }`

### `process_document_for_rag` (New)

*   **Description:** Extracts and processes text content from a previously downloaded document file (initially EPUB, TXT) for use in RAG workflows. Useful for processing existing files.
*   **Input:** `{ "file_path": "string" }` (Absolute path to the document file)
*   **Output:** `{ "processed_text": "string" }` (Extracted and processed plain text content)

## 6. Technology Choice

*   **Python:** Used for content extraction and processing within the Python bridge.
*   **Rationale:** Leverages the existing bridge infrastructure and Python's strong ecosystem of libraries for handling various document formats (e.g., `ebooklib` for EPUB). This promotes modularity and simplifies adding support for new formats (like PDF) in the future. The dual workflow approach provides both efficiency and flexibility.

## 7. Extensibility

The architecture allows for future extension:
*   **New Formats:** Add support for formats like PDF by installing necessary Python libraries (e.g., `pypdf`) and adding corresponding logic within the `process_document` function in `lib/python-bridge.py`.
*   **Processing Options:** Optional parameters could be added to `process_document_for_rag` (or potentially the combined `download_book_to_file` call) to control output format (e.g., Markdown) or chunking strategies, implemented within the Python bridge.