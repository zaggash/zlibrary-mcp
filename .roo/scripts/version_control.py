#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path
import datetime

# --- Helper Functions ---

def run_command(command, cwd=None, check=False):
    """Run a shell command and return stdout, stderr, and return code."""
    try:
        result = subprocess.run(command, capture_output=True, text=True, cwd=cwd, shell=True, check=check)
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except FileNotFoundError:
        print(f"❌ Error: 'git' command not found. Is git installed and in PATH?", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        # This is caught when check=True and return code is non-zero
        print(f"❌ Command failed: {' '.join(e.cmd)}", file=sys.stderr)
        print(f"   Exit code: {e.returncode}", file=sys.stderr)
        if e.stdout:
            print(f"   Stdout: {e.stdout.strip()}", file=sys.stderr)
        if e.stderr:
            print(f"   Stderr: {e.stderr.strip()}", file=sys.stderr)
        sys.exit(e.returncode)
    except Exception as e:
        print(f"❌ An unexpected error occurred running command: {command}\n{e}", file=sys.stderr)
        sys.exit(1)

def get_repo_root(start_path: Path) -> Path:
    """Finds the git repository root directory or exits if not found."""
    current_path = start_path.resolve()
    while current_path.parent != current_path:
        if (current_path / ".git").exists():
            return current_path
        current_path = current_path.parent
    # Check the final path as well
    if (current_path / ".git").exists():
        return current_path
    print("❌ Error: Not a git repository or .git directory not found.", file=sys.stderr)
    sys.exit(1)

def get_current_branch(repo_path):
    """Get the current git branch name."""
    stdout, stderr, exit_code = run_command("git rev-parse --abbrev-ref HEAD", cwd=repo_path)
    if exit_code != 0:
        print(f"❌ Failed to get current branch: {stderr}", file=sys.stderr)
        sys.exit(1)
    return stdout

# --- Subcommand Handlers ---

def handle_commit(args, repo_path):
    """Handles the 'commit' subcommand."""
    print(f"📦 Handling commit for: {args.message}")

    # Check git status
    stdout, stderr, exit_code = run_command("git status --porcelain", cwd=repo_path)
    if exit_code != 0:
        print(f"❌ Failed to get git status: {stderr}", file=sys.stderr)
        sys.exit(1)

    if not stdout and not args.allow_empty:
        print("ℹ️ No changes detected to commit.")
        return # Successful exit, nothing to do

    print(f"📝 Changes detected:\n{stdout}" if stdout else "ℹ️ No changes detected (allowing empty commit).")

    # Stage all changes
    print("📋 Staging all changes...")
    run_command("git add .", cwd=repo_path, check=True) # Exit on failure

    # Build commit message
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    prefix = args.semantic_prefix if args.semantic_prefix else "chore"
    commit_msg_subject = f"{prefix}: {args.message} [{timestamp}]"
    commit_msg_body = f"\n\n{args.body}" if args.body else ""
    full_commit_msg = f"{commit_msg_subject}{commit_msg_body}"

    # Commit changes
    print(f"💾 Committing with message:\n{full_commit_msg}")
    commit_command = ["git", "commit", "-m", full_commit_msg]
    if args.allow_empty:
        commit_command.append("--allow-empty")

    # Use list format for subprocess.run when not using shell=True for safety with messages
    try:
        result = subprocess.run(commit_command, capture_output=True, text=True, cwd=repo_path, check=True)
        print("✅ Changes committed successfully.")
        print(result.stdout.strip())
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to commit changes.", file=sys.stderr)
        if e.stdout: print(f"   Stdout: {e.stdout.strip()}", file=sys.stderr)
        if e.stderr: print(f"   Stderr: {e.stderr.strip()}", file=sys.stderr)
        sys.exit(e.returncode)
    except Exception as e:
        print(f"❌ An unexpected error occurred during commit: {e}", file=sys.stderr)
        sys.exit(1)


def handle_tag(args, repo_path):
    """Handles the 'tag' subcommand."""
    version = args.version if args.version else f"v{datetime.datetime.now().strftime('%Y.%m.%d.%H%M%S')}"
    tag_message = args.message if args.message else f"Release {version}"
    print(f"🏷️ Creating tag: {version} with message: '{tag_message}'")

    tag_command = ["git", "tag", "-a", version, "-m", tag_message]
    if args.force:
        tag_command.insert(2, "-f") # Insert -f after 'tag'

    try:
        result = subprocess.run(tag_command, capture_output=True, text=True, cwd=repo_path, check=True)
        print(f"✅ Tag '{version}' created successfully.")
        if args.push:
            print(f" Pushing tag '{version}' to origin...")
            push_result = subprocess.run(["git", "push", "origin", version], capture_output=True, text=True, cwd=repo_path, check=True)
            print(f"✅ Tag '{version}' pushed successfully.")
            print(push_result.stdout.strip())
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create or push tag '{version}'.", file=sys.stderr)
        if e.stdout: print(f"   Stdout: {e.stdout.strip()}", file=sys.stderr)
        if e.stderr: print(f"   Stderr: {e.stderr.strip()}", file=sys.stderr)
        sys.exit(e.returncode)
    except Exception as e:
        print(f"❌ An unexpected error occurred during tag operation: {e}", file=sys.stderr)
        sys.exit(1)


def handle_branch(args, repo_path):
    """Handles the 'branch' subcommand."""
    branch_name = args.branch_name
    current_branch = get_current_branch(repo_path)
    print(f"🌿 Handling branch operation for: {branch_name}")

    if args.delete:
        print(f"   Attempting to delete branch '{branch_name}'...")
        if branch_name == current_branch:
            print(f"❌ Cannot delete the current branch '{branch_name}'. Switch branches first.", file=sys.stderr)
            sys.exit(1)
        delete_flag = "-D" if args.force else "-d"
        run_command(f"git branch {delete_flag} {branch_name}", cwd=repo_path, check=True)
        print(f"✅ Branch '{branch_name}' deleted.")
    elif args.list:
        print("   Listing branches:")
        stdout, _, _ = run_command("git branch", cwd=repo_path, check=True)
        print(stdout)
    else: # Create branch
        start_point = args.start_point if args.start_point else ""
        print(f"   Creating new branch '{branch_name}' from '{start_point if start_point else current_branch}'...")
        run_command(f"git checkout -b {branch_name} {start_point}", cwd=repo_path, check=True)
        print(f"✅ Switched to new branch: {branch_name}")


def handle_status(args, repo_path):
    """Handles the 'status' subcommand."""
    print("🔍 Checking repository status...")
    stdout, stderr, exit_code = run_command("git status", cwd=repo_path)
    if exit_code != 0:
        print(f"❌ Failed to get git status: {stderr}", file=sys.stderr)
        sys.exit(1)
    print(stdout)

# --- Main Setup & Execution ---

def main():
    parser = argparse.ArgumentParser(description="Perform version control operations (commit, tag, branch, status).")
    parser.add_argument("--repo-path", default=".", help="Path to the git repository (default: current directory).")
    subparsers = parser.add_subparsers(dest="command", required=True, help="Subcommand to execute")

    # --- Commit Subparser ---
    parser_commit = subparsers.add_parser("commit", help="Stage all changes and commit them.")
    parser_commit.add_argument("-m", "--message", required=True, help="Commit message subject.")
    parser_commit.add_argument("-b", "--body", help="Optional commit message body.")
    parser_commit.add_argument("-p", "--semantic-prefix", default="chore", help="Semantic prefix (e.g., feat, fix, chore, docs). Default: chore")
    parser_commit.add_argument("--allow-empty", action="store_true", help="Allow committing even if there are no changes.")
    parser_commit.set_defaults(func=handle_commit)

    # --- Tag Subparser ---
    parser_tag = subparsers.add_parser("tag", help="Create an annotated tag.")
    parser_tag.add_argument("-v", "--version", help="Version tag name (e.g., v1.0.0). Defaults to timestamp-based tag.")
    parser_tag.add_argument("-m", "--message", help="Annotation message for the tag. Defaults to 'Release <version>'.")
    parser_tag.add_argument("-f", "--force", action="store_true", help="Force replace the tag if it already exists.")
    parser_tag.add_argument("--push", action="store_true", help="Push the tag to origin after creation.")
    parser_tag.set_defaults(func=handle_tag)

    # --- Branch Subparser ---
    parser_branch = subparsers.add_parser("branch", help="Create, list, or delete branches.")
    parser_branch.add_argument("branch_name", nargs='?', help="Name of the branch to create or delete (required unless listing).")
    parser_branch.add_argument("-s", "--start-point", help="Commit or branch to start the new branch from (defaults to current HEAD).")
    parser_branch.add_argument("-l", "--list", action="store_true", help="List all branches.")
    parser_branch.add_argument("-d", "--delete", action="store_true", help="Delete the specified branch.")
    parser_branch.add_argument("-f", "--force", action="store_true", help="Force delete the branch (used with -d).")
    parser_branch.set_defaults(func=handle_branch)

    # --- Status Subparser ---
    parser_status = subparsers.add_parser("status", help="Show the working tree status.")
    parser_status.set_defaults(func=handle_status)

    args = parser.parse_args()

    # Validate branch command arguments
    if args.command == "branch" and not args.list and not args.branch_name:
         parser_branch.error("branch_name is required unless --list is specified.")
    if args.command == "branch" and args.list and (args.branch_name or args.delete or args.start_point):
         parser_branch.error("--list cannot be used with branch_name, --delete, or --start-point.")
    if args.command == "branch" and args.delete and args.start_point:
         parser_branch.error("--delete cannot be used with --start-point.")


    repo_path = Path(args.repo_path).resolve()
    repo_root = get_repo_root(repo_path) # Ensure it's a git repo and find root

    # Call the appropriate handler function
    args.func(args, repo_root)

if __name__ == "__main__":
    main()