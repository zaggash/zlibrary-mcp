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