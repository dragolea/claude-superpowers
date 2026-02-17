# Claude Superpowers

Smart skill installer for [Claude Code](https://claude.ai/code). Powered by the [skills.sh](https://skills.sh) ecosystem.

Scans your project, detects your tech stack, discovers relevant skills from the open ecosystem, and installs them — all in one interactive flow. Includes [obra/superpowers](https://skills.sh/?q=obra%2Fsuperpowers) as recommended defaults (brainstorming, TDD, debugging, code review, and more).

## Quick Start

Run directly from GitHub (no npm install needed):

```bash
npx github:dragolea/claude-superpowers
```

The interactive wizard:

1. **Scans** your project (pattern-based + optional AI detection)
2. **Discovers** matching skills from the [skills.sh](https://skills.sh) ecosystem
3. **Recommends** [obra/superpowers](https://skills.sh/?q=obra%2Fsuperpowers) as pre-checked defaults
4. **Deduplicates** cross-source skills by name, keeping the most-installed variant
5. **Installs** selected skills via [`npx skills`](https://www.npmjs.com/package/skills)
6. **Generates** CLAUDE.md rules so Claude knows when to use each skill

## Commands

All commands use `npx github:dragolea/claude-superpowers` (aliased as `superpowers` below for brevity):

```bash
superpowers                    # Interactive wizard (scan + discover + install)
superpowers --scan             # Detect project tech stack
superpowers --search react     # Search skills ecosystem by keyword
superpowers --list             # List installed skills
superpowers --update           # Update installed skills
superpowers --help             # Full usage info
```

## Scope

Control where skills are installed:

```bash
superpowers --scope project   # .claude/ — shared with collaborators (default)
superpowers --scope user      # ~/.claude/ — available in all your projects
superpowers --scope local     # .claude/ + .gitignore — this repo only
```

## How It Works

### Detection

The scanner detects your tech stack through two methods:

- **Pattern-based** — reads `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, Dockerfiles, CI configs, and 70+ other signals
- **AI-powered** (optional) — uses Claude to analyze project structure, imports, and config files for deeper detection

Detection produces a set of **tags** (e.g., `react`, `typescript`, `backend`, `devops`) that drive skill discovery.

### Discovery & Defaults

Tags are searched against the [skills.sh](https://skills.sh) directory. The discovery pipeline:

- **Fetches defaults** — the 14 [obra/superpowers](https://skills.sh/?q=obra%2Fsuperpowers) workflow skills (brainstorming, TDD, systematic debugging, code review, etc.) are always included as pre-checked recommendations
- **Searches by tags** — each detected tag is searched against skills.sh, returning project-specific skills
- **Deduplicates by name** — when multiple sources publish the same skill (e.g., `typescript-pro` from 3+ publishers), keeps the variant with the most installs
- **Pre-selects all matches** — both defaults and scan-matched skills are pre-checked; users uncheck what they don't need

### Installation

Selected skills are installed via [`npx skills add`](https://www.npmjs.com/package/skills), the standard CLI for the [Agent Skills](https://agentskills.io) ecosystem. Skills are written to `.claude/skills/` as `SKILL.md` files that Claude Code reads automatically.

### CLAUDE.md Generation

After installation, the tool generates a `<!-- superpower-skills-start -->` section in your CLAUDE.md with rules like:

```markdown
- Use systematic-debugging — Four-phase root cause analysis
- Use test-driven-development — RED-GREEN-REFACTOR cycle
- Use frontend-design — UI component design patterns
```

This tells Claude when and how to use each installed skill.

## Local Development

```bash
git clone https://github.com/dragolea/claude-superpowers.git
cd claude-superpowers
npm install
npm run build
node dist/bin.js          # Run the installer
npm test                  # Run tests
```

## Requirements

- Node.js 18+

## License

MIT
