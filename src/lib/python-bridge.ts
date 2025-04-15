const { spawn } = require('child_process');
const path = require('path');

/**
 * Execute a Python function from the Z-Library repository
 * @param {string} functionName - Name of the Python function to call
 * @param {Array} args - Arguments to pass to the function
 * @returns {Promise<any>} - Result from the Python function
 */
async function callPythonFunction(functionName, args = []) {
  return new Promise((resolve, reject) => {
    // Path to the Python bridge script
    const scriptPath = path.join(__dirname, 'python-bridge.py');
    
    // Serialize arguments as JSON
    const serializedArgs = JSON.stringify(args);
    
    // Spawn Python process
    const pythonProcess = spawn('python3', [
      scriptPath, 
      functionName,
      serializedArgs
    ]);
    
    let result = '';
    let errorOutput = '';
    
    // Collect output
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON result
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (e) {
          reject(new Error(`Failed to parse result: ${e.message}`));
        }
      } else {
        reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

module.exports = { callPythonFunction };