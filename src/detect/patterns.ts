import { readFile, access, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

export interface DetectionResult {
  techs: string[];
  skillTags: string[];
  archetypes?: string[];
  confidence?: Record<string, "high" | "medium">;
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
    skillTags: [],
  };

  const t = result.techs;
  const st = result.skillTags;

  // ---- Node.js / package.json ----
  if (fileExists("package.json")) {
    uniquePush(t, "Node.js");

    const pkg = await readFileSafe("package.json");

    if (pkg.includes('"react-native"')) {
      uniquePush(t, "React Native");
      uniquePush(st, "react-native", "mobile", "typescript");
    } else if (pkg.includes('"react"')) {
      uniquePush(t, "React");
      uniquePush(st, "react", "web", "typescript");
    }

    if (pkg.includes('"vue"')) {
      uniquePush(t, "Vue");
      uniquePush(st, "vue", "web", "typescript");
    }

    if (pkg.includes('"@angular/core"')) {
      uniquePush(t, "Angular");
      uniquePush(st, "angular", "web", "typescript");
    }

    if (pkg.includes('"next"')) {
      uniquePush(t, "Next.js");
      uniquePush(st, "nextjs", "react", "web", "typescript");
    }

    if (pkg.includes('"nuxt"')) {
      uniquePush(t, "Nuxt");
      uniquePush(st, "vue", "web", "typescript");
    }

    if (pkg.includes('"express"')) {
      uniquePush(t, "Express");
      uniquePush(st, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"@nestjs/core"')) {
      uniquePush(t, "NestJS");
      uniquePush(st, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"fastify"')) {
      uniquePush(t, "Fastify");
      uniquePush(st, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"expo"')) {
      uniquePush(t, "Expo");
      uniquePush(st, "expo", "mobile", "react-native", "typescript");
    }

    if (/\"(jest|vitest|mocha|cypress|playwright)\"/.test(pkg)) {
      uniquePush(t, "Testing");
      uniquePush(st, "universal");
    }

    // AI/ML libraries
    if (pkg.includes('"langchain"') || pkg.includes('"@langchain/')) {
      uniquePush(t, "LangChain");
      uniquePush(st, "ai");
    }

    // Blockchain/Web3
    if (pkg.includes('"ethers"') || pkg.includes('"web3"') || pkg.includes('"hardhat"')) {
      uniquePush(t, "Web3");
      uniquePush(st, "web3");
    }

    // Payment processing
    if (pkg.includes('"stripe"') || pkg.includes('"@stripe/')) {
      uniquePush(t, "Stripe");
    }

    // Database/ORM
    if (/\"(?:prisma|drizzle-orm|@drizzle-team|typeorm|sequelize|mongoose|knex|@mikro-orm|better-sqlite3|pg|mysql2|ioredis|redis)\"/.test(pkg)) {
      uniquePush(t, "Database/ORM");
    }

    // Auth/Security
    if (/\"(?:passport|@auth0|next-auth|@clerk|firebase|jsonwebtoken|bcrypt|helmet|@supabase\/auth-helpers)\"/.test(pkg)) {
      uniquePush(t, "Auth/Security");
    }

    // Monitoring/Observability
    if (/\"(?:@sentry\/node|@sentry\/react|@datadog|@opentelemetry|newrelic|pino|winston)\"/.test(pkg)) {
      uniquePush(t, "Monitoring");
    }

    // Analytics/Reporting
    if (/\"(?:mixpanel|@amplitude|@segment\/analytics-node|posthog-node|chart\.js|d3|recharts)\"/.test(pkg)) {
      uniquePush(t, "Analytics");
    }

    // Design System/UI
    if (/\"(?:tailwindcss|@chakra-ui|@mui\/material|@radix-ui|styled-components|@emotion|storybook|@storybook)\"/.test(pkg)) {
      uniquePush(t, "Design System");
    }

    // CMS/Content
    if (/\"(?:contentful|@sanity|strapi|@keystonejs|ghost|@contentlayer)\"/.test(pkg)) {
      uniquePush(t, "CMS");
    }
  }

  // ---- TypeScript ----
  if (fileExists("tsconfig.json")) {
    uniquePush(t, "TypeScript");
    uniquePush(st, "typescript");
  }

  // ---- Python ----
  if (
    fileExists("requirements.txt") ||
    fileExists("pyproject.toml") ||
    fileExists("setup.py") ||
    fileExists("Pipfile")
  ) {
    uniquePush(t, "Python");
    uniquePush(st, "python", "backend");

    let pydeps = "";
    for (const f of ["requirements.txt", "pyproject.toml", "Pipfile"]) {
      pydeps += await readFileSafe(f);
    }

    if (/django/i.test(pydeps)) {
      uniquePush(t, "Django");
      uniquePush(st, "python", "backend");
    }
    if (/fastapi/i.test(pydeps)) {
      uniquePush(t, "FastAPI");
      uniquePush(st, "python", "backend");
    }
    if (/flask/i.test(pydeps)) {
      uniquePush(t, "Flask");
      uniquePush(st, "python", "backend");
    }

    // AI/ML libraries
    if (/(?:tensorflow|torch|langchain|openai|anthropic|transformers)/i.test(pydeps)) {
      uniquePush(t, "AI/ML");
      uniquePush(st, "ai");
    }

    // Data engineering
    if (/(?:pyspark|dbt|airflow|pandas|polars)/i.test(pydeps)) {
      uniquePush(t, "Data Engineering");
    }

    // Database/ORM (Python)
    if (/(?:sqlalchemy|peewee|tortoise-orm|psycopg2|pymongo|redis)/i.test(pydeps)) {
      uniquePush(t, "Database/ORM");
    }

    // Auth/Security (Python)
    if (/(?:authlib|python-jose|passlib|django-allauth)/i.test(pydeps)) {
      uniquePush(t, "Auth/Security");
    }

    // Monitoring (Python)
    if (/(?:sentry-sdk|datadog|opentelemetry-api)/i.test(pydeps)) {
      uniquePush(t, "Monitoring");
    }

    // Analytics (Python)
    if (/(?:matplotlib|plotly|dash|streamlit|metabase)/i.test(pydeps)) {
      uniquePush(t, "Analytics");
    }
  }

  // ---- Go ----
  if (fileExists("go.mod")) {
    uniquePush(t, "Go");
    uniquePush(st, "go", "backend");

    const gomod = await readFileSafe("go.mod");

    // Database/ORM (Go)
    if (/(?:gorm\.io|entgo\.io|github\.com\/jmoiron\/sqlx)/i.test(gomod)) {
      uniquePush(t, "Database/ORM");
    }
  }

  // ---- Rust ----
  if (fileExists("Cargo.toml")) {
    uniquePush(t, "Rust");
    uniquePush(st, "rust");

    const cargo = await readFileSafe("Cargo.toml");

    // Database/ORM (Rust)
    if (/(?:diesel|sqlx|sea-orm)/i.test(cargo)) {
      uniquePush(t, "Database/ORM");
    }
  }

  // ---- Ruby ----
  if (fileExists("Gemfile")) {
    uniquePush(t, "Ruby");
    uniquePush(st, "ruby", "backend");

    const gemfile = await readFileSafe("Gemfile");
    if (/rails/i.test(gemfile)) {
      uniquePush(t, "Rails");
      uniquePush(st, "ruby", "backend");
    }
  }

  // ---- Java / Kotlin ----
  if (
    fileExists("pom.xml") ||
    fileExists("build.gradle") ||
    fileExists("build.gradle.kts")
  ) {
    uniquePush(t, "Java/Kotlin");
    uniquePush(st, "java", "kotlin");
  }

  // ---- iOS ----
  if (fileExists("Podfile") || (await hasGlob("\\.xcodeproj$"))) {
    uniquePush(t, "iOS");
    uniquePush(st, "ios", "swift", "mobile");
  }

  // ---- Flutter ----
  if (fileExists("pubspec.yaml")) {
    uniquePush(t, "Flutter");
    uniquePush(st, "flutter", "mobile");
  }

  // ---- C# / .NET ----
  if (await hasGlob("\\.csproj$")) {
    uniquePush(t, "C#/.NET");
    uniquePush(st, "csharp");
  }

  // ---- PHP ----
  if (fileExists("composer.json")) {
    uniquePush(t, "PHP");
    uniquePush(st, "php", "backend");

    const composer = await readFileSafe("composer.json");
    if (/laravel/i.test(composer)) {
      uniquePush(t, "Laravel");
      uniquePush(st, "php", "backend");
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
    uniquePush(st, "devops");
  }

  // ---- Kubernetes ----
  if (fileExists("k8s") || fileExists("kubernetes")) {
    uniquePush(t, "Kubernetes");
    uniquePush(st, "devops");
  }

  // ---- Terraform ----
  if ((await hasGlob("\\.tf$")) || fileExists("terraform")) {
    uniquePush(t, "Terraform");
    uniquePush(st, "devops");
  }

  // ---- CI/CD ----
  if (
    fileExists(".github/workflows") ||
    fileExists(".gitlab-ci.yml") ||
    fileExists("Jenkinsfile")
  ) {
    uniquePush(t, "CI/CD");
    uniquePush(st, "devops");
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
    uniquePush(st, "universal");
  }

  // ---- Solidity / Blockchain ----
  if (fileExists("hardhat.config.ts") || fileExists("hardhat.config.js") || fileExists("foundry.toml")) {
    uniquePush(t, "Blockchain");
    uniquePush(st, "web3");
  }

  // ---- Monitoring infra files ----
  if (fileExists("prometheus.yml") || fileExists("grafana")) {
    uniquePush(t, "Monitoring");
  }

  // ---- Archetype detection ----
  const archetypes = deriveArchetypes(result);
  if (archetypes.length > 0) {
    result.archetypes = archetypes;
  }

  return result;
}

function deriveArchetypes(result: DetectionResult): string[] {
  const archetypes: string[] = [];
  const hasFrontend = result.skillTags.some((t) =>
    ["react", "vue", "angular", "nextjs"].includes(t),
  );
  const hasBackend = result.skillTags.includes("backend");
  const hasDocker = result.techs.includes("Docker");
  const hasK8sOrTerraform = result.techs.some((t) =>
    ["Kubernetes", "Terraform"].includes(t),
  );
  const hasCICD = result.techs.includes("CI/CD");
  const hasAI = result.techs.some((t) =>
    ["AI/ML", "LangChain"].includes(t),
  ) || result.skillTags.includes("ai");
  const hasData = result.techs.some((t) =>
    ["Data Engineering", "Database/ORM"].includes(t),
  );
  const hasPayments = result.techs.includes("Stripe");
  const hasMobile = result.skillTags.some((t) =>
    ["mobile", "react-native", "flutter", "ios", "android"].includes(t),
  );

  if (hasFrontend && hasBackend) archetypes.push("fullstack-web");
  if (!hasFrontend && hasBackend) archetypes.push("api-backend");
  if (hasMobile) archetypes.push("mobile-app");
  if (hasDocker && (hasK8sOrTerraform || hasCICD)) archetypes.push("devops-infra");
  if (hasAI && hasData) archetypes.push("ml-platform");
  if (hasAI && !hasData) archetypes.push("data-pipeline");
  if (hasPayments && hasFrontend) archetypes.push("e-commerce");

  return archetypes;
}
