# Claude Superpowers

Curated, technology-aware skill installer for [Claude Code](https://claude.ai/code).

Instead of installing every skill blindly, **pick only what fits your stack** — web, mobile, backend, security, or just the essentials. **77 skills** from 5 source repositories, organized into 12 categories. Also supports **130 agent plugins** from 2 marketplaces.

## Quick Start

```bash
npx superpower-installer
```

That's it. The interactive wizard walks you through project type, tech stack, and skill selection.

## Presets

Skip the interactive wizard with `--preset`:

```bash
npx superpower-installer --preset core          # Debugging, TDD, verification (4 skills)
npx superpower-installer --preset workflow       # Core + planning & execution (10 skills)
npx superpower-installer --preset web           # Web stack + frameworks + design (28 skills)
npx superpower-installer --preset mobile        # Mobile frameworks + core (19 skills)
npx superpower-installer --preset mobile-expo   # React Native/Expo focused (19 skills)
npx superpower-installer --preset backend       # Server frameworks + databases (25 skills)
npx superpower-installer --preset fullstack     # Web + backend + languages (46 skills)
npx superpower-installer --preset devops        # Infrastructure + CI/CD (22 skills)
npx superpower-installer --preset security      # OWASP, static analysis, auditing (17 skills)
npx superpower-installer --preset documents     # PDF, Word, Excel, PowerPoint (5 skills)
npx superpower-installer --preset full          # Everything (77 skills)
```

## Interactive Mode

Run `npx superpower-installer` without arguments for a guided experience:

1. **Project type** — Web, Mobile, Backend, CLI, or General
2. **Tech stack** — Framework-specific (React, Expo, Node.js, etc.)
3. **Skill categories** — Pick from 12 categories with smart pre-selection
4. **Per-skill picker** — Tag-based pre-selection, toggle individual skills
5. **Confirm** — Review selected skills, choose scope, then install

Skills are downloaded to `.claude/skills/` in your current directory.

## Other Commands

```bash
npx superpower-installer --list      # Show all 77 skills with descriptions
npx superpower-installer --search    # Searchable multi-select picker
npx superpower-installer --search react  # Pre-filtered search
npx superpower-installer --update    # Re-download already installed skills
npx superpower-installer --scan      # Detect project tech stack
npx superpower-installer --help      # Full usage info
```

## Scope

Control where skills are installed:

```bash
npx superpower-installer --scope project   # .claude/ — shared with collaborators (default)
npx superpower-installer --scope user      # ~/.claude/ — available in all your projects
npx superpower-installer --scope local     # .claude/ + .gitignore — this repo only
```

## Agent Installation

Agents are installed as plugins from two marketplaces via the Claude CLI. **83 plugins** (~240 agents) from [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) and [Claude Code Workflows](https://github.com/wshobson/agents).

```bash
npx superpower-installer --agents                        # Interactive wizard
npx superpower-installer --agents --preset core-dev      # Install a preset
npx superpower-installer --agents --preset fullstack     # Core + languages + quality + DX
npx superpower-installer --agents --search               # Search & pick individual plugins
npx superpower-installer --agents --search kubernetes    # Pre-filtered search
npx superpower-installer --agents --list                 # List all plugins by category
npx superpower-installer --agents --update               # Update installed plugins
```

> **Note:** Agent installation requires the Claude CLI (`npm install -g @anthropic-ai/claude-code`).

### Agent Presets

```bash
npx superpower-installer --agents --preset core-dev     # Frontend, backend, fullstack, API, mobile
npx superpower-installer --agents --preset web          # Core + language specialists
npx superpower-installer --agents --preset backend      # Core + languages + infrastructure
npx superpower-installer --agents --preset fullstack    # Core + languages + quality + DX
npx superpower-installer --agents --preset devops       # Infrastructure + quality + orchestration
npx superpower-installer --agents --preset security     # Quality/security + infrastructure
npx superpower-installer --agents --preset full         # Everything
```

### Agent Categories

| Category | Agents | Highlights |
|----------|--------|------------|
| **Core Development** | 10 | fullstack-developer, backend-developer, frontend-developer, mobile-developer |
| **Language Specialists** | 26 | TypeScript, Python, Rust, Go, Java, C#, Swift, PHP, Elixir, PowerShell |
| **Infrastructure** | 16 | DevOps, Docker, Kubernetes, Terraform, SRE, cloud, networking |
| **Quality & Security** | 14 | code-reviewer, security-auditor, penetration-tester, chaos-engineer |
| **Data & AI** | 12 | ML engineer, data scientist, LLM architect, NLP, MLOps |
| **Developer Experience** | 13 | build-engineer, CLI, documentation, git workflows, refactoring |
| **Specialized Domains** | 12 | blockchain, embedded, fintech, gaming, IoT, payments |
| **Business & Product** | 11 | product-manager, scrum-master, technical-writer, UX researcher |
| **Meta & Orchestration** | 10 | multi-agent-coordinator, workflow-orchestrator, task-distributor |
| **Research & Analysis** | 6 | competitive-analyst, market-researcher, trend-analyst |

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

| Source | Count | Focus |
|--------|-------|-------|
| [obra/superpowers](https://github.com/obra/superpowers) | 14 skills | Development workflow — debugging, TDD, planning, code review |
| [anthropic/skills](https://github.com/anthropics/skills) | 16 skills | Official Anthropic — documents, design, testing, MCP |
| [jeffallan/claude-skills](https://github.com/jeffallan/claude-skills) | 30 skills | Fullstack — frameworks, languages, DevOps |
| [trailofbits/skills](https://github.com/trailofbits/skills) | 16 skills | Security — static analysis, vulnerability detection, auditing |
| [agamm/claude-code-owasp](https://github.com/agamm/claude-code-owasp) | 1 skill | OWASP Top 10:2025, ASVS 5.0 |

## Adding Skills

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for how to:
- Add a skill from an existing repository
- Add a new source repository
- Create custom skills

## Requirements

- Node.js 18+ (already required by [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview))

## License

MIT
