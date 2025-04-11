# Z-Library MCP Server

This Model Context Protocol (MCP) server provides access to Z-Library for AI coding assistants like RooCode and Cline for VSCode. It allows AI assistants to search for books, retrieve metadata, and provide download links through a standardized API.

## Features

- 📚 Search for books by title, author, year, language, and format
- 📖 Get detailed book information and metadata
- 🔗 Get download links for books in various formats
- 🔍 Full-text search within book contents
- 📊 View download history and limits
- 💾 Download books directly to local file system

## Prerequisites

- Node.js 14 or newer
- Python 3.7 or newer
- Z-Library account (for authentication)

## Installation

### Global Installation

Install the package globally to use as a command-line tool:

```bash
npm install -g zlibrary-mcp
```

### Local Installation

```bash
# Clone this repository
git clone https://github.com/loganrooks/zlibrary-mcp.git
cd zlibrary-mcp

# Install dependencies
npm install

# Run the setup script to create Python virtual environment
./setup_venv.sh
```

## Configuration

The server requires Z-Library credentials to function. Set these as environment variables:

```bash
export ZLIBRARY_EMAIL="your-email@example.com"
export ZLIBRARY_PASSWORD="your-password"
```

## Usage

### Starting the Server

After installing globally:

```bash
zlibrary-mcp
```

From local repository:

```bash
npm start
```

The server will start on port 3000 by default.

### Integration with RooCode

Add it to your RooCode MCP configuration:

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

### Integration with Cline for VSCode

Add the following to your Cline settings:

```json
{
  "cline.modelContextProtocolServers": [
    {
      "name": "zlibrary",
      "command": "zlibrary-mcp",
      "env": {
        "ZLIBRARY_EMAIL": "your-email@example.com",
        "ZLIBRARY_PASSWORD": "your-password"
      }
    }
  ]
}
```

## Available Tools

- `search_books` - Search for books by title, author, etc.
- `get_book_by_id` - Get detailed information about a specific book
- `get_download_info` - Get download information including URLs
- `full_text_search` - Search for text within book contents
- `get_download_history` - View user's download history
- `get_download_limits` - Check current download limits
- `get_recent_books` - Get recently added books
- `download_book_to_file` - Download a book directly to a file

## Python Environment Setup

If you need to manually set up the Python environment:

```bash
# Create a virtual environment
python3 -m venv .venv

# Activate the environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Z-Library package
pip install zlibrary

# When you're done
deactivate
```

## Development

### Running Tests

```bash
npm test
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is provided for educational and research purposes only. Users are responsible for complying with all applicable laws and regulations regarding the downloading and use of copyrighted materials.
