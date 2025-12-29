#!/bin/bash
#
# ripgrep UTF-8 Boundary Test Matrix
#
# Purpose: Test rg with various options to identify which mode causes panic
# Usage: ./scripts/repro/run-rg-matrix.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
TEST_FILE="$SCRIPT_DIR/utf8-paren.txt"
LOG_DIR="$ROOT_DIR/.logs/claude"
RESULT_FILE="$LOG_DIR/rg-matrix-$(date +%Y%m%d-%H%M%S).log"

# Set backtrace for any potential panics
export RUST_BACKTRACE=full

mkdir -p "$LOG_DIR"

echo "========================================"
echo "ripgrep UTF-8 Boundary Test Matrix"
echo "========================================"
echo "Test file: $TEST_FILE"
echo "Result log: $RESULT_FILE"
echo ""

# Detect rg command (prefer Claude bundled version)
if [ -f "$HOME/.local/share/claude/versions/2.0.75" ]; then
    RG_CMD="$HOME/.local/share/claude/versions/2.0.75 --ripgrep"
    RG_VERSION="Claude bundled"
elif command -v rg &> /dev/null; then
    RG_CMD="rg"
    RG_VERSION=$(rg --version | head -1)
else
    echo "Error: ripgrep not found"
    exit 1
fi

echo "Using: $RG_CMD ($RG_VERSION)"
echo ""

# Test function
run_test() {
    local name="$1"
    local args="$2"

    echo "----------------------------------------" | tee -a "$RESULT_FILE"
    echo "Test: $name" | tee -a "$RESULT_FILE"
    echo "Args: $args" | tee -a "$RESULT_FILE"
    echo "" | tee -a "$RESULT_FILE"

    # Run and capture exit code
    set +e
    output=$($RG_CMD $args "）" "$TEST_FILE" 2>&1)
    exit_code=$?
    set -e

    echo "$output" | tee -a "$RESULT_FILE"
    echo "" | tee -a "$RESULT_FILE"

    if [ $exit_code -eq 0 ]; then
        echo "Result: OK (exit code 0)" | tee -a "$RESULT_FILE"
    elif [ $exit_code -eq 1 ]; then
        echo "Result: No match (exit code 1)" | tee -a "$RESULT_FILE"
    else
        echo "Result: ERROR (exit code $exit_code)" | tee -a "$RESULT_FILE"
    fi
    echo "" | tee -a "$RESULT_FILE"
}

# Run test matrix
{
    echo "Test started at: $(date)"
    echo "RUST_BACKTRACE: $RUST_BACKTRACE"
    echo ""
} | tee "$RESULT_FILE"

run_test "Normal (default)" ""
run_test "JSON output" "--json"
run_test "Context lines" "-C 2"
run_test "No heading" "--no-heading"
run_test "Color never" "--color never"
run_test "Color always" "--color always"
run_test "Line number" "-n"
run_test "Count only" "-c"
run_test "Files only" "-l"
run_test "Multiline" "-U"

echo "========================================" | tee -a "$RESULT_FILE"
echo "All tests completed at: $(date)" | tee -a "$RESULT_FILE"
echo "Results saved to: $RESULT_FILE"
echo ""
echo "Summary: Check $RESULT_FILE for any ERROR results"
