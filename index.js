#!/usr/bin/env node

const { MCPServer } = require('@modelcontextprotocol/server');
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

// Check for Python dependencies before starting
async function start() {
  try {
    // Check if zlibrary is installed
    const installed = await ensureZLibraryInstalled();
    
    if (!installed) {
      console.error('Failed to ensure Z-Library Python package is installed.');
      console.error('Please install it manually using: pip install zlibrary');
      process.exit(1);
    }
    
    // Create MCP server
    const server = new MCPServer();
    
    // Register search_books tool
    server.registerTool({
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
      handler: async (params) => {
        try {
          const { 
            query, 
            exact = false, 
            fromYear, 
            toYear, 
            language = [], 
            extensions = [], 
            count = 10 
          } = params;
          
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
      }
    });

    // Register get_book_by_id tool
    server.registerTool({
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
      handler: async (params) => {
        try {
          const { id } = params;
          return await getBookById(id);
        } catch (error) {
          return { error: error.message || 'Failed to get book information' };
        }
      }
    });

    // Register get_download_info tool
    server.registerTool({
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
      handler: async (params) => {
        try {
          const { id, format } = params;
          return await getDownloadInfo(id, format);
        } catch (error) {
          return { error: error.message || 'Failed to get download information' };
        }
      }
    });

    // Register full_text_search tool
    server.registerTool({
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
      handler: async (params) => {
        try {
          const { 
            query, 
            exact = false, 
            phrase = true,
            words = false,
            language = [], 
            extensions = [], 
            count = 10 
          } = params;
          
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
      }
    });

    // Register get_download_history tool
    server.registerTool({
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
      handler: async (params) => {
        try {
          const { count = 10 } = params;
          return await getDownloadHistory(count);
        } catch (error) {
          return { error: error.message || 'Failed to get download history' };
        }
      }
    });

    // Register get_download_limits tool
    server.registerTool({
      name: 'get_download_limits',
      description: 'Get user\'s current download limits',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        try {
          return await getDownloadLimits();
        } catch (error) {
          return { error: error.message || 'Failed to get download limits' };
        }
      }
    });

    // Register get_recent_books tool
    server.registerTool({
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
      handler: async (params) => {
        try {
          const { count = 10, format } = params;
          const results = await getRecentBooks(count, format);
          return {
            books: results,
            total: results.length
          };
        } catch (error) {
          return { error: error.message || 'Failed to get recent books' };
        }
      }
    });

    // Register download_book_to_file tool
    server.registerTool({
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
      handler: async (params) => {
        try {
          const { id, format, outputDir = './downloads' } = params;
          return await downloadBookToFile(id, format, outputDir);
        } catch (error) {
          return { error: error.message || 'Failed to download book' };
        }
      }
    });

    // Start the server
    server.start();
    console.log('Z-Library MCP server is running...');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

start();