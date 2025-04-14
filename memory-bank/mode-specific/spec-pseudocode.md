# Specification Writer Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
## Functional Requirements
<!-- Append new requirements using the format below -->

### Feature: Managed Python Virtual Environment
- Added: 2025-04-14 03:31:01
- Description: Implement automated creation and management of a dedicated Python virtual environment for the `zlibrary` dependency within a user cache directory. This includes Python 3 detection, venv creation, dependency installation (`zlibrary`), storing the venv Python path, and modifying `zlibrary-api.js` to use this path.
- Acceptance criteria: 1. `zlibrary-mcp` successfully executes Python scripts using the managed venv. 2. Setup handles Python 3 detection errors gracefully. 3. Setup handles venv creation errors gracefully. 4. Setup handles dependency installation errors gracefully. 5. Subsequent runs use the existing configured venv.
- Dependencies: Node.js (`env-paths`, `child_process`, `fs`, `path`), User system must have Python 3 installed.
- Status: Draft

### Feature: Node.js SDK Import Fix
- Added: 2025-04-14 03:31:01
- Description: Correct the `require` statement in `index.js` to properly import the `@modelcontextprotocol/sdk`.
- Acceptance criteria: 1. `index.js` successfully imports the SDK without `ERR_PACKAGE_PATH_NOT_EXPORTED` errors. 2. Core SDK functionality is accessible.
- Dependencies: `@modelcontextprotocol/sdk` package.
- Status: Draft


## System Constraints
<!-- Append new constraints using the format below -->

### Constraint: Python 3 Prerequisite
- Added: 2025-04-14 03:31:01
- Description: The user's system must have a functional Python 3 installation (version 3.6+ recommended for `venv`) accessible via the system's PATH or detectable by the chosen Node.js detection library.
- Impact: The managed venv setup will fail if Python 3 is not found.
- Mitigation strategy: Provide clear error messages guiding the user to install Python 3.


## Edge Cases
<!-- Append new edge cases using the format below -->

### Edge Case: Venv Management - Python Not Found
- Identified: 2025-04-14 03:31:01
- Scenario: The `findPythonExecutable` function fails to locate a compatible Python 3 installation on the user's system.
- Expected behavior: The setup process halts, and a clear error message is displayed instructing the user to install Python 3.
- Testing approach: Mock the Python detection library/logic to return 'not found'. Verify the correct error is thrown.

### Edge Case: Venv Management - Venv Creation Failure
- Identified: 2025-04-14 03:31:01
- Scenario: The `python3 -m venv <path>` command fails (e.g., due to permissions, disk space, corrupted Python installation).
- Expected behavior: The setup process halts, and an error message indicating venv creation failure is displayed.
- Testing approach: Mock `child_process.execSync`/`exec` to throw an error during the venv creation command. Verify the correct error is propagated.

### Edge Case: Venv Management - Dependency Installation Failure
- Identified: 2025-04-14 03:31:01
- Scenario: The `<venv_pip> install zlibrary` command fails (e.g., network issues, PyPI unavailable, incompatible `zlibrary` version).
- Expected behavior: The setup process halts, and an error message indicating dependency installation failure is displayed.
- Testing approach: Mock `child_process.execSync`/`exec` to throw an error during the pip install command. Verify the correct error is propagated.

### Edge Case: Venv Management - Corrupted Config File
- Identified: 2025-04-14 03:31:01
- Scenario: The `venv_config.json` file exists but is malformed or contains an invalid/non-executable Python path.
- Expected behavior: The `ensureVenvReady` function detects the invalid config, attempts to repair the venv (re-install dependencies, re-verify Python path), and saves a new valid config. If repair fails, an error is thrown.
- Testing approach: Create mock corrupted config files. Mock `fs` reads/writes and `child_process` calls. Verify the repair logic is triggered and succeeds/fails correctly.


## Pseudocode Library
<!-- Append new pseudocode blocks using the format below -->

### Pseudocode: VenvManager - Core Logic
- Created: 2025-04-14 03:31:01
- Updated: 2025-04-14 03:31:01
```pseudocode
// File: lib/venv-manager.js
// Dependencies: env-paths, fs, path, child_process

CONSTANT VENV_DIR_NAME = "venv"
CONSTANT CONFIG_FILE_NAME = "venv_config.json"
CONSTANT PYTHON_DEPENDENCY = "zlibrary" // Add version if needed: "zlibrary==1.0.0"

FUNCTION getPythonPath():
  // Main function called by external modules (e.g., zlibrary-api.js)
  // Ensures venv is ready and returns the path to the venv's Python executable.
  TRY
    CALL ensureVenvReady()
    config = READ parseJsonFile(getConfigPath())
    IF config.pythonPath EXISTS AND isExecutable(config.pythonPath) THEN
      RETURN config.pythonPath
    ELSE
      THROW Error("Managed Python environment is configured but invalid.")
    ENDIF
  CATCH error
    LOG error
    THROW Error("Failed to get managed Python environment path: " + error.message)
  ENDTRY
END FUNCTION

FUNCTION ensureVenvReady():
  // Checks if venv is set up; creates/repairs if necessary.
  configPath = getConfigPath()
  venvDir = getVenvDir()

  IF fileExists(configPath) THEN
    config = READ parseJsonFile(configPath)
    IF config.pythonPath EXISTS AND isExecutable(config.pythonPath) THEN
      LOG "Managed Python environment found and valid."
      RETURN // Already ready
    ELSE
      LOG "Managed Python config found but invalid. Attempting repair..."
      // Proceed to setup/repair steps below
    ENDIF
  ELSE
      LOG "Managed Python config not found. Starting setup..."
      // Proceed to setup steps below
  ENDIF

  // Setup/Repair Steps
  IF NOT directoryExists(venvDir) THEN
      LOG "Creating venv directory..."
      pythonExe = CALL findPythonExecutable() // Throws if not found
      CALL createVenv(pythonExe, venvDir) // Throws on failure
  ELSE
      LOG "Venv directory exists."
  ENDIF

  // Always try to install/update dependencies in case venv exists but is incomplete
  LOG "Ensuring dependencies are installed..."
  CALL installDependencies(venvDir) // Throws on failure

  LOG "Saving venv configuration..."
  pythonVenvPath = getPlatformPythonPath(venvDir)
  IF NOT isExecutable(pythonVenvPath) THEN
      THROW Error("Venv Python executable not found or not executable after setup: " + pythonVenvPath)
  ENDIF
  CALL saveVenvConfig(configPath, pythonVenvPath) // Throws on failure

  LOG "Managed Python environment setup complete."
END FUNCTION

FUNCTION findPythonExecutable():
  // Finds a suitable Python 3 executable.
  // Uses a library or custom logic (e.g., check PATH for python3, python).
  // Return path to executable or throw error if not found.
  LOG "Searching for Python 3 executable..."
  // ... implementation using find-python-script or similar ...
  IF foundPath THEN
    LOG "Found Python 3 at: " + foundPath
    RETURN foundPath
  ELSE
    THROW Error("Python 3 installation not found. Please install Python 3 and ensure it's in your PATH.")
  ENDIF
END FUNCTION

FUNCTION createVenv(pythonExePath, venvDirPath):
  // Creates the virtual environment.
  LOG "Creating Python virtual environment at: " + venvDirPath
  command = `"${pythonExePath}" -m venv "${venvDirPath}"`
  TRY
    EXECUTE command synchronously // Use child_process.execSync or async equivalent
    LOG "Venv created successfully."
  CATCH error
    THROW Error("Failed to create Python virtual environment: " + error.message)
  ENDTRY
END FUNCTION

FUNCTION installDependencies(venvDirPath):
  // Installs Python dependencies using the venv's pip.
  pipPath = getPlatformPipPath(venvDirPath)
  IF NOT isExecutable(pipPath) THEN
      THROW Error("Venv pip executable not found or not executable: " + pipPath)
  ENDIF

  LOG "Installing dependencies using: " + pipPath
  command = `"${pipPath}" install ${PYTHON_DEPENDENCY}`
  TRY
    EXECUTE command synchronously // Use child_process.execSync or async equivalent
    LOG "Dependencies installed successfully."
  CATCH error
    THROW Error("Failed to install Python dependencies: " + error.message)
  ENDTRY
END FUNCTION

FUNCTION saveVenvConfig(configFilePath, pythonVenvPath):
  // Saves the venv Python path to the config file.
  configData = { pythonPath: pythonVenvPath }
  TRY
    WRITE JSON.stringify(configData) TO configFilePath
    LOG "Venv configuration saved to: " + configFilePath
  CATCH error
    THROW Error("Failed to write venv config file: " + error.message)
  ENDTRY
END FUNCTION

// --- Helper Functions ---

FUNCTION getConfigPath():
  paths = CALL envPaths('zlibrary-mcp', { suffix: '' })
  RETURN path.join(paths.cache, CONFIG_FILE_NAME)
END FUNCTION

FUNCTION getVenvDir():
  paths = CALL envPaths('zlibrary-mcp', { suffix: '' })
  RETURN path.join(paths.cache, VENV_DIR_NAME)
END FUNCTION

FUNCTION getPlatformPipPath(venvDirPath):
  IF OS is Windows THEN
    RETURN path.join(venvDirPath, 'Scripts', 'pip.exe')
  ELSE // Assume Unix-like
    RETURN path.join(venvDirPath, 'bin', 'pip')
  ENDIF
END FUNCTION

FUNCTION getPlatformPythonPath(venvDirPath):
  IF OS is Windows THEN
    RETURN path.join(venvDirPath, 'Scripts', 'python.exe')
  ELSE // Assume Unix-like
    RETURN path.join(venvDirPath, 'bin', 'python')
  ENDIF
END FUNCTION

FUNCTION isExecutable(filePath):
  // Checks if a file exists and is executable (using fs.accessSync or similar).
  TRY
    CALL fs.accessSync(filePath, fs.constants.X_OK)
    RETURN TRUE
  CATCH error
    RETURN FALSE
  ENDTRY
END FUNCTION

FUNCTION parseJsonFile(filePath):
  // Reads and parses a JSON file. Handles errors.
  TRY
    content = READ fs.readFileSync(filePath, 'utf8')
    RETURN JSON.parse(content)
  CATCH error
    LOG "Error reading/parsing JSON file: " + filePath + " - " + error.message
    RETURN {} // Return empty object on error
  ENDTRY
END FUNCTION

// ... other helpers like fileExists, directoryExists as needed ...
```
#### TDD Anchors:
- Test case 1: Python 3 detection (found/not found/error)
- Test case 2: Venv creation (success/failure)
- Test case 3: Dependency installation (success/failure)
- Test case 4: Config path generation and file I/O (read/write/error)
- Test case 5: Full `ensureVenvReady` lifecycle (initial setup, valid existing, repair invalid)
- Test case 6: `getPythonPath` returns correct path or throws error

### Pseudocode: ZLibraryAPI - Integration
- Created: 2025-04-14 03:31:01
- Updated: 2025-04-14 03:31:01
```pseudocode
// File: lib/zlibrary-api.js (Relevant Snippet)
// Dependencies: python-shell, ./venv-manager

IMPORT { PythonShell } from 'python-shell'
IMPORT venvManager from './venv-manager' // Or adjust path
IMPORT path from 'path'

ASYNC FUNCTION searchZlibrary(query):
  TRY
    // 1. Get the Python path from the venv manager
    pythonPath = AWAIT venvManager.getPythonPath() // Ensures venv is ready

    // 2. Define PythonShell options using the retrieved path
    options = {
      mode: 'text',
      pythonPath: pythonPath, // CRITICAL: Use the managed venv path
      pythonOptions: ['-u'],
      scriptPath: path.dirname(require.resolve('zlibrary/search')), // Adjust if needed
      args: [query]
    }

    // 3. Create and run PythonShell
    pyshell = new PythonShell('search', options) // Assuming 'search.py' is the script

    // ... (rest of the existing promise-based handling for pyshell.on('message'), .end(), .on('error')) ...

  CATCH error
    LOG "Error during Zlibrary search: " + error.message
    THROW error // Re-throw or handle appropriately
  ENDTRY
END FUNCTION
```
#### TDD Anchors:
- Test case 1: `venvManager.getPythonPath` is called before `PythonShell`
- Test case 2: `PythonShell` options include the correct `pythonPath`
- Test case 3: Errors from `getPythonPath` are handled

