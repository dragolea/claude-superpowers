/**
 * Skills bridge — public API surface.
 *
 * Re-exports the discover, install, and installed modules so
 * consumers can import from a single entry point:
 *
 *   import { discoverSkillsForTags, installDiscoveredSkill } from "./skills-bridge/index.js";
 */

export { discoverSkillsForTags, fetchDefaultSkills, discoverSkills } from "./discover.js";
export {
  installDiscoveredSkill,
  installDiscoveredSkills,
} from "./install.js";
export type { InstallResult, BulkInstallResult } from "./install.js";
export { getInstalledSkillMetadata } from "./installed.js";
