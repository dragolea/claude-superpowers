import { readFile, readdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { theme } from "../ui/format.js";
import type { DetectionResult } from "./patterns.js";

const execFileAsync = promisify(execFile);

// Valid values for validation
const VALID_SKILL_CATS = new Set([
  "core", "workflow", "git", "web", "mobile", "backend", "languages",
  "devops", "security", "design", "documents", "meta",
]);
const VALID_AGENT_CATS = new Set([
  "core-dev", "languages", "infrastructure", "quality-security", "data-ai",
  "dev-experience", "specialized", "business", "orchestration", "research",
  "marketing",
]);
const VALID_SKILL_TAGS = new Set([
  "universal", "web", "react", "nextjs", "vue", "angular", "mobile",
  "react-native", "expo", "flutter", "ios", "swift", "android", "kotlin",
  "backend", "nodejs", "python", "php", "ruby", "java", "cpp", "csharp",
  "go", "rust", "typescript", "devops", "creative", "documents", "web3",
]);
const VALID_AGENT_TAGS = new Set([
  "backend", "frontend", "fullstack", "mobile", "api", "design", "typescript",
  "python", "rust", "go", "java", "csharp", "swift", "php", "ruby", "react",
  "vue", "angular", "nextjs", "django", "spring", "laravel", "flutter",
  "kotlin", "elixir", "cloud", "docker", "kubernetes", "terraform", "azure",
  "devops", "sre", "testing", "security", "review", "debugging", "ai", "ml",
  "data", "tooling", "cli", "docs", "git", "refactoring", "blockchain",
  "embedded", "fintech", "gamedev", "iot", "payments", "seo", "product",
  "marketing", "meta", "orchestration", "workflow", "research", "analytics",
]);

async function readFileSafe(path: string, maxLines: number): Promise<string> {
  try {
    const content = await readFile(path, "utf-8");
    return content.split("\n").slice(0, maxLines).join("\n");
  } catch {
    return "";
  }
}

export async function gatherProjectContext(): Promise<string> {
  let ctx = "";

  const fileChecks: Array<{ file: string; label: string; lines: number }> = [
    { file: "package.json", label: "package.json", lines: 100 },
    { file: "tsconfig.json", label: "tsconfig.json", lines: 60 },
    { file: "go.mod", label: "go.mod", lines: 40 },
    { file: "Cargo.toml", label: "Cargo.toml", lines: 60 },
    { file: "Gemfile", label: "Gemfile", lines: 40 },
    { file: "pom.xml", label: "pom.xml (first 60 lines)", lines: 60 },
    { file: "build.gradle", label: "build.gradle (first 60 lines)", lines: 60 },
    { file: "build.gradle.kts", label: "build.gradle.kts (first 60 lines)", lines: 60 },
    { file: "pubspec.yaml", label: "pubspec.yaml", lines: 40 },
    { file: "requirements.txt", label: "requirements.txt (first 40 lines)", lines: 40 },
    { file: "setup.py", label: "setup.py (first 40 lines)", lines: 40 },
    { file: "setup.cfg", label: "setup.cfg (first 40 lines)", lines: 40 },
    { file: "pyproject.toml", label: "pyproject.toml (first 40 lines)", lines: 40 },
    { file: "Pipfile", label: "Pipfile (first 40 lines)", lines: 40 },
    { file: "composer.json", label: "composer.json (first 60 lines)", lines: 60 },
    { file: "README.md", label: "README.md (first 30 lines)", lines: 30 },
  ];

  for (const { file, label, lines } of fileChecks) {
    if (existsSync(file)) {
      const content = await readFileSafe(file, lines);
      ctx += `=== ${label} ===\n${content}\n`;
    }
  }

  // C# project file
  try {
    const entries = await readdir(".");
    const csproj = entries.find((e) => e.endsWith(".csproj"));
    if (csproj) {
      const content = await readFileSafe(csproj, 40);
      ctx += `=== ${csproj} (first 40 lines) ===\n${content}\n`;
    }
  } catch { /* ignore */ }

  // Infrastructure signals
  const infraFiles = [
    "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
    ".github/workflows", ".gitlab-ci.yml", "Jenkinsfile",
    "terraform.tf", "main.tf", ".terraform",
    "k8s", "kubernetes", "Chart.yaml", "helmfile.yaml",
    ".eslintrc", ".eslintrc.js", ".eslintrc.json",
    "eslint.config.js", "eslint.config.mjs",
    ".prettierrc", "prettier.config.js",
    ".env.example", ".env.local",
  ];

  const infraSignals: string[] = [];
  for (const f of infraFiles) {
    if (existsSync(f)) {
      infraSignals.push(`  [exists] ${f}`);
    }
  }
  if (infraSignals.length > 0) {
    ctx += `=== Infrastructure / config signals ===\n${infraSignals.join("\n")}\n`;
  }

  // Directory listing
  try {
    const entries = await readdir(".");
    ctx += `=== Directory listing ===\n${entries.slice(0, 40).join("\n")}\n`;
  } catch { /* ignore */ }

  return ctx;
}

interface AiDetectionJson {
  techs?: string[];
  skill_cats?: string[];
  agent_cats?: string[];
  skill_tags?: string[];
  agent_tags?: string[];
}

export async function detectProjectAI(): Promise<DetectionResult | null> {
  const projectContext = await gatherProjectContext();
  if (!projectContext.trim()) return null;

  const prompt = `Analyze the following project files and detect the technology stack.
Return ONLY a JSON object with these exact keys:
{
  "techs": [...],
  "skill_cats": [...],
  "agent_cats": [...],
  "skill_tags": [...],
  "agent_tags": [...]
}

- techs: Human-readable technology names detected (e.g. "React", "TypeScript", "Docker")
- skill_cats / agent_cats: Categories from the valid lists below
- skill_tags / agent_tags: Tags from the valid lists below

VALID SKILL CATEGORIES: core, workflow, git, web, mobile, backend, languages, devops, security, design, documents, meta
VALID AGENT CATEGORIES: core-dev, languages, infrastructure, quality-security, data-ai, dev-experience, specialized, business, orchestration, research, marketing
VALID SKILL TAGS: universal, web, react, nextjs, vue, angular, mobile, react-native, expo, flutter, ios, swift, android, kotlin, backend, nodejs, python, php, ruby, java, cpp, csharp, go, rust, typescript, devops, creative, documents, web3
VALID AGENT TAGS: backend, frontend, fullstack, mobile, api, design, typescript, python, rust, go, java, csharp, swift, php, ruby, react, vue, angular, nextjs, django, spring, laravel, flutter, kotlin, elixir, cloud, docker, kubernetes, terraform, azure, devops, sre, testing, security, review, debugging, ai, ml, data, tooling, cli, docs, git, refactoring, blockchain, embedded, fintech, gamedev, iot, payments, seo, product, marketing, meta, orchestration, workflow, research, analytics

RULES:
- Always include "core" and "workflow" in skill_cats, and "core-dev" in agent_cats
- Only include categories/tags relevant to detected technologies
- Return ONLY the JSON object, no other text

PROJECT FILES:
${projectContext}`;

  console.log(`  ${theme.accent("Analyzing project with AI...")}`);

  try {
    const { stdout } = await execFileAsync(
      "claude",
      ["-p", "--model", "haiku", "--output-format", "text", "--max-budget-usd", "0.01", prompt],
      { env: { ...process.env, CLAUDECODE: "" }, timeout: 30000 },
    );

    if (!stdout.trim()) {
      console.log(`  ${theme.warn("AI detection failed, using pattern-based fallback.")}`);
      return null;
    }

    // Strip markdown code fences
    const jsonStr = stdout.replace(/^```\w*\n?/gm, "").replace(/```$/gm, "").trim();

    const data: AiDetectionJson = JSON.parse(jsonStr);

    if (!data.techs || data.techs.length === 0) return null;

    return {
      techs: data.techs,
      skillCats: (data.skill_cats ?? []).filter((c) => VALID_SKILL_CATS.has(c)),
      agentCats: (data.agent_cats ?? []).filter((c) => VALID_AGENT_CATS.has(c)),
      skillTags: (data.skill_tags ?? []).filter((t) => VALID_SKILL_TAGS.has(t)),
      agentTags: (data.agent_tags ?? []).filter((t) => VALID_AGENT_TAGS.has(t)),
    };
  } catch {
    console.log(`  ${theme.warn("AI detection failed, using pattern-based fallback.")}`);
    return null;
  }
}
