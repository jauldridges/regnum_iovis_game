#!/bin/sh
# Run: sh tests/run.sh   (rebuilds the content first; takes a few minutes)
cd "$(dirname "$0")/.." && python3 tools/build_content.py && for t in lose book ch1 ch2 boons ch3 ch4 ch5 epilogue; do node tests/$t.js || exit 1; done
