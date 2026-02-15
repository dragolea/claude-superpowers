# Contributing to Claude Superpowers

## Adding a Skill from an Existing Repository

1. Edit `registry/sources.json` — add the source repo if it's not already listed:

```json
{
  "sources": {
    "owner/repo": {
      "name": "Display Name",
      "base_url": "https://raw.githubusercontent.com/owner/repo/main",
      "repo_url": "https://github.com/owner/repo",
      "description": "What this repo provides"
    }
  }
}
```

2. Edit `registry/skills.json` — add the skill entry:

```json
{
  "name": "skill-name",
  "description": "What this skill does (one sentence)",
  "source": "owner/repo",
  "path": "skills/skill-name/SKILL.md",
  "tags": ["universal"],
  "category": "core"
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique skill identifier (lowercase, hyphens) |
| `description` | Yes | One-sentence description |
| `source` | Yes | Source ID matching a key in `sources.json` |
| `path` | Yes | Path to SKILL.md within the source repo |
| `tags` | Yes | Technology tags (see below) |
| `category` | Yes | One of: `core`, `workflow`, `git`, `documents`, `meta` |

### Tags

Tags control which skills appear for which project types:

| Tag | Meaning |
|-----|---------|
| `universal` | Relevant to all project types |
| `web` | Web application specific |
| `mobile` | Mobile app specific |
| `react-native` | React Native specific |
| `expo` | Expo SDK specific |
| `flutter` | Flutter specific |
| `ios` | Native iOS specific |
| `android` | Native Android specific |
| `backend` | Backend/API specific |
| `documents` | Document manipulation |

## Adding a New Category

Edit the `categories` section in `registry/skills.json`:

```json
{
  "categories": {
    "your-category": {
      "name": "Display Name",
      "description": "What this category covers",
      "recommended": false
    }
  }
}
```

Set `recommended: true` to pre-select it during interactive install.

## Adding a Preset

Edit the `presets` section in `registry/skills.json`:

```json
{
  "presets": {
    "preset-name": {
      "name": "Display Name",
      "description": "What this preset includes",
      "categories": ["core", "workflow"]
    }
  }
}
```

Presets can also filter by tags using the `tags` field.

## Creating Custom Skills

For skills that don't exist in any external repository, add them to the `skills/` directory:

```
skills/
  your-skill/
    SKILL.md
```

Then register them in `registry/skills.json` with `"source": "local"`.

## Testing Changes

After editing the registry:

```bash
# Verify JSON is valid
node -e "JSON.parse(require('fs').readFileSync('registry/skills.json','utf-8'))"
node -e "JSON.parse(require('fs').readFileSync('registry/sources.json','utf-8'))"

# Build and test
npm run build

# Test listing
node dist/bin.js --list

# Test preset install
node dist/bin.js --preset core

# Test interactive mode
node dist/bin.js
```
