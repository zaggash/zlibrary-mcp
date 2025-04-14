# Architect Specific Memory
<!-- Entries below should be added reverse chronologically (newest first) -->
## System Diagrams
<!-- Append new diagrams using the format below -->

### Diagram: Managed Python Venv for NPM Package - [2025-04-14 03:29:40]
- **Description**: Flowchart illustrating the setup and runtime process for automatically managing a Python virtual environment to ensure reliable execution of `python-bridge.py` with its `zlibrary` dependency when `zlibrary-mcp` is installed globally via NPM.
```mermaid
graph TD
    subgraph Installation/Setup (Post-install/First Run)
        A[NPM Install zlibrary-mcp] --> B{Python 3 Found?};
        B -- Yes --> C{Venv Exists @ Cache Path?};
        B -- No --> D[Fail: Instruct User to Install Python 3];
        C -- No --> E[Create Venv using Found Python 3];
        C -- Yes --> F[Verify Venv Integrity (Optional)];
        E --> G[Install zlibrary via venv pip];
        F --> G;
        G --> H[Store Absolute Path to venv Python];
    end

    subgraph Runtime Execution
        I[zlibrary-mcp needs Python bridge] --> J[Load Stored Venv Python Path];
        J -- Path Found --> K[Configure python-shell/spawn];
        J -- Path Not Found/Invalid --> L[Error: Setup Incomplete? Re-run Setup?];
        K -- pythonPath = venv/bin/python --> M[Execute python-bridge.py];
        M --> N[Python script runs in dedicated venv];
        N -- Accesses zlibrary --> O[Success: Return Result to Node.js];
        N -- Fails --> P[Error: Report Python Error to Node.js];
    end

    H --> J;
```
**Notes:** This approach balances reliability and user experience by automating the Python environment setup required for the `zlibrary` dependency, assuming the user has a base Python 3 installation.

## Data Models
<!-- Append new data models using the format below -->

## Interface Definitions
<!-- Append new interface definitions using the format below -->

## Component Specifications
<!-- Append new component specs using the format below -->