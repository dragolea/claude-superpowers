# Searchable Skill Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `--search` flag to `install.sh` that opens a live-filter checkbox TUI for picking individual skills.

**Architecture:** New `search_checkbox_menu` function extending the existing TUI pattern. Loads all skills into arrays, renders a filterable checkbox list. New `cmd_search` command wired into `main()`. Pure bash, no new dependencies.

**Tech Stack:** Bash, terminal escape sequences (same as existing TUI)

---

### Task 1: Add `search_checkbox_menu` function

**Files:**
- Modify: `install.sh:430` (insert after `checkbox_menu` closing brace, before `select_menu`)

**Step 1: Add the `search_checkbox_menu` function**

Insert the following function after line 431 (`return 0` / closing `}` of `checkbox_menu`):

```bash
# Searchable checkbox menu — returns selected names in SELECTED_SKILLS array
# Args: title, total_count, parallel arrays set via _SCM_NAMES, _SCM_DESCS
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
    ((current >= vis_count)) && current=$((vis_count > 0 ? vis_count - 1 : 0))
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
    IFS= read -rsn1 key
    case "$key" in
      $'\x1b') # Escape sequence
        # Read with timeout to distinguish bare ESC from arrow keys
        if IFS= read -rsn1 -t 0.1 seq1; then
          if IFS= read -rsn1 -t 0.1 seq2; then
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
```

**Step 2: Verify syntax**

Run: `bash -n install.sh`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add install.sh
git commit -m "feat: add search_checkbox_menu TUI function for live-filter skill selection"
```

---

### Task 2: Add `cmd_search` command function

**Files:**
- Modify: `install.sh` (insert after `cmd_update` function, before `cmd_interactive`)

**Step 1: Add the `cmd_search` function**

Insert after the closing `}` of `cmd_update` (line 677) and before `cmd_interactive`:

```bash
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

    read -rp "$(echo -e "${BOLD}Install these skills? ${NC}[Y/n] ")" confirm
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
```

**Step 2: Verify syntax**

Run: `bash -n install.sh`
Expected: No output (clean parse)

**Step 3: Commit**

```bash
git add install.sh
git commit -m "feat: add cmd_search command for individual skill selection"
```

---

### Task 3: Wire `--search` into `main()` and update help

**Files:**
- Modify: `install.sh:53-80` (`print_help` function)
- Modify: `install.sh:871-904` (`main` function)

**Step 1: Update `print_help` to document `--search`**

In `print_help`, add after the `--list` line (line 58):

```bash
  echo "  ./install.sh --search              Search & pick individual skills"
  echo "  ./install.sh --search <term>       Search with initial filter"
```

And in the USAGE section header area (line 13-14 comment block), add:
```
#   ./install.sh --search               # Search & pick individual skills
#   ./install.sh --search <term>         # Pre-filtered search
```

**Step 2: Add `--search` case to `main()`**

In the `main` function's case statement (after `--update|-u)` block, before `--version|-v)`), add:

```bash
    --search|-s)
      cmd_search "${2:-}"
      ;;
```

**Step 3: Verify syntax**

Run: `bash -n install.sh`
Expected: No output (clean parse)

**Step 4: Manual smoke test**

Run: `./install.sh --help`
Expected: Shows `--search` in usage and examples

Run: `./install.sh --search`
Expected: Opens searchable skill list, type "react" to filter, space to select, enter to confirm, shows installation summary

Run: `./install.sh --search django`
Expected: Opens with "django" pre-filled in filter, matching skills visible

**Step 5: Commit**

```bash
git add install.sh
git commit -m "feat: wire --search flag into main and update help text"
```
