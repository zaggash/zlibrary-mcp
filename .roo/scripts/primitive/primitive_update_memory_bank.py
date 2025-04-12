#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path
import datetime
import sys
import yaml # Requires PyYAML: pip install pyyaml

# --- Configuration ---
# Path to the main memory formats file (relative to this script's location)
# Assumes this script is in .roo/scripts/primitive/ and formats are in .roo/config/
FORMATS_FILE_PATH = Path(__file__).resolve().parent.parent.parent / 'config' / 'memory_formats.yaml'
DEFAULT_MEMORY_PATH = "memory-bank"
# --- End Configuration ---

def load_formats(formats_file: Path) -> dict:
    """Loads the format templates from the YAML file."""
    if not formats_file.is_file():
        print(f"Error: Formats file not found at {formats_file}", file=sys.stderr)
        return {}
    try:
        with open(formats_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading formats from {formats_file}: {e}", file=sys.stderr)
        return {}

def render_content(data: dict, format_template: str) -> str:
    """Renders data using a format template string."""
    try:
        # Add timestamp if not present
        if 'timestamp' not in data:
            data['timestamp'] = datetime.datetime.now().strftime("%Y-%m-%DD %H:%M:%S")
        # Basic placeholder replacement
        content = format_template
        for key, value in data.items():
            placeholder = "{" + key + "}"
            # Handle lists/arrays by joining them
            if isinstance(value, list):
                value_str = ", ".join(map(str, value)) if value else "N/A"
            else:
                value_str = str(value) if value is not None else ""
            content = content.replace(placeholder, value_str)
        # Clean up any unused placeholders (optional)
        # import re
        # content = re.sub(r'\{[^{}]+\}', '', content)
        return content.strip() + "\n" # Ensure trailing newline
    except Exception as e:
        print(f"Error rendering content: {e}. Data: {data}", file=sys.stderr)
        return f"Error rendering content: {e}\n"

def update_file(file_path: Path, content: str, append: bool = False) -> dict:
    """Updates a file with the provided content."""
    result = {"path": str(file_path), "success": False, "message": ""}
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        mode = 'a' if append else 'w'
        with open(file_path, mode, encoding='utf-8') as f:
            f.write(content)
        result["success"] = True
        result["message"] = f"{'Appended to' if append else 'Updated'} {file_path}"
    except Exception as e:
        result["message"] = f"Error updating {file_path}: {e}"
    return result

def get_format_key(args) -> tuple[str | None, str | None]:
    """Determine the primary format key based on which argument is present."""
    if args.mode_specific:
        return args.mode_slug, args.mode_specific_key
    if args.global_context:
        return "global_context", args.global_context_key
    if args.feedback:
        return "feedback", "default" # Feedback usually has a default format
    if args.maintenance:
        return "maintenance", args.maintenance_key # e.g., Maintenance Log, Known Issues
    if args.active_context:
        return "active_context", "default" # Active context usually has a default format
    return None, None

def main():
    parser = argparse.ArgumentParser(description="[PRIMITIVE] Update memory bank files using JSON payloads and format templates.")
    parser.add_argument("--mode-slug", required=True, help="The slug of the mode (e.g., 'system-strategist').")
    parser.add_argument("--memory-path", default=DEFAULT_MEMORY_PATH, help="Path to the memory-bank directory.")

    # Arguments for different memory sections, accepting JSON strings
    parser.add_argument("--active-context", help="JSON string for activeContext.md update.")
    parser.add_argument("--global-context", help="JSON string for globalContext.md update.")
    parser.add_argument("--global-context-key", help="Specific format key under 'global_context' in formats YAML (e.g., 'Decision Log'). Required if --global-context is used.")
    parser.add_argument("--mode-specific", help="JSON string for mode-specific/<mode-slug>.md update.")
    parser.add_argument("--mode-specific-key", help="Specific format key under the mode slug in formats YAML (e.g., 'Improvement Analysis Log'). Required if --mode-specific is used.")
    parser.add_argument("--feedback", help="JSON string for feedback/<mode-slug>-feedback.md update (uses 'feedback.default' format).")
    parser.add_argument("--maintenance", help="JSON string for maintenance.md update.")
    parser.add_argument("--maintenance-key", help="Specific format key under 'maintenance' in formats YAML (e.g., 'Maintenance Log'). Required if --maintenance is used.")

    parser.add_argument("--append", action="store_true", help="Append to files instead of overwriting (default for logs, ignored for activeContext).")
    # No --commit option for primitive script

    args = parser.parse_args()

    memory_base_path = Path(args.memory_path)
    mode_slug = args.mode_slug
    results = []

    if not memory_base_path.is_dir():
        print(f"Error: Memory bank directory not found at '{memory_base_path}'", file=sys.stderr)
        sys.exit(1)

    # Load formats
    formats = load_formats(FORMATS_FILE_PATH)
    if not formats:
        sys.exit(1) # Exit if formats failed to load

    # Determine which section to update and get the format key
    primary_format_category, specific_format_key = get_format_key(args)
    json_payload_str = None
    target_file = None
    is_append = args.append

    # --- MODIFIED SECTION ---
    if primary_format_category == "active_context":
        json_payload_str = args.active_context
        target_file = memory_base_path / "activeContext.md"
        is_append = False # Never append to active context
    elif primary_format_category == "global_context":
        if not args.global_context_key:
            print("Error: --global-context-key is required when using --global-context.", file=sys.stderr)
            sys.exit(1)
        json_payload_str = args.global_context
        target_file = memory_base_path / "globalContext.md"
    # elif primary_format_category == "mode_specific": # <<< OLD CHECK
    elif primary_format_category == args.mode_slug: # <<< NEW CHECK: Handle mode-specific case where category IS the slug
        if not args.mode_specific_key:
            print("Error: --mode-specific-key is required when using --mode-specific.", file=sys.stderr)
            sys.exit(1)
        json_payload_str = args.mode_specific
        # Use the category (which is the mode slug) to build the path
        target_file = memory_base_path / "mode-specific" / f"{primary_format_category}.md"
    elif primary_format_category == "feedback":
        json_payload_str = args.feedback
        target_file = memory_base_path / "feedback" / f"{mode_slug}-feedback.md"
    elif primary_format_category == "maintenance":
        if not args.maintenance_key:
             print("Error: --maintenance-key is required when using --maintenance.", file=sys.stderr)
             sys.exit(1)
        json_payload_str = args.maintenance
        target_file = memory_base_path / "maintenance.md"
    # --- END MODIFIED SECTION ---

    if not json_payload_str or not target_file or not primary_format_category or not specific_format_key:
        print("Error: No valid update argument provided or missing required key (e.g., --global-context-key).", file=sys.stderr)
        # Print help if no valid args?
        # parser.print_help()
        sys.exit(1)

    # Parse JSON payload
    try:
        payload_data = json.loads(json_payload_str)
        if not isinstance(payload_data, dict):
            raise ValueError("JSON payload must be an object.")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON provided for --{primary_format_category.replace('_', '-')}: {e}", file=sys.stderr)
        print(f"Received: {json_payload_str}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


    # Get the format template
    format_template = formats.get(primary_format_category, {}).get(specific_format_key)

    if not format_template:
        print(f"Error: Format template not found for key '{primary_format_category}.{specific_format_key}' in {FORMATS_FILE_PATH}", file=sys.stderr)
        sys.exit(1)

    # Render content
    rendered_markdown = render_content(payload_data, format_template)

    # Update the target file
    result = update_file(target_file, rendered_markdown, is_append)
    results.append(result)

    # Print results
    for res in results:
        status = "✅" if res["success"] else "❌"
        print(f"{status} {res['message']}")

    if not all(r["success"] for r in results):
        sys.exit(1) # Exit with error if any update failed

if __name__ == "__main__":
    main()