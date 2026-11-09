#!/bin/sh
# Run: sh tests/run.sh   (rebuilds the content first)
cd "$(dirname "$0")/.." && python3 tools/build_content.py && node tests/book.js && node tests/hall.js
