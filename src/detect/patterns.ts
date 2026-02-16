import { readFile, access, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";

export interface DetectionResult {
  techs: string[];
  skillCats: string[];
  agentCats: string[];
  skillTags: string[];
  agentTags: string[];
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

    const pkg = await readFileSafe("package.json");

    if (pkg.includes('"react-native"')) {
      uniquePush(t, "React Native");
      uniquePush(sc, "mobile", "languages");
      uniquePush(st, "react-native", "mobile", "typescript");
    } else if (pkg.includes('"react"')) {
      uniquePush(t, "React");
      uniquePush(sc, "web", "languages");
      uniquePush(st, "react", "web", "typescript");
    }

    if (pkg.includes('"vue"')) {
      uniquePush(t, "Vue");
      uniquePush(sc, "web", "languages");
      uniquePush(st, "vue", "web", "typescript");
    }

    if (pkg.includes('"@angular/core"')) {
      uniquePush(t, "Angular");
      uniquePush(sc, "web", "languages");
      uniquePush(st, "angular", "web", "typescript");
    }

    if (pkg.includes('"next"')) {
      uniquePush(t, "Next.js");
      uniquePush(sc, "web", "backend", "languages");
      uniquePush(st, "nextjs", "react", "web", "typescript");
    }

    if (pkg.includes('"nuxt"')) {
      uniquePush(t, "Nuxt");
      uniquePush(sc, "web", "backend", "languages");
      uniquePush(st, "vue", "web", "typescript");
    }

    if (pkg.includes('"express"')) {
      uniquePush(t, "Express");
      uniquePush(sc, "backend", "languages");
      uniquePush(st, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"@nestjs/core"')) {
      uniquePush(t, "NestJS");
      uniquePush(sc, "backend", "languages");
      uniquePush(st, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"fastify"')) {
      uniquePush(t, "Fastify");
      uniquePush(sc, "backend", "languages");
      uniquePush(st, "nodejs", "backend", "typescript");
    }

    if (pkg.includes('"expo"')) {
      uniquePush(t, "Expo");
      uniquePush(sc, "mobile", "languages");
      uniquePush(st, "expo", "mobile", "react-native", "typescript");
    }

    if (/\"(jest|vitest|mocha|cypress|playwright)\"/.test(pkg)) {
      uniquePush(t, "Testing");
      uniquePush(sc, "core");
      uniquePush(st, "universal");
    }

    // AI/ML libraries → data-ai agents
    if (pkg.includes('"langchain"') || pkg.includes('"@langchain/')) {
      uniquePush(t, "LangChain");
      uniquePush(ac, "data-ai");
      uniquePush(at, "llm", "langchain", "ai");
    }

    // Blockchain/Web3 → specialized agents
    if (pkg.includes('"ethers"') || pkg.includes('"web3"') || pkg.includes('"hardhat"')) {
      uniquePush(t, "Web3");
      uniquePush(ac, "specialized");
      uniquePush(at, "blockchain", "web3");
    }

    // Payment processing → specialized agents
    if (pkg.includes('"stripe"') || pkg.includes('"@stripe/')) {
      uniquePush(t, "Stripe");
      uniquePush(ac, "specialized");
      uniquePush(at, "payments", "stripe");
    }

    // Database/ORM → data-ai agents
    if (/\"(?:prisma|drizzle-orm|@drizzle-team|typeorm|sequelize|mongoose|knex|@mikro-orm|better-sqlite3|pg|mysql2|ioredis|redis)\"/.test(pkg)) {
      uniquePush(t, "Database/ORM");
      uniquePush(ac, "data-ai");
      uniquePush(at, "database", "migrations", "data");
    }

    // Auth/Security → security skill tags
    if (/\"(?:passport|@auth0|next-auth|@clerk|firebase|jsonwebtoken|bcrypt|helmet|@supabase\/auth-helpers)\"/.test(pkg)) {
      uniquePush(t, "Auth/Security");
      uniquePush(sc, "security");
      uniquePush(at, "security");
    }

    // Monitoring/Observability → operations agents
    if (/\"(?:@sentry\/node|@sentry\/react|@datadog|@opentelemetry|newrelic|pino|winston)\"/.test(pkg)) {
      uniquePush(t, "Monitoring");
      uniquePush(ac, "operations");
      uniquePush(at, "monitoring", "incident-response", "performance");
    }

    // Analytics/Reporting → business agents
    if (/\"(?:mixpanel|@amplitude|@segment\/analytics-node|posthog-node|chart\.js|d3|recharts)\"/.test(pkg)) {
      uniquePush(t, "Analytics");
      uniquePush(ac, "business");
      uniquePush(at, "analytics", "dashboards", "reporting");
    }

    // Design System/UI → design agents
    if (/\"(?:tailwindcss|@chakra-ui|@mui\/material|@radix-ui|styled-components|@emotion|storybook|@storybook)\"/.test(pkg)) {
      uniquePush(t, "Design System");
      uniquePush(ac, "design");
      uniquePush(at, "design", "ui", "ux", "accessibility", "responsive");
    }

    // CMS/Content → marketing agents
    if (/\"(?:contentful|@sanity|strapi|@keystonejs|ghost|@contentlayer)\"/.test(pkg)) {
      uniquePush(t, "CMS");
      uniquePush(ac, "marketing");
      uniquePush(at, "content", "marketing", "seo");
    }

    // Testing/Quality → quality tags
    if (/\"(?:@testing-library\/|cypress|playwright|puppeteer|@storybook\/test)/.test(pkg)) {
      uniquePush(at, "quality", "validation");
    }
  }

  // ---- TypeScript ----
  if (fileExists("tsconfig.json")) {
    uniquePush(t, "TypeScript");
    uniquePush(sc, "languages");
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
    uniquePush(sc, "backend", "languages");
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

    // AI/ML libraries → data-ai agents
    if (/(?:tensorflow|torch|langchain|openai|anthropic|transformers)/i.test(pydeps)) {
      uniquePush(t, "AI/ML");
      uniquePush(ac, "data-ai");
      uniquePush(at, "ai", "ml", "llm");
    }

    // Data engineering → data-ai agents
    if (/(?:pyspark|dbt|airflow|pandas|polars)/i.test(pydeps)) {
      uniquePush(t, "Data Engineering");
      uniquePush(ac, "data-ai");
      uniquePush(at, "data", "pipelines");
    }

    // Database/ORM (Python) → data-ai agents
    if (/(?:sqlalchemy|peewee|tortoise-orm|psycopg2|pymongo|redis)/i.test(pydeps)) {
      uniquePush(t, "Database/ORM");
      uniquePush(ac, "data-ai");
      uniquePush(at, "database", "migrations", "data");
    }

    // Auth/Security (Python) → security skill tags
    if (/(?:authlib|python-jose|passlib|django-allauth)/i.test(pydeps)) {
      uniquePush(t, "Auth/Security");
      uniquePush(sc, "security");
      uniquePush(at, "security");
    }

    // Monitoring (Python) → operations agents
    if (/(?:sentry-sdk|datadog|opentelemetry-api)/i.test(pydeps)) {
      uniquePush(t, "Monitoring");
      uniquePush(ac, "operations");
      uniquePush(at, "monitoring", "incident-response", "performance");
    }

    // Analytics (Python) → business agents
    if (/(?:matplotlib|plotly|dash|streamlit|metabase)/i.test(pydeps)) {
      uniquePush(t, "Analytics");
      uniquePush(ac, "business");
      uniquePush(at, "analytics", "dashboards", "reporting");
    }
  }

  // ---- Go ----
  if (fileExists("go.mod")) {
    uniquePush(t, "Go");
    uniquePush(sc, "backend", "languages");
    uniquePush(st, "go", "backend");

    const gomod = await readFileSafe("go.mod");

    // Database/ORM (Go) → data-ai agents
    if (/(?:gorm\.io|entgo\.io|github\.com\/jmoiron\/sqlx)/i.test(gomod)) {
      uniquePush(t, "Database/ORM");
      uniquePush(ac, "data-ai");
      uniquePush(at, "database", "migrations", "data");
    }
  }

  // ---- Rust ----
  if (fileExists("Cargo.toml")) {
    uniquePush(t, "Rust");
    uniquePush(sc, "backend", "languages");
    uniquePush(st, "rust");

    const cargo = await readFileSafe("Cargo.toml");

    // Database/ORM (Rust) → data-ai agents
    if (/(?:diesel|sqlx|sea-orm)/i.test(cargo)) {
      uniquePush(t, "Database/ORM");
      uniquePush(ac, "data-ai");
      uniquePush(at, "database", "migrations", "data");
    }
  }

  // ---- Ruby ----
  if (fileExists("Gemfile")) {
    uniquePush(t, "Ruby");
    uniquePush(sc, "backend", "languages");
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
    uniquePush(sc, "backend", "languages");
    uniquePush(st, "java", "kotlin");
  }

  // ---- iOS ----
  if (fileExists("Podfile") || (await hasGlob("\\.xcodeproj$"))) {
    uniquePush(t, "iOS");
    uniquePush(sc, "mobile");
    uniquePush(st, "ios", "swift", "mobile");
  }

  // ---- Flutter ----
  if (fileExists("pubspec.yaml")) {
    uniquePush(t, "Flutter");
    uniquePush(sc, "mobile");
    uniquePush(st, "flutter", "mobile");
  }

  // ---- C# / .NET ----
  if (await hasGlob("\\.csproj$")) {
    uniquePush(t, "C#/.NET");
    uniquePush(sc, "backend", "languages");
    uniquePush(st, "csharp");
  }

  // ---- PHP ----
  if (fileExists("composer.json")) {
    uniquePush(t, "PHP");
    uniquePush(sc, "backend", "languages");
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
    uniquePush(sc, "devops");
    uniquePush(st, "devops");
  }

  // ---- Kubernetes ----
  if (fileExists("k8s") || fileExists("kubernetes")) {
    uniquePush(t, "Kubernetes");
    uniquePush(sc, "devops");
    uniquePush(st, "devops");
  }

  // ---- Terraform ----
  if ((await hasGlob("\\.tf$")) || fileExists("terraform")) {
    uniquePush(t, "Terraform");
    uniquePush(sc, "devops");
    uniquePush(st, "devops");
  }

  // ---- CI/CD ----
  if (
    fileExists(".github/workflows") ||
    fileExists(".gitlab-ci.yml") ||
    fileExists("Jenkinsfile")
  ) {
    uniquePush(t, "CI/CD");
    uniquePush(sc, "devops");
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
    uniquePush(sc, "core");
    uniquePush(st, "universal");
  }

  // ---- Solidity / Blockchain ----
  if (fileExists("hardhat.config.ts") || fileExists("hardhat.config.js") || fileExists("foundry.toml")) {
    uniquePush(t, "Blockchain");
    uniquePush(ac, "specialized");
    uniquePush(at, "blockchain", "web3", "solidity");
  }

  // ---- Monitoring infra files → operations agents ----
  if (fileExists("prometheus.yml") || fileExists("grafana")) {
    uniquePush(t, "Monitoring");
    uniquePush(ac, "operations");
    uniquePush(at, "monitoring", "incident-response", "performance");
  }

  // ---- Archetype detection + enrichment ----
  const archetypes = deriveArchetypes(result);
  if (archetypes.length > 0) {
    result.archetypes = archetypes;
    enrichFromArchetypes(result, archetypes);
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
  const hasAI = result.agentTags.some((t) => ["ai", "ml", "llm"].includes(t));
  const hasData = result.agentTags.some((t) =>
    ["data", "pipelines", "database"].includes(t),
  );
  const hasPayments = result.agentTags.some((t) =>
    ["payments", "stripe"].includes(t),
  );
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

function enrichFromArchetypes(
  result: DetectionResult,
  archetypes: string[],
): void {
  const mapping: Record<string, { agentCats: string[]; agentTags: string[] }> = {
    "fullstack-web": {
      agentCats: ["design"],
      agentTags: ["ui", "ux", "responsive"],
    },
    "devops-infra": {
      agentCats: ["operations"],
      agentTags: ["monitoring", "incident-response"],
    },
    "ml-platform": {
      agentCats: ["data-ai"],
      agentTags: ["ml", "mlops", "pipelines"],
    },
    "e-commerce": {
      agentCats: ["specialized", "business"],
      agentTags: ["payments", "analytics"],
    },
    saas: {
      agentCats: ["business"],
      agentTags: ["analytics", "dashboards"],
    },
  };

  for (const arch of archetypes) {
    const m = mapping[arch];
    if (m) {
      for (const c of m.agentCats) uniquePush(result.agentCats, c);
      for (const t of m.agentTags) uniquePush(result.agentTags, t);
    }
  }
}
