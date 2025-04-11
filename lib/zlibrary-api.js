const { PythonShell } = require('python-shell');
const path = require('path');

// Path to the Python bridge script
const BRIDGE_SCRIPT = path.join(__dirname, 'python-bridge.py');

/**
 * Execute a Python function from the Z-Library repository
 * @param {string} functionName - Name of the Python function to call
 * @param {Array} args - Arguments to pass to the function
 * @returns {Promise<any>} - Result from the Python function
 */
async function callPythonFunction(functionName, args = []) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'json',
      pythonPath: 'python3', // Or the path to your Python executable
      scriptPath: __dirname,
      args: [functionName, JSON.stringify(args)]
    };

    PythonShell.run('python-bridge.py', options).then(results => {
      if (results && results.length > 0) {
        if (results[0].error) {
          reject(new Error(results[0].error));
        } else {
          resolve(results[0]);
        }
      } else {
        reject(new Error('No results from Python script'));
      }
    }).catch(err => {
      reject(err);
    });
  });
}

/**
 * Search for books in Z-Library
 */
async function searchBooks(
  query, 
  exact = false, 
  fromYear = null, 
  toYear = null, 
  languages = [], 
  extensions = [], 
  count = 10
) {
  return await callPythonFunction('search', [
    query, exact, fromYear, toYear, languages, extensions, count
  ]);
}

/**
 * Get book details by ID
 */
async function getBookById(id) {
  return await callPythonFunction('get_by_id', [id]);
}

/**
 * Get download link for a book
 */
async function getDownloadLink(id, format = null) {
  return await callPythonFunction('get_download_link', [id, format]);
}

/**
 * Perform full text search
 */
async function fullTextSearch(
  query,
  exact = false,
  phrase = true,
  words = false,
  languages = [],
  extensions = [],
  count = 10
) {
  return await callPythonFunction('full_text_search', [
    query, exact, phrase, words, languages, extensions, count
  ]);
}

/**
 * Get user's download history
 */
async function getDownloadHistory(count = 10) {
  return await callPythonFunction('get_download_history', [count]);
}

/**
 * Get user's download limits
 */
async function getDownloadLimits() {
  return await callPythonFunction('get_download_limits', []);
}

/**
 * Get recently added books
 */
async function getRecentBooks(count = 10, format = null) {
  return await callPythonFunction('get_recent_books', [count, format]);
}

module.exports = {
  searchBooks,
  getBookById,
  getDownloadLink,
  fullTextSearch,
  getDownloadHistory,
  getDownloadLimits,
  getRecentBooks
};