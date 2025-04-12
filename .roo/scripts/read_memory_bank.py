#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path

# --- Configuration ---
DEFAULT_MEMORY_PATH = "memory-bank"

# --- Helper Functions ---

def format_file_content(file_path: Path, base_path: Path) -> list[str]:
    """
    Reads a file and formats its content with line numbers and relative path.
    Returns a list of strings for the formatted output.
    """
    output_lines = []
    try:
        # Calculate relative path robustly
        relative_path = file_path.relative_to(base_path.parent) # Relative to parent of memory-bank
    except ValueError:
        # Fallback if not directly relative (shouldn't happen with standard structure)
        relative_path = file_path

    if file_path.is_file():
        output_lines.append(f"--- START FILE: {relative_path} ---")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if not lines:
                    output_lines.append("(File is empty)")
                else:
                    for i, line in enumerate(lines):
                        # Mimic the 'read_file' tool format
                        output_lines.append(f"{i + 1} | {line.rstrip()}")
        except Exception as e:
             output_lines.append(f"Error reading file {relative_path}: {e}")
        output_lines.append(f"--- END FILE: {relative_path} ---")
    else:
        # Optionally add a note if a file doesn't exist
        output_lines.append(f"--- INFO: File not found: {relative_path} ---")
    return output_lines

# --- Main Execution ---

def main():
    parser = argparse.ArgumentParser(description="Read and concatenate core and mode-specific memory bank files.")
    parser.add_argument("--mode-slug", required=True, help="The slug of the mode (e.g., 'code', 'tdd').")
    parser.add_argument("--memory-path", default=DEFAULT_MEMORY_PATH, help=f"Path to the memory-bank directory (default: {DEFAULT_MEMORY_PATH}).")
    args = parser.parse_args()

    memory_base_path = Path(args.memory_path).resolve() # Use resolve for robust path handling
    mode_slug = args.mode_slug

    if not memory_base_path.is_dir():
        print(f"❌ Error: Memory bank directory not found at '{memory_base_path}'", file=sys.stderr)
        sys.exit(1)

    # Define core files relative to memory_base_path
    core_files = [
        memory_base_path / "activeContext.md",
        memory_base_path / "globalContext.md",
    ]

    # Define mode-specific files relative to memory_base_path
    # Handle potential slug mismatches noted in Phase 1 (e.g., monitor vs post-deployment...)
    # We'll use the provided mode_slug for now, as the rules update in Phase 6 should fix this.
    mode_specific_file = memory_base_path / "mode-specific" / f"{mode_slug}.md"
    feedback_file = memory_base_path / "feedback" / f"{mode_slug}-feedback.md"

    files_to_read = core_files + [mode_specific_file, feedback_file]

    all_output_lines = []
    for file_path in files_to_read:
        all_output_lines.extend(format_file_content(file_path, memory_base_path))
        # Add a blank line between file contents for readability, unless the last was 'file not found'
        if all_output_lines and not all_output_lines[-1].startswith("--- INFO"):
             all_output_lines.append("")

    # Print the combined output to stdout
    # Ensure the last line is not an extra blank line if the last file was found
    if all_output_lines and all_output_lines[-1] == "":
        all_output_lines.pop()

    print("\n".join(all_output_lines))

if __name__ == "__main__":
    main()