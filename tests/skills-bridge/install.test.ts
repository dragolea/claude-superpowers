import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DiscoveredSkill } from "../../src/types.js";

// Mock node:child_process — execFile is the only export we use (via promisify)
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { execFile } from "node:child_process";
import {
  installDiscoveredSkill,
  installDiscoveredSkills,
} from "../../src/skills-bridge/install.js";

const mockExecFile = vi.mocked(execFile);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Helpers ----

function makeSkill(overrides: Partial<DiscoveredSkill> = {}): DiscoveredSkill {
  return {
    name: "test-skill",
    description: "",
    installName: "org/repo",
    sourceUrl: "https://skills.sh/org-repo-test-skill",
    relevance: 1,
    matchedTags: ["tag"],
    installs: 100,
    isDefault: false,
    ...overrides,
  };
}

/**
 * Make the mocked execFile resolve successfully.
 * execFile is used via `promisify`, so the mock needs to call
 * the callback (last argument) with (null, stdout, stderr).
 */
function mockExecSuccess(): void {
  mockExecFile.mockImplementation(
    (_cmd: any, _args: any, _opts: any, cb?: any) => {
      // promisify(execFile) passes a callback as the last argument
      const callback = cb ?? _opts;
      if (typeof callback === "function") {
        callback(null, "ok", "");
      }
      return {} as any;
    },
  );
}

/**
 * Make the mocked execFile reject with an error.
 */
function mockExecError(message: string): void {
  mockExecFile.mockImplementation(
    (_cmd: any, _args: any, _opts: any, cb?: any) => {
      const callback = cb ?? _opts;
      if (typeof callback === "function") {
        callback(new Error(message));
      }
      return {} as any;
    },
  );
}

// ---- Tests ----

describe("installDiscoveredSkill", () => {
  it("passes correct args for project scope", async () => {
    mockExecSuccess();

    const skill = makeSkill({
      name: "frontend-design",
      installName: "vercel-labs/agent-skills",
    });

    const result = await installDiscoveredSkill(skill, "project", "/app");

    expect(result).toEqual({ success: true });
    expect(mockExecFile).toHaveBeenCalledOnce();

    const [cmd, args, opts] = mockExecFile.mock.calls[0]!;
    expect(cmd).toBe("npx");
    expect(args).toEqual([
      "skills",
      "add",
      "vercel-labs/agent-skills",
      "--skill",
      "frontend-design",
      "-a",
      "claude-code",
      "-y",
    ]);
    expect(opts).toEqual(
      expect.objectContaining({ cwd: "/app", timeout: 60_000 }),
    );
  });

  it("passes -g flag for user scope", async () => {
    mockExecSuccess();

    const skill = makeSkill({ name: "ts-pro", installName: "acme/ts" });

    await installDiscoveredSkill(skill, "user", "/app");

    const [, args] = mockExecFile.mock.calls[0]!;
    expect(args).toContain("-g");
    // -g should be the last argument
    expect((args as string[]).at(-1)).toBe("-g");
  });

  it("does not pass -g flag for project scope", async () => {
    mockExecSuccess();

    await installDiscoveredSkill(makeSkill(), "project", "/app");

    const [, args] = mockExecFile.mock.calls[0]!;
    expect(args).not.toContain("-g");
  });

  it("returns error on failure", async () => {
    mockExecError("Command failed: exit code 1");

    const result = await installDiscoveredSkill(makeSkill(), "project", "/app");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Command failed");
  });
});

describe("installDiscoveredSkills", () => {
  it("returns correct counts for mixed success/failure", async () => {
    let callIndex = 0;
    mockExecFile.mockImplementation(
      (_cmd: any, _args: any, _opts: any, cb?: any) => {
        const callback = cb ?? _opts;
        if (typeof callback === "function") {
          if (callIndex === 1) {
            // Second call fails
            callback(new Error("install failed"));
          } else {
            callback(null, "ok", "");
          }
        }
        callIndex++;
        return {} as any;
      },
    );

    const skills = [
      makeSkill({ name: "skill-a", installName: "org/a" }),
      makeSkill({ name: "skill-b", installName: "org/b" }),
      makeSkill({ name: "skill-c", installName: "org/c" }),
    ];

    const result = await installDiscoveredSkills(skills, "project", "/app");

    expect(result.total).toBe(3);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.results).toHaveLength(3);
    expect(result.results[0]).toEqual({
      name: "skill-a",
      result: { success: true },
    });
    expect(result.results[1]!.result.success).toBe(false);
    expect(result.results[2]).toEqual({
      name: "skill-c",
      result: { success: true },
    });
  });

  it("returns zeros for empty skills array", async () => {
    const result = await installDiscoveredSkills([], "project", "/app");

    expect(result).toEqual({
      total: 0,
      success: 0,
      failed: 0,
      results: [],
    });
    expect(mockExecFile).not.toHaveBeenCalled();
  });
});
