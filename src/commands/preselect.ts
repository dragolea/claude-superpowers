import type { Skill, Plugin } from "../registry/types.js";

/**
 * Derive skill and agent tags from a wizard stack selection label.
 */
export function deriveTagsFromStack(stackLabel: string): {
  skillTags: string[];
  agentTags: string[];
} {
  const map: Record<string, { skillTags: string[]; agentTags: string[] }> = {
    expo: {
      skillTags: ["typescript", "expo", "react-native"],
      agentTags: ["typescript", "expo", "react-native"],
    },
    "react-native": {
      skillTags: ["typescript", "react-native"],
      agentTags: ["typescript", "react-native"],
    },
    flutter: { skillTags: ["flutter"], agentTags: ["flutter"] },
    ios: { skillTags: ["swift", "ios"], agentTags: ["swift", "ios"] },
    android: {
      skillTags: ["kotlin", "java", "android"],
      agentTags: ["kotlin", "java", "android"],
    },
    react: {
      skillTags: ["typescript", "react"],
      agentTags: ["typescript", "react"],
    },
    nextjs: {
      skillTags: ["typescript", "nextjs", "react"],
      agentTags: ["typescript", "nextjs", "react"],
    },
    vue: { skillTags: ["typescript", "vue"], agentTags: ["typescript", "vue"] },
    angular: {
      skillTags: ["typescript", "angular"],
      agentTags: ["typescript", "angular"],
    },
    nodejs: {
      skillTags: ["typescript", "nodejs"],
      agentTags: ["typescript", "nodejs"],
    },
    python: { skillTags: ["python"], agentTags: ["python"] },
    go: { skillTags: ["go"], agentTags: ["go"] },
    rust: { skillTags: ["rust"], agentTags: ["rust"] },
  };
  return map[stackLabel] ?? { skillTags: [], agentTags: [] };
}

/**
 * Determine whether a skill should be pre-selected based on detected tags.
 *
 * - No detected tags → select all (nothing to filter on)
 * - Pure universal skill (no specific tags) → always select
 * - Otherwise → select if any specific tag matches a detected tag
 */
export function shouldPreselectSkill(
  skill: Skill,
  detectedTags: string[],
): boolean {
  if (detectedTags.length === 0) return true; // No tags → select all

  const specificTags = skill.tags.filter((t) => t !== "universal");
  if (specificTags.length === 0) return true; // Pure universal → always select

  return specificTags.some((t) => detectedTags.includes(t));
}

/**
 * Determine whether an agent plugin should be pre-selected based on detected tags.
 *
 * - No detected tags → select NONE (not all)
 * - Plugin with no tags → skip
 * - Otherwise → select if any plugin tag matches a detected tag
 */
export function shouldPreselectPlugin(
  plugin: Plugin,
  detectedTags: string[],
): boolean {
  if (detectedTags.length === 0) return false;
  if (plugin.tags.length === 0) return false;
  return plugin.tags.some((t) => detectedTags.includes(t));
}
