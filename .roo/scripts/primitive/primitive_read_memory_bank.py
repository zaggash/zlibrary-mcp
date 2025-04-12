#!/usr/bin/env python3
import argparse
import os
from pathlib import Path

# def format_file_content(file_path: Path) -> list[str]:
def format_file_content(file_path: Path, base_dir: Path) -> list[str]:
    """Reads a file and formats its content with line numbers relative to a base directory."""
    output_lines = []
    if file_path.is_file():
        # output_lines.append(f"--- START FILE: {file_path.relative_to(Path.cwd())} ---")
        output_lines.append(f"--- START FILE: {file_path.relative_to(base_dir)} ---")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for i, line in enumerate(f):
                    # Mimic the 'read_file' tool format
                    output_lines.append(f"{i + 1} | {line.rstrip()}")
        except Exception as e:
             output_lines.append(f"Error reading file {file_path}: {e}")
        # output_lines.append(f"--- END FILE: {file_path.relative_to(Path.cwd())} ---")
        output_lines.append(f"--- END FILE: {file_path.relative_to(base_dir)} ---")
    # else:
        # Optionally add a note if a file doesn't exist
        # output_lines.append(f"--- INFO: File not found: {file_path.relative_to(Path.cwd())} ---")
    return output_lines

def main():
    parser = argparse.ArgumentParser(description="Concatenate core and mode-specific memory bank files.")
    parser.add_argument("--mode-slug", required=True, help="The slug of the mode (e.g., 'code', 'tdd').")
    parser.add_argument("--memory-path", default="memory-bank", help="Path to the memory-bank directory.")
    args = parser.parse_args()

    # Use resolve() to ensure memory_base_path is absolute
    memory_base_path = Path(args.memory_path).resolve()
    mode_slug = args.mode_slug
    workspace_root = Path.cwd() # Get current working directory as base for relative paths

    if not memory_base_path.is_dir():
        # Use relative path for error message if original was relative
        print(f"Error: Memory bank directory not found at '{args.memory_path}'")
        # Use sys.exit(1) for error exit
        import sys
        sys.exit(1)

    # Define core files relative to memory_base_path
    core_files = [
        memory_base_path / "activeContext.md",
        memory_base_path / "globalContext.md",
    ]

    # Define mode-specific files relative to memory_base_path
    mode_specific_file = memory_base_path / "mode-specific" / f"{mode_slug}.md"
    feedback_file = memory_base_path / "feedback" / f"{mode_slug}-feedback.md"

    files_to_read = core_files + [mode_specific_file, feedback_file]

    all_output_lines = []
    for file_path in files_to_read:
        # file_path is already absolute because memory_base_path is resolved
        # Pass the absolute path and the workspace root to the formatting function
        # all_output_lines.extend(format_file_content(file_path))
        all_output_lines.extend(format_file_content(file_path, workspace_root))
        # Add a blank line between file contents for readability
        # Check if content was actually added before adding a blank line
        if all_output_lines and all_output_lines[-1].startswith("--- END FILE"):
             all_output_lines.append("") # Add separator line

    # Remove trailing blank line if it exists
    if all_output_lines and all_output_lines[-1] == "":
        all_output_lines.pop()

    # Print the combined output to stdout
    print("\n".join(all_output_lines))

if __name__ == "__main__":
    main()