/**
 * Shared types for the superpower-installer.
 * Replaces the old registry/types.ts.
 */

export type InstallScope = "project" | "user" | "local";

/**
 * A skill discovered via the skills.sh search API.
 */
export interface DiscoveredSkill {
  /** Skill name (e.g., "frontend-design") */
  name: string;
  /** Short description */
  description: string;
  /** Install identifier (e.g., "vercel-labs/agent-skills") */
  installName: string;
  /** Source URL for the skill */
  sourceUrl: string;
  /** Number of detection tags that matched this skill */
  relevance: number;
  /** The tags that matched */
  matchedTags: string[];
  /** Install count from skills.sh API — used for dedup ranking */
  installs: number;
  /** Whether this is a default/recommended skill (obra/superpowers) */
  isDefault: boolean;
}

/**
 * Metadata extracted from an installed SKILL.md file.
 * Used for CLAUDE.md generation.
 */
export interface SkillMetadata {
  /** Skill name from frontmatter */
  name: string;
  /** Skill description from frontmatter */
  description: string;
  /** Path to the SKILL.md file */
  path: string;
}
