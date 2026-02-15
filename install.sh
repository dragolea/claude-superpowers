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
AGENTS_DIR=".claude/agents"

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
  echo "  ./install.sh --help              Show this help"
  echo ""
  echo -e "${BOLD}USAGE — AGENTS${NC}"
  echo "  ./install.sh --agents                     Interactive mode"
  echo "  ./install.sh --agents --preset <name>     Install a preset"
  echo "  ./install.sh --agents --list              List all agents"
  echo "  ./install.sh --agents --search [term]     Search & pick agents"
  echo "  ./install.sh --agents --update            Re-download installed agents"
  echo "  ./install.sh --agents --help              Agent help"
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
elif query == '.agents | length':
    print(len(data['agents']))
elif query.startswith('.agents['):
    import re
    m = re.match(r'\.agents\[(\d+)\]\.(\w+)', query)
    if m:
        print(data['agents'][int(m.group(1))][m.group(2)])
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
  local sources_file=""

  # Try local registry first (when running from repo), then fetch from GitHub
  if [[ -f "${SCRIPT_DIR}/registry/agents.json" ]]; then
    agents_file="${SCRIPT_DIR}/registry/agents.json"
    sources_file="${SCRIPT_DIR}/registry/sources.json"
    AGENTS_JSON=$(cat "$agents_file")
    SOURCES_JSON=$(cat "$sources_file")
  else
    echo -e "${DIM}Fetching agent registry from GitHub...${NC}"
    AGENTS_JSON=$(curl -sL --fail "${REGISTRY_URL}/agents.json") || {
      echo -e "${RED}Failed to fetch agent registry.${NC}"
      exit 1
    }
    SOURCES_JSON=$(curl -sL --fail "${REGISTRY_URL}/sources.json") || {
      echo -e "${RED}Failed to fetch source registry.${NC}"
      exit 1
    }
  fi

  AGENT_COUNT=$(json_query "$AGENTS_JSON" '.agents | length')
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
# Agent queries
# ============================================================================

# Get all agents matching given categories
get_agents_by_categories() {
  local categories=("$@")
  if command -v jq &>/dev/null; then
    local filter
    filter=$(printf '"%s",' "${categories[@]}")
    filter="[${filter%,}]"
    echo "$AGENTS_JSON" | jq -r --argjson cats "$filter" \
      '.agents[] | select(.category as $c | $cats | index($c)) | .name'
  else
    local cats_str
    cats_str=$(printf "'%s'," "${categories[@]}")
    cats_str="[${cats_str%,}]"
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
cats = ${cats_str}
for a in data['agents']:
    if a['category'] in cats:
        print(a['name'])
"
  fi
}

# Get agent info by name
get_agent_info() {
  local agent_name="$1"
  local field="$2"
  if command -v jq &>/dev/null; then
    echo "$AGENTS_JSON" | jq -r ".agents[] | select(.name == \"${agent_name}\") | .${field}"
  else
    echo "$AGENTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for a in data['agents']:
    if a['name'] == '${agent_name}':
        print(a['${field}'])
        break
"
  fi
}

# Get all unique agent categories
get_all_agent_categories() {
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

# Get agent category display name
get_agent_category_name() {
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

# Get agent category description
get_agent_category_desc() {
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

# Check if agent category is recommended
is_agent_category_recommended() {
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

# Get agent preset categories
get_agent_preset_categories() {
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
  echo -e "Skills installed to: ${BOLD}${SKILLS_DIR}/${NC}"
  echo -e "Run ${DIM}./install.sh --update${NC} to refresh later."
  echo ""
}

# ============================================================================
# Agent installation
# ============================================================================

download_agent() {
  local agent_name="$1"
  local source
  local path
  local base_url

  source=$(get_agent_info "$agent_name" "source")
  path=$(get_agent_info "$agent_name" "path")
  base_url=$(get_source_url "$source")

  mkdir -p "$AGENTS_DIR"

  local url="${base_url}/${path}"
  if curl -sL --fail "$url" -o "${AGENTS_DIR}/${agent_name}.md" 2>/dev/null; then
    echo -e "  ${GREEN}+${NC} ${agent_name}"
    return 0
  else
    echo -e "  ${RED}x${NC} ${agent_name} ${DIM}(download failed)${NC}"
    rm -f "${AGENTS_DIR}/${agent_name}.md"
    return 1
  fi
}

install_agents() {
  local -a agent_names=("$@")
  local success=0
  local failed=0
  local total=${#agent_names[@]}

  echo ""
  echo -e "${BOLD}Installing ${total} agents to ${AGENTS_DIR}/${NC}"
  echo ""

  mkdir -p "$AGENTS_DIR"

  for agent in "${agent_names[@]}"; do
    if download_agent "$agent"; then
      ((success++))
    else
      ((failed++))
    fi
  done

  echo ""
  echo -e "${BOLD}────────────────────────────────────${NC}"
  echo -e "  ${GREEN}Installed:${NC} ${success} agents"
  if [[ $failed -gt 0 ]]; then
    echo -e "  ${RED}Failed:${NC}    ${failed} agents"
  fi
  echo -e "${BOLD}────────────────────────────────────${NC}"
  echo ""
  echo -e "Agents installed to: ${BOLD}${AGENTS_DIR}/${NC}"
  echo -e "Run ${DIM}./install.sh --agents --update${NC} to refresh later."
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

    # Confirmation
    echo ""
    echo -e "${BOLD}Skills to install (${#SELECTED_SKILLS[@]}):${NC}"
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
  load_registry
  print_banner

  local step=1
  local project_label stack_label

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

          local rec
          rec=$(is_category_recommended "$cat_id")
          if [[ "$rec" == "true" ]]; then
            preselected+=("$idx")
          fi
          ((idx++))
        done < <(get_all_categories)

        # Go back to tech stack if applicable, otherwise project type
        local prev_step=1
        if [[ "$project_label" == "mobile" || "$project_label" == "web" || "$project_label" == "backend" ]]; then
          prev_step=2
        fi

        if ! checkbox_menu --back "Which skill categories do you want?" \
          "${cat_options[@]}" \
          "__SEP__" \
          "${preselected[@]}"; then
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

        # Step 4: Show summary and confirm
        echo ""
        echo -e "${BOLD}Skills to install (${#skill_names[@]}):${NC}"
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
  echo -e "${BOLD}AGENT INSTALLATION${NC}"
  echo ""
  echo -e "${BOLD}USAGE${NC}"
  echo "  ./install.sh --agents                     Interactive mode"
  echo "  ./install.sh --agents --preset <name>     Install a preset"
  echo "  ./install.sh --agents --list              List all agents"
  echo "  ./install.sh --agents --search            Search & pick agents"
  echo "  ./install.sh --agents --search <term>     Pre-filtered search"
  echo "  ./install.sh --agents --update            Re-download installed agents"
  echo "  ./install.sh --agents --help              Show this help"
  echo ""
  echo -e "${BOLD}PRESETS${NC}"
  echo "  core-dev       Frontend, backend, fullstack, API, mobile (10 agents)"
  echo "  web            Core + language specialists (36 agents)"
  echo "  mobile         Core + language specialists (36 agents)"
  echo "  backend        Core + languages + infrastructure (52 agents)"
  echo "  fullstack      Core + languages + quality + DX (63 agents)"
  echo "  devops         Infrastructure + quality + orchestration (40 agents)"
  echo "  security       Quality/security + infrastructure (30 agents)"
  echo "  full           Everything (130 agents)"
  echo ""
  echo -e "${BOLD}EXAMPLES${NC}"
  echo "  ./install.sh --agents --preset core-dev"
  echo "  ./install.sh --agents --search kubernetes"
  echo "  ./install.sh --agents --list"
  echo ""
}

cmd_agents_list() {
  load_agent_registry
  echo ""
  echo -e "${BOLD}Available Agents (${AGENT_COUNT} total)${NC}"
  echo ""

  local categories
  categories=$(get_all_agent_categories)

  while IFS= read -r cat_id; do
    local cat_name
    cat_name=$(get_agent_category_name "$cat_id")
    local cat_desc
    cat_desc=$(get_agent_category_desc "$cat_id")
    echo -e "  ${BOLD}${CYAN}${cat_name}${NC} ${DIM}— ${cat_desc}${NC}"

    local agents
    agents=$(get_agents_by_categories "$cat_id")
    while IFS= read -r agent_name; do
      [[ -z "$agent_name" ]] && continue
      local desc
      desc=$(get_agent_info "$agent_name" "description")

      local installed=""
      if [[ -f "${AGENTS_DIR}/${agent_name}.md" ]]; then
        installed="${GREEN} (installed)${NC}"
      fi

      echo -e "    ${BOLD}${agent_name}${NC}${installed}"
      echo -e "    ${DIM}${desc}${NC}"
      echo ""
    done <<< "$agents"
  done <<< "$categories"
}

cmd_agents_preset() {
  local preset_name="$1"
  load_agent_registry

  # Validate preset
  local valid_presets
  valid_presets=$(json_query "$AGENTS_JSON" '.presets | keys[]')
  if ! echo "$valid_presets" | grep -qx "$preset_name"; then
    echo -e "${RED}Unknown agent preset: ${preset_name}${NC}"
    echo ""
    echo "Available presets:"
    while IFS= read -r p; do
      echo "  $p"
    done <<< "$valid_presets"
    exit 1
  fi

  echo -e "${BOLD}Installing agent preset: ${CYAN}${preset_name}${NC}"

  local -a categories=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && categories+=("$line")
  done < <(get_agent_preset_categories "$preset_name")

  local -a agent_names=()
  for cat in "${categories[@]}"; do
    local agents
    agents=$(get_agents_by_categories "$cat")
    while IFS= read -r name; do
      [[ -n "$name" ]] && agent_names+=("$name")
    done <<< "$agents"
  done

  install_agents "${agent_names[@]}"
}

cmd_agents_search() {
  local initial_filter="${1:-}"
  load_agent_registry
  print_banner

  # Build parallel arrays of all agents
  _SCM_NAMES=()
  _SCM_DESCS=()
  for ((i = 0; i < AGENT_COUNT; i++)); do
    _SCM_NAMES+=("$(json_query "$AGENTS_JSON" ".agents[$i].name")")
    _SCM_DESCS+=("$(json_query "$AGENTS_JSON" ".agents[$i].description")")
  done

  echo ""
  if search_checkbox_menu "Search agents (${AGENT_COUNT} available)" "$AGENT_COUNT" "$initial_filter"; then
    if [[ ${#SELECTED_SKILLS[@]} -eq 0 ]]; then
      echo -e "${YELLOW}No agents selected. Exiting.${NC}"
      exit 0
    fi

    # Confirmation
    echo ""
    echo -e "${BOLD}Agents to install (${#SELECTED_SKILLS[@]}):${NC}"
    echo ""
    for agent in "${SELECTED_SKILLS[@]}"; do
      local desc
      desc=$(get_agent_info "$agent" "description")
      echo -e "  ${GREEN}+${NC} ${BOLD}${agent}${NC}  ${DIM}${desc}${NC}"
    done
    echo ""

    read -rp "$(echo -e "${BOLD}Install these agents? ${NC}[Y/n] ")" confirm < /dev/tty
    case "${confirm:-y}" in
      [Yy]*|"")
        install_agents "${SELECTED_SKILLS[@]}"
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

  if [[ ! -d "$AGENTS_DIR" ]]; then
    echo -e "${YELLOW}No agents installed yet. Run ./install.sh --agents first.${NC}"
    exit 0
  fi

  echo -e "${BOLD}Updating installed agents...${NC}"

  local -a installed=()
  for file in "${AGENTS_DIR}"/*.md; do
    [[ -f "$file" ]] || continue
    local name
    name=$(basename "$file" .md)
    installed+=("$name")
  done

  if [[ ${#installed[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No agents found in ${AGENTS_DIR}/${NC}"
    exit 0
  fi

  install_agents "${installed[@]}"
}

cmd_agents_interactive() {
  load_agent_registry
  print_banner

  # Step 1: Category selection
  local -a cat_ids=()
  local -a cat_options=()
  local -a preselected=()
  local idx=0

  while IFS= read -r cat_id; do
    [[ -z "$cat_id" ]] && continue
    cat_ids+=("$cat_id")
    local name
    name=$(get_agent_category_name "$cat_id")
    local desc
    desc=$(get_agent_category_desc "$cat_id")
    cat_options+=("${name}|${desc}")

    local rec
    rec=$(is_agent_category_recommended "$cat_id")
    if [[ "$rec" == "true" ]]; then
      preselected+=("$idx")
    fi
    ((idx++))
  done < <(get_all_agent_categories)

  echo ""
  if ! checkbox_menu "Which agent categories do you want?" \
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

  # Resolve agents
  local -a agent_names=()
  for cat in "${selected_categories[@]}"; do
    local agents
    agents=$(get_agents_by_categories "$cat")
    while IFS= read -r name; do
      [[ -n "$name" ]] && agent_names+=("$name")
    done <<< "$agents"
  done

  # Show summary and confirm
  echo ""
  echo -e "${BOLD}Agents to install (${#agent_names[@]}):${NC}"
  echo ""
  for agent in "${agent_names[@]}"; do
    local desc
    desc=$(get_agent_info "$agent" "description")
    echo -e "  ${GREEN}+${NC} ${BOLD}${agent}${NC}  ${DIM}${desc}${NC}"
  done
  echo ""

  read -rp "$(echo -e "${BOLD}Install these agents? ${NC}[Y/n] ")" confirm < /dev/tty
  case "${confirm:-y}" in
    [Yy]*|"")
      install_agents "${agent_names[@]}"
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
