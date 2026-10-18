#!/usr/bin/env bash
# push.sh - one-command push of RoutineTrack to GitHub
#
# Usage:
#   1. Create an (empty) GitHub repo at https://github.com/new
#   2. Generate a token at https://github.com/settings/tokens
#      (classic token with `repo` scope)
#   3. export REPO="your-username/your-repo-name"
#   4. export GH_TOKEN="<paste-token>"
#   5. bash push.sh

set -euo pipefail

if [ -z "${REPO:-}" ]; then
  echo "ERROR: Set REPO to 'username/repo-name' first." >&2
  echo "  Example: export REPO=alice/routinetrack" >&2
  exit 1
fi

if [ -z "${GH_TOKEN:-}" ]; then
  echo "ERROR: Set GH_TOKEN to a GitHub personal access token (classic, repo scope)." >&2
  echo "  Get one at https://github.com/settings/tokens" >&2
  exit 1
fi

cd "$(dirname "$0")"
if [ ! -f index.html ]; then
  echo "ERROR: No index.html here. Run this script from the routinetrack/ folder." >&2
  exit 1
fi

git config user.name  >/dev/null 2>&1 || git config user.name  "RoutineTrack"
git config user.email >/dev/null 2>&1 || git config user.email "routinetrack@local"

if [ ! -d .git ]; then
  echo "-> Initializing git repo..."
  git init -b main >/dev/null
fi

git add .

if git diff --cached --quiet; then
  echo "-> No changes to commit."
else
  echo "-> Committing..."
  git commit -m "RoutineTrack: $(date +%Y-%m-%d)" >/dev/null
fi

echo "-> Pushing to https://github.com/${REPO} ..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${REPO}.git"

# Authenticate via an ephemeral token-in-URL push (never persisted)
git -c http.https://github.com/.extraheader="Authorization: token ${GH_TOKEN}" \
  push -u origin main

echo
echo "Done."
echo "   Repo: https://github.com/${REPO}"
echo
echo "   To get a live URL, enable GitHub Pages in Settings > Pages"
echo "   (Source: Deploy from a branch > main / root)."
echo "   The included .github/workflows/deploy.yml will auto-deploy on every push."
