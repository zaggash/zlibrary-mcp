# Tester (TDD) Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
## Test Execution Results
### Test Execution: Unit/Integration (index.js Mock Fix) - 2025-04-14 11:37:37
- **Trigger**: Manual run after fixing `index.js` tests.
- **Outcome**: PASS / **Summary**: 4 suites passed, 31 tests passed, 13 todo
- **Failed Tests**: None
- **Coverage Change**: Stable
- **Notes**: Confirmed `index.js` tests pass after applying `jest.doMock` to specific SDK sub-paths and using `globalTeardown` workaround for Jest exit.


<!-- Append test run summaries using the format below -->
### Test Execution: Unit/Integration (Post-Refactor) - 2025-04-14 04:15:38
- **Trigger**: Manual run after refactoring and test fixes.
- **Outcome**: PASS / **Summary**: 4 suites passed, 33 tests passed, 13 todo
- **Failed Tests**: None
- **Coverage Change**: Stable (Expected for refactoring)
- **Notes**: Confirmed refactoring did not break functionality.



### Test Execution: Unit/Integration (Initial Failing) - 2025-04-14 03:35:21
- **Trigger**: Manual run after writing initial tests
- **Outcome**: FAIL / **Summary**: 3 suites failed, 2 passed, 1 test failed, 13 todo
- **Failed Tests**:
    - `__tests__/venv-manager.test.js`: Cannot find module '../lib/venv-manager'
    - `__tests__/zlibrary-api.test.js`: Cannot find module '../lib/venv-manager'
    - `__tests__/index.test.js`: Cannot find module '@modelcontextprotocol/sdk/lib/index'
- **Coverage Change**: N/A (Initial run)
- **Notes**: Failures are expected as implementation is missing.

## TDD Cycles Log
<!-- Append TDD cycle outcomes using the format below -->

### TDD Cycle: Global Execution Fix (Refactor) - 2025-04-14 04:15:38
- **Red**: N/A (Refactor phase)
- **Green**: N/A (Refactor phase)
- **Refactor**:
    - `lib/venv-manager.js`: Extracted `runCommand` helper, used `VENV_BIN_DIR` constant.
    - `index.js`: Removed obsolete comments.
    - `lib/zlibrary-api.js`: Simplified `callPythonFunction` with async/await, changed `downloadBookToFile` to throw errors.
    - `__tests__/zlibrary-api.test.js`: Updated error assertions to match refactored code.
- **Outcome**: Refactoring complete. Code improved for clarity and consistency. All tests passing.
- **Files Changed**: `lib/venv-manager.js`, `index.js`, `lib/zlibrary-api.js`, `__tests__/zlibrary-api.test.js`


## Test Fixtures
<!-- Append new fixtures using the format below -->

## Test Coverage Summary
<!-- Update coverage summary using the format below -->

## Test Plans (Driving Implementation)
<!-- Append new test plans using the format below -->

### Test Plan: Global Execution Fix (Venv & Import) - 2025-04-14 03:35:59
- **Objective**: Drive implementation of Managed Python Venv and fix Node.js SDK import.
- **Scope**: `index.js`, `lib/zlibrary-api.js`, new `lib/venv-manager.js`.
- **Test Cases**:
    - Case 1 (Failing): `index.js` loads without `ERR_PACKAGE_PATH_NOT_EXPORTED`. / Expected: No error / Status: Red (`__tests__/index.test.js`)
    - Case 2 (Failing): `VenvManager.findPythonExecutable` finds python3. / Expected: Path string / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 3 (Failing): `VenvManager.findPythonExecutable` throws if no python3. / Expected: Error thrown / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 4 (Failing): `VenvManager.createVenv` executes venv command. / Expected: Mocked command called / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 5 (Failing): `VenvManager.createVenv` handles errors. / Expected: Error thrown / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 6 (Failing): `VenvManager.installDependencies` executes pip install. / Expected: Mocked command called / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 7 (Failing): `VenvManager.installDependencies` handles errors. / Expected: Error thrown / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 8 (Failing): `VenvManager` saves config. / Expected: Mocked fs write called / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 9 (Failing): `VenvManager` loads config. / Expected: Mocked fs read called, returns path / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 10 (Failing): `VenvManager.ensureVenvReady` runs full flow. / Expected: Mocks called in sequence / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 11 (Failing): `VenvManager.ensureVenvReady` is idempotent. / Expected: Checks existing venv/config / Status: Red (`__tests__/venv-manager.test.js` - todo)
    - Case 12 (Failing): `zlibrary-api` uses pythonPath from `VenvManager`. / Expected: `PythonShell` called with correct path / Status: Red (`__tests__/zlibrary-api.test.js`)
- **Related Requirements**: SpecPseudo MB entry [2025-04-14 03:31:01], GlobalContext Pattern/Decision [2025-04-14 03:29:08/29]