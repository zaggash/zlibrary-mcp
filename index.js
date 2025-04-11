const express = require('express');
const zlibraryApi = require('./lib/zlibrary-api');
const pythonBridge = require('./lib/python-bridge');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// MCP endpoint for book search
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const results = await zlibraryApi.searchBooks(query);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search books' });
  }
});

// MCP endpoint for book download
app.post('/api/download', async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }
    
    const downloadInfo = await zlibraryApi.getDownloadLink(bookId);
    res.json(downloadInfo);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to get download information' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`zlibrary MCP server running on port ${PORT}`);
});