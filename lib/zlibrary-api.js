const { PythonShell } = require('python-shell');
const fs = require('fs');
const path = require('path');
const { getManagedPythonPath } = require('./venv-manager'); // Import the function to get the venv Python path
const https = require('https');
const http = require('http');

// Path to the Python bridge script
const BRIDGE_SCRIPT = path.join(__dirname, 'python-bridge.py');

/**
 * Execute a Python function from the Z-Library repository
 * @param {string} functionName - Name of the Python function to call
 * @param {Array} args - Arguments to pass to the function
 * @returns {Promise<any>} - Result from the Python function
 */
async function callPythonFunction(functionName, args = []) {
  // Get the python path asynchronously
  const venvPythonPath = await getManagedPythonPath();
  const options = {
    mode: 'json',
    pythonPath: venvPythonPath, // Use the Python from our managed venv
    scriptPath: __dirname,
    args: [functionName, JSON.stringify(args)]
  };

  try {
    const results = await PythonShell.run('python-bridge.py', options);
    if (results && results.length > 0) {
      if (results[0].error) {
        // Throw error if the Python script indicated failure
        throw new Error(results[0].error);
      } else {
        // Resolve with the successful result from Python
        return results[0];
      }
    } else {
      // Throw error if Python script gave no output (unexpected)
      throw new Error('No results received from Python script');
    }
  } catch (err) {
    // Re-throw PythonShell execution errors or errors thrown above
    throw new Error(`Python bridge execution failed for ${functionName}: ${err.message}`);
  }
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
async function getDownloadInfo(id, format = null) {
  return await callPythonFunction('get_download_info', [id, format]);
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

/**
 * Download a book directly to a file
 * @param {string} id - Book ID
 * @param {string} format - File format
 * @param {string} outputDir - Directory to save the file
 * @returns {Promise<object>} - Download information
 */
async function downloadBookToFile(id, format = null, outputDir = './downloads') {
  try {
    // First get the download info (includes URL)
    const downloadInfo = await getDownloadInfo(id, format);
    
    if (!downloadInfo || downloadInfo.error) {
      throw new Error(downloadInfo.error || 'Failed to get download info');
    }
    
    if (!downloadInfo.download_url) {
      throw new Error('No download URL available for this book');
    }
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate a safe filename
    const title = downloadInfo.title
      .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid characters
      .substring(0, 100); // Limit length
      
    const fileExt = downloadInfo.format.toLowerCase();
    const outputPath = path.join(outputDir, `${title}.${fileExt}`);
    
    // Download the file
    await downloadFile(downloadInfo.download_url, outputPath);
    
    return {
      success: true,
      title: downloadInfo.title,
      format: fileExt,
      path: outputPath,
      size: downloadInfo.filesize
    };
  } catch (error) {
    // Throw an error instead of returning an object
    throw new Error(`Failed to download book: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Helper function to download a file from URL
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    // Determine protocol (http or https)
    const protocol = url.startsWith('https:') ? https : http;
    
    // Create file stream
    const fileStream = fs.createWriteStream(outputPath);
    
    // Make request
    const request = protocol.get(url, (response) => {
      // Check for redirect
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Follow redirect
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      // Check for error
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file, status: ${response.statusCode}`));
        return;
      }
      
      // Pipe response to file
      response.pipe(fileStream);
      
      // Handle events
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    });
    
    // Handle request errors
    request.on('error', (err) => {
      fs.unlinkSync(outputPath); // Remove partial file
      reject(err);
    });
    
    // Handle file errors
    fileStream.on('error', (err) => {
      fs.unlinkSync(outputPath); // Remove partial file
      reject(err);
    });
  });
}

module.exports = {
  searchBooks,
  getBookById,
  getDownloadInfo,
  fullTextSearch,
  getDownloadHistory,
  getDownloadLimits,
  getRecentBooks, 
  downloadBookToFile
};