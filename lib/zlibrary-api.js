const axios = require('axios');
const pythonBridge = require('./python-bridge');

/**
 * Service for interacting with the zlibrary API
 */
class ZLibraryApi {
  constructor() {
    this.pythonBridge = pythonBridge;
  }

  /**
   * Search for books in zlibrary
   * @param {string} query - Search query string
   * @returns {Promise<Array>} - Array of book search results
   */
  async searchBooks(query) {
    try {
      // Use the python bridge to perform the search
      const results = await this.pythonBridge.searchBooks(query);
      return results;
    } catch (error) {
      console.error('Error searching books:', error);
      throw new Error('Failed to search books');
    }
  }

  /**
   * Get download link for a specific book
   * @param {string} bookId - ID of the book to download
   * @returns {Promise<object>} - Download information including URL
   */
  async getDownloadLink(bookId) {
    try {
      // Use the python bridge to get the download link
      const downloadInfo = await this.pythonBridge.getDownloadLink(bookId);
      return downloadInfo;
    } catch (error) {
      console.error('Error getting download link:', error);
      throw new Error('Failed to get download link');
    }
  }

  /**
   * Check if the zlibrary service is accessible
   * @returns {Promise<boolean>} - True if service is accessible
   */
  async checkServiceAvailability() {
    try {
      const result = await this.pythonBridge.execute('check_availability', {});
      return result && result.available === true;
    } catch (error) {
      console.error('Error checking service availability:', error);
      return false;
    }
  }
}

module.exports = new ZLibraryApi();