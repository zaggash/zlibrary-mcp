#!/usr/bin/env node

const { createServer } = require('@modelcontextprotocol/sdk');
const { ensureZLibraryInstalled } = require('./lib/python-env');
const { 
  searchBooks, 
  getBookById, 
  getDownloadInfo,
  fullTextSearch,
  getDownloadHistory,
  getDownloadLimits,
  getRecentBooks,
  downloadBookToFile
} = require('./lib/zlibrary-api');

// Store registered tools for testing purposes
const registeredTools = [];

// Tool handler implementations - exported for testing
const handlers = {
  searchBooks: async ({ query, exact = false, fromYear, toYear, language = [], extensions = [], count = 10 }) => {
    try {
      const results = await searchBooks(
        query, 
        exact, 
        fromYear, 
        toYear, 
        language, 
        extensions, 
        count
      );
      
      return {
        results: results,
        total: results.length,
        query: query
      };
    } catch (error) {
      return { error: error.message || 'Failed to search books' };
    }
  },

  getBookById: async ({ id }) => {
    try {
      return await getBookById(id);
    } catch (error) {
      return { error: error.message || 'Failed to get book information' };
    }
  },

  getDownloadInfo: async ({ id, format }) => {
    try {
      return await getDownloadInfo(id, format);
    } catch (error) {
      return { error: error.message || 'Failed to get download information' };
    }
  },

  fullTextSearch: async ({ query, exact = false, phrase = true, words = false, language = [], extensions = [], count = 10 }) => {
    try {
      const results = await fullTextSearch(
        query, 
        exact,
        phrase,
        words,
        language, 
        extensions, 
        count
      );
      
      return {
        results: results,
        total: results.length,
        query: query
      };
    } catch (error) {
      return { error: error.message || 'Failed to perform full text search' };
    }
  },

  getDownloadHistory: async ({ count = 10 }) => {
    try {
      return await getDownloadHistory(count);
    } catch (error) {
      return { error: error.message || 'Failed to get download history' };
    }
  },

  getDownloadLimits: async () => {
    try {
      return await getDownloadLimits();
    } catch (error) {
      return { error: error.message || 'Failed to get download limits' };
    }
  },

  getRecentBooks: async ({ count = 10, format }) => {
    try {
      const results = await getRecentBooks(count, format);
      return {
        books: results,
        total: results.length
      };
    } catch (error) {
      return { error: error.message || 'Failed to get recent books' };
    }
  },

  downloadBookToFile: async ({ id, format, outputDir = './downloads' }) => {
    try {
      return await downloadBookToFile(id, format, outputDir);
    } catch (error) {
      return { error: error.message || 'Failed to download book' };
    }
  }
};

// Check for Python dependencies before starting
async function start(opts = {}) {
  try {
    // Check if zlibrary is installed
    const installed = await ensureZLibraryInstalled();
    
    if (!installed) {
      console.error('Failed to ensure Z-Library Python package is installed.');
      console.error('Please install it manually using: pip install zlibrary');
      
      // Allow tests to bypass process.exit
      if (opts.testing !== true) {
        process.exit(1);
      }
      return null;
    }
    
    // Create MCP server with metadata
    const server = createServer({
      name: "zlibrary-mcp",
      description: "Z-Library access for AI assistants",
      version: "1.0.0"
    });
    
    // Register search_books tool
    const searchBooksToolConfig = {
      name: 'search_books',
      description: 'Search for books in Z-Library',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          exact: {
            type: 'boolean',
            description: 'Whether to perform an exact match search',
            optional: true
          },
          fromYear: {
            type: 'number',
            description: 'Filter by minimum publication year',
            optional: true
          },
          toYear: {
            type: 'number',
            description: 'Filter by maximum publication year',
            optional: true
          },
          language: {
            type: 'array',
            description: 'Filter by languages (e.g., ["english", "russian"])',
            items: {
              type: 'string'
            },
            optional: true
          },
          extensions: {
            type: 'array',
            description: 'Filter by file extensions (e.g., ["pdf", "epub"])',
            items: {
              type: 'string'
            },
            optional: true
          },
          count: {
            type: 'number',
            description: 'Number of results to return per page',
            optional: true
          }
        },
        required: ['query']
      },
      handler: handlers.searchBooks
    };
    
    server.registerTool(searchBooksToolConfig);
    registeredTools.push(searchBooksToolConfig);

    // Register get_book_by_id tool
    const getBookByIdToolConfig = {
      name: 'get_book_by_id',
      description: 'Get detailed information about a book by its ID',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Z-Library book ID'
          }
        },
        required: ['id']
      },
      handler: handlers.getBookById
    };
    server.registerTool(getBookByIdToolConfig);
    registeredTools.push(getBookByIdToolConfig);

    // Register get_download_info tool
    const getDownloadInfoToolConfig = {
      name: 'get_download_info',
      description: 'Get download information for a book including its download URL',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Z-Library book ID'
          },
          format: {
            type: 'string',
            description: 'File format (e.g., "pdf", "epub")',
            optional: true
          }
        },
        required: ['id']
      },
      handler: handlers.getDownloadInfo
    };
    server.registerTool(getDownloadInfoToolConfig);
    registeredTools.push(getDownloadInfoToolConfig);

    // Register full_text_search tool
    const fullTextSearchToolConfig = {
      name: 'full_text_search',
      description: 'Search for books containing specific text in their content',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Text to search for in book content'
          },
          exact: {
            type: 'boolean',
            description: 'Whether to perform an exact match search',
            optional: true
          },
          phrase: {
            type: 'boolean',
            description: 'Whether to search for the exact phrase (requires at least 2 words)',
            optional: true
          },
          words: {
            type: 'boolean',
            description: 'Whether to search for individual words',
            optional: true
          },
          language: {
            type: 'array',
            description: 'Filter by languages (e.g., ["english", "russian"])',
            items: {
              type: 'string'
            },
            optional: true
          },
          extensions: {
            type: 'array',
            description: 'Filter by file extensions (e.g., ["pdf", "epub"])',
            items: {
              type: 'string'
            },
            optional: true
          },
          count: {
            type: 'number',
            description: 'Number of results to return per page',
            optional: true
          }
        },
        required: ['query']
      },
      handler: handlers.fullTextSearch
    };
    server.registerTool(fullTextSearchToolConfig);
    registeredTools.push(fullTextSearchToolConfig);

    // Register get_download_history tool
    const getDownloadHistoryToolConfig = {
      name: 'get_download_history',
      description: 'Get user\'s book download history',
      parameters: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: 'Number of results to return',
            optional: true
          }
        }
      },
      handler: handlers.getDownloadHistory
    };
    server.registerTool(getDownloadHistoryToolConfig);
    registeredTools.push(getDownloadHistoryToolConfig);

    // Register get_download_limits tool
    const getDownloadLimitsToolConfig = {
      name: 'get_download_limits',
      description: 'Get user\'s current download limits',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: handlers.getDownloadLimits
    };
    server.registerTool(getDownloadLimitsToolConfig);
    registeredTools.push(getDownloadLimitsToolConfig);

    // Register get_recent_books tool
    const getRecentBooksToolConfig = {
      name: 'get_recent_books',
      description: 'Get recently added books in Z-Library',
      parameters: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: 'Number of books to return',
            optional: true
          },
          format: {
            type: 'string',
            description: 'Filter by file format (e.g., "pdf", "epub")',
            optional: true
          }
        }
      },
      handler: handlers.getRecentBooks
    };
    server.registerTool(getRecentBooksToolConfig);
    registeredTools.push(getRecentBooksToolConfig);

    // Register download_book_to_file tool
    const downloadBookToFileToolConfig = {
      name: 'download_book_to_file',
      description: 'Download a book directly to a local file',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Z-Library book ID'
          },
          format: {
            type: 'string',
            description: 'File format (e.g., "pdf", "epub")',
            optional: true
          },
          outputDir: {
            type: 'string',
            description: 'Directory to save the file to (default: "./downloads")',
            optional: true
          }
        },
        required: ['id']
      },
      handler: handlers.downloadBookToFile
    };
    server.registerTool(downloadBookToFileToolConfig);
    registeredTools.push(downloadBookToFileToolConfig);

    // Start the server
    server.start();
    console.log('Z-Library MCP server is running...');
    return server;
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    
    // Allow tests to bypass process.exit
    if (opts.testing !== true) {
      process.exit(1);
    }
    return null;
  }
}

// Only auto-start when this file is run directly, not when imported by tests
if (require.main === module) {
  start();
}

// Export for testing
module.exports = { start, registeredTools, handlers };