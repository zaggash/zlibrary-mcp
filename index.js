#!/usr/bin/env node

// Use the main package export for the SDK
// Import the Server class (capital S) from the correct CJS path
// Moved SDK requires inside start function
const z = require('zod'); // Import Zod
const zodToJsonSchema = require('zod-to-json-schema').default; // Import converter
const { ensureVenvReady } = require('./lib/venv-manager'); // New venv manager
const fs = require('fs'); // For reading package.json
const path = require('path'); // For reading package.json
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

// Define Zod schemas for tool parameters
const SearchBooksParamsSchema = z.object({
  query: z.string().describe('Search query'),
  exact: z.boolean().optional().default(false).describe('Whether to perform an exact match search'),
  fromYear: z.number().int().optional().describe('Filter by minimum publication year'),
  toYear: z.number().int().optional().describe('Filter by maximum publication year'),
  language: z.array(z.string()).optional().default([]).describe('Filter by languages (e.g., ["english", "russian"])'),
  extensions: z.array(z.string()).optional().default([]).describe('Filter by file extensions (e.g., ["pdf", "epub"])'),
  count: z.number().int().optional().default(10).describe('Number of results to return per page'),
});

const GetBookByIdParamsSchema = z.object({
  id: z.string().describe('Z-Library book ID'),
});

const GetDownloadInfoParamsSchema = z.object({
  id: z.string().describe('Z-Library book ID'),
  format: z.string().optional().describe('File format (e.g., "pdf", "epub")'),
});

const FullTextSearchParamsSchema = z.object({
  query: z.string().describe('Text to search for in book content'),
  exact: z.boolean().optional().default(false).describe('Whether to perform an exact match search'),
  phrase: z.boolean().optional().default(true).describe('Whether to search for the exact phrase (requires at least 2 words)'),
  words: z.boolean().optional().default(false).describe('Whether to search for individual words'),
  language: z.array(z.string()).optional().default([]).describe('Filter by languages (e.g., ["english", "russian"])'),
  extensions: z.array(z.string()).optional().default([]).describe('Filter by file extensions (e.g., ["pdf", "epub"])'),
  count: z.number().int().optional().default(10).describe('Number of results to return per page'),
});

const GetDownloadHistoryParamsSchema = z.object({
  count: z.number().int().optional().default(10).describe('Number of results to return'),
});

const GetDownloadLimitsParamsSchema = z.object({}); // No parameters

const GetRecentBooksParamsSchema = z.object({
  count: z.number().int().optional().default(10).describe('Number of books to return'),
  format: z.string().optional().describe('Filter by file format (e.g., "pdf", "epub")'),
});

const DownloadBookToFileParamsSchema = z.object({
  id: z.string().describe('Z-Library book ID'),
  format: z.string().optional().describe('File format (e.g., "pdf", "epub")'),
  outputDir: z.string().optional().default('./downloads').describe('Directory to save the file to (default: "./downloads")'),
});

// Tool Registry
const toolRegistry = {
  search_books: {
    description: 'Search for books in Z-Library',
    schema: SearchBooksParamsSchema,
    handler: handlers.searchBooks,
  },
  get_book_by_id: {
    description: 'Get detailed information about a book by its ID',
    schema: GetBookByIdParamsSchema,
    handler: handlers.getBookById,
  },
  get_download_info: {
    description: 'Get download information for a book including its download URL',
    schema: GetDownloadInfoParamsSchema,
    handler: handlers.getDownloadInfo,
  },
  full_text_search: {
    description: 'Search for books containing specific text in their content',
    schema: FullTextSearchParamsSchema,
    handler: handlers.fullTextSearch,
  },
  get_download_history: {
    description: "Get user's book download history",
    schema: GetDownloadHistoryParamsSchema,
    handler: handlers.getDownloadHistory,
  },
  get_download_limits: {
    description: "Get user's current download limits",
    schema: GetDownloadLimitsParamsSchema,
    handler: handlers.getDownloadLimits,
  },
  get_recent_books: {
    description: 'Get recently added books in Z-Library',
    schema: GetRecentBooksParamsSchema,
    handler: handlers.getRecentBooks,
  },
  download_book_to_file: {
    description: 'Download a book directly to a local file',
    schema: DownloadBookToFileParamsSchema,
    handler: handlers.downloadBookToFile,
  },
};

// Check for Python dependencies before starting
// Helper function to get version from package.json
function getPackageVersion() {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || 'unknown';
  } catch (error) {
    console.warn('Could not read package.json for version:', error.message);
    return 'unknown';
  }
}

async function start(opts = {}) {
  try {
    // Ensure the Python virtual environment is ready
    await ensureVenvReady();
    // ensureVenvReady throws if setup fails, simplifying error handling here.
    
    // Require SDK components *inside* start, after mocks are potentially set by tests
    const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
    const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
    const mcpTypes = require('@modelcontextprotocol/sdk/types.js');

    // Instantiate the Server class
    const server = new Server({
      name: "zlibrary-mcp",
      description: "Z-Library access for AI assistants",
      version: getPackageVersion()
    });

    // Enable tools capability
    server.registerCapabilities({ tools: true });

// Implement tools/list handler - access schema inside start function
server.setRequestHandler(mcpTypes.ListToolsRequestSchema, async (request) => {
  const tools = Object.entries(toolRegistry).map(([name, tool]) => {
    // Convert Zod schema to JSON schema
    const jsonSchema = zodToJsonSchema(tool.schema, name);
    return {
      name: name,
      description: tool.description,
      input_schema: jsonSchema, // Use the generated JSON schema
    };
  });
  return { tools };
});

// Implement tools/call handler - access schema inside start function
server.setRequestHandler(mcpTypes.CallToolRequestSchema, async (request) => {
  const { tool_name, arguments: args } = request.params;
  const tool = toolRegistry[tool_name];

  if (!tool) {
    return { error: { message: `Tool "${tool_name}" not found.` } };
  }

  // Validate arguments using Zod schema
  const validationResult = tool.schema.safeParse(args);

  if (!validationResult.success) {
    // Provide detailed validation errors
    const errorDetails = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { error: { message: `Invalid arguments for tool "${tool_name}": ${errorDetails}` } };
  }

  try {
    // Call the actual tool handler with validated arguments
    const result = await tool.handler(validationResult.data);
    // Check if the handler returned an error object itself
    if (result && typeof result === 'object' && result.error) {
       return { error: { message: result.error } };
    }
    return { result }; // Wrap the successful result
  } catch (error) {
    // Catch errors thrown by the handler
    console.error(`Error calling tool "${tool_name}":`, error);
    return { error: { message: error.message || `Tool "${tool_name}" failed.` } };
  }
});

// Create and start the Stdio transport
    // Create and connect the Stdio transport using the pattern from SDK examples
    const transport = new StdioServerTransport(); // Instantiate without arguments
    await server.connect(transport); // Use server.connect instead of transport.start()
    console.error('Z-Library MCP server is running via Stdio...'); // Use console.error for logs as per examples

    return { server, transport }; // Return both for potential testing needs
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    
    // Allow tests to bypass process.exit
    if (opts.testing !== true) {
      process.exit(1);
    }
    return null;
  }
}

// Only auto-start when this file is run directly
if (require.main === module) {
  start().catch(err => { // Add error catching as per examples
    console.error("Fatal error starting server:", err);
    process.exit(1);
  });
}

// Export for testing (note: registeredTools is removed)
module.exports = { start, handlers, toolRegistry };