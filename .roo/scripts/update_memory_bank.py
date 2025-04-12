#!/usr/bin/env python3
import argparse
import json
import yaml
import jsonschema
from pathlib import Path
from datetime import datetime
import sys
import subprocess # Keep for potential git commit functionality

# --- Configuration ---
DEFAULT_MEMORY_PATH = "memory-bank"
DEFAULT_CONFIG_PATH = ".roo/config"
SCHEMAS_FILE = "memory_schemas.yaml"
FORMATS_FILE = "memory_formats.yaml"

# --- Helper Functions ---

def load_yaml_config(file_path: Path) -> dict:
    """Loads a YAML file and returns its content."""
    if not file_path.is_file():
        print(f"❌ Error: Configuration file not found: {file_path}", file=sys.stderr)
        sys.exit(1)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"❌ Error loading YAML file {file_path}: {e}", file=sys.stderr)
        sys.exit(1)

def validate_data(data: dict, schema: dict) -> list:
    """Validates data against a JSON schema. Returns a list of validation errors."""
    errors = []
    validator = jsonschema.Draft7Validator(schema)
    for error in sorted(validator.iter_errors(data), key=str):
        errors.append(error.message)
    return errors

def format_content(data: dict, format_template: str) -> str:
    """Formats data using a Python format string template."""
    try:
        # Ensure timestamp is present for formatting
        if 'timestamp' not in data:
             data['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # Basic template rendering
        return format_template.format(**data) + "\n" # Add newline for separation
    except KeyError as e:
        print(f"⚠️ Warning: Missing key '{e}' in data for formatting. Template: '{format_template}'", file=sys.stderr)
        # Attempt partial formatting or return raw data? For now, return placeholder
        return f"Error formatting content: Missing key {e}\nRaw data: {json.dumps(data)}\n"
    except Exception as e:
        print(f"❌ Error formatting content: {e}", file=sys.stderr)
        return f"Error formatting content: {e}\nRaw data: {json.dumps(data)}\n"


def update_file(file_path: Path, content: str, append: bool) -> dict:
    """Updates a file with the provided content."""
    result = {"path": str(file_path), "success": False, "message": ""}
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        mode = 'a' if append else 'w'
        with open(file_path, mode, encoding='utf-8') as f:
            # Add a newline before appending if the file is not empty
            if append and file_path.exists() and file_path.stat().st_size > 0:
                 # Check if file already ends with a newline
                 with open(file_path, 'rb') as check_f:
                     check_f.seek(-1, 2) # Go to the last byte
                     if check_f.read(1) != b'\n':
                         f.write('\n') # Add newline if missing
            f.write(content)
        result["success"] = True
        result["message"] = f"{'Appended to' if append else 'Updated'} {file_path}"
    except Exception as e:
        result["message"] = f"Error updating {file_path}: {e}"
    return result

def get_repo_root(start_path: Path) -> Path | None:
    """Finds the git repository root directory."""
    current_path = start_path.resolve()
    while current_path.parent != current_path:
        if (current_path / ".git").exists():
            return current_path
        current_path = current_path.parent
    # Check the final path as well
    if (current_path / ".git").exists():
        return current_path
    return None

def run_git_commit(repo_root: Path, memory_base_path: Path, mode_slug: str, append: bool):
    """Stages and commits memory bank changes."""
    try:
        print(f"ℹ️ Attempting git commit in repository: {repo_root}")
        # Stage changes within the memory bank directory relative to repo root
        relative_memory_path = memory_base_path.relative_to(repo_root)
        subprocess.run(["git", "add", str(relative_memory_path)], check=True, cwd=repo_root, capture_output=True, text=True)

        # Check if there are staged changes
        status_result = subprocess.run(["git", "status", "--porcelain"], check=True, cwd=repo_root, capture_output=True, text=True)
        staged_files_in_memory = [line for line in status_result.stdout.splitlines() if line.startswith(('A ', 'M ', ' D')) and Path(line.split(maxsplit=1)[1]).is_relative_to(relative_memory_path)]

        if not staged_files_in_memory:
             print("ℹ️ No staged changes detected in memory bank. Skipping commit.")
             return

        # Commit with descriptive message
        commit_action = "Append to" if append else "Update"
        commit_msg = f"chore: {commit_action} memory bank for {mode_slug} mode"
        commit_result = subprocess.run(["git", "commit", "-m", commit_msg], check=True, cwd=repo_root, capture_output=True, text=True)
        print(f"✅ Committed changes to git: '{commit_msg}'")
        print(commit_result.stdout)

    except FileNotFoundError:
         print("❌ Error: 'git' command not found. Skipping commit.", file=sys.stderr)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during git operation: {e}", file=sys.stderr)
        print(f"Git stdout: {e.stdout}", file=sys.stderr)
        print(f"Git stderr: {e.stderr}", file=sys.stderr)
    except Exception as e:
        print(f"❌ An unexpected error occurred during git commit: {e}", file=sys.stderr)

# --- Main Execution ---

def main():
    parser = argparse.ArgumentParser(description="Update memory bank files using external configs and validation.")
    parser.add_argument("--mode-slug", required=True, help="The slug of the mode (e.g., 'code', 'tdd').")
    parser.add_argument("--memory-path", default=DEFAULT_MEMORY_PATH, help=f"Path to the memory-bank directory (default: {DEFAULT_MEMORY_PATH}).")
    parser.add_argument("--config-path", default=DEFAULT_CONFIG_PATH, help=f"Path to the config directory (default: {DEFAULT_CONFIG_PATH}).")

    # Arguments for specific memory sections (accept JSON strings)
    parser.add_argument("--active-context", help="JSON string for activeContext.md.")
    parser.add_argument("--global-context", help="JSON string for globalContext.md.")
    parser.add_argument("--mode-specific", help="JSON string for mode-specific/<mode-slug>.md.")
    parser.add_argument("--feedback", help="JSON string for feedback/<mode-slug>-feedback.md.")
    parser.add_argument("--maintenance", help="JSON string for maintenance.md.")

    # Corresponding keys to select the correct schema/format
    parser.add_argument("--active-context-key", default="default", help="Key for active context schema/format.")
    parser.add_argument("--global-context-key", help="Key for global context schema/format (required if --global-context is used).")
    parser.add_argument("--mode-specific-key", help="Key for mode-specific schema/format (required if --mode-specific is used).")
    parser.add_argument("--feedback-key", default="default", help="Key for feedback schema/format.")
    parser.add_argument("--maintenance-key", help="Key for maintenance schema/format (required if --maintenance is used).")

    parser.add_argument("--append", action="store_true", help="Append to files instead of overwriting (applies to all sections except active-context).")
    parser.add_argument("--commit", action="store_true", help="Automatically commit changes to git.")

    args = parser.parse_args()

    # --- Load Configurations ---
    config_base_path = Path(args.config_path)
    schemas_path = config_base_path / SCHEMAS_FILE
    formats_path = config_base_path / FORMATS_FILE

    all_schemas = load_yaml_config(schemas_path)
    all_formats = load_yaml_config(formats_path)

    memory_base_path = Path(args.memory_path)
    mode_slug = args.mode_slug
    results = []
    any_successful_update = False

    # --- Process Memory Sections ---
    sections_to_process = [
        ("active_context", args.active_context, args.active_context_key, memory_base_path / "activeContext.md", False), # Never append active context
        ("global_context", args.global_context, args.global_context_key, memory_base_path / "globalContext.md", args.append),
        ("mode_specific", args.mode_specific, args.mode_specific_key, memory_base_path / "mode-specific" / f"{mode_slug}.md", args.append),
        ("feedback", args.feedback, args.feedback_key, memory_base_path / "feedback" / f"{mode_slug}-feedback.md", args.append),
        ("maintenance", args.maintenance, args.maintenance_key, memory_base_path / "maintenance.md", args.append),
    ]

    for section_name, json_input, key, file_path, use_append in sections_to_process:
        if not json_input:
            continue

        if not key and section_name not in ["active_context", "feedback"]: # Keys are required for others
             print(f"❌ Error: --{section_name.replace('_', '-')}-key is required when using --{section_name.replace('_', '-')}.", file=sys.stderr)
             results.append({"path": str(file_path), "success": False, "message": f"Missing --{section_name.replace('_', '-')}-key"})
             continue

        # 1. Parse JSON
        try:
            data = json.loads(json_input)
            if not isinstance(data, dict):
                 raise ValueError("Input must be a JSON object.")
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON for --{section_name.replace('_', '-')}: {e}", file=sys.stderr)
            results.append({"path": str(file_path), "success": False, "message": f"Invalid JSON input: {e}"})
            continue
        except ValueError as e:
             print(f"❌ Error: {e} for --{section_name.replace('_', '-')}", file=sys.stderr)
             results.append({"path": str(file_path), "success": False, "message": str(e)})
             continue

        # Add/Ensure timestamp
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 2. Get Schema
        schema = None
        schema_source_key = section_name if section_name != "mode_specific" else mode_slug
        try:
            if schema_source_key in all_schemas and key in all_schemas[schema_source_key]:
                schema = all_schemas[schema_source_key][key]
            else:
                 print(f"❌ Error: Schema not found for section '{schema_source_key}', key '{key}' in {schemas_path}", file=sys.stderr)
                 results.append({"path": str(file_path), "success": False, "message": f"Schema not found for key '{key}'"})
                 continue
        except Exception as e:
             print(f"❌ Error accessing schema for section '{schema_source_key}', key '{key}': {e}", file=sys.stderr)
             results.append({"path": str(file_path), "success": False, "message": f"Error accessing schema: {e}"})
             continue

        # 3. Validate Data
        validation_errors = validate_data(data, schema)
        if validation_errors:
            print(f"❌ Validation failed for --{section_name.replace('_', '-')}, key '{key}':", file=sys.stderr)
            for error in validation_errors:
                print(f"  - {error}", file=sys.stderr)
            results.append({"path": str(file_path), "success": False, "message": f"Validation failed: {'; '.join(validation_errors)}"})
            continue

        # 4. Get Format Template
        format_template = None
        format_source_key = section_name if section_name != "mode_specific" else mode_slug
        try:
             if format_source_key in all_formats and key in all_formats[format_source_key]:
                 format_template = all_formats[format_source_key][key]
             # Handle potential nested structure like TDD Test Plans
             elif format_source_key in all_formats and isinstance(all_formats[format_source_key], dict):
                 # Check if the key exists within a nested dictionary
                 for sub_key, sub_value in all_formats[format_source_key].items():
                     if isinstance(sub_value, dict) and key in sub_value:
                         format_template = sub_value[key]
                         break
                     # Handle simple key-value at the top level of the mode format
                     elif sub_key == key and isinstance(sub_value, str):
                          format_template = sub_value
                          break

             if format_template is None:
                 print(f"❌ Error: Format template not found for section '{format_source_key}', key '{key}' in {formats_path}", file=sys.stderr)
                 results.append({"path": str(file_path), "success": False, "message": f"Format template not found for key '{key}'"})
                 continue
        except Exception as e:
             print(f"❌ Error accessing format template for section '{format_source_key}', key '{key}': {e}", file=sys.stderr)
             results.append({"path": str(file_path), "success": False, "message": f"Error accessing format template: {e}"})
             continue

        # 5. Format Content
        formatted_content = format_content(data, format_template)
        if "Error formatting content" in formatted_content: # Check if formatting failed
             results.append({"path": str(file_path), "success": False, "message": formatted_content.split('\n')[0]})
             continue

        # 6. Update File
        update_result = update_file(file_path, formatted_content, use_append)
        results.append(update_result)
        if update_result["success"]:
            any_successful_update = True

    # --- Print Results ---
    print("--- Update Results ---")
    for result in results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['message']}")

    # --- Handle Git Commit ---
    if args.commit and any_successful_update:
        repo_root = get_repo_root(memory_base_path)
        if repo_root:
            run_git_commit(repo_root, memory_base_path, mode_slug, args.append)
        else:
            print("❌ Not a git repository or repo root not found. Skipping commit.", file=sys.stderr)

    # Exit with error code if any update failed
    if not all(r["success"] for r in results if r): # Check if results list is not empty
         sys.exit(1)

if __name__ == "__main__":
    main()