const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Check if the Z-Library Python package is installed
 * @returns {Promise<boolean>}
 */
async function checkZLibraryInstallation() {
  return new Promise((resolve) => {
    exec('pip show zlibrary', (error) => {
      resolve(!error);
    });
  });
}

/**
 * Install Z-Library Python package
 * @returns {Promise<boolean>} Success status
 */
async function installZLibrary() {
  return new Promise((resolve) => {
    console.log('Installing zlibrary Python package...');
    exec('pip install zlibrary', (error) => {
      if (error) {
        console.error('Failed to install zlibrary Python package:', error);
        resolve(false);
      } else {
        console.log('Successfully installed zlibrary Python package');
        resolve(true);
      }
    });
  });
}

/**
 * Ensure Z-Library Python package is installed
 * @returns {Promise<boolean>} Success status
 */
async function ensureZLibraryInstalled() {
  const isInstalled = await checkZLibraryInstallation();
  if (isInstalled) {
    console.log('Z-Library Python package is already installed');
    return true;
  }
  
  return await installZLibrary();
}

module.exports = {
  checkZLibraryInstallation,
  installZLibrary,
  ensureZLibraryInstalled
};