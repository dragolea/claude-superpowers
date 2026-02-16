import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DetectionResult } from "./patterns.js";

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
import { detectProject } from "./patterns.js";

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
