#!/bin/bash
# Install LIGO compiler using official installation method

set -e

echo "Installing LIGO using official installer..."

# Use the official LIGO installer
curl -sSfL https://get.ligolang.org | bash -s -- --version 1.7.0

# Add to current PATH for this session
export PATH="$HOME/.ligo/bin:$PATH"

# Verify installation
if command -v ligo &> /dev/null; then
    echo "LIGO installed successfully!"
    ligo --version
else
    echo "LIGO installation may require adding to PATH:"
    echo 'export PATH="$HOME/.ligo/bin:$PATH"'
fi
