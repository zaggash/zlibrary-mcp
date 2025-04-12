# Plan: Implement Enhanced Memory Bank System (v4)

This plan details the steps to implement an enhanced memory bank system featuring:
*   Reliance on external configuration for formats (`memory_formats.yaml`) and schemas (`memory_schemas.yaml`), which **you will create manually**.
*   JSON schema validation in update scripts.
*   Updated standard memory scripts (`read_memory_bank.py`, `update_memory_bank.py`) using external configs and validation.
*   Refined `.clinerules` files based on existing content, removing format definitions and updating script usage.
*   Improved `version_control.py` script with subcommands.

You will execute this plan step-by-step. Start with no prior context besides the files you are explicitly asked to read. Assume `.roo/config/memory_formats.yaml` and `.roo/config/memory_schemas.yaml` exist and are correctly populated before starting Phase 3.

**Phase 1: Initialization and Setup**

1.  **Goal:** Understand your tools, the existing scripts, relevant `.clinerules`, and the structure of the memory configuration files.
2.  **Action:** Read the following files to populate your context:
    *   `<read_file><path>.roo/.systemprompt</path></read_file>`
    *   `<read_file><path>.roo/scripts/update_memory_bank.py</path></read_file>` (Existing version)
    *   `<read_file><path>.roo/scripts/read_memory_bank.py</path></read_file>` (Existing version)
    *   `<read_file><path>.roo/scripts/feature_cycle_complete.py</path></read_file>` (Existing version, to be renamed)
    *   `<read_file><path>pyproject.toml</path></read_file>` (To check for dependencies)
    *   `<read_file><path>.roo/.roomodes</path></read_file>` (To identify all modes)
    *   **`<read_file><path>.roo/config/memory_formats.yaml</path></read_file>`** (User-created)
    *   **`<read_file><path>.roo/config/memory_schemas.yaml</path></read_file>`** (User-created)
    *   `<read_file><path>.roo/rules-sparc/.clinerules-sparc</path></read_file>`
    *   `<read_file><path>.roo/rules-code/.clinerules-code</path></read_file>`
    *   `<read_file><path>.roo/rules-tdd/.clinerules-tdd</path></read_file>`
    *   `<read_file><path>.roo/rules-debug/.clinerules-debug</path></read_file>`
    *   `<read_file><path>.roo/rules-security-review/.clinerules-security-review</path></read_file>`
    *   `<read_file><path>.roo/rules-docs-writer/.clinerules-docs-writer</path></read_file>`
    *   `<read_file><path>.roo/rules-integration/.clinerules-integration</path></read_file>`
    *   `<read_file><path>.roo/rules-post-deployment-monitoring-mode/.clinerules-post-deployment-mode</path></read_file>`
    *   `<read_file><path>.roo/rules-refinement-optimization-mode/.clinerules-refinement-optimization-mode</path></read_file>`
    *   `<read_file><path>.roo/rules-ask/.clinerules-ask</path></read_file>`
    *   `<read_file><path>.roo/rules-devops/.clinerules-devops</path></read_file>`
    *   `<read_file><path>.roo/rules-spec-pseudocode/.clinerules-spec-pseudocode</path></read_file>`
    *   `<read_file><path>.roo/rules-architect/.clinerules-architect</path></read_file>`
    *   `<read_file><path>.roo/rules-memory-bank-doctor/.clinerules-memory-bank-doctor</path></read_file>`
    *   (Add reads for any other mode `.clinerules` files identified from `.roomodes` if not listed above)

**Phase 2: Update Dependencies**

1.  **Goal:** Add necessary Python libraries (`PyYAML`, `jsonschema`).
2.  **Action:** Based on the `pyproject.toml` content read earlier:
    *   If using Poetry: Add `PyYAML = "^6.0"` and `jsonschema = "^4.17"` (or latest stable) under `[tool.poetry.dependencies]`. Use `<apply_diff>`.
        ````diff
        // filepath: pyproject.toml
        <<<<<<< SEARCH
        :start_line:X // Find the start line of [tool.poetry.dependencies]
        :end_line:Y // Find the end line of [tool.poetry.dependencies]
        -------
        [tool.poetry.dependencies]
        # ... existing dependencies ...
        =======
        [tool.poetry.dependencies]
        # ... existing dependencies ...
        PyYAML = "^6.0.1"
        jsonschema = "^4.22.0" # Use latest stable
        >>>>>>> REPLACE
        ````
    *   If using `requirements.txt`: Add `PyYAML>=6.0` and `jsonschema>=4.17` to the file. Use `<apply_diff>`.
        ````diff
        // filepath: requirements.txt
        <<<<<<< SEARCH
        :start_line:1
        :end_line:Z // End of file
        -------
        # Existing requirements...
        =======
        # Existing requirements...
        PyYAML>=6.0.1
        jsonschema>=4.22.0
        >>>>>>> REPLACE
        ````
3.  **Instruction:** Inform the user: "Dependencies `PyYAML` and `jsonschema` added to project configuration. Please run `poetry install` or `pip install -r requirements.txt` to install them."

**Phase 3: Implement `update_memory_bank.py` (High-Level Requirements)**

1.  **Goal:** Refactor the script to use external formats, validate input using schemas, and handle section-based updates correctly.
2.  **Action:** Overwrite `.roo/scripts/update_memory_bank.py` using `write_to_file` with pseudocode/requirements outlining the following structure (ensure it correctly loads and uses the config files read in Phase 1):
    ````pseudocode
    # filepath: /home/rookslog/zlibrary-mcp/.roo/scripts/update_memory_bank.py
    # High-Level Requirements & Pseudocode

    # Imports: argparse, json, os, pathlib, datetime, sys, yaml, jsonschema, typing

    # Define Constants:
    #   ROOT_DIR = Path(__file__).resolve().parent.parent # .roo/
    #   CONFIG_DIR = ROOT_DIR / 'config'
    #   FORMATS_FILE_PATH = CONFIG_DIR / 'memory_formats.yaml'
    #   SCHEMAS_FILE_PATH = CONFIG_DIR / 'memory_schemas.yaml'
    #   DEFAULT_MEMORY_PATH = ROOT_DIR / "memory-bank" # Or relative "memory-bank"

    # Global Variables:
    #   MEMORY_FORMATS = {}
    #   MEMORY_SCHEMAS = {}

    function load_config_yaml(config_path, config_name):
        # Input: Path object for config file, string name for logging
        # Output: Dictionary of loaded config or empty dict on error
        # Behavior:
        #   Check if config_path exists. Print error and return {} if not.
        #   Try opening and loading YAML using yaml.safe_load().
        #   Handle YAMLError and other exceptions, print error, return {}.
        #   Return loaded data (or {} if empty).

    function render_content(payload_data, format_template):
        # Input: Dictionary payload, string template
        # Output: Rendered markdown string or error string
        # Behavior:
        #   If 'timestamp' not in payload_data, add current UTC timestamp (ISO format).
        #   Iterate through payload_data keys:
        #       Replace "{key}" in format_template with value.
        #       Handle lists by joining with "- " prefix.
        #       Handle dicts by converting to JSON string (optional).
        #       Convert other values to string.
        #   Return rendered string + "\n\n".
        #   Handle exceptions, print error, return error message.

    function update_file(file_path, content, append):
        # Input: Path object, string content, boolean append flag
        # Output: Dictionary {path: str, success: bool, message: str}
        # Behavior:
        #   Create parent directories for file_path if they don't exist.
        #   Open file_path in 'a' (append) or 'w' (write) mode.
        #   If appending and file exists and is not empty, write a newline separator first.
        #   Write content to file.
        #   Return success status dictionary.
        #   Handle exceptions, return error status dictionary.

    function get_format_and_schema_keys(args):
        # Input: Parsed arguments object
        # Output: Tuple (category_string | None, key_string | None, json_payload_string | None)
        # Behavior:
        #   Check args in order: --mode-specific, --global-context, --feedback, --maintenance, --active-context.
        #   For the first one found:
        #       Check if its corresponding --*-key argument is provided (if required, e.g., for global, mode-specific, maintenance). Print error and return (None, None, None) if missing.
        #       Return (category_name, key_name, json_payload_string).
        #       Use mode_slug for category if --mode-specific.
        #       Use "default" key if --active-context-key or --feedback-key not provided.
        #   If none found, return (None, None, None).

    function validate_payload(payload_data, schema_category, schema_key):
        # Input: Dictionary payload, string category, string key
        # Output: None if valid, string error message if invalid
        # Behavior:
        #   Check if MEMORY_SCHEMAS is loaded. Return error if not.
        #   Get schema = MEMORY_SCHEMAS.get(schema_category, {}).get(schema_key).
        #   Return error if schema not found or not a dictionary.
        #   Try jsonschema.validate(instance=payload_data, schema=schema).
        #   Catch ValidationError: format helpful error message including path and return it.
        #   Catch other exceptions: return generic error message.
        #   Return None if validation succeeds.

    function main():
        # Load Formats & Schemas:
        #   MEMORY_FORMATS = load_config_yaml(FORMATS_FILE_PATH, "formats")
        #   MEMORY_SCHEMAS = load_config_yaml(SCHEMAS_FILE_PATH, "schemas")
        #   If either fails, print error and sys.exit(1).

        # Setup Argument Parser:
        #   Add --mode-slug (required)
        #   Add --memory-path (default="memory-bank")
        #   Add --append (action="store_true")
        #   Add update arguments (mutually exclusive conceptually):
        #       --active-context (JSON string), --active-context-key (default="default")
        #       --global-context (JSON string), --global-context-key (required if --global-context)
        #       --mode-specific (JSON string), --mode-specific-key (required if --mode-specific)
        #       --feedback (JSON string), --feedback-key (default="default")
        #       --maintenance (JSON string), --maintenance-key (required if --maintenance)
        #   Parse args.

        # Check Memory Path:
        #   memory_base_path = Path(args.memory_path)
        #   If not memory_base_path.is_dir(), print error and sys.exit(1).

        # Determine Update Type:
        #   schema_category, specific_key, json_payload_str = get_format_and_schema_keys(args)
        #   If any are None (due to missing args or required keys), print error and sys.exit(1).
        #   Check if multiple update args were provided; if so, print error and sys.exit(1).

        # Determine Target File:
        #   is_append = args.append
        #   Based on schema_category:
        #       if "active_context": target_file = memory_base_path / "activeContext.md"; is_append = False
        #       if "global_context": target_file = memory_base_path / "globalContext.md"
        #       if "feedback": target_file = memory_base_path / "feedback" / f"{args.mode_slug}-feedback.md"
        #       if "maintenance": target_file = memory_base_path / "maintenance.md"
        #       else (mode-specific): target_file = memory_base_path / "mode-specific" / f"{schema_category}.md" # Category is the slug

        # Parse JSON Payload:
        #   Try json.loads(json_payload_str).
        #   Catch JSONDecodeError, print error (including payload string), sys.exit(1).
        #   Ensure result is a dictionary. If not, print error, sys.exit(1).

        # Validate Payload:
        #   validation_error = validate_payload(payload_data, schema_category, specific_key)
        #   If validation_error: print error (including payload), sys.exit(1).

        # Get Format Template:
        #   format_template = MEMORY_FORMATS.get(schema_category, {}).get(specific_key)
        #   If not format_template or not isinstance(format_template, str): print error, sys.exit(1).

        # Render Content:
        #   rendered_markdown = render_content(payload_data, format_template)
        #   If rendering failed (check for error string), sys.exit(1).

        # Update File:
        #   result = update_file(target_file, rendered_markdown, is_append)
        #   Print result status (success/failure message).
        #   If result["success"] is False, sys.exit(1).

    # Call main() if script is executed directly
    ````

**Phase 4: Implement `read_memory_bank.py` (High-Level Requirements)**

1.  **Goal:** Refactor the script to read the standard set of memory files.
2.  **Action:** Overwrite `.roo/scripts/read_memory_bank.py` using `write_to_file` with pseudocode/requirements outlining the following structure:
    ````pseudocode
    # filepath: /home/rookslog/zlibrary-mcp/.roo/scripts/read_memory_bank.py
    # High-Level Requirements & Pseudocode

    # Imports: argparse, os, pathlib, sys

    # Define Constants:
    #   ROOT_DIR = Path(__file__).resolve().parent.parent # .roo/
    #   DEFAULT_MEMORY_PATH = ROOT_DIR / "memory-bank" # Or relative "memory-bank"

    function format_file_content(file_path, base_dir):
        # Input: Path object for file, Path object for base directory (for relative paths)
        # Output: List of strings (formatted lines)
        # Behavior:
        #   If file_path exists:
        #       Calculate relative_path = file_path.relative_to(base_dir).
        #       Start output list with "--- START FILE: {relative_path} ---".
        #       Try reading file line by line:
        #           Append "{line_number} | {line_content.rstrip()}" to output list.
        #       Catch exceptions, append error message.
        #       Append "--- END FILE: {relative_path} ---".
        #   Return output list.

    function main():
        # Setup Argument Parser:
        #   Add --mode-slug (required)
        #   Add --memory-path (default="memory-bank")
        #   Parse args.

        # Check Memory Path:
        #   memory_base_path = Path(args.memory_path)
        #   If not memory_base_path.is_dir(), print error and sys.exit(1).

        # Define Files to Read:
        #   core_files = [ memory_base_path / "activeContext.md", memory_base_path / "globalContext.md" ]
        #   mode_specific_file = memory_base_path / "mode-specific" / f"{args.mode_slug}.md"
        #   feedback_file = memory_base_path / "feedback" / f"{args.mode_slug}-feedback.md"
        #   files_to_read = core_files + [mode_specific_file, feedback_file]

        # Read and Format Files:
        #   all_output_lines = []
        #   workspace_root = Path.cwd() # Base for relative paths
        #   For each file_path in files_to_read:
        #       absolute_file_path = file_path if file_path.is_absolute() else workspace_root / file_path
        #       formatted_lines = format_file_content(absolute_file_path, workspace_root)
        #       all_output_lines.extend(formatted_lines)
        #       If formatted_lines is not empty, append "" (blank line separator).

        # Print Combined Output:
        #   Print "\n".join(all_output_lines)

    # Call main() if script is executed directly
    ````

**Phase 5: Refine `version_control.py` (High-Level Requirements)**

1.  **Goal:** Rename `feature_cycle_complete.py` and enhance its functionality with subcommands (`commit`, `tag`, `branch`, `status`).
2.  **Action:** Rename the file.
    *   `<run_command><command>mv .roo/scripts/feature_cycle_complete.py .roo/scripts/version_control.py</command></run_command>`
3.  **Action:** Overwrite `.roo/scripts/version_control.py` using `write_to_file` with pseudocode/requirements outlining the following structure:
    ````pseudocode
    # filepath: /home/rookslog/zlibrary-mcp/.roo/scripts/version_control.py
    # High-Level Requirements & Pseudocode

    # Imports: argparse, subprocess, os, pathlib, datetime, sys, typing

    function run_git_command(command_list, cwd):
        # Input: List of command parts (strings), Path object for working directory
        # Output: Tuple (stdout_str, stderr_str, exit_code_int)
        # Behavior:
        #   Run subprocess.run(['git'] + command_list, ...)
        #   Capture output, handle errors (FileNotFound, general exceptions).
        #   Return stdout, stderr, returncode.

    function get_repo_root(start_path):
        # Input: Path object
        # Output: Path object for repo root or None
        # Behavior:
        #   Traverse up from start_path until ".git" directory is found.
        #   Return the path containing ".git" or None if not found.

    function handle_commit(args, repo_root):
        # Input: Parsed args, Path repo root
        # Output: Exit code (0 for success, 1 for failure)
        # Behavior:
        #   Check git status --porcelain. If error or no changes, print message and return 0 or 1.
        #   Run git add .
        #   Construct commit message (with optional semantic prefix).
        #   Run git commit -m "message". Handle errors (including "nothing to commit").
        #   Print success/error messages. Return 0 or 1.

    function handle_tag(args, repo_root):
        # Input: Parsed args, Path repo root
        # Output: Exit code (0 for success, 1 for failure)
        # Behavior:
        #   Get tag_name and message from args.
        #   Run git tag -a tag_name -m "message". Handle errors.
        #   Print success/error messages. Return 0 or 1.

    function handle_branch(args, repo_root):
        # Input: Parsed args, Path repo root
        # Output: Exit code (0 for success, 1 for failure)
        # Behavior:
        #   Get branch_name from args.
        #   Run git checkout -b branch_name.
        #   If error (e.g., branch exists), try git checkout branch_name.
        #   Print success/error messages. Return 0 or 1.

    function handle_status(args, repo_root):
        # Input: Parsed args, Path repo root
        # Output: Exit code (0 for success, 1 for failure)
        # Behavior:
        #   Run git status. Handle errors.
        #   Print stdout. Return 0 or 1.

    function main():
        # Setup Argument Parser with Subparsers:
        #   Create main parser.
        #   Add subparsers for 'commit', 'tag', 'branch', 'status'.
        #   Define arguments for each subcommand:
        #       commit: -m/--message (required), --semantic-prefix
        #       tag: tag_name (positional, required), -m/--message
        #       branch: branch_name (positional, required)
        #       status: (no arguments)
        #   Parse args.

        # Find Repo Root:
        #   repo_root = get_repo_root(Path.cwd())
        #   If not repo_root, print error and sys.exit(1).

        # Dispatch to Handler:
        #   Based on args.command, call the corresponding handle_* function.
        #   Store the exit code returned by the handler.

        # Exit:
        #   sys.exit(exit_code)

    # Call main() if script is executed directly
    ````

**Phase 6: Update `.clinerules` Files**

1.  **Goal:** Update all mode rules to use the new scripts, remove embedded format definitions, and guide JSON payload usage based on the schemas (read in Phase 1).
2.  **Action:** For *each* mode listed in `.roo/.roomodes` (use the attached `.roomodes` file content):
    *   Identify the corresponding `.clinerules` file path (e.g., `.roo/rules-code/.clinerules-code`). Use the attached `.clinerules` files as reference for paths and existing content.
    *   Use `<read_file>` to get the current content of the specific `.clinerules` file.
    *   Use `<apply_diff>` to apply the following modifications:
        *   **Remove** specific format definition blocks (e.g., `implementation_format: |`, `findings_format: |`, etc.) entirely.
        *   **Update `memory_bank_strategy.initialization`:**
            *   Modify the `<read_file>` commands in `if_memory_bank_exists:` to use the single `read_memory_bank.py` script:
                ```diff
                // filepath: /path/to/.clinerules-MODE
                <<<<<<< SEARCH
                :start_line:X // Find start of if_memory_bank_exists
                :end_line:Y // Find end of if_memory_bank_exists
                -------
                  if_memory_bank_exists: |
                      1. Read Global & Active Files: `memory-bank/activeContext.md`, `memory-bank/globalContext.md` (WAIT after each)
                      2. Read Mode-Specific & Feedback: `memory-bank/mode-specific/[MODE_SLUG].md`, `memory-bank/feedback/[MODE_SLUG]-feedback.md` (WAIT after each, if exists)
                      3. Activation: Set status '[MEMORY BANK: ACTIVE]', inform user, apply feedback.
                =======
                  if_memory_bank_exists: |
                      1. **Read Memory Bank:** <run_command><command>python .roo/scripts/read_memory_bank.py --mode-slug [MODE_SLUG]</command></run_command> # WAIT
                      2. **Activation:** Set status '[MEMORY BANK: ACTIVE]', inform user "Memory Bank loaded.", apply feedback.
                >>>>>>> REPLACE
                ```
                (Replace `[MODE_SLUG]` with the actual slug for the file being modified).
        *   **Update `memory_bank_updates.update_process` and `umb:` instructions:**
            *   Replace existing multi-step file update instructions with guidance on using `update_memory_bank.py`.
            *   Instruct usage with JSON payloads and `--*-key` arguments (e.g., `--mode-specific '{...}' --mode-specific-key "KeyName"`).
            *   Provide clear examples referencing the expected schema structure (from `memory_schemas.yaml`).
            *   Emphasize using `--append` for log-like entries (mode-specific, global, feedback) and *not* for `--active-context`.
    *   **Example Diff Snippet for `.clinerules-code` `update_process`:**
        ````diff
        // filepath: /home/rookslog/zlibrary-mcp/.roo/rules-code/.clinerules-code
        <<<<<<< SEARCH
        :start_line:X // Find start of memory_bank_updates.update_process
        :end_line:Y // Find end of memory_bank_updates.update_process
        -------
          update_process: |
              1. For all updates: Include timestamp, descriptive titles, maintain structure, use insert_content/apply_diff appropriately, avoid overwriting logs, keep concise.
              2. File-Specific Updates: Update `activeContext.md` and relevant sections in `globalContext.md`. Update `memory-bank/mode-specific/code.md` under appropriate headers. Cross-reference if needed.
        =======
          update_process: |
              1. **Identify Target & Key:** Determine section (e.g., mode-specific) & schema/format key (e.g., `Implementation Notes` from `memory_formats.yaml`).
              2. **Construct JSON:** Create JSON object matching the schema defined in `memory_schemas.yaml` for the chosen key. Include `timestamp` if not automatically added by the format.
              3. **Escape JSON:** Escape the JSON string for command line use (e.g., using single quotes around the JSON).
              4. **Use `update_memory_bank.py`:** Call via `<run_command>`.
                 - Provide `--mode-slug code`.
                 - Use the target section argument (e.g., `--mode-specific`, `--active-context`, `--global-context`).
                 - Provide the escaped JSON string as the argument value.
                 - Provide the schema/format key via the corresponding `--*-key` argument (e.g., `--mode-specific-key "Implementation Notes"`). Use "default" for active_context/feedback keys unless specified otherwise in configs.
                 - Use `--append` for log-like entries (mode-specific, global context sections like Decision Log, feedback). **Do NOT use `--append` for `--active-context`**.
              5. **Example (Logging Implementation Notes):**
                 ```xml
                 <run_command>
                   <command>python .roo/scripts/update_memory_bank.py --mode-slug code --mode-specific '{"component": "Auth Module", "approach": "JWT based", "files_modified": ["src/auth.py"], "notes": "Initial implementation."}' --mode-specific-key "Implementation Notes" --append</command>
                 </run_command>
                 ```
              6. **Example (Updating Active Context):**
                 ```xml
                 <run_command>
                   <command>python .roo/scripts/update_memory_bank.py --mode-slug code --active-context '{"title": "Refactor Database Connection", "focus": "Applying connection pooling", "status": "In Progress"}' --active-context-key "default"</command>
                 </run_command>
                 ```
        >>>>>>> REPLACE

        <<<<<<< SEARCH
        :start_line:X // Find start of mode_specific_updates section
        :end_line:Y // Find end of mode_specific_updates section (including all *_format definitions)
        -------
          mode_specific_updates:
            target_file: memory-bank/mode-specific/code.md
            structure: |
              # Code Specific Memory
              ## Implementation Notes
              ## Technical Debt Log
              ## Dependencies Log
              ## Code Patterns Log
            implementation_format: |
              ### Implementation: [Feature/Component] - [YYYY-MM-DD HH:MM:SS]
              # ... etc ...
            tech_debt_format: |
              ### Tech Debt: [Issue Name/ID] - [Status: Open|Resolved] - [YYYY-MM-DD HH:MM:SS]
              # ... etc ...
            dependencies_format: |
              ### Dependency: [Dependency Name] - [YYYY-MM-DD HH:MM:SS]
              # ... etc ...
            code_patterns_format: |
              ### Code Pattern: [Pattern Name] - [YYYY-MM-DD HH:MM:SS]
              # ... etc ...
        =======
          mode_specific_updates:
            target_file: memory-bank/mode-specific/code.md
            structure: |
              # Code Specific Memory

              ## Implementation Notes
              <!-- Use --mode-specific-key "Implementation Notes". Schema requires: component, approach. Optional: files_modified, notes, timestamp. -->

              ## Technical Debt Log
              <!-- Use --mode-specific-key "Technical Debt Log". Schema requires: debt_id, status, location, description. Optional: priority, timestamp. -->

              ## Dependencies Log
              <!-- Use --mode-specific-key "Dependencies Log". Schema requires: dependency_name, version. Optional: purpose, timestamp. -->

              ## Code Patterns Log
              <!-- Use --mode-specific-key "Code Patterns Log". Schema requires: pattern_name. Optional: description, example_usage, timestamp. -->
        >>>>>>> REPLACE

        <<<<<<< SEARCH
        :start_line:X // Find start of umb: instructions
        :end_line:Y // Find end of umb: instructions
        -------
          instructions: |
              1. Halt Current Task. Acknowledge Command: '[MEMORY BANK: UPDATING]'. Review Chat History.
              2. Temporary God-Mode Activation.
              3. Core Update Process: Update `activeContext.md` and `globalContext.md`. Update `memory-bank/mode-specific/code.md` under relevant headers. Update feedback file. Ensure consistency.
              4. Confirm Completion: '[MEMORY BANK: UPDATED]'.
        =======
          instructions: |
              1. Halt. Acknowledge: '[MEMORY BANK: UPDATING]'. Review History.
              2. Construct JSON payloads for relevant sections (e.g., activeContext, mode-specific, feedback) matching schemas in `memory_schemas.yaml`.
              3. Call `update_memory_bank.py` via `<run_command>` for each update. Use appropriate args (`--active-context`, `--mode-specific`, etc.), keys (`--*-key`), and JSON payloads. Use `--append` for log-like entries (mode-specific, feedback, specific global sections).
              4. Example: Update active context and log implementation notes.
                 ```xml
                 <run_command><command>python .roo/scripts/update_memory_bank.py --mode-slug code --active-context '{"title": "Finalizing Feature X", "focus": "Updating memory bank", "status": "Complete"}' --active-context-key "default"</command></run_command>
                 <run_command><command>python .roo/scripts/update_memory_bank.py --mode-slug code --mode-specific '{"component": "Feature X", "approach": "Finalized based on review", "files_modified": ["src/feature_x.py"], "notes": "Ready for integration."}' --mode-specific-key "Implementation Notes" --append</command></run_command>
                 ```
              5. Confirm: '[MEMORY BANK: UPDATED]'.
        >>>>>>> REPLACE
        ````
    *   Repeat this process carefully for *every* mode's `.clinerules` file identified from `.roomodes`.

**Phase 7: Finalization**

1.  **Goal:** Ensure the system is ready and inform the user.
2.  **Action:** Inform the user: "Implementation complete. Dependencies (`PyYAML`, `jsonschema`) added. Please run your dependency manager (`poetry install` or `pip install -r requirements.txt`). The memory bank system now uses external configuration (`memory_formats.yaml`, `memory_schemas.yaml` - which you created), schema validation, and updated scripts. `.clinerules` files are updated to use the new scripts and JSON-based updates. The version control script (`version_control.py`) is updated with subcommands."
3.  **Action (Optional):** Suggest committing the changes using the newly updated script:
    *   `<run_command><command>python .roo/scripts/version_control.py commit --semantic-prefix feat --message "Implement enhanced memory bank system with validation and external configs"</command></run_command>`

This revised plan removes the config file creation step, adds reading them to Phase 1, and ensures subsequent phases correctly reference this setup.