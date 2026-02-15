import { readFile, readdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import type { DetectionResult } from "./patterns.js";

function spawnWithStdin(
  cmd: string,
  args: string[],
  input: string,
  opts: { env?: NodeJS.ProcessEnv; timeout?: number },
): Promise<{ stdout: string; killed: boolean }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      env: opts.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });

    const timer = opts.timeout
      ? setTimeout(() => { killed = true; child.kill(); }, opts.timeout)
      : undefined;

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (killed) {
        reject(Object.assign(new Error("Process timed out"), { killed: true }));
      } else if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      } else {
        resolve({ stdout, killed: false });
      }
    });

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      reject(err);
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

// Valid values for validation
const VALID_SKILL_CATS = new Set([
  "core", "workflow", "git", "web", "mobile", "backend", "languages",
  "devops", "security", "design", "documents", "meta",
]);
const VALID_AGENT_CATS = new Set([
  "design", "data-ai", "specialized", "business", "operations",
  "research", "marketing",
]);
const VALID_SKILL_TAGS = new Set([
  "universal", "web", "react", "nextjs", "vue", "angular", "mobile",
  "react-native", "expo", "flutter", "ios", "swift", "android", "kotlin",
  "backend", "nodejs", "python", "php", "ruby", "java", "cpp", "csharp",
  "go", "rust", "typescript", "devops", "creative", "documents", "web3",
]);
const VALID_AGENT_TAGS = new Set([
  "design", "ui", "ux", "accessibility", "responsive",
  "llm", "langchain", "rag", "embeddings", "ai", "ml", "mlops",
  "data", "spark", "dbt", "airflow", "pipelines", "database", "migrations",
  "validation", "quality",
  "blockchain", "web3", "solidity", "defi", "nft",
  "trading", "finance", "backtesting", "risk",
  "gamedev", "unity", "godot",
  "architecture", "c4", "modeling", "migration", "modernization", "frameworks",
  "payments", "stripe", "paypal", "billing", "pci",
  "analytics", "kpi", "dashboards", "reporting",
  "startup", "business", "financial-modeling",
  "hr", "legal", "gdpr", "compliance",
  "crm", "sales", "automation",
  "collaboration", "communication", "teams",
  "incident-response", "postmortem", "runbooks",
  "performance", "profiling", "optimization",
  "dependencies", "packages", "security",
  "reverse-engineering", "analysis",
  "research", "trends", "search",
  "content", "marketing", "seo", "writing", "technical", "monitoring",
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
  const s = p.spinner();

  s.start("Gathering project context...");
  const projectContext = await gatherProjectContext();
  if (!projectContext.trim()) {
    s.stop("AI detection failed: no project files found", 1);
    return null;
  }

  const prompt = `You are a strict project analyzer. Examine the project files below and detect ONLY technologies that are explicitly present as dependencies, config files, or source code.

Return ONLY a JSON object:
{
  "techs": [...],
  "skill_cats": [...],
  "agent_cats": [...],
  "skill_tags": [...],
  "agent_tags": [...]
}

FIELD DEFINITIONS:
- techs: Human-readable names of technologies explicitly found (e.g. "React", "TypeScript", "Docker")
- skill_cats: Skill categories from VALID list that match detected technologies
- agent_cats: Agent categories from VALID list that match detected technologies
- skill_tags: Skill tags from VALID list that match detected technologies
- agent_tags: Agent tags from VALID list that match detected technologies

VALID SKILL CATEGORIES: core, workflow, git, web, mobile, backend, languages, devops, security, design, documents, meta
VALID AGENT CATEGORIES: design, data-ai, specialized, business, operations, research, marketing
VALID SKILL TAGS: universal, web, react, nextjs, vue, angular, mobile, react-native, expo, flutter, ios, swift, android, kotlin, backend, nodejs, python, php, ruby, java, cpp, csharp, go, rust, typescript, devops, creative, documents, web3
VALID AGENT TAGS: design, ui, ux, accessibility, responsive, llm, langchain, rag, embeddings, ai, ml, mlops, data, spark, dbt, airflow, pipelines, database, migrations, validation, quality, blockchain, web3, solidity, defi, nft, trading, finance, backtesting, risk, gamedev, unity, godot, architecture, c4, modeling, migration, modernization, frameworks, payments, stripe, paypal, billing, pci, analytics, kpi, dashboards, reporting, startup, business, financial-modeling, hr, legal, gdpr, compliance, crm, sales, automation, collaboration, communication, teams, incident-response, postmortem, runbooks, performance, profiling, optimization, dependencies, packages, security, reverse-engineering, analysis, research, trends, search, content, marketing, seo, writing, technical, monitoring

RULES:
1. Always include "core" and "workflow" in skill_cats — these are universal. Do NOT auto-include any agent_cats.
2. Be CONSERVATIVE. Only include a category/tag if there is concrete evidence in the project files.
3. Skill category evidence requirements:
   - "devops": ONLY if Dockerfile, docker-compose, terraform, k8s manifests, CI/CD configs, or cloud SDK dependencies exist
   - "security": ONLY if auth/crypto/security libraries are dependencies (e.g. passport, helmet, bcrypt, jsonwebtoken, oauth) or security-focused tooling is configured
   - "documents": ONLY if PDF/Office processing libraries are dependencies (e.g. pdfkit, docx, exceljs, sharp)
   - "web": ONLY if frontend framework dependencies exist (React, Vue, Angular, Svelte) or HTML/CSS tooling is present
   - "mobile": ONLY if React Native, Flutter, Swift, Kotlin, or mobile SDK dependencies exist
   - "design": ONLY if design/theming/CSS-in-JS libraries are dependencies
   - "meta": ONLY if the project itself is a tool/framework for building developer tools or skills
   - "languages": Include when the project uses a language that has specific skill tags (e.g. TypeScript, Python, Go, Rust)
   - "backend": ONLY if server frameworks (Express, Fastify, Django, Rails, etc.), database drivers, or API frameworks are dependencies
4. Agent category evidence requirements (agents are for niche delegation — most projects need NO agent categories):
   - "data-ai": ONLY if AI/ML libraries (tensorflow, pytorch, langchain, openai, transformers) or data pipeline tools (spark, dbt, airflow) are dependencies
   - "specialized": ONLY if blockchain/web3 (hardhat, ethers, solidity), game engines (unity, godot), or payment libraries (stripe) are dependencies
   - "design": ONLY if this is primarily a design-system or accessibility-focused project
   - "business"/"marketing"/"research": Almost never auto-suggest — these are opt-in by users
   - "operations": ONLY if incident management or monitoring dependencies exist
5. Do NOT speculatively include categories because "every project could use X". Match only what IS there, not what COULD be useful.
6. Return ONLY the JSON object, no other text.

PROJECT FILES:
${projectContext}`;

  s.message("Analyzing project with AI...");

  try {
    const { stdout } = await spawnWithStdin(
      "claude",
      ["-p", "--model", "sonnet", "--output-format", "text", "--max-budget-usd", "0.02"],
      prompt,
      { env: { ...process.env, CLAUDECODE: "" }, timeout: 30000 },
    );

    if (!stdout.trim()) {
      s.stop("AI detection failed: empty response from AI", 1);
      return null;
    }

    // Strip markdown code fences
    const jsonStr = stdout.replace(/^```\w*\n?/gm, "").replace(/```$/gm, "").trim();

    let data: AiDetectionJson;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      s.stop("AI detection failed: could not parse AI response", 1);
      return null;
    }

    if (!data.techs || data.techs.length === 0) {
      s.stop("AI detection failed: no technologies detected", 1);
      return null;
    }

    s.stop("AI scan complete");

    return {
      techs: data.techs,
      skillCats: (data.skill_cats ?? []).filter((c) => VALID_SKILL_CATS.has(c)),
      agentCats: (data.agent_cats ?? []).filter((c) => VALID_AGENT_CATS.has(c)),
      skillTags: (data.skill_tags ?? []).filter((t) => VALID_SKILL_TAGS.has(t)),
      agentTags: (data.agent_tags ?? []).filter((t) => VALID_AGENT_TAGS.has(t)),
    };
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error && "killed" in err && (err as any).killed;
    const reason = isTimeout
      ? "Claude CLI timed out (30s)"
      : "AI detection failed";
    s.stop(`AI detection failed: ${reason}`, 1);
    return null;
  }
}
