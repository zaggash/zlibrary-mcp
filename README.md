# Z-Library MCP Server

This Model Context Protocol (MCP) server provides access to Z-Library for AI coding assistants like RooCode and Cline for VSCode.

## Features

- Search for books by title, author, year, language, and format
- Get detailed book information
- Get download links for books
- Full-text search within book contents
- View download history and limits

## Prerequisites

- Node.js 14+
- Python 3.7+
- Z-Library Python client installed (`pip install zlibrary`)

## Installation

```bash
# Clone this repository
git clone https://github.com/yourusername/zlibrary-mcp.git
cd zlibrary-mcp

# Install dependencies
npm install

# Set environment variables for Z-Library credentials
export ZLIBRARY_EMAIL="your-email@example.com"
export ZLIBRARY_PASSWORD="your-password"
```

Install the package globally to use as an MCP server:

```bash
npm install -g zlibrary-mcp
```

Or add it to your RooCode MCP configuration:

```json
{
  "mcpServers": {
    "zlibrary": {
      "command": "npx",
      "args": [
        "-y",
        "zlibrary-mcp"
      ],
      "env": {
        "ZLIBRARY_EMAIL": "your-email@example.com",
        "ZLIBRARY_PASSWORD": "your-password",
        "PYTHONPATH": "/path/to/your/venv/lib/python3.x/site-packages",
        "OPENSSL_CONF": "/etc/ssl/openssl.cnf",
        "NODE_EXTRA_CA_CERTS": "/etc/ssl/certs/ca-certificates.crt"
      },
      "alwaysAllow": [
        "search_books",
        "get_book_by_id"
      ]
    }
  }
}
```

## Python Virtual Environment Setup

This project requires a Python virtual environment with the Z-Library package installed:

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install zlibrary

# When you're done
deactivate
