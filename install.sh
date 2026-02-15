#!/usr/bin/env bash
# Wrap entire script in { } so bash reads it fully before executing.
# This is required for `curl | bash` to work correctly with interactive TUI.
{
set -euo pipefail

# ============================================================================
# Claude Superpowers — Interactive Skill Installer
# https://github.com/dragolea/claude-superpowers
#
# Installs curated Claude Code skills based on your technology stack.
# Skills are downloaded from their source repositories into .claude/skills/
#
# Usage:
#   ./install.sh                        # Interactive mode
#   ./install.sh --preset core          # Non-interactive preset
#   ./install.sh --list                 # List all available skills
#   ./install.sh --search               # Search & pick individual skills
#   ./install.sh --search <term>         # Pre-filtered search
#   ./install.sh --update               # Re-download installed skills
#   ./install.sh --help                 # Show help
# ============================================================================

VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REGISTRY_URL="https://raw.githubusercontent.com/dragolea/claude-superpowers/main/registry"
SKILLS_DIR=".claude/skills"
INSTALL_SCOPE="project"
SCOPE_SET_BY_FLAG=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# ============================================================================
# Utility functions
# ============================================================================

print_banner() {
  echo ""
  echo -e "${BOLD}${CYAN}"
  echo "   _____ _                 _        "
  echo "  / ____| |               | |       "
  echo " | |    | | __ _ _   _  __| | ___   "
  echo " | |    | |/ _\` | | | |/ _\` |/ _ \\  "
  echo " | |____| | (_| | |_| | (_| |  __/  "
  echo "  \\_____|_|\\__,_|\\__,_|\\__,_|\\___|  "
  echo "                                     "
  echo -e "  ${YELLOW}S U P E R P O W E R S${NC}"
  echo -e "  ${DIM}v${VERSION} — Curated skill installer${NC}"
  echo ""
}

print_help() {
  print_banner
  echo -e "${BOLD}USAGE — SKILLS${NC}"
  echo "  ./install.sh                     Interactive mode"
  echo "  ./install.sh --preset <name>     Install a preset"
  echo "  ./install.sh --list              List all skills"
  echo "  ./install.sh --search            Search & pick individual skills"
  echo "  ./install.sh --search <term>     Pre-filtered search"
  echo "  ./install.sh --update            Re-download installed skills"
  echo "  ./install.sh --scan              Detect project stack & show categories"
  echo "  ./install.sh --help              Show this help"
  echo ""
  echo -e "${BOLD}USAGE — AGENTS (via plugin marketplace)${NC}"
  echo "  ./install.sh --agents                     Interactive mode"
  echo "  ./install.sh --agents --preset <name>     Install a preset"
  echo "  ./install.sh --agents --list              List all plugins"
  echo "  ./install.sh --agents --search [term]     Search & pick plugins"
  echo "  ./install.sh --agents --update            Update installed plugins"
  echo "  ./install.sh --agents --help              Agent help"
  echo ""
  echo -e "${BOLD}SCOPE${NC}"
  echo "  --scope project     .claude/ — shared with all collaborators (default)"
  echo "  --scope user        ~/.claude/ — available in all your projects"
  echo "  --scope local       .claude/ — this repo only, not committed"
  echo ""
  echo -e "${BOLD}SKILL PRESETS${NC}"
  echo "  core           Debugging, TDD, verification (4 skills)"
  echo "  workflow        Core + planning & execution (10 skills)"
  echo "  web            Web stack + frameworks + design (28 skills)"
  echo "  mobile         Mobile frameworks + core (19 skills)"
  echo "  mobile-expo    React Native/Expo focused (19 skills)"
  echo "  backend        Server frameworks + databases (25 skills)"
  echo "  fullstack      Web + backend + languages (46 skills)"
  echo "  devops         Infrastructure + CI/CD (22 skills)"
  echo "  security       OWASP, static analysis, auditing (17 skills)"
  echo "  documents      PDF, Word, Excel, PowerPoint (5 skills)"
  echo "  full           Everything (77 skills)"
  echo ""
  echo -e "${BOLD}EXAMPLES${NC}"
  echo "  ./install.sh --preset core"
  echo "  ./install.sh --preset mobile-expo"
  echo "  ./install.sh --agents --preset fullstack"
  echo "  ./install.sh --agents --search kubernetes"
  echo ""
  echo -e "${DIM}Note: Agent installation requires the Claude CLI (claude command).${NC}"
  echo -e "${DIM}Skills are installed via curl (no CLI needed).${NC}"
  echo ""
}

# Set install directories based on scope (skills only — agents use claude plugin CLI)
apply_scope() {
  case "$INSTALL_SCOPE" in
    user)
      SKILLS_DIR="${HOME}/.claude/skills"
      ;;
    project|local)
      SKILLS_DIR=".claude/skills"
      ;;
  esac
}

# Add path to .gitignore for local scope
ensure_gitignored() {
  local path="$1"
  [[ "$INSTALL_SCOPE" != "local" ]] && return

  local gitignore=".gitignore"

  if [[ ! -f "$gitignore" ]]; then
    touch "$gitignore"
  fi

  # Add header comment if not present
  if ! grep -q "# Claude Superpowers (local scope)" "$gitignore"; then
    echo "" >> "$gitignore"
    echo "# Claude Superpowers (local scope)" >> "$gitignore"
  fi

  # Add path if not already listed
  if ! grep -qxF "$path" "$gitignore"; then
    echo "$path" >> "$gitignore"
  fi
}

# Interactive scope selection menu
select_scope() {
  select_menu "Where should these be installed?" \
    "Project scope|.claude/ — shared with all collaborators via git" \
    "User scope|~/.claude/ — available in all your projects" \
    "Local scope|.claude/ + .gitignore — this repo only, not committed"

  case $SELECTED_INDEX in
    0) INSTALL_SCOPE="project" ;;
    1) INSTALL_SCOPE="user" ;;
    2) INSTALL_SCOPE="local" ;;
  esac

  apply_scope
}

# Check for required tools
check_dependencies() {
  if ! command -v curl &>/dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
  fi
  if ! command -v python3 &>/dev/null && ! command -v jq &>/dev/null; then
    echo -e "${RED}Error: python3 or jq is required to parse JSON.${NC}"
    exit 1
  fi
}

# Check for Claude CLI (required for agent/plugin installation)
check_claude_cli() {
  if ! command -v claude &>/dev/null; then
    echo ""
    echo -e "${RED}Error: Claude CLI is required for agent/plugin installation.${NC}"
    echo ""
    echo -e "Install it from: ${BOLD}https://docs.anthropic.com/en/docs/claude-code/overview${NC}"
    echo -e "  ${DIM}npm install -g @anthropic-ai/claude-code${NC}"
    echo ""
    echo -e "${DIM}Note: Skills can still be installed without the CLI (./install.sh without --agents).${NC}"
    exit 1
  fi
}

# Ensure a marketplace is added to the Claude CLI
ensure_marketplace() {
  local marketplace_id="$1"
  local repo="$2"

  # Check if marketplace already added
  if claude plugin marketplace list 2>/dev/null | grep -q "$repo"; then
    return 0
  fi

  echo -e "  ${DIM}Adding marketplace: ${repo}${NC}"
  if claude plugin marketplace add "$repo" 2>/dev/null; then
    return 0
  else
    echo -e "  ${YELLOW}Warning: Could not add marketplace ${repo}${NC}"
    return 1
  fi
}

# Ensure all required marketplaces are added
ensure_all_marketplaces() {
  local -a marketplace_ids=("$@")

  echo -e "${DIM}Ensuring plugin marketplaces are configured...${NC}"

  for mp_id in "${marketplace_ids[@]}"; do
    local repo
    repo=$(get_marketplace_repo "$mp_id")
    ensure_marketplace "$mp_id" "$repo"
  done
  echo ""
}

# Get marketplace repo from marketplace ID
get_marketplace_repo() {
  local mp_id="$1"
  if command -v jq &>/dev/null; then
    echo "$AGENTS_JSON" | jq -r ".marketplaces[\"${mp_id}\"].repo"
  else
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['marketplaces']['${mp_id}']['repo'])
"
  fi
}

# Install a single plugin via Claude CLI
install_plugin() {
  local plugin_name="$1"
  local marketplace="$2"
  local agent_count="$3"

  if claude plugin install "${plugin_name}@${marketplace}" --scope "$INSTALL_SCOPE" 2>/dev/null; then
    echo -e "  ${GREEN}+${NC} ${plugin_name}@${marketplace} ${DIM}(${agent_count} agents)${NC}"
    return 0
  else
    echo -e "  ${RED}x${NC} ${plugin_name}@${marketplace} ${DIM}(install failed)${NC}"
    return 1
  fi
}

# Install multiple plugins
install_plugins() {
  local -a plugin_names=("$@")
  local success=0
  local failed=0
  local total=${#plugin_names[@]}
  local total_agents=0

  # Collect unique marketplaces
  local -a unique_marketplaces=()
  for plugin in "${plugin_names[@]}"; do
    local mp
    mp=$(get_plugin_info "$plugin" "marketplace")
    local found=false
    for existing in "${unique_marketplaces[@]+"${unique_marketplaces[@]}"}"; do
      if [[ "$existing" == "$mp" ]]; then
        found=true
        break
      fi
    done
    if ! $found; then
      unique_marketplaces+=("$mp")
    fi
  done

  # Ensure all marketplaces are configured
  ensure_all_marketplaces "${unique_marketplaces[@]}"

  echo ""
  echo -e "${BOLD}Installing ${total} plugins (scope: ${INSTALL_SCOPE})${NC}"
  echo ""

  for plugin in "${plugin_names[@]}"; do
    local marketplace
    marketplace=$(get_plugin_info "$plugin" "marketplace")
    local agent_count
    agent_count=$(get_plugin_info "$plugin" "agent_count")
    if install_plugin "$plugin" "$marketplace" "$agent_count"; then
      ((success++))
      ((total_agents += agent_count))
    else
      ((failed++))
    fi
  done

  echo ""
  echo -e "${BOLD}────────────────────────────────────${NC}"
  echo -e "  ${GREEN}Installed:${NC} ${success} plugins (${total_agents} agents)"
  if [[ $failed -gt 0 ]]; then
    echo -e "  ${RED}Failed:${NC}    ${failed} plugins"
  fi
  echo -e "${BOLD}────────────────────────────────────${NC}"
  echo ""
  echo -e "  ${DIM}Scope:${NC}     ${INSTALL_SCOPE}"
  echo -e "Run ${DIM}./install.sh --agents --update${NC} to update later."
  echo ""
}

# JSON parsing — use jq if available, fall back to python3
json_query() {
  local json="$1"
  local query="$2"
  if command -v jq &>/dev/null; then
    echo "$json" | jq -r "$query"
  else
    echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
query = '''$query'''
# Simple jq-compatible queries
if query == '.skills | length':
    print(len(data['skills']))
elif query == '.plugins | length':
    print(len(data['plugins']))
elif query.startswith('.plugins['):
    import re
    m = re.match(r'\.plugins\[(\d+)\]\.(\w+)', query)
    if m:
        print(data['plugins'][int(m.group(1))][m.group(2)])
elif query.startswith('.skills['):
    import re
    m = re.match(r'\.skills\[(\d+)\]\.(\w+)', query)
    if m:
        print(data['skills'][int(m.group(1))][m.group(2)])
elif query.startswith('.categories'):
    import re
    m = re.match(r'\.categories\s*\|\s*keys\[\]', query)
    if m:
        for k in data['categories']:
            print(k)
elif query.startswith('.presets.'):
    import re
    m = re.match(r'\.presets\.([a-z-]+)\.categories\[\]', query)
    if m:
        preset = m.group(1).replace('-', '_')
        # Handle hyphenated preset names
        for key in data['presets']:
            if key == m.group(1) or key.replace('-', '_') == preset:
                for c in data['presets'][key]['categories']:
                    print(c)
                break
elif query == '.presets | keys[]':
    for k in data['presets']:
        print(k)
else:
    print(query)
"
  fi
}

# ============================================================================
# Registry loading
# ============================================================================

load_registry() {
  local skills_file=""
  local sources_file=""

  # Try local registry first (when running from repo), then fetch from GitHub
  if [[ -f "${SCRIPT_DIR}/registry/skills.json" ]]; then
    skills_file="${SCRIPT_DIR}/registry/skills.json"
    sources_file="${SCRIPT_DIR}/registry/sources.json"
    SKILLS_JSON=$(cat "$skills_file")
    SOURCES_JSON=$(cat "$sources_file")
  else
    echo -e "${DIM}Fetching registry from GitHub...${NC}"
    SKILLS_JSON=$(curl -sL --fail "${REGISTRY_URL}/skills.json") || {
      echo -e "${RED}Failed to fetch skill registry.${NC}"
      exit 1
    }
    SOURCES_JSON=$(curl -sL --fail "${REGISTRY_URL}/sources.json") || {
      echo -e "${RED}Failed to fetch source registry.${NC}"
      exit 1
    }
  fi

  SKILL_COUNT=$(json_query "$SKILLS_JSON" '.skills | length')
}

load_agent_registry() {
  local agents_file=""

  # Try local registry first (when running from repo), then fetch from GitHub
  if [[ -f "${SCRIPT_DIR}/registry/agents.json" ]]; then
    agents_file="${SCRIPT_DIR}/registry/agents.json"
    AGENTS_JSON=$(cat "$agents_file")
  else
    echo -e "${DIM}Fetching plugin registry from GitHub...${NC}"
    AGENTS_JSON=$(curl -sL --fail "${REGISTRY_URL}/agents.json") || {
      echo -e "${RED}Failed to fetch plugin registry.${NC}"
      exit 1
    }
  fi

  PLUGIN_COUNT=$(json_query "$AGENTS_JSON" '.plugins | length')
}

# Get base URL for a source
get_source_url() {
  local source_id="$1"
  if command -v jq &>/dev/null; then
    echo "$SOURCES_JSON" | jq -r ".sources[\"${source_id}\"].base_url"
  else
    echo "$SOURCES_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['sources']['${source_id}']['base_url'])
"
  fi
}

# ============================================================================
# Skill queries
# ============================================================================

# Get all skills matching given categories
get_skills_by_categories() {
  local categories=("$@")
  if command -v jq &>/dev/null; then
    local filter
    filter=$(printf '"%s",' "${categories[@]}")
    filter="[${filter%,}]"
    echo "$SKILLS_JSON" | jq -r --argjson cats "$filter" \
      '.skills[] | select(.category as $c | $cats | index($c)) | .name'
  else
    local cats_str
    cats_str=$(printf "'%s'," "${categories[@]}")
    cats_str="[${cats_str%,}]"
    echo "$SKILLS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
cats = ${cats_str}
for s in data['skills']:
    if s['category'] in cats:
        print(s['name'])
"
  fi
}

# Get skill info by name
get_skill_info() {
  local skill_name="$1"
  local field="$2"
  if command -v jq &>/dev/null; then
    echo "$SKILLS_JSON" | jq -r ".skills[] | select(.name == \"${skill_name}\") | .${field}"
  else
    echo "$SKILLS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for s in data['skills']:
    if s['name'] == '${skill_name}':
        print(s['${field}'])
        break
"
  fi
}

# Get all unique categories
get_all_categories() {
  if command -v jq &>/dev/null; then
    echo "$SKILLS_JSON" | jq -r '.categories | keys[]'
  else
    echo "$SKILLS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for k in data['categories']:
    print(k)
"
  fi
}

# Get category display name
get_category_name() {
  local cat_id="$1"
  if command -v jq &>/dev/null; then
    echo "$SKILLS_JSON" | jq -r ".categories[\"${cat_id}\"].name"
  else
    echo "$SKILLS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['categories']['${cat_id}']['name'])
"
  fi
}

# Get category description
get_category_desc() {
  local cat_id="$1"
  if command -v jq &>/dev/null; then
    echo "$SKILLS_JSON" | jq -r ".categories[\"${cat_id}\"].description"
  else
    echo "$SKILLS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['categories']['${cat_id}']['description'])
"
  fi
}

# Check if category is recommended
is_category_recommended() {
  local cat_id="$1"
  if command -v jq &>/dev/null; then
    echo "$SKILLS_JSON" | jq -r ".categories[\"${cat_id}\"].recommended"
  else
    echo "$SKILLS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(str(data['categories']['${cat_id}'].get('recommended', False)).lower())
"
  fi
}

# Get preset categories
get_preset_categories() {
  local preset_name="$1"
  if command -v jq &>/dev/null; then
    echo "$SKILLS_JSON" | jq -r ".presets[\"${preset_name}\"].categories[]"
  else
    echo "$SKILLS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data['presets']['${preset_name}']['categories']:
    print(c)
"
  fi
}

# ============================================================================
# Plugin queries (for agent marketplace)
# ============================================================================

# Get all plugins matching given categories (deduplicated)
get_plugins_by_categories() {
  local categories=("$@")
  if command -v jq &>/dev/null; then
    local filter
    filter=$(printf '"%s",' "${categories[@]}")
    filter="[${filter%,}]"
    echo "$AGENTS_JSON" | jq -r --argjson cats "$filter" \
      '[.plugins[] | select(.category as $c | $cats | index($c)) | .name] | unique[]'
  else
    local cats_str
    cats_str=$(printf "'%s'," "${categories[@]}")
    cats_str="[${cats_str%,}]"
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
cats = ${cats_str}
seen = set()
for p in data['plugins']:
    if p['category'] in cats and p['name'] not in seen:
        seen.add(p['name'])
        print(p['name'])
"
  fi
}

# Get plugin info by name
get_plugin_info() {
  local plugin_name="$1"
  local field="$2"
  if command -v jq &>/dev/null; then
    echo "$AGENTS_JSON" | jq -r ".plugins[] | select(.name == \"${plugin_name}\") | .${field}"
  else
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data['plugins']:
    if p['name'] == '${plugin_name}':
        print(p['${field}'])
        break
"
  fi
}

# Get all unique plugin categories
get_all_plugin_categories() {
  if command -v jq &>/dev/null; then
    echo "$AGENTS_JSON" | jq -r '.categories | keys[]'
  else
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for k in data['categories']:
    print(k)
"
  fi
}

# Get plugin category display name
get_plugin_category_name() {
  local cat_id="$1"
  if command -v jq &>/dev/null; then
    echo "$AGENTS_JSON" | jq -r ".categories[\"${cat_id}\"].name"
  else
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['categories']['${cat_id}']['name'])
"
  fi
}

# Get plugin category description
get_plugin_category_desc() {
  local cat_id="$1"
  if command -v jq &>/dev/null; then
    echo "$AGENTS_JSON" | jq -r ".categories[\"${cat_id}\"].description"
  else
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['categories']['${cat_id}']['description'])
"
  fi
}

# Check if plugin category is recommended
is_plugin_category_recommended() {
  local cat_id="$1"
  if command -v jq &>/dev/null; then
    echo "$AGENTS_JSON" | jq -r ".categories[\"${cat_id}\"].recommended"
  else
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(str(data['categories']['${cat_id}'].get('recommended', False)).lower())
"
  fi
}

# Get plugin preset categories
get_plugin_preset_categories() {
  local preset_name="$1"
  if command -v jq &>/dev/null; then
    echo "$AGENTS_JSON" | jq -r ".presets[\"${preset_name}\"].categories[]"
  else
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data['presets']['${preset_name}']['categories']:
    print(c)
"
  fi
}

# Interactive scope selection for agents/plugins
select_agent_scope() {
  select_menu "Where should plugins be installed?" \
    "Project scope|.claude/settings.json — shared with collaborators via git" \
    "User scope|~/.claude/settings.json — available in all your projects" \
    "Local scope|.claude/settings.local.json — this repo only, auto-gitignored"

  case $SELECTED_INDEX in
    0) INSTALL_SCOPE="project" ;;
    1) INSTALL_SCOPE="user" ;;
    2) INSTALL_SCOPE="local" ;;
  esac
}

# ============================================================================
# Project detection
# ============================================================================

# Global arrays populated by detect_project()
DETECTED_TECHS=()
DETECTED_SKILL_CATS=()
DETECTED_AGENT_CATS=()

_add_tech() {
  local tech="$1"
  local found=false
  for t in "${DETECTED_TECHS[@]+"${DETECTED_TECHS[@]}"}"; do
    if [[ "$t" == "$tech" ]]; then found=true; break; fi
  done
  $found || DETECTED_TECHS+=("$tech")
}

_add_skill_cats() {
  for cat in "$@"; do
    local found=false
    for c in "${DETECTED_SKILL_CATS[@]+"${DETECTED_SKILL_CATS[@]}"}"; do
      if [[ "$c" == "$cat" ]]; then found=true; break; fi
    done
    $found || DETECTED_SKILL_CATS+=("$cat")
  done
}

_add_agent_cats() {
  for cat in "$@"; do
    local found=false
    for c in "${DETECTED_AGENT_CATS[@]+"${DETECTED_AGENT_CATS[@]}"}"; do
      if [[ "$c" == "$cat" ]]; then found=true; break; fi
    done
    $found || DETECTED_AGENT_CATS+=("$cat")
  done
}

detect_project() {
  DETECTED_TECHS=()
  DETECTED_SKILL_CATS=()
  DETECTED_AGENT_CATS=()

  # ---- Node.js / package.json based detection ----
  if [[ -f "package.json" ]]; then
    _add_tech "Node.js"
    _add_skill_cats "core" "workflow"
    _add_agent_cats "core-dev"

    local pkg
    pkg=$(cat package.json 2>/dev/null || true)

    if echo "$pkg" | grep -q '"react-native"'; then
      _add_tech "React Native"
      _add_skill_cats "mobile" "languages"
      _add_agent_cats "core-dev" "languages"
    elif echo "$pkg" | grep -q '"react"'; then
      _add_tech "React"
      _add_skill_cats "web" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -q '"vue"'; then
      _add_tech "Vue"
      _add_skill_cats "web" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -q '"@angular/core"'; then
      _add_tech "Angular"
      _add_skill_cats "web" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -q '"next"'; then
      _add_tech "Next.js"
      _add_skill_cats "web" "backend" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -q '"nuxt"'; then
      _add_tech "Nuxt"
      _add_skill_cats "web" "backend" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -q '"express"'; then
      _add_tech "Express"
      _add_skill_cats "backend" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -q '"@nestjs/core"'; then
      _add_tech "NestJS"
      _add_skill_cats "backend" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -q '"fastify"'; then
      _add_tech "Fastify"
      _add_skill_cats "backend" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -q '"expo"'; then
      _add_tech "Expo"
      _add_skill_cats "mobile" "languages"
      _add_agent_cats "core-dev" "languages"
    fi

    if echo "$pkg" | grep -qE '"(jest|vitest|mocha|cypress|playwright)"'; then
      _add_tech "Testing"
      _add_skill_cats "core"
      _add_agent_cats "quality-security"
    fi
  fi

  # ---- TypeScript ----
  if [[ -f "tsconfig.json" ]]; then
    _add_tech "TypeScript"
    _add_skill_cats "languages"
    _add_agent_cats "languages"
  fi

  # ---- Python ----
  if [[ -f "requirements.txt" || -f "pyproject.toml" || -f "setup.py" || -f "Pipfile" ]]; then
    _add_tech "Python"
    _add_skill_cats "backend" "languages"
    _add_agent_cats "core-dev" "languages"

    local pydeps=""
    [[ -f "requirements.txt" ]] && pydeps+=$(cat requirements.txt 2>/dev/null || true)
    [[ -f "pyproject.toml" ]] && pydeps+=$(cat pyproject.toml 2>/dev/null || true)
    [[ -f "Pipfile" ]] && pydeps+=$(cat Pipfile 2>/dev/null || true)

    if echo "$pydeps" | grep -qi "django"; then
      _add_tech "Django"
    fi
    if echo "$pydeps" | grep -qi "fastapi"; then
      _add_tech "FastAPI"
    fi
    if echo "$pydeps" | grep -qi "flask"; then
      _add_tech "Flask"
    fi
  fi

  # ---- Go ----
  if [[ -f "go.mod" ]]; then
    _add_tech "Go"
    _add_skill_cats "backend" "languages"
    _add_agent_cats "core-dev" "languages"
  fi

  # ---- Rust ----
  if [[ -f "Cargo.toml" ]]; then
    _add_tech "Rust"
    _add_skill_cats "backend" "languages"
    _add_agent_cats "core-dev" "languages"
  fi

  # ---- Ruby ----
  if [[ -f "Gemfile" ]]; then
    _add_tech "Ruby"
    _add_skill_cats "backend" "languages"
    _add_agent_cats "core-dev" "languages"

    if grep -qi "rails" Gemfile 2>/dev/null; then
      _add_tech "Rails"
    fi
  fi

  # ---- Java / Kotlin ----
  if [[ -f "pom.xml" || -f "build.gradle" || -f "build.gradle.kts" ]]; then
    _add_tech "Java/Kotlin"
    _add_skill_cats "backend" "languages"
    _add_agent_cats "core-dev" "languages"
  fi

  # ---- iOS ----
  if [[ -f "Podfile" ]] || ls *.xcodeproj &>/dev/null; then
    _add_tech "iOS"
    _add_skill_cats "mobile"
    _add_agent_cats "core-dev" "languages"
  fi

  # ---- Flutter ----
  if [[ -f "pubspec.yaml" ]]; then
    _add_tech "Flutter"
    _add_skill_cats "mobile"
    _add_agent_cats "core-dev" "languages"
  fi

  # ---- Docker ----
  if [[ -f "Dockerfile" || -f "docker-compose.yml" || -f "docker-compose.yaml" || -f "compose.yml" || -f "compose.yaml" ]]; then
    _add_tech "Docker"
    _add_skill_cats "devops"
    _add_agent_cats "infrastructure"
  fi

  # ---- Kubernetes ----
  if [[ -d "k8s" || -d "kubernetes" ]]; then
    _add_tech "Kubernetes"
    _add_skill_cats "devops"
    _add_agent_cats "infrastructure"
  fi

  # ---- Terraform ----
  if ls *.tf &>/dev/null || [[ -d "terraform" ]]; then
    _add_tech "Terraform"
    _add_skill_cats "devops"
    _add_agent_cats "infrastructure"
  fi

  # ---- CI/CD ----
  if [[ -d ".github/workflows" || -f ".gitlab-ci.yml" || -f "Jenkinsfile" ]]; then
    _add_tech "CI/CD"
    _add_skill_cats "devops"
    _add_agent_cats "infrastructure"
  fi

  # ---- Linting / Formatting ----
  if [[ -f ".eslintrc" || -f ".eslintrc.js" || -f ".eslintrc.json" || -f ".eslintrc.yml" || -f "eslint.config.js" || -f "eslint.config.mjs" || -f ".prettierrc" || -f ".prettierrc.json" || -f "prettier.config.js" || -f "prettier.config.mjs" || -f "biome.json" ]]; then
    _add_tech "Linting"
    _add_skill_cats "core"
    _add_agent_cats "dev-experience"
  fi
}

cmd_scan() {
  detect_project

  if [[ ${#DETECTED_TECHS[@]} -eq 0 ]]; then
    echo ""
    echo -e "${YELLOW}No project signals detected in current directory.${NC}"
    echo -e "${DIM}Run from a project root with package.json, go.mod, etc.${NC}"
    echo ""
    return 0
  fi

  echo ""
  echo -e "${BOLD}${CYAN}Project scan results${NC}"
  echo ""

  # Detected technologies
  local tech_list=""
  for t in "${DETECTED_TECHS[@]}"; do
    if [[ -n "$tech_list" ]]; then tech_list+=", "; fi
    tech_list+="$t"
  done
  echo -e "  ${BOLD}Detected:${NC} ${tech_list}"
  echo ""

  # Skill categories
  echo -e "  ${BOLD}Skill categories:${NC}"
  for cat in "${DETECTED_SKILL_CATS[@]}"; do
    echo -e "    ${GREEN}+${NC} ${cat}"
  done
  echo ""

  # Agent categories
  echo -e "  ${BOLD}Agent categories:${NC}"
  for cat in "${DETECTED_AGENT_CATS[@]}"; do
    echo -e "    ${GREEN}+${NC} ${cat}"
  done
  echo ""
}

# ============================================================================
# Interactive TUI
# ============================================================================

# Checkbox menu — returns selected indices in SELECTED_INDICES array
# Pass --back as first arg to show a back option (returns 1 if chosen)
# Args: [--back] title, options array, __SEP__, pre-selected indices array
checkbox_menu() {
  local show_back=false
  if [[ "${1:-}" == "--back" ]]; then
    show_back=true
    shift
  fi

  local title="$1"
  shift
  local -a options=()
  local -a descriptions=()
  local -a selected=()
  local separator="__SEP__"

  # Parse options (format: "label|description")
  while [[ $# -gt 0 && "$1" != "$separator" ]]; do
    local item="$1"
    options+=("${item%%|*}")
    descriptions+=("${item#*|}")
    selected+=(0)
    shift
  done

  # Skip separator
  [[ "${1:-}" == "$separator" ]] && shift

  # Pre-select indices
  while [[ $# -gt 0 ]]; do
    selected[$1]=1
    shift
  done

  local current=0
  local count=${#options[@]}
  local max_index=$((count - 1))
  $show_back && max_index=$count

  # Hide cursor
  tput civis 2>/dev/null || true

  # Trap to restore cursor on exit
  trap 'tput cnorm 2>/dev/null || true' EXIT

  while true; do
    # Clear and draw
    echo -e "\033[2K${BOLD}${CYAN}  $title${NC}"
    echo -e "\033[2K${DIM}  Use arrow keys to move, space to toggle, enter to confirm${NC}"
    echo -e "\033[2K"

    for i in $(seq 0 $((count - 1))); do
      local prefix="  "
      local checkbox
      if [[ ${selected[$i]} -eq 1 ]]; then
        checkbox="${GREEN}[x]${NC}"
      else
        checkbox="[ ]"
      fi

      if [[ $i -eq $current ]]; then
        echo -e "\033[2K  ${BOLD}> ${checkbox} ${options[$i]}${NC}  ${DIM}${descriptions[$i]}${NC}"
      else
        echo -e "\033[2K    ${checkbox} ${options[$i]}  ${DIM}${descriptions[$i]}${NC}"
      fi
    done

    if $show_back; then
      echo -e "\033[2K"
      if [[ $current -eq $count ]]; then
        echo -e "\033[2K  ${BOLD}> ${DIM}← Back${NC}"
      else
        echo -e "\033[2K    ${DIM}← Back${NC}"
      fi
    fi

    echo -e "\033[2K"

    # Read input
    IFS= read -rsn1 key < /dev/tty
    case "$key" in
      $'\x1b')
        read -rsn2 key < /dev/tty
        case "$key" in
          '[A') # Up
            ((current > 0)) && ((current--))
            ;;
          '[B') # Down
            ((current < max_index)) && ((current++))
            ;;
        esac
        ;;
      ' ') # Space — toggle (only for real options, not back)
        if [[ $current -lt $count ]]; then
          if [[ ${selected[$current]} -eq 1 ]]; then
            selected[$current]=0
          else
            selected[$current]=1
          fi
        fi
        ;;
      '') # Enter — confirm or back
        if $show_back && [[ $current -eq $count ]]; then
          tput cnorm 2>/dev/null || true
          return 1
        fi
        break
        ;;
    esac

    # Move cursor up to redraw
    local lines_to_move=$((count + 4))
    $show_back && lines_to_move=$((count + 6))
    echo -en "\033[${lines_to_move}A"
  done

  # Restore cursor
  tput cnorm 2>/dev/null || true

  # Set result
  SELECTED_INDICES=()
  for i in $(seq 0 $((count - 1))); do
    if [[ ${selected[$i]} -eq 1 ]]; then
      SELECTED_INDICES+=("$i")
    fi
  done
  return 0
}

# Searchable checkbox menu — returns selected names in SELECTED_SKILLS array
# Caller must set _SCM_NAMES and _SCM_DESCS arrays before calling
# Args: title, total_count, [initial_filter]
search_checkbox_menu() {
  local title="$1"
  local total_count="$2"
  local initial_filter="${3:-}"

  # Copy from global parallel arrays (caller must set these)
  local -a names=("${_SCM_NAMES[@]}")
  local -a descs=("${_SCM_DESCS[@]}")
  local -a selected=()
  for ((i = 0; i < total_count; i++)); do
    selected+=(0)
  done

  local filter="$initial_filter"
  local current=0

  # Get terminal height for paging
  local term_height
  term_height=$(tput lines 2>/dev/null || echo 24)
  local max_visible=$((term_height - 7)) # header(3) + footer(2) + padding(2)
  ((max_visible < 5)) && max_visible=5

  # Build filtered indices
  local -a visible=()
  _rebuild_visible() {
    visible=()
    local lc_filter
    lc_filter=$(echo "$filter" | tr '[:upper:]' '[:lower:]')
    for ((i = 0; i < total_count; i++)); do
      if [[ -z "$filter" ]]; then
        visible+=("$i")
      else
        local lc_name lc_desc
        lc_name=$(echo "${names[$i]}" | tr '[:upper:]' '[:lower:]')
        lc_desc=$(echo "${descs[$i]}" | tr '[:upper:]' '[:lower:]')
        if [[ "$lc_name" == *"$lc_filter"* || "$lc_desc" == *"$lc_filter"* ]]; then
          visible+=("$i")
        fi
      fi
    done
  }
  _rebuild_visible

  local scroll_offset=0

  # Hide cursor
  tput civis 2>/dev/null || true
  trap 'tput cnorm 2>/dev/null || true' EXIT

  # Track how many lines we drew last frame for cursor-up
  local last_drawn=0

  while true; do
    local vis_count=${#visible[@]}
    local display_count=$vis_count
    ((display_count > max_visible)) && display_count=$max_visible

    # Clamp cursor
    if ((current >= vis_count)); then
      ((vis_count > 0)) && current=$((vis_count - 1)) || current=0
    fi
    ((current < 0)) && current=0

    # Adjust scroll to keep cursor visible
    if ((vis_count > max_visible)); then
      ((current < scroll_offset)) && scroll_offset=$current
      ((current >= scroll_offset + max_visible)) && scroll_offset=$((current - max_visible + 1))
    else
      scroll_offset=0
    fi

    # Count selected
    local sel_count=0
    for ((i = 0; i < total_count; i++)); do
      ((selected[i] == 1)) && ((sel_count++))
    done

    # Move up to overwrite previous frame
    if ((last_drawn > 0)); then
      echo -en "\033[${last_drawn}A"
    fi

    local lines_drawn=0

    # Header
    echo -e "\033[2K${BOLD}${CYAN}  $title${NC}"
    echo -e "\033[2K${DIM}  Type to filter, space to toggle, enter to confirm, esc to cancel${NC}"
    echo -e "\033[2K"
    ((lines_drawn += 3))

    # Filter line
    echo -e "\033[2K  ${BOLD}Filter:${NC} ${filter}█"
    echo -e "\033[2K"
    ((lines_drawn += 2))

    # Skill list
    if ((vis_count == 0)); then
      echo -e "\033[2K  ${DIM}No skills match \"${filter}\"${NC}"
      echo -e "\033[2K"
      ((lines_drawn += 2))
    else
      local end=$((scroll_offset + display_count))
      for ((vi = scroll_offset; vi < end; vi++)); do
        local idx=${visible[$vi]}
        local checkbox
        if ((selected[idx] == 1)); then
          checkbox="${GREEN}[x]${NC}"
        else
          checkbox="[ ]"
        fi

        # Truncate description to fit
        local name="${names[$idx]}"
        local desc="${descs[$idx]}"
        local max_desc=50
        if ((${#desc} > max_desc)); then
          desc="${desc:0:$max_desc}..."
        fi

        if ((vi == current)); then
          echo -e "\033[2K  ${BOLD}> ${checkbox} ${name}${NC}  ${DIM}${desc}${NC}"
        else
          echo -e "\033[2K    ${checkbox} ${name}  ${DIM}${desc}${NC}"
        fi
        ((lines_drawn++))
      done
    fi

    # Footer
    echo -e "\033[2K"
    echo -e "\033[2K  ${DIM}${vis_count} matching · ${sel_count} selected${NC}"
    ((lines_drawn += 2))

    last_drawn=$lines_drawn

    # Read input
    IFS= read -rsn1 key < /dev/tty
    case "$key" in
      $'\x1b') # Escape sequence
        # Use timeout to distinguish bare ESC (cancel) from arrow key sequences
        # Arrow keys send ESC [ A/B; bare ESC is just ESC with no follow-up
        if IFS= read -rsn1 -t 0.1 seq1 < /dev/tty; then
          if IFS= read -rsn1 -t 0.1 seq2 < /dev/tty; then
            case "${seq1}${seq2}" in
              '[A') # Up
                ((current > 0)) && ((current--))
                ;;
              '[B') # Down
                ((current < vis_count - 1)) && ((current++))
                ;;
            esac
          fi
        else
          # Bare ESC — cancel
          tput cnorm 2>/dev/null || true
          SELECTED_SKILLS=()
          return 1
        fi
        ;;
      ' ') # Space — toggle
        if ((vis_count > 0)); then
          local idx=${visible[$current]}
          if ((selected[idx] == 1)); then
            selected[$idx]=0
          else
            selected[$idx]=1
          fi
        fi
        ;;
      $'\x7f'|$'\x08') # Backspace (DEL or BS)
        if ((${#filter} > 0)); then
          filter="${filter%?}"
          _rebuild_visible
          current=0
          scroll_offset=0
        fi
        ;;
      '') # Enter — confirm
        break
        ;;
      *) # Regular character — append to filter
        if [[ "$key" =~ [[:print:]] ]]; then
          filter="${filter}${key}"
          _rebuild_visible
          current=0
          scroll_offset=0
        fi
        ;;
    esac
  done

  # Restore cursor
  tput cnorm 2>/dev/null || true

  # Build result array of selected skill names
  SELECTED_SKILLS=()
  for ((i = 0; i < total_count; i++)); do
    if ((selected[i] == 1)); then
      SELECTED_SKILLS+=("${names[$i]}")
    fi
  done
  return 0
}

# Single-select menu — returns selected index in SELECTED_INDEX
# Pass --back as first arg to show a back option (returns 1 if chosen)
select_menu() {
  local show_back=false
  if [[ "${1:-}" == "--back" ]]; then
    show_back=true
    shift
  fi

  local title="$1"
  shift
  local -a options=()
  local -a descriptions=()

  while [[ $# -gt 0 ]]; do
    local item="$1"
    options+=("${item%%|*}")
    descriptions+=("${item#*|}")
    shift
  done

  local current=0
  local count=${#options[@]}
  local max_index=$((count - 1))
  $show_back && max_index=$count

  tput civis 2>/dev/null || true

  while true; do
    echo -e "\033[2K${BOLD}${CYAN}  $title${NC}"
    echo -e "\033[2K${DIM}  Use arrow keys to move, enter to select${NC}"
    echo -e "\033[2K"

    for i in $(seq 0 $((count - 1))); do
      if [[ $i -eq $current ]]; then
        echo -e "\033[2K  ${BOLD}${GREEN}> ${options[$i]}${NC}  ${DIM}${descriptions[$i]}${NC}"
      else
        echo -e "\033[2K    ${options[$i]}  ${DIM}${descriptions[$i]}${NC}"
      fi
    done

    if $show_back; then
      echo -e "\033[2K"
      if [[ $current -eq $count ]]; then
        echo -e "\033[2K  ${BOLD}> ${DIM}← Back${NC}"
      else
        echo -e "\033[2K    ${DIM}← Back${NC}"
      fi
    fi

    echo -e "\033[2K"

    IFS= read -rsn1 key < /dev/tty
    case "$key" in
      $'\x1b')
        read -rsn2 key < /dev/tty
        case "$key" in
          '[A') ((current > 0)) && ((current--)) ;;
          '[B') ((current < max_index)) && ((current++)) ;;
        esac
        ;;
      '')
        if $show_back && [[ $current -eq $count ]]; then
          tput cnorm 2>/dev/null || true
          return 1
        fi
        break
        ;;
    esac

    local lines_to_move=$((count + 4))
    $show_back && lines_to_move=$((count + 6))
    echo -en "\033[${lines_to_move}A"
  done

  tput cnorm 2>/dev/null || true
  SELECTED_INDEX=$current
  return 0
}

# ============================================================================
# Installation
# ============================================================================

download_skill() {
  local skill_name="$1"
  local source
  local path
  local base_url
  local target_dir

  source=$(get_skill_info "$skill_name" "source")
  path=$(get_skill_info "$skill_name" "path")
  base_url=$(get_source_url "$source")
  target_dir="${SKILLS_DIR}/${skill_name}"

  mkdir -p "$target_dir"

  local url="${base_url}/${path}"
  if curl -sL --fail "$url" -o "${target_dir}/SKILL.md" 2>/dev/null; then
    echo -e "  ${GREEN}+${NC} ${skill_name}"
    ensure_gitignored "${SKILLS_DIR}/${skill_name}/"
    return 0
  else
    echo -e "  ${RED}x${NC} ${skill_name} ${DIM}(download failed)${NC}"
    rm -rf "$target_dir"
    return 1
  fi
}

install_skills() {
  local -a skill_names=("$@")
  local success=0
  local failed=0
  local total=${#skill_names[@]}

  echo ""
  echo -e "${BOLD}Installing ${total} skills to ${SKILLS_DIR}/${NC}"
  echo ""

  mkdir -p "$SKILLS_DIR"

  for skill in "${skill_names[@]}"; do
    if download_skill "$skill"; then
      ((success++))
    else
      ((failed++))
    fi
  done

  echo ""
  echo -e "${BOLD}────────────────────────────────────${NC}"
  echo -e "  ${GREEN}Installed:${NC} ${success} skills"
  if [[ $failed -gt 0 ]]; then
    echo -e "  ${RED}Failed:${NC}    ${failed} skills"
  fi
  echo -e "${BOLD}────────────────────────────────────${NC}"
  echo ""
  echo -e "  ${DIM}Scope:${NC}     ${INSTALL_SCOPE}"
  echo -e "Skills installed to: ${BOLD}${SKILLS_DIR}/${NC}"
  if [[ "$INSTALL_SCOPE" == "local" ]]; then
    echo -e "Entries added to ${BOLD}.gitignore${NC} ${DIM}(local scope)${NC}"
  fi
  echo -e "Run ${DIM}./install.sh --update${NC} to refresh later."
  echo ""
}

# ============================================================================
# Commands
# ============================================================================

cmd_list() {
  load_registry
  echo ""
  echo -e "${BOLD}Available Skills (${SKILL_COUNT} total)${NC}"
  echo ""

  local categories
  categories=$(get_all_categories)

  while IFS= read -r cat_id; do
    local cat_name
    cat_name=$(get_category_name "$cat_id")
    local cat_desc
    cat_desc=$(get_category_desc "$cat_id")
    echo -e "  ${BOLD}${CYAN}${cat_name}${NC} ${DIM}— ${cat_desc}${NC}"

    local skills
    skills=$(get_skills_by_categories "$cat_id")
    while IFS= read -r skill_name; do
      [[ -z "$skill_name" ]] && continue
      local desc
      desc=$(get_skill_info "$skill_name" "description")
      local source
      source=$(get_skill_info "$skill_name" "source")

      local installed=""
      if [[ -f "${SKILLS_DIR}/${skill_name}/SKILL.md" ]]; then
        installed="${GREEN} (installed)${NC}"
      fi

      echo -e "    ${BOLD}${skill_name}${NC}${installed}"
      echo -e "    ${DIM}${desc}${NC}"
      echo -e "    ${DIM}Source: ${source}${NC}"
      echo ""
    done <<< "$skills"
  done <<< "$categories"
}

cmd_preset() {
  local preset_name="$1"
  load_registry

  # Validate preset
  local valid_presets
  valid_presets=$(json_query "$SKILLS_JSON" '.presets | keys[]')
  if ! echo "$valid_presets" | grep -qx "$preset_name"; then
    echo -e "${RED}Unknown preset: ${preset_name}${NC}"
    echo ""
    echo "Available presets:"
    while IFS= read -r p; do
      echo "  $p"
    done <<< "$valid_presets"
    exit 1
  fi

  echo -e "${BOLD}Installing preset: ${CYAN}${preset_name}${NC}"

  local -a categories=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && categories+=("$line")
  done < <(get_preset_categories "$preset_name")

  local -a skill_names=()
  for cat in "${categories[@]}"; do
    local skills
    skills=$(get_skills_by_categories "$cat")
    while IFS= read -r name; do
      [[ -n "$name" ]] && skill_names+=("$name")
    done <<< "$skills"
  done

  install_skills "${skill_names[@]}"
}

cmd_update() {
  load_registry

  if [[ ! -d "$SKILLS_DIR" ]]; then
    echo -e "${YELLOW}No skills installed yet. Run ./install.sh first.${NC}"
    exit 0
  fi

  echo -e "${BOLD}Updating installed skills...${NC}"

  local -a installed=()
  for dir in "${SKILLS_DIR}"/*/; do
    [[ -d "$dir" ]] || continue
    local name
    name=$(basename "$dir")
    installed+=("$name")
  done

  if [[ ${#installed[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No skills found in ${SKILLS_DIR}/${NC}"
    exit 0
  fi

  install_skills "${installed[@]}"
}

cmd_search() {
  local initial_filter="${1:-}"
  load_registry
  print_banner

  # Build parallel arrays of all skills
  _SCM_NAMES=()
  _SCM_DESCS=()
  for ((i = 0; i < SKILL_COUNT; i++)); do
    _SCM_NAMES+=("$(json_query "$SKILLS_JSON" ".skills[$i].name")")
    _SCM_DESCS+=("$(json_query "$SKILLS_JSON" ".skills[$i].description")")
  done

  echo ""
  if search_checkbox_menu "Search skills (${SKILL_COUNT} available)" "$SKILL_COUNT" "$initial_filter"; then
    if [[ ${#SELECTED_SKILLS[@]} -eq 0 ]]; then
      echo -e "${YELLOW}No skills selected. Exiting.${NC}"
      exit 0
    fi

    # Scope selection (if not set via --scope flag)
    if ! $SCOPE_SET_BY_FLAG; then
      echo ""
      select_scope
    fi

    # Confirmation
    echo ""
    echo -e "${BOLD}Skills to install (${#SELECTED_SKILLS[@]}):${NC}"
    echo -e "${DIM}  Scope: ${INSTALL_SCOPE} → ${SKILLS_DIR}/${NC}"
    echo ""
    for skill in "${SELECTED_SKILLS[@]}"; do
      local desc
      desc=$(get_skill_info "$skill" "description")
      echo -e "  ${GREEN}+${NC} ${BOLD}${skill}${NC}  ${DIM}${desc}${NC}"
    done
    echo ""

    read -rp "$(echo -e "${BOLD}Install these skills? ${NC}[Y/n] ")" confirm < /dev/tty
    case "${confirm:-y}" in
      [Yy]*|"")
        install_skills "${SELECTED_SKILLS[@]}"
        ;;
      *)
        echo -e "${YELLOW}Installation cancelled.${NC}"
        exit 0
        ;;
    esac
  else
    echo ""
    echo -e "${YELLOW}Search cancelled.${NC}"
    exit 0
  fi
}

cmd_interactive() {
  print_banner

  # Step 0: Choose what to install
  echo ""
  select_menu "What do you want to install?" \
    "Skills|77 curated skill files (.claude/skills/)" \
    "Agents|83 plugins from 2 marketplaces (via claude plugin CLI)" \
    "Both|Install skills first, then agents"

  case $SELECTED_INDEX in
    1)
      cmd_agents_interactive
      return
      ;;
    2)
      load_registry
      _run_skill_wizard
      cmd_agents_interactive
      return
      ;;
  esac

  # Default: skills only
  load_registry
  _run_skill_wizard
}

_run_skill_wizard() {
  local step=1
  local project_label stack_label
  local use_detection=false

  # Try auto-detection first
  detect_project
  if [[ ${#DETECTED_SKILL_CATS[@]} -gt 0 ]]; then
    use_detection=true
    step=3

    # Show detection banner
    local tech_list=""
    for t in "${DETECTED_TECHS[@]}"; do
      if [[ -n "$tech_list" ]]; then tech_list+=", "; fi
      tech_list+="$t"
    done
    echo ""
    echo -e "  ${GREEN}Detected:${NC} ${BOLD}${tech_list}${NC}"
    echo -e "  ${DIM}Pre-selecting relevant categories. Press Back to choose manually.${NC}"
  fi

  while true; do
    case $step in
      1)
        # Step 1: Project type
        echo ""
        select_menu "What type of project are you working on?" \
          "Web application|React, Vue, Angular, Next.js, etc." \
          "Mobile app|React Native, Flutter, native iOS/Android" \
          "Backend / API|Node.js, Python, Go, Rust, etc." \
          "CLI tool|Command-line applications" \
          "General / All|Not project-specific, show everything"

        case $SELECTED_INDEX in
          0) project_label="web" ;;
          1) project_label="mobile" ;;
          2) project_label="backend" ;;
          3) project_label="cli" ;;
          4) project_label="general" ;;
        esac

        echo -e "  ${DIM}Selected: ${project_label}${NC}"
        echo ""
        step=2
        ;;

      2)
        # Step 2: Tech stack (contextual)
        stack_label=""
        if [[ "$project_label" == "mobile" ]]; then
          if ! select_menu --back "What mobile framework?" \
            "React Native (Expo)|JavaScript/TypeScript with Expo SDK" \
            "React Native (bare)|JavaScript/TypeScript without Expo" \
            "Flutter|Dart cross-platform framework" \
            "Native iOS|Swift / Objective-C" \
            "Native Android|Kotlin / Java"; then
            step=1; continue
          fi

          case $SELECTED_INDEX in
            0) stack_label="expo" ;;
            1) stack_label="react-native" ;;
            2) stack_label="flutter" ;;
            3) stack_label="ios" ;;
            4) stack_label="android" ;;
          esac
          echo -e "  ${DIM}Selected: ${stack_label}${NC}"
          echo ""

        elif [[ "$project_label" == "web" ]]; then
          if ! select_menu --back "What web framework?" \
            "React|Component-based UI library" \
            "Next.js|React framework with SSR/SSG" \
            "Vue|Progressive JavaScript framework" \
            "Angular|Full-featured TypeScript framework" \
            "Other|Vanilla JS, Svelte, etc."; then
            step=1; continue
          fi

          case $SELECTED_INDEX in
            0) stack_label="react" ;;
            1) stack_label="nextjs" ;;
            2) stack_label="vue" ;;
            3) stack_label="angular" ;;
            4) stack_label="web-other" ;;
          esac
          echo -e "  ${DIM}Selected: ${stack_label}${NC}"
          echo ""

        elif [[ "$project_label" == "backend" ]]; then
          if ! select_menu --back "What backend stack?" \
            "Node.js|Express, NestJS, Fastify, etc." \
            "Python|Django, FastAPI, Flask, etc." \
            "Go|Standard library, Gin, Echo, etc." \
            "Rust|Actix, Axum, Rocket, etc." \
            "Other|Java, Ruby, PHP, etc."; then
            step=1; continue
          fi

          case $SELECTED_INDEX in
            0) stack_label="nodejs" ;;
            1) stack_label="python" ;;
            2) stack_label="go" ;;
            3) stack_label="rust" ;;
            4) stack_label="backend-other" ;;
          esac
          echo -e "  ${DIM}Selected: ${stack_label}${NC}"
          echo ""
        fi

        step=3
        ;;

      3)
        # Step 3: Category selection
        local -a cat_ids=()
        local -a cat_options=()
        local -a preselected=()
        local idx=0

        while IFS= read -r cat_id; do
          [[ -z "$cat_id" ]] && continue
          cat_ids+=("$cat_id")
          local name
          name=$(get_category_name "$cat_id")
          local desc
          desc=$(get_category_desc "$cat_id")
          cat_options+=("${name}|${desc}")

          if $use_detection; then
            # Pre-select based on detection results
            for dcat in "${DETECTED_SKILL_CATS[@]}"; do
              if [[ "$dcat" == "$cat_id" ]]; then
                preselected+=("$idx")
                break
              fi
            done
          else
            local rec
            rec=$(is_category_recommended "$cat_id")
            if [[ "$rec" == "true" ]]; then
              preselected+=("$idx")
            fi
          fi
          ((idx++))
        done < <(get_all_categories)

        # Back behavior: detection → manual step 1; otherwise tech/project step
        local prev_step=1
        if ! $use_detection; then
          if [[ "$project_label" == "mobile" || "$project_label" == "web" || "$project_label" == "backend" ]]; then
            prev_step=2
          fi
        fi

        if ! checkbox_menu --back "Which skill categories do you want?" \
          "${cat_options[@]}" \
          "__SEP__" \
          "${preselected[@]}"; then
          # If coming from detection, disable it and go to manual step 1
          use_detection=false
          step=$prev_step; continue
        fi

        # Gather selected categories
        local -a selected_categories=()
        for i in "${SELECTED_INDICES[@]}"; do
          selected_categories+=("${cat_ids[$i]}")
        done

        if [[ ${#selected_categories[@]} -eq 0 ]]; then
          echo -e "${YELLOW}No categories selected. Exiting.${NC}"
          exit 0
        fi

        # Resolve skills
        local -a skill_names=()
        for cat in "${selected_categories[@]}"; do
          local skills
          skills=$(get_skills_by_categories "$cat")
          while IFS= read -r name; do
            [[ -n "$name" ]] && skill_names+=("$name")
          done <<< "$skills"
        done

        # Step 4: Scope selection + summary + confirm
        if ! $SCOPE_SET_BY_FLAG; then
          echo ""
          select_scope
        fi

        echo ""
        echo -e "${BOLD}Skills to install (${#skill_names[@]}):${NC}"
        echo -e "${DIM}  Scope: ${INSTALL_SCOPE} → ${SKILLS_DIR}/${NC}"
        echo ""
        for skill in "${skill_names[@]}"; do
          local desc
          desc=$(get_skill_info "$skill" "description")
          echo -e "  ${GREEN}+${NC} ${BOLD}${skill}${NC}  ${DIM}${desc}${NC}"
        done
        echo ""

        read -rp "$(echo -e "${BOLD}Install these skills? ${NC}[Y/n/b] ")" confirm < /dev/tty
        case "${confirm:-y}" in
          [Yy]*|"")
            install_skills "${skill_names[@]}"
            break
            ;;
          [Bb]*)
            step=3
            continue
            ;;
          *)
            echo -e "${YELLOW}Installation cancelled.${NC}"
            exit 0
            ;;
        esac
        ;;
    esac
  done
}

# ============================================================================
# Agent commands
# ============================================================================

print_agents_help() {
  print_banner
  echo -e "${BOLD}AGENT INSTALLATION (via plugin marketplace)${NC}"
  echo ""
  echo -e "Agents are installed as plugins from two marketplaces:"
  echo -e "  ${DIM}VoltAgent — 10 category bundles (~130 agents)${NC}"
  echo -e "  ${DIM}Claude Code Workflows — 73 focused plugins (~112 agents)${NC}"
  echo ""
  echo -e "${BOLD}USAGE${NC}"
  echo "  ./install.sh --agents                     Interactive mode"
  echo "  ./install.sh --agents --preset <name>     Install a preset"
  echo "  ./install.sh --agents --list              List all plugins"
  echo "  ./install.sh --agents --search [term]     Search & pick plugins"
  echo "  ./install.sh --agents --update            Update installed plugins"
  echo "  ./install.sh --agents --help              Show this help"
  echo ""
  echo -e "${BOLD}SCOPE${NC}"
  echo "  --scope project     .claude/settings.json — shared with collaborators (default)"
  echo "  --scope user        ~/.claude/settings.json — available in all your projects"
  echo "  --scope local       .claude/settings.local.json — this repo only, auto-gitignored"
  echo ""
  echo -e "${BOLD}PRESETS${NC}"
  echo "  core-dev       Core development plugins (8 plugins)"
  echo "  web            Core + language specialists (17 plugins)"
  echo "  mobile         Core + language specialists (17 plugins)"
  echo "  backend        Core + languages + infrastructure (23 plugins)"
  echo "  fullstack      Core + languages + quality + DX (43 plugins)"
  echo "  devops         Infrastructure + quality + orchestration (23 plugins)"
  echo "  security       Quality/security + infrastructure (18 plugins)"
  echo "  full           Everything (83 plugins)"
  echo ""
  echo -e "${BOLD}EXAMPLES${NC}"
  echo "  ./install.sh --agents --preset core-dev"
  echo "  ./install.sh --agents --search kubernetes"
  echo "  ./install.sh --agents --list"
  echo ""
  echo -e "${DIM}Requires Claude CLI: npm install -g @anthropic-ai/claude-code${NC}"
  echo ""
}

cmd_agents_list() {
  load_agent_registry
  echo ""
  echo -e "${BOLD}Available Plugins (${PLUGIN_COUNT} total from 2 marketplaces)${NC}"
  echo ""

  local categories
  categories=$(get_all_plugin_categories)

  while IFS= read -r cat_id; do
    local cat_name
    cat_name=$(get_plugin_category_name "$cat_id")
    local cat_desc
    cat_desc=$(get_plugin_category_desc "$cat_id")
    echo -e "  ${BOLD}${CYAN}${cat_name}${NC} ${DIM}— ${cat_desc}${NC}"

    local plugins
    plugins=$(get_plugins_by_categories "$cat_id")
    while IFS= read -r plugin_name; do
      [[ -z "$plugin_name" ]] && continue
      local desc
      desc=$(get_plugin_info "$plugin_name" "description")
      local marketplace
      marketplace=$(get_plugin_info "$plugin_name" "marketplace")
      local agent_count
      agent_count=$(get_plugin_info "$plugin_name" "agent_count")

      echo -e "    ${BOLD}${plugin_name}${NC}@${marketplace} ${DIM}(${agent_count} agents)${NC}"
      echo -e "    ${DIM}${desc}${NC}"
      echo ""
    done <<< "$plugins"
  done <<< "$categories"
}

cmd_agents_preset() {
  local preset_name="$1"
  load_agent_registry
  check_claude_cli

  # Validate preset
  local valid_presets
  valid_presets=$(json_query "$AGENTS_JSON" '.presets | keys[]')
  if ! echo "$valid_presets" | grep -qx "$preset_name"; then
    echo -e "${RED}Unknown plugin preset: ${preset_name}${NC}"
    echo ""
    echo "Available presets:"
    while IFS= read -r p; do
      echo "  $p"
    done <<< "$valid_presets"
    exit 1
  fi

  echo -e "${BOLD}Installing plugin preset: ${CYAN}${preset_name}${NC}"

  local -a categories=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && categories+=("$line")
  done < <(get_plugin_preset_categories "$preset_name")

  # Resolve categories to plugins (deduplicated)
  local -a plugin_names=()
  local -a seen=()
  for cat in "${categories[@]}"; do
    local plugins
    plugins=$(get_plugins_by_categories "$cat")
    while IFS= read -r name; do
      [[ -z "$name" ]] && continue
      local already=false
      for s in "${seen[@]+"${seen[@]}"}"; do
        if [[ "$s" == "$name" ]]; then
          already=true
          break
        fi
      done
      if ! $already; then
        plugin_names+=("$name")
        seen+=("$name")
      fi
    done <<< "$plugins"
  done

  install_plugins "${plugin_names[@]}"
}

cmd_agents_search() {
  local initial_filter="${1:-}"
  load_agent_registry
  check_claude_cli
  print_banner

  # Build parallel arrays of all plugins (search matches plugin names, descriptions, and tags)
  _SCM_NAMES=()
  _SCM_DESCS=()
  for ((i = 0; i < PLUGIN_COUNT; i++)); do
    _SCM_NAMES+=("$(json_query "$AGENTS_JSON" ".plugins[$i].name")")
    _SCM_DESCS+=("$(json_query "$AGENTS_JSON" ".plugins[$i].description")")
  done

  echo ""
  if search_checkbox_menu "Search plugins (${PLUGIN_COUNT} available)" "$PLUGIN_COUNT" "$initial_filter"; then
    if [[ ${#SELECTED_SKILLS[@]} -eq 0 ]]; then
      echo -e "${YELLOW}No plugins selected. Exiting.${NC}"
      exit 0
    fi

    # Scope selection (if not set via --scope flag)
    if ! $SCOPE_SET_BY_FLAG; then
      echo ""
      select_agent_scope
    fi

    # Confirmation
    echo ""
    echo -e "${BOLD}Plugins to install (${#SELECTED_SKILLS[@]}):${NC}"
    echo -e "${DIM}  Scope: ${INSTALL_SCOPE}${NC}"
    echo ""
    for plugin in "${SELECTED_SKILLS[@]}"; do
      local desc
      desc=$(get_plugin_info "$plugin" "description")
      local marketplace
      marketplace=$(get_plugin_info "$plugin" "marketplace")
      local agent_count
      agent_count=$(get_plugin_info "$plugin" "agent_count")
      echo -e "  ${GREEN}+${NC} ${BOLD}${plugin}${NC}@${marketplace} ${DIM}(${agent_count} agents) ${desc}${NC}"
    done
    echo ""

    read -rp "$(echo -e "${BOLD}Install these plugins? ${NC}[Y/n] ")" confirm < /dev/tty
    case "${confirm:-y}" in
      [Yy]*|"")
        install_plugins "${SELECTED_SKILLS[@]}"
        ;;
      *)
        echo -e "${YELLOW}Installation cancelled.${NC}"
        exit 0
        ;;
    esac
  else
    echo ""
    echo -e "${YELLOW}Search cancelled.${NC}"
    exit 0
  fi
}

cmd_agents_update() {
  load_agent_registry
  check_claude_cli

  echo -e "${BOLD}Updating installed plugins...${NC}"
  echo ""

  # Collect all unique marketplaces from registry
  local -a all_marketplaces=()
  if command -v jq &>/dev/null; then
    while IFS= read -r mp; do
      [[ -n "$mp" ]] && all_marketplaces+=("$mp")
    done < <(echo "$AGENTS_JSON" | jq -r '.marketplaces | keys[]')
  else
    while IFS= read -r mp; do
      [[ -n "$mp" ]] && all_marketplaces+=("$mp")
    done < <(echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for k in data['marketplaces']:
    print(k)
")
  fi

  ensure_all_marketplaces "${all_marketplaces[@]}"

  local success=0
  local failed=0

  for ((i = 0; i < PLUGIN_COUNT; i++)); do
    local plugin_name
    plugin_name=$(json_query "$AGENTS_JSON" ".plugins[$i].name")
    local marketplace
    marketplace=$(json_query "$AGENTS_JSON" ".plugins[$i].marketplace")

    if claude plugin update "${plugin_name}@${marketplace}" 2>/dev/null; then
      echo -e "  ${GREEN}+${NC} ${plugin_name}@${marketplace} ${DIM}(updated)${NC}"
      ((success++))
    else
      ((failed++))
    fi
  done

  echo ""
  echo -e "${BOLD}────────────────────────────────────${NC}"
  echo -e "  ${GREEN}Updated:${NC} ${success} plugins"
  if [[ $failed -gt 0 ]]; then
    echo -e "  ${DIM}Skipped:${NC} ${failed} plugins (not installed or unchanged)"
  fi
  echo -e "${BOLD}────────────────────────────────────${NC}"
  echo ""
}

cmd_agents_interactive() {
  load_agent_registry
  check_claude_cli
  print_banner

  # Try auto-detection
  detect_project
  local use_agent_detection=false
  if [[ ${#DETECTED_AGENT_CATS[@]} -gt 0 ]]; then
    use_agent_detection=true

    local tech_list=""
    for t in "${DETECTED_TECHS[@]}"; do
      if [[ -n "$tech_list" ]]; then tech_list+=", "; fi
      tech_list+="$t"
    done
    echo ""
    echo -e "  ${GREEN}Detected:${NC} ${BOLD}${tech_list}${NC}"
    echo -e "  ${DIM}Pre-selecting relevant plugin categories.${NC}"
  fi

  # Step 1: Category selection
  local -a cat_ids=()
  local -a cat_options=()
  local -a preselected=()
  local idx=0

  while IFS= read -r cat_id; do
    [[ -z "$cat_id" ]] && continue
    cat_ids+=("$cat_id")
    local name
    name=$(get_plugin_category_name "$cat_id")
    local desc
    desc=$(get_plugin_category_desc "$cat_id")
    cat_options+=("${name}|${desc}")

    if $use_agent_detection; then
      for dcat in "${DETECTED_AGENT_CATS[@]}"; do
        if [[ "$dcat" == "$cat_id" ]]; then
          preselected+=("$idx")
          break
        fi
      done
    else
      local rec
      rec=$(is_plugin_category_recommended "$cat_id")
      if [[ "$rec" == "true" ]]; then
        preselected+=("$idx")
      fi
    fi
    ((idx++))
  done < <(get_all_plugin_categories)

  echo ""
  if ! checkbox_menu "Which plugin categories do you want?" \
    "${cat_options[@]}" \
    "__SEP__" \
    "${preselected[@]}"; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
  fi

  # Gather selected categories
  local -a selected_categories=()
  for i in "${SELECTED_INDICES[@]}"; do
    selected_categories+=("${cat_ids[$i]}")
  done

  if [[ ${#selected_categories[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No categories selected. Exiting.${NC}"
    exit 0
  fi

  # Resolve categories to plugins (deduplicated)
  local -a plugin_names=()
  local -a seen=()
  for cat in "${selected_categories[@]}"; do
    local plugins
    plugins=$(get_plugins_by_categories "$cat")
    while IFS= read -r name; do
      [[ -z "$name" ]] && continue
      local already=false
      for s in "${seen[@]+"${seen[@]}"}"; do
        if [[ "$s" == "$name" ]]; then
          already=true
          break
        fi
      done
      if ! $already; then
        plugin_names+=("$name")
        seen+=("$name")
      fi
    done <<< "$plugins"
  done

  # Scope selection + summary + confirm
  if ! $SCOPE_SET_BY_FLAG; then
    echo ""
    select_agent_scope
  fi

  echo ""
  echo -e "${BOLD}Plugins to install (${#plugin_names[@]}):${NC}"
  echo -e "${DIM}  Scope: ${INSTALL_SCOPE}${NC}"
  echo ""
  for plugin in "${plugin_names[@]}"; do
    local desc
    desc=$(get_plugin_info "$plugin" "description")
    local marketplace
    marketplace=$(get_plugin_info "$plugin" "marketplace")
    local agent_count
    agent_count=$(get_plugin_info "$plugin" "agent_count")
    echo -e "  ${GREEN}+${NC} ${BOLD}${plugin}${NC}@${marketplace} ${DIM}(${agent_count} agents) ${desc}${NC}"
  done
  echo ""

  read -rp "$(echo -e "${BOLD}Install these plugins? ${NC}[Y/n] ")" confirm < /dev/tty
  case "${confirm:-y}" in
    [Yy]*|"")
      install_plugins "${plugin_names[@]}"
      ;;
    *)
      echo -e "${YELLOW}Installation cancelled.${NC}"
      exit 0
      ;;
  esac
}

# ============================================================================
# Main
# ============================================================================

main() {
  check_dependencies

  # Extract --scope flag from anywhere in args
  local -a remaining_args=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --scope)
        if [[ -z "${2:-}" ]]; then
          echo -e "${RED}Error: --scope requires a value (user, project, local)${NC}"
          exit 1
        fi
        case "$2" in
          user|project|local)
            INSTALL_SCOPE="$2"
            SCOPE_SET_BY_FLAG=true
            apply_scope
            ;;
          *)
            echo -e "${RED}Error: invalid scope '${2}'. Use: user, project, local${NC}"
            exit 1
            ;;
        esac
        shift 2
        ;;
      *)
        remaining_args+=("$1")
        shift
        ;;
    esac
  done
  set -- ${remaining_args[@]+"${remaining_args[@]}"}

  # Agent mode: --agents consumes first arg, dispatches remaining to agent commands
  if [[ "${1:-}" == "--agents" ]]; then
    shift
    case "${1:-}" in
      --help|-h)
        print_agents_help
        ;;
      --list|-l)
        cmd_agents_list
        ;;
      --preset|-p)
        if [[ -z "${2:-}" ]]; then
          echo -e "${RED}Error: --preset requires a name${NC}"
          echo "Usage: ./install.sh --agents --preset <name>"
          exit 1
        fi
        cmd_agents_preset "$2"
        ;;
      --update|-u)
        cmd_agents_update
        ;;
      --search|-s)
        cmd_agents_search "${2:-}"
        ;;
      "")
        cmd_agents_interactive
        ;;
      *)
        echo -e "${RED}Unknown agent option: $1${NC}"
        print_agents_help
        exit 1
        ;;
    esac
    return
  fi

  case "${1:-}" in
    --help|-h)
      print_help
      ;;
    --list|-l)
      cmd_list
      ;;
    --preset|-p)
      if [[ -z "${2:-}" ]]; then
        echo -e "${RED}Error: --preset requires a name${NC}"
        echo "Usage: ./install.sh --preset <name>"
        exit 1
      fi
      cmd_preset "$2"
      ;;
    --update|-u)
      cmd_update
      ;;
    --search|-s)
      cmd_search "${2:-}"
      ;;
    --scan)
      cmd_scan
      ;;
    --version|-v)
      echo "claude-superpowers v${VERSION}"
      ;;
    "")
      cmd_interactive
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_help
      exit 1
      ;;
  esac
}

main "$@"
exit $?
}
