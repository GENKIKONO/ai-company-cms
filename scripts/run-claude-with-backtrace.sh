#!/bin/bash
#
# Claude Code Panic Capture Launcher
#
# Purpose: Run Claude Code with full backtrace enabled and log all output
# Usage: ./scripts/run-claude-with-backtrace.sh [claude args...]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$ROOT_DIR/.logs/claude"

# Create log directory if not exists
mkdir -p "$LOG_DIR"

# Generate timestamped log filename
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/claude-$TIMESTAMP.log"

# Set Rust backtrace environment variables
export RUST_BACKTRACE=full
export RUST_BACKTRACE_STYLE=full

echo "========================================"
echo "Claude Code Panic Capture Mode"
echo "========================================"
echo "Log file: $LOG_FILE"
echo "RUST_BACKTRACE: $RUST_BACKTRACE"
echo "========================================"
echo ""

# Detect Claude command
if command -v claude &> /dev/null; then
    CLAUDE_CMD="claude"
elif [ -f "$HOME/.local/share/claude/versions/2.0.75" ]; then
    CLAUDE_CMD="$HOME/.local/share/claude/versions/2.0.75"
else
    echo "Error: Claude Code not found"
    exit 1
fi

echo "Using: $CLAUDE_CMD"
echo "Starting at: $(date)"
echo ""

# Run Claude with all output logged
# Using script command to capture interactive terminal output
if command -v script &> /dev/null; then
    # macOS/BSD style
    script -q "$LOG_FILE" "$CLAUDE_CMD" "$@"
else
    # Fallback: simple tee (may miss some output in interactive mode)
    "$CLAUDE_CMD" "$@" 2>&1 | tee "$LOG_FILE"
fi

echo ""
echo "========================================"
echo "Session ended at: $(date)"
echo "Log saved to: $LOG_FILE"
echo ""
echo "To check for panics:"
echo "  grep -A 50 'panicked at' $LOG_FILE"
echo "========================================"
