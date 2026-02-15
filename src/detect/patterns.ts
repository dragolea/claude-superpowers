import { readFile, access, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

export interface DetectionResult {
  techs: string[];
  skillCats: string[];
  agentCats: string[];
  skillTags: string[];
  agentTags: string[];
}

function uniquePush(arr: string[], ...items: string[]): void {
  for (const item of items) {
    if (!arr.includes(item)) arr.push(item);
  }
}

function fileExists(path: string): boolean {
  return existsSync(path);
}

async function hasGlob(pattern: string): Promise<boolean> {
  try {
    const entries = await readdir(".");
    return entries.some((e) => e.match(new RegExp(pattern)));
  } catch {
    return false;
  }
}

async function readFileSafe(path: string): Promise<string> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return "";
  }
}

export async function detectProject(): Promise<DetectionResult> {
  const result: DetectionResult = {
    techs: [],
    skillCats: [],
    agentCats: [],
    skillTags: [],
    agentTags: [],
  };

  const t = result.techs;
  const sc = result.skillCats;
  const ac = result.agentCats;
  const st = result.skillTags;
  const at = result.agentTags;

  // ---- Node.js / package.json ----
  if (fileExists("package.json")) {
    uniquePush(t, "Node.js");
    uniquePush(sc, "core", "workflow");
    uniquePush(ac, "core-dev");

    const pkg = await readFileSafe("package.json");

    if (pkg.includes('"react-native"')) {
      uniquePush(t, "React Native");
      uniquePush(sc, "mobile", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "react-native", "mobile", "typescript");
      uniquePush(at, "react-native", "mobile", "typescript");
    } else if (pkg.includes('"react"')) {
      uniquePush(t, "React");
      uniquePush(sc, "web", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "react", "web", "typescript");
      uniquePush(at, "react", "web", "typescript");
    }

    if (pkg.includes('"vue"')) {
      uniquePush(t, "Vue");
      uniquePush(sc, "web", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "vue", "web", "typescript");
      uniquePush(at, "vue", "web", "typescript");
    }

    if (pkg.includes('"@angular/core"')) {
      uniquePush(t, "Angular");
      uniquePush(sc, "web", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "angular", "web", "typescript");
      uniquePush(at, "angular", "web", "typescript");
    }

    if (pkg.includes('"next"')) {
      uniquePush(t, "Next.js");
      uniquePush(sc, "web", "backend", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "nextjs", "react", "web", "typescript");
      uniquePush(at, "nextjs", "react", "web", "typescript");
    }

    if (pkg.includes('"nuxt"')) {
      uniquePush(t, "Nuxt");
      uniquePush(sc, "web", "backend", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "vue", "web", "typescript");
      uniquePush(at, "vue", "web", "typescript");
    }

    if (pkg.includes('"express"')) {
      uniquePush(t, "Express");
      uniquePush(sc, "backend", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "nodejs", "backend", "typescript");
      uniquePush(at, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"@nestjs/core"')) {
      uniquePush(t, "NestJS");
      uniquePush(sc, "backend", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "nodejs", "backend", "typescript");
      uniquePush(at, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"fastify"')) {
      uniquePush(t, "Fastify");
      uniquePush(sc, "backend", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "nodejs", "backend", "typescript");
      uniquePush(at, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"expo"')) {
      uniquePush(t, "Expo");
      uniquePush(sc, "mobile", "languages");
      uniquePush(ac, "core-dev", "languages");
      uniquePush(st, "expo", "mobile", "react-native", "typescript");
      uniquePush(at, "expo", "mobile", "react-native", "typescript");
    }

    if (/\"(jest|vitest|mocha|cypress|playwright)\"/.test(pkg)) {
      uniquePush(t, "Testing");
      uniquePush(sc, "core");
      uniquePush(ac, "quality-security");
      uniquePush(st, "universal");
      uniquePush(at, "testing");
    }
  }

  // ---- TypeScript ----
  if (fileExists("tsconfig.json")) {
    uniquePush(t, "TypeScript");
    uniquePush(sc, "languages");
    uniquePush(ac, "languages");
    uniquePush(st, "typescript");
    uniquePush(at, "typescript");
  }

  // ---- Python ----
  if (
    fileExists("requirements.txt") ||
    fileExists("pyproject.toml") ||
    fileExists("setup.py") ||
    fileExists("Pipfile")
  ) {
    uniquePush(t, "Python");
    uniquePush(sc, "backend", "languages");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "python", "backend");
    uniquePush(at, "python", "backend");

    let pydeps = "";
    for (const f of ["requirements.txt", "pyproject.toml", "Pipfile"]) {
      pydeps += await readFileSafe(f);
    }

    if (/django/i.test(pydeps)) {
      uniquePush(t, "Django");
      uniquePush(st, "python", "backend");
      uniquePush(at, "python", "backend");
    }
    if (/fastapi/i.test(pydeps)) {
      uniquePush(t, "FastAPI");
      uniquePush(st, "python", "backend");
      uniquePush(at, "python", "backend");
    }
    if (/flask/i.test(pydeps)) {
      uniquePush(t, "Flask");
      uniquePush(st, "python", "backend");
      uniquePush(at, "python", "backend");
    }
  }

  // ---- Go ----
  if (fileExists("go.mod")) {
    uniquePush(t, "Go");
    uniquePush(sc, "backend", "languages");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "go", "backend");
    uniquePush(at, "go", "backend");
  }

  // ---- Rust ----
  if (fileExists("Cargo.toml")) {
    uniquePush(t, "Rust");
    uniquePush(sc, "backend", "languages");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "rust");
    uniquePush(at, "rust");
  }

  // ---- Ruby ----
  if (fileExists("Gemfile")) {
    uniquePush(t, "Ruby");
    uniquePush(sc, "backend", "languages");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "ruby", "backend");
    uniquePush(at, "ruby", "backend");

    const gemfile = await readFileSafe("Gemfile");
    if (/rails/i.test(gemfile)) {
      uniquePush(t, "Rails");
      uniquePush(st, "ruby", "backend");
      uniquePush(at, "ruby", "backend");
    }
  }

  // ---- Java / Kotlin ----
  if (
    fileExists("pom.xml") ||
    fileExists("build.gradle") ||
    fileExists("build.gradle.kts")
  ) {
    uniquePush(t, "Java/Kotlin");
    uniquePush(sc, "backend", "languages");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "java", "kotlin");
    uniquePush(at, "java", "kotlin");
  }

  // ---- iOS ----
  if (fileExists("Podfile") || (await hasGlob("\\.xcodeproj$"))) {
    uniquePush(t, "iOS");
    uniquePush(sc, "mobile");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "ios", "swift", "mobile");
    uniquePush(at, "ios", "swift", "mobile");
  }

  // ---- Flutter ----
  if (fileExists("pubspec.yaml")) {
    uniquePush(t, "Flutter");
    uniquePush(sc, "mobile");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "flutter", "mobile");
    uniquePush(at, "flutter", "mobile");
  }

  // ---- C# / .NET ----
  if (await hasGlob("\\.csproj$")) {
    uniquePush(t, "C#/.NET");
    uniquePush(sc, "backend", "languages");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "csharp");
    uniquePush(at, "csharp", "dotnet");
  }

  // ---- PHP ----
  if (fileExists("composer.json")) {
    uniquePush(t, "PHP");
    uniquePush(sc, "backend", "languages");
    uniquePush(ac, "core-dev", "languages");
    uniquePush(st, "php", "backend");
    uniquePush(at, "php", "backend");

    const composer = await readFileSafe("composer.json");
    if (/laravel/i.test(composer)) {
      uniquePush(t, "Laravel");
      uniquePush(st, "php", "backend");
      uniquePush(at, "php", "laravel", "backend");
    }
  }

  // ---- Docker ----
  if (
    fileExists("Dockerfile") ||
    fileExists("docker-compose.yml") ||
    fileExists("docker-compose.yaml") ||
    fileExists("compose.yml") ||
    fileExists("compose.yaml")
  ) {
    uniquePush(t, "Docker");
    uniquePush(sc, "devops");
    uniquePush(ac, "infrastructure");
    uniquePush(st, "devops");
    uniquePush(at, "docker", "devops");
  }

  // ---- Kubernetes ----
  if (fileExists("k8s") || fileExists("kubernetes")) {
    uniquePush(t, "Kubernetes");
    uniquePush(sc, "devops");
    uniquePush(ac, "infrastructure");
    uniquePush(st, "devops");
    uniquePush(at, "kubernetes", "devops");
  }

  // ---- Terraform ----
  if ((await hasGlob("\\.tf$")) || fileExists("terraform")) {
    uniquePush(t, "Terraform");
    uniquePush(sc, "devops");
    uniquePush(ac, "infrastructure");
    uniquePush(st, "devops");
    uniquePush(at, "terraform", "devops");
  }

  // ---- CI/CD ----
  if (
    fileExists(".github/workflows") ||
    fileExists(".gitlab-ci.yml") ||
    fileExists("Jenkinsfile")
  ) {
    uniquePush(t, "CI/CD");
    uniquePush(sc, "devops");
    uniquePush(ac, "infrastructure");
    uniquePush(st, "devops");
    uniquePush(at, "cicd", "devops");
  }

  // ---- Linting ----
  const lintFiles = [
    ".eslintrc",
    ".eslintrc.js",
    ".eslintrc.json",
    ".eslintrc.yml",
    "eslint.config.js",
    "eslint.config.mjs",
    ".prettierrc",
    ".prettierrc.json",
    "prettier.config.js",
    "prettier.config.mjs",
    "biome.json",
  ];
  if (lintFiles.some(fileExists)) {
    uniquePush(t, "Linting");
    uniquePush(sc, "core");
    uniquePush(ac, "dev-experience");
    uniquePush(st, "universal");
    uniquePush(at, "tooling", "dx");
  }

  return result;
}
