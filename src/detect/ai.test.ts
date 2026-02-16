import { describe, it, expect } from "vitest";
import {
  VALID_SKILL_CATS,
  VALID_AGENT_CATS,
  VALID_SKILL_TAGS,
  VALID_AGENT_TAGS,
} from "./ai.js";

// ---- Validation sets ----

describe("VALID_SKILL_CATS", () => {
  it("contains expected core categories", () => {
    expect(VALID_SKILL_CATS.has("core")).toBe(true);
    expect(VALID_SKILL_CATS.has("workflow")).toBe(true);
    expect(VALID_SKILL_CATS.has("git")).toBe(true);
    expect(VALID_SKILL_CATS.has("web")).toBe(true);
    expect(VALID_SKILL_CATS.has("mobile")).toBe(true);
    expect(VALID_SKILL_CATS.has("backend")).toBe(true);
    expect(VALID_SKILL_CATS.has("languages")).toBe(true);
    expect(VALID_SKILL_CATS.has("devops")).toBe(true);
    expect(VALID_SKILL_CATS.has("security")).toBe(true);
  });

  it("does not contain invalid categories", () => {
    expect(VALID_SKILL_CATS.has("nonexistent")).toBe(false);
    expect(VALID_SKILL_CATS.has("data-ai")).toBe(false);
    expect(VALID_SKILL_CATS.has("")).toBe(false);
  });
});

describe("VALID_AGENT_CATS", () => {
  it("contains expected agent categories", () => {
    expect(VALID_AGENT_CATS.has("design")).toBe(true);
    expect(VALID_AGENT_CATS.has("data-ai")).toBe(true);
    expect(VALID_AGENT_CATS.has("specialized")).toBe(true);
    expect(VALID_AGENT_CATS.has("business")).toBe(true);
    expect(VALID_AGENT_CATS.has("operations")).toBe(true);
    expect(VALID_AGENT_CATS.has("research")).toBe(true);
    expect(VALID_AGENT_CATS.has("marketing")).toBe(true);
  });

  it("does not contain skill categories", () => {
    expect(VALID_AGENT_CATS.has("core")).toBe(false);
    expect(VALID_AGENT_CATS.has("workflow")).toBe(false);
    expect(VALID_AGENT_CATS.has("web")).toBe(false);
  });
});

describe("VALID_SKILL_TAGS", () => {
  it("contains universal tag", () => {
    expect(VALID_SKILL_TAGS.has("universal")).toBe(true);
  });

  it("contains language tags", () => {
    expect(VALID_SKILL_TAGS.has("typescript")).toBe(true);
    expect(VALID_SKILL_TAGS.has("python")).toBe(true);
    expect(VALID_SKILL_TAGS.has("go")).toBe(true);
    expect(VALID_SKILL_TAGS.has("rust")).toBe(true);
  });

  it("contains framework tags", () => {
    expect(VALID_SKILL_TAGS.has("react")).toBe(true);
    expect(VALID_SKILL_TAGS.has("nextjs")).toBe(true);
    expect(VALID_SKILL_TAGS.has("vue")).toBe(true);
    expect(VALID_SKILL_TAGS.has("angular")).toBe(true);
  });

  it("contains mobile tags", () => {
    expect(VALID_SKILL_TAGS.has("mobile")).toBe(true);
    expect(VALID_SKILL_TAGS.has("react-native")).toBe(true);
    expect(VALID_SKILL_TAGS.has("expo")).toBe(true);
    expect(VALID_SKILL_TAGS.has("flutter")).toBe(true);
    expect(VALID_SKILL_TAGS.has("ios")).toBe(true);
    expect(VALID_SKILL_TAGS.has("swift")).toBe(true);
  });

  it("does not contain invalid tags", () => {
    expect(VALID_SKILL_TAGS.has("nonexistent")).toBe(false);
    expect(VALID_SKILL_TAGS.has("llm")).toBe(false);
  });
});

describe("VALID_AGENT_TAGS", () => {
  it("contains AI/ML tags", () => {
    expect(VALID_AGENT_TAGS.has("llm")).toBe(true);
    expect(VALID_AGENT_TAGS.has("langchain")).toBe(true);
    expect(VALID_AGENT_TAGS.has("rag")).toBe(true);
    expect(VALID_AGENT_TAGS.has("ai")).toBe(true);
    expect(VALID_AGENT_TAGS.has("ml")).toBe(true);
  });

  it("contains blockchain tags", () => {
    expect(VALID_AGENT_TAGS.has("blockchain")).toBe(true);
    expect(VALID_AGENT_TAGS.has("web3")).toBe(true);
    expect(VALID_AGENT_TAGS.has("solidity")).toBe(true);
  });

  it("contains business tags", () => {
    expect(VALID_AGENT_TAGS.has("analytics")).toBe(true);
    expect(VALID_AGENT_TAGS.has("marketing")).toBe(true);
    expect(VALID_AGENT_TAGS.has("seo")).toBe(true);
  });

  it("does not contain skill-only tags", () => {
    expect(VALID_AGENT_TAGS.has("universal")).toBe(false);
  });
});

// ---- Filtering simulation ----

describe("validation filtering", () => {
  it("filters invalid skill categories", () => {
    const raw = ["core", "workflow", "invalid", "web", "fake"];
    const filtered = raw.filter((c) => VALID_SKILL_CATS.has(c));
    expect(filtered).toEqual(["core", "workflow", "web"]);
  });

  it("filters invalid agent categories", () => {
    const raw = ["data-ai", "core", "specialized", "workflow"];
    const filtered = raw.filter((c) => VALID_AGENT_CATS.has(c));
    expect(filtered).toEqual(["data-ai", "specialized"]);
  });

  it("filters invalid skill tags", () => {
    const raw = ["typescript", "react", "invalid-tag", "universal"];
    const filtered = raw.filter((t) => VALID_SKILL_TAGS.has(t));
    expect(filtered).toEqual(["typescript", "react", "universal"]);
  });

  it("filters invalid agent tags", () => {
    const raw = ["llm", "ai", "universal", "blockchain"];
    const filtered = raw.filter((t) => VALID_AGENT_TAGS.has(t));
    expect(filtered).toEqual(["llm", "ai", "blockchain"]);
  });
});
