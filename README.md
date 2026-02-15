# Claude Superpowers

Curated, technology-aware skill installer for [Claude Code](https://claude.ai/code).

Instead of installing every skill blindly, **pick only what fits your stack** — web, mobile, backend, security, or just the essentials. **77 skills** from 5 source repositories, organized into 12 categories.

## Quick Start

**One-liner** (runs interactively):

```bash
curl -sL https://raw.githubusercontent.com/dragolea/claude-superpowers/main/install.sh | bash
```

**Or clone and run:**

```bash
git clone https://github.com/dragolea/claude-superpowers.git
cd claude-superpowers
./install.sh
```

## Presets

Skip the interactive wizard with `--preset`:

```bash
./install.sh --preset core          # Debugging, TDD, verification (4 skills)
./install.sh --preset workflow       # Core + planning & execution (10 skills)
./install.sh --preset web           # Web stack + frameworks + design (28 skills)
./install.sh --preset mobile        # Mobile frameworks + core (19 skills)
./install.sh --preset mobile-expo   # React Native/Expo focused (19 skills)
./install.sh --preset backend       # Server frameworks + databases (25 skills)
./install.sh --preset fullstack     # Web + backend + languages (46 skills)
./install.sh --preset devops        # Infrastructure + CI/CD (22 skills)
./install.sh --preset security      # OWASP, static analysis, auditing (17 skills)
./install.sh --preset documents     # PDF, Word, Excel, PowerPoint (5 skills)
./install.sh --preset full          # Everything (77 skills)
```

## Interactive Mode

Run `./install.sh` without arguments for a guided experience:

1. **Project type** — Web, Mobile, Backend, CLI, or General
2. **Tech stack** — Framework-specific (React, Expo, Node.js, etc.)
3. **Skill categories** — Pick from 12 categories with smart pre-selection
4. **Confirm** — Review selected skills, then install

Skills are downloaded to `.claude/skills/` in your current directory.

## Other Commands

```bash
./install.sh --list      # Show all 77 skills with descriptions
./install.sh --update    # Re-download already installed skills
./install.sh --help      # Full usage info
```

## Skill Categories

| Category | Count | Highlights |
|----------|-------|------------|
| **Core** | 4 | systematic-debugging, TDD, verification, property-based-testing |
| **Workflow** | 6 | brainstorming, writing-plans, executing-plans, parallel agents |
| **Git & Code Review** | 5 | worktrees, code review, branch management, differential review |
| **Web Development** | 7 | webapp-testing, React, Next.js, Vue, Angular, Playwright |
| **Mobile Development** | 4 | React Native/Expo, Flutter, Swift, Kotlin |
| **Backend & API** | 11 | NestJS, Django, FastAPI, Rails, Laravel, Spring Boot, GraphQL, MCP |
| **Languages** | 7 | TypeScript, Python, Go, Rust, Java, C++, C# |
| **DevOps & Infra** | 6 | CI/CD, Kubernetes, Terraform, cloud, SRE, monitoring |
| **Security** | 13 | OWASP, Semgrep, variant analysis, insecure defaults, APK scanning |
| **Design & Creative** | 6 | frontend-design, algorithmic art, theming, canvas |
| **Documents** | 5 | PDF, Word, Excel, PowerPoint, internal comms |
| **Meta** | 3 | skill creation guides, superpowers system intro |

## Skill Sources

Skills are fetched from their original repositories at install time:

| Source | Skills | Focus |
|--------|--------|-------|
| [obra/superpowers](https://github.com/obra/superpowers) | 14 | Development workflow — debugging, TDD, planning, code review |
| [anthropic/skills](https://github.com/anthropics/skills) | 16 | Official Anthropic — documents, design, testing, MCP |
| [jeffallan/claude-skills](https://github.com/jeffallan/claude-skills) | 30 | Fullstack — frameworks, languages, DevOps |
| [trailofbits/skills](https://github.com/trailofbits/skills) | 16 | Security — static analysis, vulnerability detection, auditing |
| [agamm/claude-code-owasp](https://github.com/agamm/claude-code-owasp) | 1 | OWASP Top 10:2025, ASVS 5.0 |

## Overlap Analysis

Several repositories offer skills in similar domains. This registry resolves overlaps by picking the best source for each niche:

| Domain | We use | Alternatives considered |
|--------|--------|------------------------|
| Debugging | obra/superpowers `systematic-debugging` | jeffallan `debugging-wizard` (less structured) |
| Code review | obra/superpowers `requesting/receiving-code-review` | jeffallan `code-reviewer` (single skill vs workflow pair) |
| Security review | jeffallan `security-reviewer` + trailofbits (specialized) | obra overlaps only on general debugging |
| MCP building | anthropic `mcp-builder` + jeffallan `mcp-developer` | Both included — Anthropic for guide, jeffallan for SDK expertise |
| Playwright | anthropic `webapp-testing` + jeffallan `playwright-expert` | Both included — Anthropic for Playwright MCP, jeffallan for patterns |
| Skill creation | anthropic `skill-creator` + obra `writing-skills` | Both included — interactive Q&A vs reference guide |

## Adding Skills

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for how to:
- Add a skill from an existing repository
- Add a new source repository
- Create custom skills

## Requirements

- `bash` (macOS/Linux)
- `curl`
- `jq` or `python3` (for JSON parsing)

## License

MIT
# claude-superpowers
