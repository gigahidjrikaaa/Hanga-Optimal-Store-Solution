#!/usr/bin/env bash
set -e

echo "=========================================="
echo "  Hanga - Optimal Store Solution Setup"
echo "=========================================="
echo

if command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
elif command -v python &>/dev/null; then
    PYTHON_BIN="python"
else
    echo "❌ Error: Python 3 is not installed or not in PATH."
    exit 1
fi

$PYTHON_BIN setup.py
