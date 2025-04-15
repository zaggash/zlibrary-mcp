const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
// Dynamic import for env-paths (ESM module)
let envPaths = null;

const VENV_DIR_NAME = 'zlibrary-mcp-venv';
const CONFIG_FILE_NAME = '.venv_config';
// const REQUIRED_PACKAGE = 'zlibrary'; // Replaced by requirements.txt
const VENV_BIN_DIR = process.platform === 'win32' ? 'Scripts' : 'bin';

/**
 * Runs a command asynchronously using spawn, returning a promise.
 * @param {string} command The command to run.
 * @param {string[]} args Array of string arguments.
 * @param {object} [options] Options for spawn.
 * @param {boolean} [logOutput=true] Whether to log stdout/stderr.
 * @returns {Promise<{stdout: string, stderr: string, code: number}>}
 */
function runCommand(command, args, options = {}, logOutput = true) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, options);
        let stdout = '';
        let stderr = '';

        if (proc.stdout) {
            proc.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                if (logOutput) console.log(`[${command} ${args.join(' ')}] stdout: ${output.trim()}`);
            });
        }

        if (proc.stderr) {
            proc.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                if (logOutput) console.error(`[${command} ${args.join(' ')}] stderr: ${output.trim()}`);
            });
        }

        proc.on('close', (code) => {
            resolve({ stdout, stderr, code });
        });

        proc.on('error', (err) => {
            reject(new Error(`Failed to spawn command "${command}": ${err.message}`));
        });
    });
}


/**
 * Gets the application-specific cache directory.
 * @returns {string} The path to the cache directory.
 */
async function getCacheDir() {
    // Check if running in Jest test environment
    if (process.env.JEST_WORKER_ID) {
        // Return a mock path during tests to avoid dynamic import issues
        return '/mock/cache/dir';
    } else {
        // Dynamically import env-paths only when not in Jest
        if (!envPaths) {
            const module = await import('env-paths');
            envPaths = module.default; // Assuming default export
        }
        // Use 'zlibrary-mcp' as the name for env-paths
        const paths = envPaths('zlibrary-mcp', { suffix: '' });
        return paths.cache;
    }
}

/**
 * Gets the full path to the virtual environment directory.
 * @returns {string} The path to the venv directory.
 */
async function getVenvDir() {
    const cacheDir = await getCacheDir();
    return path.join(cacheDir, VENV_DIR_NAME);
}

/**
 * Gets the path to the configuration file storing the venv Python path.
 * @returns {string} The path to the config file.
 */
async function getConfigPath() {
    const cacheDir = await getCacheDir();
    return path.join(cacheDir, CONFIG_FILE_NAME);
}

/**
 * Finds a suitable Python 3 executable path.
 * Tries 'python3' first, then 'python'.
 * @returns {Promise<string>} The path to the Python 3 executable.
 * @throws {Error} If no suitable Python 3 executable is found or version check fails.
 */
async function findPythonExecutable() {
    const candidates = ['python3', 'python'];
    for (const candidate of candidates) {
        try {
            // Check if command exists and is Python 3
            const versionOutput = execSync(`${candidate} --version`, { encoding: 'utf8' });
            if (versionOutput.includes('Python 3.')) {
                // Verify it's executable (execSync would throw if not)
                return candidate; // Return the command name, works cross-platform
            }
        } catch (error) {
            // Command not found or failed, try next candidate
        }
    }
    throw new Error('Could not find a valid Python 3 installation. Please ensure Python 3 is installed and accessible in your PATH.');
}

/**
 * Creates the Python virtual environment.
 * @param {string} pythonExecutable - The command/path of the Python 3 executable to use.
 * @param {string} venvDir - The directory where the venv should be created.
 * @returns {Promise<string>} The path to the Python executable within the created venv.
 * @throws {Error} If venv creation fails.
 */
async function createVenv(pythonExecutable, venvDir) {
    console.log(`Creating Python virtual environment in: ${venvDir}...`);
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(venvDir), { recursive: true });

    try {
        const { stderr, code } = await runCommand(pythonExecutable, ['-m', 'venv', venvDir]);
        if (code === 0) {
            const venvPythonPath = path.join(venvDir, VENV_BIN_DIR, 'python');
            console.log(`Virtual environment created successfully. Python path: ${venvPythonPath}`);
            return venvPythonPath;
        } else {
            throw new Error(`Failed to create virtual environment (exit code ${code}). Stderr: ${stderr}`);
        }
    } catch (error) {
        // Catch spawn errors or re-throw non-zero exit code errors
        throw new Error(`Failed during venv creation: ${error.message}`);
    }
}

/**
 * Installs the required Python package(s) into the virtual environment.
 * @param {string} venvPythonPath - Path to the Python executable within the venv.
 * @returns {Promise<void>}
 * @throws {Error} If installation fails.
 */
async function installDependencies(venvPythonPath) {
    const requirementsPath = path.resolve(__dirname, '..', 'requirements.txt'); // Ensure correct path
    console.log(`Installing packages from ${requirementsPath} using ${venvPythonPath}...`);
    try {
        // Use '-r' flag to install from requirements.txt
        const { stderr, code } = await runCommand(venvPythonPath, ['-m', 'pip', 'install', '-r', requirementsPath]);
        if (code === 0) {
            console.log(`Packages from requirements.txt installed successfully.`);
        } else {
            throw new Error(`Failed to install packages from requirements.txt (exit code ${code}). Stderr: ${stderr}`);
        }
    } catch (error) {
        // Catch spawn errors or re-throw non-zero exit code errors
        throw new Error(`Failed during pip installation: ${error.message}`);
    }
}

/**
 * Saves the path to the venv Python executable to the config file.
 * @param {string} venvPythonPath - The path to save.
 */
async function saveVenvPathConfig(venvPythonPath) {
    const configPath = await getConfigPath();
    try {
        fs.writeFileSync(configPath, venvPythonPath, 'utf8');
        console.log(`Saved venv Python path to ${configPath}`);
    } catch (error) {
        console.error(`Warning: Failed to save venv config to ${configPath}: ${error.message}`);
        // Non-fatal, but setup will run again next time.
    }
}

/**
 * Reads the saved venv Python executable path from the config file.
 * @returns {string | null} The saved path, or null if not found or invalid.
 */
async function readVenvPathConfig() {
    const configPath = await getConfigPath();
    try {
        if (fs.existsSync(configPath)) {
            const venvPythonPath = fs.readFileSync(configPath, 'utf8').trim();
            // Basic validation: check if the file exists
            if (fs.existsSync(venvPythonPath)) {
                console.log(`Read venv Python path from config: ${venvPythonPath}`);
                return venvPythonPath;
            } else {
                console.warn(`Configured venv Python path not found: ${venvPythonPath}. Re-running setup.`);
                fs.unlinkSync(configPath); // Remove invalid config
                return null;
            }
        }
    } catch (error) {
        console.error(`Warning: Failed to read or validate venv config from ${configPath}: ${error.message}`);
    }
    return null;
}

/**
 * Checks if the required package is installed in the venv.
 * @param {string} venvPythonPath - Path to the Python executable within the venv.
 * @returns {Promise<boolean>} True if the package is installed, false otherwise.
 */
async function checkPackageInstalled(venvPythonPath) {
    // Check for a key package (e.g., zlibrary) as a proxy for successful installation
    const keyPackage = 'zlibrary';
    console.log(`Checking if key package '${keyPackage}' is installed in ${venvPythonPath} (proxy for requirements.txt)...`);
    try {
        // Don't log output for this check unless debugging
        const { code } = await runCommand(venvPythonPath, ['-m', 'pip', 'show', keyPackage], {}, false); // Explicitly pass false for logOutput
        // pip show returns 0 if found, 1 if not found
        if (code === 0) {
            console.log(`Key package '${keyPackage}' is installed.`);
            return true;
        } else {
            console.log(`Key package '${keyPackage}' not found (pip show exit code ${code}). Assuming requirements need installation.`);
            return false;
        }
    } catch (error) {
        console.error(`Failed to run pip show check: ${error.message}`);
        return false; // Assume not installed if check fails
    }
}


/**
 * Ensures the Python virtual environment is set up and dependencies are installed.
 * Stores the path to the venv's Python executable for later use.
 * @throws {Error} If setup fails at any critical step.
 */
async function ensureVenvReady() {
    console.log('Ensuring Python virtual environment is ready...');
    let venvPythonPath = await readVenvPathConfig();

    if (venvPythonPath) {
        // Config exists, verify package installation
        const isInstalled = await checkPackageInstalled(venvPythonPath);
        if (isInstalled) {
            console.log('Venv and package already configured and valid.');
            return; // Already set up
        } else {
            console.log(`Key package not found in configured venv. Re-installing from requirements.txt...`);
            try {
                await installDependencies(venvPythonPath);
                console.log('Venv re-validated successfully.');
                return; // Setup complete after re-install
            } catch (installError) {
                console.error(`Failed to reinstall packages from requirements.txt. Attempting full venv recreation.`);
                // Proceed to delete and recreate venv
                venvPythonPath = null; // Force recreation logic
                try {
                    const venvDir = await getVenvDir();
                    if (fs.existsSync(venvDir)) {
                        console.log(`Removing existing invalid venv: ${venvDir}`);
                        fs.rmSync(venvDir, { recursive: true, force: true });
                    }
                    const configPath = await getConfigPath();
                     if (fs.existsSync(configPath)) {
                        fs.unlinkSync(configPath);
                    }
                } catch (cleanupError) {
                    throw new Error(`Failed to clean up existing invalid venv before recreation: ${cleanupError.message}`);
                }
            }
        }
    }

    // If we reach here, venvPythonPath is null (no config or config was invalid/package missing and reinstall failed)
    console.log('Setting up new Python virtual environment...');
    try {
        const pythonExecutable = await findPythonExecutable();
        const venvDir = await getVenvDir();

        // Clean up potentially incomplete venv dir if it exists
        if (fs.existsSync(venvDir)) {
             console.log(`Removing potentially incomplete venv directory: ${venvDir}`);
             fs.rmSync(venvDir, { recursive: true, force: true });
        }

        venvPythonPath = await createVenv(pythonExecutable, venvDir);
        await installDependencies(venvPythonPath);
        await saveVenvPathConfig(venvPythonPath);
        console.log('Python virtual environment setup complete.');
    } catch (error) {
        console.error(`Critical error during venv setup: ${error.message}`);
        throw new Error(`Failed to set up Python environment: ${error.message}. Please ensure Python 3 and venv are correctly installed and try again.`);
    }
}

/**
 * Gets the path to the managed Python executable within the venv.
 * Assumes ensureVenvReady() has been called successfully before.
 * @returns {string} The path to the venv's Python executable.
 * @throws {Error} If the config file is missing or invalid (should not happen if ensureVenvReady succeeded).
 */
async function getManagedPythonPath() {
    const venvPythonPath = await readVenvPathConfig();
    if (!venvPythonPath) {
        // This should ideally not happen if ensureVenvReady was called and succeeded.
        throw new Error('Virtual environment configuration is missing or invalid. Please run the setup process again.');
    }
    return venvPythonPath;
}

module.exports = {
    ensureVenvReady, // Already async
    getManagedPythonPath, // Now async
    // Exported for potential testing/debugging
    _findPythonExecutable: findPythonExecutable, // Already async
    _getVenvDir: getVenvDir, // Now async
    _getConfigPath: getConfigPath, // Now async
    _checkPackageInstalled: checkPackageInstalled // Already async
};