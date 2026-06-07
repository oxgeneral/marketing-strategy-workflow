#!/usr/bin/env bash
#
# install.sh — install the marketing-strategy workflow and its skills for Claude Code.
#
# By default: installs the skills (3 sources) via the claude CLI and copies
# .claude/workflows + .claude/commands into the target project (current folder).
#
# Usage:
#   ./install.sh [--target DIR] [--skills-only] [--no-skills] [-h|--help]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$PWD"
DO_SKILLS=1
DO_COPY=1

c() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
info() { c "36" "→ $1"; }
ok()   { c "32" "✓ $1"; }
warn() { c "33" "! $1"; }
err()  { c "31" "✗ $1" >&2; }

usage() {
  cat <<'EOF'
install.sh — marketing-strategy workflow for Claude Code

Usage:
  ./install.sh [options]

Options:
  --target DIR    Where to copy .claude/ (default: current folder)
  --skills-only   Only install skills, do not copy files
  --no-skills     Only copy files, do not install skills
  -h, --help      Show this help

By default it installs the skills (coreyhaines marketing-skills + ajtbd + design)
and copies the workflow and command into DIR/.claude/.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --target) TARGET="${2:?--target requires a path}"; shift 2 ;;
    --skills-only) DO_COPY=0; shift ;;
    --no-skills) DO_SKILLS=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) err "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

# --- Skills ---
install_plugin() {
  # $1 = owner/repo (marketplace), $2 = plugin@marketplace
  info "Marketplace: $1"
  claude plugin marketplace add "$1" 2>&1 | sed 's/^/    /' \
    || warn "marketplace add returned an error (maybe already added) — continuing"
  info "Skill: $2"
  claude plugin install "$2" 2>&1 | sed 's/^/    /' \
    || warn "install returned an error (maybe already installed) — continuing"
}

if [ "$DO_SKILLS" -eq 1 ]; then
  if ! command -v claude >/dev/null 2>&1; then
    warn "claude CLI not found in PATH — skipping skill installation."
    warn "Install Claude Code (https://claude.com/claude-code) and run again, or install skills manually (see README)."
  else
    info "Installing skills from 3 sources…"
    install_plugin "coreyhaines31/marketingskills"      "marketing-skills@marketingskills"
    install_plugin "oxgeneral/ajtbd-claude-skill"       "ajtbd@ajtbd-claude-skill"
    install_plugin "anthropics/knowledge-work-plugins"  "design@knowledge-work-plugins"
    ok "Skills processed (product-manager-toolkit is not from a public marketplace — the workflow uses built-in RICE as a fallback)."
  fi
fi

# --- Copy workflow files ---
SRC_WF="$SCRIPT_DIR/.claude/workflows/marketing-strategy.js"
SRC_CMD="$SCRIPT_DIR/.claude/commands/marketing.md"

if [ "$DO_COPY" -eq 1 ]; then
  if [ ! -f "$SRC_WF" ] || [ ! -f "$SRC_CMD" ]; then
    warn "Workflow files not found next to the script — run install.sh from the cloned repository. Skipping copy."
  elif [ "$TARGET" = "$SCRIPT_DIR" ]; then
    info "Target equals the repository — files are already in place, no copy needed."
  else
    info "Copying the workflow into $TARGET/.claude/…"
    mkdir -p "$TARGET/.claude/workflows" "$TARGET/.claude/commands"
    cp "$SRC_WF"  "$TARGET/.claude/workflows/"
    cp "$SRC_CMD" "$TARGET/.claude/commands/"
    ok "Copied: .claude/workflows/marketing-strategy.js, .claude/commands/marketing.md"
  fi
fi

echo
ok "Done."
echo
c "1" "Next:"
echo "  1. Restart the Claude Code session — the new skills and the /marketing command will register."
echo "  2. Run from a single question:  /marketing <what you're promoting and the main goal>"
echo "     or programmatically:  Workflow({ name: 'marketing-strategy', args: 'one-sentence brief' })"
echo
warn "It also works without a restart: skills are picked up by reading SKILL.md from disk (graceful fallback)."
