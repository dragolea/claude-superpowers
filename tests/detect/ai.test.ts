import { describe, it, expect } from "vitest";
import {
  VALID_SKILL_TAGS,
  VALID_ARCHETYPES,
} from "../../src/detect/ai.js";

// ---- Validation sets ----

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

  it("contains ai tag", () => {
    expect(VALID_SKILL_TAGS.has("ai")).toBe(true);
  });

  it("contains web3 tag", () => {
    expect(VALID_SKILL_TAGS.has("web3")).toBe(true);
  });

  it("does not contain invalid tags", () => {
    expect(VALID_SKILL_TAGS.has("nonexistent")).toBe(false);
    expect(VALID_SKILL_TAGS.has("")).toBe(false);
  });
});

describe("VALID_ARCHETYPES", () => {
  it("contains expected archetypes", () => {
    expect(VALID_ARCHETYPES.has("fullstack-web")).toBe(true);
    expect(VALID_ARCHETYPES.has("api-backend")).toBe(true);
    expect(VALID_ARCHETYPES.has("mobile-app")).toBe(true);
    expect(VALID_ARCHETYPES.has("data-pipeline")).toBe(true);
    expect(VALID_ARCHETYPES.has("ml-platform")).toBe(true);
    expect(VALID_ARCHETYPES.has("devops-infra")).toBe(true);
    expect(VALID_ARCHETYPES.has("cli-tool")).toBe(true);
    expect(VALID_ARCHETYPES.has("e-commerce")).toBe(true);
    expect(VALID_ARCHETYPES.has("saas")).toBe(true);
    expect(VALID_ARCHETYPES.has("monorepo")).toBe(true);
    expect(VALID_ARCHETYPES.has("library")).toBe(true);
    expect(VALID_ARCHETYPES.has("microservices")).toBe(true);
  });

  it("does not contain invalid archetypes", () => {
    expect(VALID_ARCHETYPES.has("nonexistent")).toBe(false);
    expect(VALID_ARCHETYPES.has("")).toBe(false);
    expect(VALID_ARCHETYPES.has("web")).toBe(false);
  });
});

// ---- Filtering simulation ----

describe("validation filtering", () => {
  it("filters invalid skill tags", () => {
    const raw = ["typescript", "react", "invalid-tag", "universal"];
    const filtered = raw.filter((t) => VALID_SKILL_TAGS.has(t));
    expect(filtered).toEqual(["typescript", "react", "universal"]);
  });

  it("filters invalid archetypes", () => {
    const raw = ["fullstack-web", "invalid", "api-backend", "fake"];
    const filtered = raw.filter((a) => VALID_ARCHETYPES.has(a));
    expect(filtered).toEqual(["fullstack-web", "api-backend"]);
  });
});
