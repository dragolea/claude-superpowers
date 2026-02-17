import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
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
export const VALID_SKILL_TAGS = new Set([
  "universal", "web", "react", "nextjs", "vue", "angular", "mobile",
  "react-native", "expo", "flutter", "ios", "swift", "android", "kotlin",
  "backend", "nodejs", "python", "php", "ruby", "java", "cpp", "csharp",
  "go", "rust", "typescript", "devops", "creative", "documents", "web3", "ai",
]);

export const VALID_ARCHETYPES = new Set([
  "fullstack-web", "api-backend", "mobile-app", "data-pipeline",
  "ml-platform", "devops-infra", "cli-tool", "e-commerce",
  "saas", "monorepo", "library", "microservices",
]);

async function readFileSafe(path: string, maxLines: number): Promise<string> {
  try {
    const content = await readFile(path, "utf-8");
    return content.split("\n").slice(0, maxLines).join("\n");
  } catch {
    return "";
  }
}

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "__pycache__",
  ".venv", "vendor", "target", ".cache", "coverage", ".turbo",
]);

async function buildDirTree(dir: string, depth: number, maxEntries: number): Promise<string> {
  const lines: string[] = [];
  async function walk(d: string, indent: number, remaining: { count: number }): Promise<void> {
    if (indent > depth || remaining.count <= 0) return;
    try {
      const entries = await readdir(d);
      for (const entry of entries) {
        if (remaining.count <= 0) break;
        if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
        const fullPath = join(d, entry);
        try {
          const s = await stat(fullPath);
          if (s.isDirectory()) {
            lines.push(`${"  ".repeat(indent)}${entry}/`);
            remaining.count--;
            await walk(fullPath, indent + 1, remaining);
          }
        } catch { /* skip inaccessible entries */ }
      }
    } catch { /* ignore */ }
  }
  await walk(dir, 0, { count: maxEntries });
  return lines.join("\n");
}

async function sampleImports(dir: string): Promise<string> {
  const extensions = [".ts", ".py", ".go"];
  const searchDirs = [join(dir, "src"), dir];
  const imports: string[] = [];
  let filesScanned = 0;

  for (const searchDir of searchDirs) {
    if (filesScanned >= 5) break;
    try {
      const entries = await readdir(searchDir);
      for (const entry of entries) {
        if (filesScanned >= 5) break;
        if (!extensions.some((ext) => entry.endsWith(ext))) continue;
        const content = await readFileSafe(join(searchDir, entry), 30);
        const importLines = content
          .split("\n")
          .filter((line) => /^(?:import |from |require\()/.test(line.trim()));
        if (importLines.length > 0) {
          imports.push(`--- ${entry} ---`);
          imports.push(...importLines);
          filesScanned++;
        }
      }
    } catch { /* ignore */ }
  }
  return imports.join("\n");
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
    { file: "README.md", label: "README.md (first 80 lines)", lines: 80 },
    { file: "CLAUDE.md", label: "CLAUDE.md (first 50 lines)", lines: 50 },
    { file: ".claude/CLAUDE.md", label: ".claude/CLAUDE.md (first 50 lines)", lines: 50 },
    { file: "Dockerfile", label: "Dockerfile (first 30 lines)", lines: 30 },
    { file: "docker-compose.yml", label: "docker-compose.yml (first 50 lines)", lines: 50 },
    { file: "docker-compose.yaml", label: "docker-compose.yaml (first 50 lines)", lines: 50 },
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

  // First CI/CD workflow file
  try {
    if (existsSync(".github/workflows")) {
      const workflows = await readdir(".github/workflows");
      const firstYml = workflows.find((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
      if (firstYml) {
        const content = await readFileSafe(join(".github/workflows", firstYml), 40);
        ctx += `=== .github/workflows/${firstYml} (first 40 lines) ===\n${content}\n`;
      }
    }
  } catch { /* ignore */ }

  // Infrastructure signals (existence-only checks for remaining infra files)
  const infraFiles = [
    ".github/workflows", ".gitlab-ci.yml", "Jenkinsfile",
    "terraform.tf", "main.tf", ".terraform",
    "k8s", "kubernetes", "Chart.yaml", "helmfile.yaml",
    ".eslintrc", ".eslintrc.js", ".eslintrc.json",
    "eslint.config.js", "eslint.config.mjs",
    ".prettierrc", "prettier.config.js",
    ".env.example", ".env.local",
    "prometheus.yml", "grafana",
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

  // Directory listing (flat)
  try {
    const entries = await readdir(".");
    ctx += `=== Directory listing ===\n${entries.slice(0, 40).join("\n")}\n`;
  } catch { /* ignore */ }

  // Directory tree (depth 2) — reveals project architecture
  try {
    const tree = await buildDirTree(".", 2, 60);
    if (tree) {
      ctx += `=== Directory tree (depth 2) ===\n${tree}\n`;
    }
  } catch { /* ignore */ }

  // Sample import analysis — reveals actual usage patterns
  try {
    const imports = await sampleImports(".");
    if (imports) {
      ctx += `=== Sample imports (first 5 source files) ===\n${imports}\n`;
    }
  } catch { /* ignore */ }

  return ctx;
}

interface AiDetectionJson {
  techs?: string[];
  skill_tags?: string[];
  archetypes?: string[];
  confidence?: Record<string, string>;
}

export async function detectProjectAI(): Promise<DetectionResult | null> {
  const s = p.spinner();

  s.start("Gathering project context...");
  const projectContext = await gatherProjectContext();
  if (!projectContext.trim()) {
    s.stop("AI detection failed: no project files found", 1);
    return null;
  }

  const prompt = `You are a project analyzer. Examine the project files below and detect technologies that are explicitly present as dependencies, config files, or source code.

Return ONLY a JSON object:
{
  "techs": [...],
  "skill_tags": [...],
  "archetypes": [...],
  "confidence": { "TechName": "high"|"medium", ... }
}

FIELD DEFINITIONS:
- techs: Human-readable names of technologies explicitly found (e.g. "React", "TypeScript", "Docker")
- skill_tags: Skill tags from VALID list that match detected technologies
- archetypes: Project archetypes from VALID list that describe this project's nature
- confidence: Object mapping each detected tech to a confidence level ("high" or "medium")
  - "high": The technology is a primary/core part of the project
  - "medium": The technology is a secondary dependency or utility

VALID SKILL TAGS: universal, web, react, nextjs, vue, angular, mobile, react-native, expo, flutter, ios, swift, android, kotlin, backend, nodejs, python, php, ruby, java, cpp, csharp, go, rust, typescript, devops, creative, documents, web3, ai
VALID ARCHETYPES: fullstack-web, api-backend, mobile-app, data-pipeline, ml-platform, devops-infra, cli-tool, e-commerce, saas, monorepo, library, microservices

RULES:
1. Only include a tag if there is concrete evidence in the project files.
2. Tag evidence requirements:
   - "devops": ONLY if Dockerfile, docker-compose, terraform, k8s manifests, CI/CD configs, or cloud SDK dependencies exist
   - "web": ONLY if frontend framework dependencies exist (React, Vue, Angular, Svelte) or HTML/CSS tooling is present
   - "mobile": ONLY if React Native, Flutter, Swift, Kotlin, or mobile SDK dependencies exist
   - "backend": ONLY if server frameworks (Express, Fastify, Django, Rails, etc.), database drivers, or API frameworks are dependencies
   - "ai": ONLY if AI/ML libraries are dependencies (e.g. langchain, openai, torch, transformers)
   - "web3": ONLY if blockchain/web3 libraries are dependencies (e.g. ethers, hardhat, foundry)
3. Return ONLY the JSON object, no other text.

PROJECT FILES:
${projectContext}`;

  s.message("Analyzing project with AI...");

  try {
    const { stdout } = await spawnWithStdin(
      "claude",
      ["-p", "--model", "sonnet", "--output-format", "text", "--max-budget-usd", "0.10"],
      prompt,
      { env: { ...process.env, CLAUDECODE: "" }, timeout: 45000 },
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

    const result: DetectionResult = {
      techs: data.techs,
      skillTags: (data.skill_tags ?? []).filter((t) => VALID_SKILL_TAGS.has(t)),
    };

    // Parse archetypes
    if (data.archetypes && Array.isArray(data.archetypes)) {
      const validArchetypes = data.archetypes.filter((a) => VALID_ARCHETYPES.has(a));
      if (validArchetypes.length > 0) {
        result.archetypes = validArchetypes;
      }
    }

    // Parse confidence
    if (data.confidence && typeof data.confidence === "object") {
      const validConfidence: Record<string, "high" | "medium"> = {};
      for (const [tech, level] of Object.entries(data.confidence)) {
        if (level === "high" || level === "medium") {
          validConfidence[tech] = level;
        }
      }
      if (Object.keys(validConfidence).length > 0) {
        result.confidence = validConfidence;
      }
    }

    return result;
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error && "killed" in err && (err as any).killed;
    const reason = isTimeout
      ? "Claude CLI timed out (45s)"
      : "AI detection failed";
    s.stop(`AI detection failed: ${reason}`, 1);
    return null;
  }
}
