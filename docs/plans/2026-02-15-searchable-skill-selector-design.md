# Searchable Skill Selector — Design

## Summary

Add a `--search` flag to `install.sh` that opens a live-filter checkbox TUI for selecting individual skills from the full registry.

## CLI Interface

```
./install.sh --search              # Open searchable skill picker
./install.sh --search react        # Pre-fill search with "react"
```

## TUI Behavior

New `search_checkbox_menu` bash function renders a searchable, toggleable skill list:

```
  Search skills (77 available)
  Type to filter, space to toggle, enter to confirm

  Filter: react_

  [x] react-expert         React 18+ component architecture, hooks, Server...
  [ ] react-native-expert  Cross-platform mobile with React Native/Expo...
  [ ] nextjs-developer     Next.js 14+ App Router, server components...

  3 matching · 1 selected
```

### Interactions

| Key | Action |
|-----|--------|
| Characters | Append to filter, re-filter list (case-insensitive against name + description) |
| Backspace | Remove last filter character |
| Arrow up/down | Navigate visible results |
| Space | Toggle checkbox on current item |
| Enter | Confirm selection, proceed to install |
| Escape | Cancel and exit |

### Key implementation details

- All skills loaded into parallel arrays (names, descriptions, selected state)
- Filter applied on each keystroke — rebuild visible indices array
- Cursor clamped to visible list when filter changes
- Selection state stored on the master list, persists across filter changes
- Footer shows matching count and selected count
- Pure bash — no new dependencies

## Data Flow

1. `cmd_search` loads registry
2. Builds skill name/description arrays from `SKILLS_JSON`
3. Calls `search_checkbox_menu` — returns selected skill names in `SELECTED_SKILLS` array
4. Shows confirmation summary (reuse existing pattern)
5. Calls `install_skills`

## Approach

Pure bash TUI extending the existing `checkbox_menu` pattern. No new files or dependencies.
