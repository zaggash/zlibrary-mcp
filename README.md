# zlibrary-MCP Server

A Model Context Protocol (MCP) server for interacting with the zlibrary API to search and download books.

## Overview

This project provides a Node.js server that interfaces with the zlibrary service through a Python bridge. It offers endpoints for searching books and retrieving download links.

## Prerequisites

- Node.js (v14 or higher)
- Python 3.6 or higher
- npm or yarn

## Installation

1. Clone this repository
2. Install Node.js dependencies:

```bash
npm install
```

3. Install required Python packages:

```bash
pip install requests
```

## Usage

Start the server:

```bash
npm start
```

The server will run on port 3000 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Health Check

```
GET /health
```

Returns a simple status message to confirm the service is running.

### Search Books

```
POST /api/search
```

Request body:
```json
{
  "query": "book title or author name"
}
```

### Get Download Link

```
POST /api/download
```

Request body:
```json
{
  "bookId": "book123"
}
```

## Notes

- This project is for educational purposes only.
- The zlibrary domain may change periodically, so you might need to update the base URL in python-bridge.py.
- Respect copyright laws and terms of service in your jurisdiction.

## License

MIT