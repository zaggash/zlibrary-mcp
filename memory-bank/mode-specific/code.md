# Auto-Coder Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
### Implementation: Global Execution Fix (Managed Venv) - [2025-04-14 04:11:52]
- **Approach**: Implemented `lib/venv-manager.js` for Python venv detection, creation, dependency installation (`zlibrary`), and configuration storage using `env-paths`. Updated `lib/zlibrary-api.js` to use the managed Python path via `getManagedPythonPath`. Updated `index.js` to call `ensureVenvReady` and use correct SDK import. Removed old `lib/python-env.js`.
- **Key Files Modified/Created**:
  - `lib/venv-manager.js`: New file implementing the core venv management logic.
  - `index.js`: Updated SDK import, replaced `ensureZLibraryInstalled` with `ensureVenvReady`.
  - `lib/zlibrary-api.js`: Updated `callPythonFunction` to use `getManagedPythonPath`.
  - `package.json`: Added `env-paths` dependency.
  - `__tests__/index.test.js`: Updated mocks for `venv-manager`.
  - `__tests__/zlibrary-api.test.js`: Refactored mock setup significantly to handle module loading order.
  - `jest.config.js`: Removed `transformIgnorePatterns` after switching to mocking `env-paths`.
  - `__mocks__/env-paths.js`: Added mock for `env-paths`.
- **Files Removed**:
  - `lib/python-env.js`
  - `__tests__/python-env.test.js`
- **Notes**: TDD Green phase complete. Required significant debugging of Jest mock setup, particularly around module loading order and ESM dependencies. Final solution involved standard Jest mocking patterns without `resetModules` in `beforeEach` for `zlibrary-api.test.js` and mocking the `env-paths` module directly.

### Dependency: env-paths - [2025-04-14 04:11:52]
- **Version**: ^3.0.0
- **Purpose**: Determine user-specific cache directory path reliably across platforms for storing the managed Python venv.
- **Used by**: `lib/venv-manager.js`
- **Config notes**: None.
