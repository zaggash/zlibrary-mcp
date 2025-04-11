const { PythonShell } = require('python-shell');
const path = require('path');

/**
 * Python bridge for interacting with zlibrary through Python scripts
 */
class PythonBridge {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'python-bridge.py');
  }

  /**
   * Execute a Python function with arguments
   * @param {string} functionName - The name of the Python function to execute
   * @param {object} args - Arguments to pass to the Python function
   * @returns {Promise<any>} - Result from the Python function
   */
  async execute(functionName, args) {
    return new Promise((resolve, reject) => {
      const options = {
        mode: 'json',
        pythonPath: 'python3',
        args: [functionName, JSON.stringify(args)]
      };

      PythonShell.run(this.pythonScriptPath, options)
        .then(results => {
          if (results && results.length > 0) {
            resolve(results[0]);
          } else {
            resolve(null);
          }
        })
        .catch(err => {
          console.error('Python bridge error:', err);
          reject(err);
        });
    });
  }

  /**
   * Search for books using the Python script
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Array of book results
   */
  async searchBooks(query) {
    return this.execute('search_books', { query });
  }

  /**
   * Get download link for a book
   * @param {string} bookId - ID of the book
   * @returns {Promise<object>} - Download information
   */
  async getDownloadLink(bookId) {
    return this.execute('get_download_link', { book_id: bookId });
  }
}

module.exports = new PythonBridge();