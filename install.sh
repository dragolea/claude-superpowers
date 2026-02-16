#!/bin/sh
set -e

REPO="dragolea/claude-superpowers"
BRANCH="main"
BIN_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}/dist/bin.js"

# --- Helpers ---

die() {
  echo "Error: $1" >&2
  exit 1
}

# --- Check prerequisites ---

command -v node >/dev/null 2>&1 || die "Node.js is required but not installed. Install it from https://nodejs.org"

NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
  die "Node.js >= 18 is required (found v$(node -v))"
fi

# --- Download and run ---

TMPFILE=$(mktemp "${TMPDIR:-/tmp}/superpower-installer.XXXXXX.js")
trap 'rm -f "$TMPFILE"' EXIT

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$BIN_URL" -o "$TMPFILE"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$TMPFILE" "$BIN_URL"
else
  die "curl or wget is required"
fi

# When piped via curl|sh, stdin is the script itself.
# Redirect stdin from /dev/tty so interactive prompts work.
if [ ! -t 0 ] && [ -e /dev/tty ]; then
  node "$TMPFILE" "$@" </dev/tty
else
  node "$TMPFILE" "$@"
fi
