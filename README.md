# Claude Superpowers

Smart skill installer for [Claude Code](https://claude.ai/code). Powered by the [skills.sh](https://skills.sh) ecosystem.

Scans your project, detects your tech stack, discovers relevant skills from the open ecosystem, and installs them — all in one interactive flow. No manual browsing or guessing what you need.

## Quick Start

```bash
npx superpower-installer
```

The interactive wizard:

1. **Scans** your project (pattern-based + optional AI detection)
2. **Discovers** matching skills from the [skills.sh](https://skills.sh) ecosystem
3. **Presents** results ranked by relevance — pre-checks the best matches
4. **Installs** selected skills via [`npx skills`](https://www.npmjs.com/package/skills)
5. **Generates** CLAUDE.md rules so Claude knows when to use each skill

## Commands

```bash
npx superpower-installer                    # Interactive wizard (scan + discover + install)
npx superpower-installer --scan             # Detect project tech stack
npx superpower-installer --search react     # Search skills ecosystem by keyword
npx superpower-installer --list             # List installed skills
npx superpower-installer --update           # Update installed skills
npx superpower-installer --help             # Full usage info
```

## Scope

Control where skills are installed:

```bash
npx superpower-installer --scope project   # .claude/ — shared with collaborators (default)
npx superpower-installer --scope user      # ~/.claude/ — available in all your projects
npx superpower-installer --scope local     # .claude/ + .gitignore — this repo only
```

## How It Works

### Detection

The scanner detects your tech stack through two methods:

- **Pattern-based** — reads `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, Dockerfiles, CI configs, and 70+ other signals
- **AI-powered** (optional) — uses Claude to analyze project structure, imports, and config files for deeper detection

Detection produces a set of **tags** (e.g., `react`, `typescript`, `backend`, `devops`) that drive skill discovery.

### Discovery

Tags are searched against the [skills.sh](https://skills.sh) directory — the open leaderboard for AI agent skills. Skills that match multiple tags rank higher (more relevant to your project).

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
