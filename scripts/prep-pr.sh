#!/usr/bin/env sh
set -eu

echo "Formatting and building..."
npm install
npm run build
npm test
echo "== Ready to submit PRs =="
echo "PR templates are in ./PRs"
