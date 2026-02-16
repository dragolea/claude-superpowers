import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DetectionResult } from "../../src/detect/patterns.js";

// We mock fs modules so detectProject() sees our fake file system.
// The module uses both `existsSync` from "node:fs" and `readFile`/`readdir` from "node:fs/promises".

vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async () => ""),
  readdir: vi.fn(async () => []),
  access: vi.fn(async () => { throw new Error("not found"); }),
}));

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { detectProject } from "../../src/detect/patterns.js";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFile = vi.mocked(readFile);
const mockReaddir = vi.mocked(readdir);

function setExistingFiles(files: string[]): void {
  mockExistsSync.mockImplementation((path: any) => files.includes(String(path)));
}

function setFileContent(mapping: Record<string, string>): void {
  mockReadFile.mockImplementation(async (path: any, _enc?: any) => {
    const content = mapping[String(path)];
    if (content !== undefined) return content;
    throw new Error(`ENOENT: ${path}`);
  });
}

function setDirEntries(entries: string[]): void {
  mockReaddir.mockImplementation(async () => entries as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockExistsSync.mockReturnValue(false);
  mockReadFile.mockRejectedValue(new Error("ENOENT"));
  mockReaddir.mockResolvedValue([] as any);
});

// ---- Empty directory ----

describe("empty directory", () => {
  it("returns empty result when no project files exist", async () => {
    const result = await detectProject();
    expect(result.techs).toEqual([]);
    expect(result.skillCats).toEqual([]);
    expect(result.agentCats).toEqual([]);
    expect(result.skillTags).toEqual([]);
    expect(result.agentTags).toEqual([]);
  });
});

// ---- Node.js / package.json ----

describe("Node.js detection", () => {
  it("detects bare Node.js project (package.json only)", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({ "package.json": '{ "name": "my-app" }' });

    const result = await detectProject();
    expect(result.techs).toContain("Node.js");
    expect(result.skillCats).toContain("core");
    expect(result.skillCats).toContain("workflow");
  });

  it("detects React project", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "react": "^18.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("React");
    expect(result.skillCats).toContain("web");
    expect(result.skillTags).toContain("react");
    expect(result.skillTags).toContain("typescript");
  });

  it("detects React Native over React (else-if precedence)", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "react-native": "^0.72.0", "react": "^18.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("React Native");
    expect(result.techs).not.toContain("React");
    expect(result.skillCats).toContain("mobile");
    expect(result.skillTags).toContain("react-native");
  });

  it("detects Next.js (via '\"next\"' string match)", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "next": "^14.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Next.js");
    expect(result.skillTags).toContain("nextjs");
    expect(result.skillTags).toContain("react");
  });

  it("detects Vue project", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "vue": "^3.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Vue");
    expect(result.skillCats).toContain("web");
    expect(result.skillTags).toContain("vue");
  });

  it("detects Angular project", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "@angular/core": "^17.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Angular");
    expect(result.skillTags).toContain("angular");
  });

  it("detects Express backend", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "express": "^4.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Express");
    expect(result.skillCats).toContain("backend");
    expect(result.skillTags).toContain("nodejs");
  });

  it("detects NestJS backend", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "@nestjs/core": "^10.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("NestJS");
    expect(result.skillTags).toContain("nodejs");
  });

  it("detects Expo project", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "expo": "^50.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Expo");
    expect(result.skillCats).toContain("mobile");
    expect(result.skillTags).toContain("expo");
    expect(result.skillTags).toContain("react-native");
  });

  it("detects testing frameworks", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        devDependencies: { "vitest": "^1.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Testing");
  });

  it("detects Web3/blockchain in package.json", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "ethers": "^6.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Web3");
    expect(result.agentCats).toContain("specialized");
    expect(result.agentTags).toContain("blockchain");
  });

  it("detects LangChain AI in package.json", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "langchain": "^0.1.0" },
      }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("LangChain");
    expect(result.agentCats).toContain("data-ai");
    expect(result.agentTags).toContain("ai");
  });

  it("detects Stripe payments in package.json", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "stripe": "^14.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Stripe");
    expect(result.agentCats).toContain("specialized");
    expect(result.agentTags).toContain("payments");
  });
});

// ---- TypeScript ----

describe("TypeScript detection", () => {
  it("detects tsconfig.json", async () => {
    setExistingFiles(["tsconfig.json"]);

    const result = await detectProject();
    expect(result.techs).toContain("TypeScript");
    expect(result.skillCats).toContain("languages");
    expect(result.skillTags).toContain("typescript");
  });
});

// ---- Python ----

describe("Python detection", () => {
  it("detects requirements.txt", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "flask\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Python");
    expect(result.techs).toContain("Flask");
    expect(result.skillCats).toContain("backend");
    expect(result.skillTags).toContain("python");
  });

  it("detects pyproject.toml", async () => {
    setExistingFiles(["pyproject.toml"]);
    setFileContent({ "pyproject.toml": "[tool.poetry]\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Python");
  });

  it("detects Django from deps", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "Django>=4.0\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Django");
  });

  it("detects FastAPI from deps", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "fastapi\nuvicorn\n" });

    const result = await detectProject();
    expect(result.techs).toContain("FastAPI");
  });

  it("detects AI/ML libraries → data-ai agent category", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "torch\ntransformers\n" });

    const result = await detectProject();
    expect(result.techs).toContain("AI/ML");
    expect(result.agentCats).toContain("data-ai");
    expect(result.agentTags).toContain("ai");
  });

  it("detects data engineering → data-ai agent category", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "pandas\nairflow\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Data Engineering");
    expect(result.agentCats).toContain("data-ai");
    expect(result.agentTags).toContain("data");
  });
});

// ---- Go ----

describe("Go detection", () => {
  it("detects go.mod", async () => {
    setExistingFiles(["go.mod"]);

    const result = await detectProject();
    expect(result.techs).toContain("Go");
    expect(result.skillCats).toContain("backend");
    expect(result.skillTags).toContain("go");
  });
});

// ---- Rust ----

describe("Rust detection", () => {
  it("detects Cargo.toml", async () => {
    setExistingFiles(["Cargo.toml"]);

    const result = await detectProject();
    expect(result.techs).toContain("Rust");
    expect(result.skillTags).toContain("rust");
  });
});

// ---- Ruby ----

describe("Ruby detection", () => {
  it("detects Gemfile (Ruby)", async () => {
    setExistingFiles(["Gemfile"]);
    setFileContent({ "Gemfile": 'source "https://rubygems.org"\n' });

    const result = await detectProject();
    expect(result.techs).toContain("Ruby");
    expect(result.skillTags).toContain("ruby");
  });

  it("detects Rails from Gemfile", async () => {
    setExistingFiles(["Gemfile"]);
    setFileContent({ "Gemfile": 'gem "rails", "~> 7.0"\n' });

    const result = await detectProject();
    expect(result.techs).toContain("Rails");
  });
});

// ---- Java / Kotlin ----

describe("Java/Kotlin detection", () => {
  it("detects pom.xml", async () => {
    setExistingFiles(["pom.xml"]);

    const result = await detectProject();
    expect(result.techs).toContain("Java/Kotlin");
    expect(result.skillTags).toContain("java");
    expect(result.skillTags).toContain("kotlin");
  });

  it("detects build.gradle", async () => {
    setExistingFiles(["build.gradle"]);

    const result = await detectProject();
    expect(result.techs).toContain("Java/Kotlin");
  });

  it("detects build.gradle.kts", async () => {
    setExistingFiles(["build.gradle.kts"]);

    const result = await detectProject();
    expect(result.techs).toContain("Java/Kotlin");
  });
});

// ---- iOS ----

describe("iOS detection", () => {
  it("detects Podfile", async () => {
    setExistingFiles(["Podfile"]);

    const result = await detectProject();
    expect(result.techs).toContain("iOS");
    expect(result.skillCats).toContain("mobile");
    expect(result.skillTags).toContain("ios");
    expect(result.skillTags).toContain("swift");
  });

  it("detects .xcodeproj via readdir glob", async () => {
    setDirEntries(["MyApp.xcodeproj", "README.md"]);

    const result = await detectProject();
    expect(result.techs).toContain("iOS");
    expect(result.skillTags).toContain("ios");
  });
});

// ---- Flutter ----

describe("Flutter detection", () => {
  it("detects pubspec.yaml", async () => {
    setExistingFiles(["pubspec.yaml"]);

    const result = await detectProject();
    expect(result.techs).toContain("Flutter");
    expect(result.skillCats).toContain("mobile");
    expect(result.skillTags).toContain("flutter");
  });
});

// ---- C# / .NET ----

describe("C#/.NET detection", () => {
  it("detects .csproj via readdir glob", async () => {
    setDirEntries(["MyApp.csproj", "README.md"]);

    const result = await detectProject();
    expect(result.techs).toContain("C#/.NET");
    expect(result.skillTags).toContain("csharp");
  });
});

// ---- PHP ----

describe("PHP detection", () => {
  it("detects composer.json", async () => {
    setExistingFiles(["composer.json"]);
    setFileContent({ "composer.json": '{ "require": {} }' });

    const result = await detectProject();
    expect(result.techs).toContain("PHP");
    expect(result.skillTags).toContain("php");
  });

  it("detects Laravel from composer.json", async () => {
    setExistingFiles(["composer.json"]);
    setFileContent({
      "composer.json": JSON.stringify({
        require: { "laravel/framework": "^10.0" },
      }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Laravel");
  });
});

// ---- Docker ----

describe("Docker detection", () => {
  it("detects Dockerfile", async () => {
    setExistingFiles(["Dockerfile"]);

    const result = await detectProject();
    expect(result.techs).toContain("Docker");
    expect(result.skillCats).toContain("devops");
    expect(result.skillTags).toContain("devops");
  });

  it("detects docker-compose.yml", async () => {
    setExistingFiles(["docker-compose.yml"]);

    const result = await detectProject();
    expect(result.techs).toContain("Docker");
  });

  it("detects compose.yaml", async () => {
    setExistingFiles(["compose.yaml"]);

    const result = await detectProject();
    expect(result.techs).toContain("Docker");
  });
});

// ---- Kubernetes ----

describe("Kubernetes detection", () => {
  it("detects k8s directory", async () => {
    setExistingFiles(["k8s"]);

    const result = await detectProject();
    expect(result.techs).toContain("Kubernetes");
    expect(result.skillCats).toContain("devops");
  });
});

// ---- Terraform ----

describe("Terraform detection", () => {
  it("detects .tf files via readdir glob", async () => {
    setDirEntries(["main.tf", "variables.tf"]);

    const result = await detectProject();
    expect(result.techs).toContain("Terraform");
    expect(result.skillCats).toContain("devops");
  });

  it("detects terraform directory", async () => {
    setExistingFiles(["terraform"]);

    const result = await detectProject();
    expect(result.techs).toContain("Terraform");
  });
});

// ---- CI/CD ----

describe("CI/CD detection", () => {
  it("detects .github/workflows", async () => {
    setExistingFiles([".github/workflows"]);

    const result = await detectProject();
    expect(result.techs).toContain("CI/CD");
    expect(result.skillCats).toContain("devops");
  });

  it("detects .gitlab-ci.yml", async () => {
    setExistingFiles([".gitlab-ci.yml"]);

    const result = await detectProject();
    expect(result.techs).toContain("CI/CD");
  });

  it("detects Jenkinsfile", async () => {
    setExistingFiles(["Jenkinsfile"]);

    const result = await detectProject();
    expect(result.techs).toContain("CI/CD");
  });
});

// ---- Linting ----

describe("Linting detection", () => {
  it("detects eslint config", async () => {
    setExistingFiles([".eslintrc.json"]);

    const result = await detectProject();
    expect(result.techs).toContain("Linting");
    expect(result.skillCats).toContain("core");
  });

  it("detects biome.json", async () => {
    setExistingFiles(["biome.json"]);

    const result = await detectProject();
    expect(result.techs).toContain("Linting");
  });

  it("detects prettier config", async () => {
    setExistingFiles([".prettierrc"]);

    const result = await detectProject();
    expect(result.techs).toContain("Linting");
  });
});

// ---- Blockchain (hardhat/foundry) ----

describe("Blockchain detection", () => {
  it("detects hardhat.config.ts", async () => {
    setExistingFiles(["hardhat.config.ts"]);

    const result = await detectProject();
    expect(result.techs).toContain("Blockchain");
    expect(result.agentCats).toContain("specialized");
    expect(result.agentTags).toContain("blockchain");
    expect(result.agentTags).toContain("solidity");
  });

  it("detects foundry.toml", async () => {
    setExistingFiles(["foundry.toml"]);

    const result = await detectProject();
    expect(result.techs).toContain("Blockchain");
  });
});

// ---- Database/ORM (package.json) ----

describe("Database/ORM detection (Node.js)", () => {
  it("detects prisma → data-ai agent", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "prisma": "^5.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Database/ORM");
    expect(result.agentCats).toContain("data-ai");
    expect(result.agentTags).toContain("database");
    expect(result.agentTags).toContain("migrations");
    expect(result.agentTags).toContain("data");
  });

  it("detects mongoose → data-ai agent", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "mongoose": "^8.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Database/ORM");
    expect(result.agentCats).toContain("data-ai");
  });
});

// ---- Auth/Security (package.json) ----

describe("Auth/Security detection (Node.js)", () => {
  it("detects passport → security skill", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "passport": "^0.7.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Auth/Security");
    expect(result.skillCats).toContain("security");
    expect(result.agentTags).toContain("security");
  });

  it("detects next-auth → security skill", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "next-auth": "^4.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Auth/Security");
    expect(result.skillCats).toContain("security");
  });
});

// ---- Monitoring/Observability ----

describe("Monitoring detection (Node.js)", () => {
  it("detects @sentry/node → operations agent", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "@sentry/node": "^7.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Monitoring");
    expect(result.agentCats).toContain("operations");
    expect(result.agentTags).toContain("monitoring");
    expect(result.agentTags).toContain("incident-response");
    expect(result.agentTags).toContain("performance");
  });

  it("detects winston → operations agent", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "winston": "^3.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Monitoring");
    expect(result.agentCats).toContain("operations");
  });
});

// ---- Analytics/Reporting ----

describe("Analytics detection (Node.js)", () => {
  it("detects mixpanel → business agent", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "mixpanel": "^0.18.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Analytics");
    expect(result.agentCats).toContain("business");
    expect(result.agentTags).toContain("analytics");
    expect(result.agentTags).toContain("dashboards");
    expect(result.agentTags).toContain("reporting");
  });
});

// ---- Design System/UI ----

describe("Design System detection (Node.js)", () => {
  it("detects tailwindcss → design agent", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ devDependencies: { "tailwindcss": "^3.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Design System");
    expect(result.agentCats).toContain("design");
    expect(result.agentTags).toContain("design");
    expect(result.agentTags).toContain("ui");
  });

  it("detects @mui/material → design agent", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "@mui/material": "^5.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("Design System");
    expect(result.agentCats).toContain("design");
  });
});

// ---- CMS/Content ----

describe("CMS detection (Node.js)", () => {
  it("detects contentful → marketing agent", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ dependencies: { "contentful": "^10.0.0" } }),
    });

    const result = await detectProject();
    expect(result.techs).toContain("CMS");
    expect(result.agentCats).toContain("marketing");
    expect(result.agentTags).toContain("content");
    expect(result.agentTags).toContain("seo");
  });
});

// ---- Testing/Quality ----

describe("Testing/Quality detection (Node.js)", () => {
  it("detects @testing-library → quality tags", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ devDependencies: { "@testing-library/react": "^14.0.0" } }),
    });

    const result = await detectProject();
    expect(result.agentTags).toContain("quality");
    expect(result.agentTags).toContain("validation");
  });

  it("detects playwright → quality tags", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({ devDependencies: { "playwright": "^1.40.0" } }),
    });

    const result = await detectProject();
    expect(result.agentTags).toContain("quality");
  });
});

// ---- Python new agent patterns ----

describe("Python agent patterns", () => {
  it("detects sqlalchemy → data-ai agent", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "sqlalchemy\nflask\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Database/ORM");
    expect(result.agentCats).toContain("data-ai");
    expect(result.agentTags).toContain("database");
  });

  it("detects authlib → security skill", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "authlib\nfastapi\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Auth/Security");
    expect(result.skillCats).toContain("security");
    expect(result.agentTags).toContain("security");
  });

  it("detects sentry-sdk → operations agent", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "sentry-sdk\nflask\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Monitoring");
    expect(result.agentCats).toContain("operations");
  });

  it("detects plotly → business agent", async () => {
    setExistingFiles(["requirements.txt"]);
    setFileContent({ "requirements.txt": "plotly\npandas\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Analytics");
    expect(result.agentCats).toContain("business");
    expect(result.agentTags).toContain("analytics");
  });
});

// ---- Go agent patterns ----

describe("Go agent patterns", () => {
  it("detects gorm.io → data-ai agent", async () => {
    setExistingFiles(["go.mod"]);
    setFileContent({ "go.mod": "module myapp\nrequire gorm.io/gorm v1.25.0\n" });

    const result = await detectProject();
    expect(result.techs).toContain("Database/ORM");
    expect(result.agentCats).toContain("data-ai");
    expect(result.agentTags).toContain("database");
  });
});

// ---- Rust agent patterns ----

describe("Rust agent patterns", () => {
  it("detects diesel → data-ai agent", async () => {
    setExistingFiles(["Cargo.toml"]);
    setFileContent({ "Cargo.toml": '[dependencies]\ndiesel = "2.1"\n' });

    const result = await detectProject();
    expect(result.techs).toContain("Database/ORM");
    expect(result.agentCats).toContain("data-ai");
    expect(result.agentTags).toContain("database");
  });
});

// ---- Monitoring infra files ----

describe("Monitoring infra detection", () => {
  it("detects prometheus.yml → operations agent", async () => {
    setExistingFiles(["prometheus.yml"]);

    const result = await detectProject();
    expect(result.techs).toContain("Monitoring");
    expect(result.agentCats).toContain("operations");
    expect(result.agentTags).toContain("monitoring");
  });

  it("detects grafana/ → operations agent", async () => {
    setExistingFiles(["grafana"]);

    const result = await detectProject();
    expect(result.techs).toContain("Monitoring");
    expect(result.agentCats).toContain("operations");
  });
});

// ---- Archetype detection ----

describe("archetype detection", () => {
  it("detects fullstack-web archetype (React + Express)", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "react": "^18.0.0", "express": "^4.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.archetypes).toContain("fullstack-web");
  });

  it("detects api-backend archetype (Express only, no frontend)", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "express": "^4.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.archetypes).toContain("api-backend");
    expect(result.archetypes).not.toContain("fullstack-web");
  });

  it("detects mobile-app archetype", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "react-native": "^0.72.0", "react": "^18.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.archetypes).toContain("mobile-app");
  });

  it("detects devops-infra archetype (Docker + CI/CD)", async () => {
    setExistingFiles(["Dockerfile", ".github/workflows"]);

    const result = await detectProject();
    expect(result.archetypes).toContain("devops-infra");
  });

  it("detects e-commerce archetype (frontend + payments)", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "react": "^18.0.0", "stripe": "^14.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.archetypes).toContain("e-commerce");
  });

  it("returns no archetypes for empty project", async () => {
    const result = await detectProject();
    expect(result.archetypes).toBeUndefined();
  });
});

// ---- Archetype enrichment ----

describe("archetype enrichment", () => {
  it("fullstack-web adds design agent category and tags", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "react": "^18.0.0", "express": "^4.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.archetypes).toContain("fullstack-web");
    expect(result.agentCats).toContain("design");
    expect(result.agentTags).toContain("ui");
    expect(result.agentTags).toContain("ux");
    expect(result.agentTags).toContain("responsive");
  });

  it("devops-infra adds operations agent category", async () => {
    setExistingFiles(["Dockerfile", ".github/workflows"]);

    const result = await detectProject();
    expect(result.archetypes).toContain("devops-infra");
    expect(result.agentCats).toContain("operations");
    expect(result.agentTags).toContain("monitoring");
    expect(result.agentTags).toContain("incident-response");
  });

  it("e-commerce adds specialized and business agent categories", async () => {
    setExistingFiles(["package.json"]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "react": "^18.0.0", "stripe": "^14.0.0" },
      }),
    });

    const result = await detectProject();
    expect(result.archetypes).toContain("e-commerce");
    expect(result.agentCats).toContain("specialized");
    expect(result.agentCats).toContain("business");
    expect(result.agentTags).toContain("payments");
    expect(result.agentTags).toContain("analytics");
  });
});

// ---- Multi-tech project (uniquePush dedup) ----

describe("multi-tech deduplication", () => {
  it("deduplicates techs and categories across multiple detections", async () => {
    setExistingFiles([
      "package.json",
      "tsconfig.json",
      "Dockerfile",
      ".github/workflows",
    ]);
    setFileContent({
      "package.json": JSON.stringify({
        dependencies: { "react": "^18.0.0", "express": "^4.0.0" },
      }),
    });

    const result = await detectProject();

    // Check no duplicates in any array
    expect(result.techs).toEqual([...new Set(result.techs)]);
    expect(result.skillCats).toEqual([...new Set(result.skillCats)]);
    expect(result.skillTags).toEqual([...new Set(result.skillTags)]);

    // Verify expected techs detected
    expect(result.techs).toContain("Node.js");
    expect(result.techs).toContain("React");
    expect(result.techs).toContain("Express");
    expect(result.techs).toContain("TypeScript");
    expect(result.techs).toContain("Docker");
    expect(result.techs).toContain("CI/CD");
  });
});
