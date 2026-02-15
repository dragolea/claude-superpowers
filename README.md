# Claude Superpowers

Curated, technology-aware skill installer for [Claude Code](https://claude.ai/code).

Instead of installing every skill blindly, **pick only what fits your stack** — web, mobile, backend, security, or just the essentials. **77 skills** from 5 source repositories, organized into 12 categories. Now also supports **130 agent personas** from VoltAgent.

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

## Agent Installation

Agents are specialized AI personas with YAML frontmatter defining their role, tools, and model routing. **130 agents** from [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents), organized into 10 categories.

Agents install to `.claude/agents/{name}.md` (flat files, not subdirectories like skills).

```bash
./install.sh --agents                        # Interactive wizard
./install.sh --agents --preset core-dev      # Install a preset
./install.sh --agents --preset fullstack     # Core + languages + quality + DX
./install.sh --agents --search               # Search & pick individual agents
./install.sh --agents --search kubernetes    # Pre-filtered search
./install.sh --agents --list                 # List all 130 agents by category
./install.sh --agents --update               # Re-download installed agents
./install.sh --agents --help                 # Agent-specific help
```

### Agent Presets

```bash
./install.sh --agents --preset core-dev     # Frontend, backend, fullstack, API, mobile (10 agents)
./install.sh --agents --preset web          # Core + language specialists (36 agents)
./install.sh --agents --preset backend      # Core + languages + infrastructure (52 agents)
./install.sh --agents --preset fullstack    # Core + languages + quality + DX (63 agents)
./install.sh --agents --preset devops       # Infrastructure + quality + orchestration (40 agents)
./install.sh --agents --preset security     # Quality/security + infrastructure (30 agents)
./install.sh --agents --preset full         # Everything (130 agents)
```

### Agent Categories

| Category | Count | Highlights |
|----------|-------|------------|
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
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | 130 agents | Specialized AI agent personas — dev, infra, security, data, business |

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
