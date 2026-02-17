/**
 * Discover skills via the skills.sh search API.
 *
 * Provides deduplication across search tags and sources,
 * relevance ranking, and default skill injection (obra/superpowers).
 */

import { searchSkillsAPI } from "./search-api.js";
import type { DiscoveredSkill } from "../types.js";

const DEFAULT_SOURCE = "obra/superpowers";

/**
 * Fetch default (obra/superpowers) skills from the skills.sh API.
 * Searches for "obra/superpowers" and filters to that source.
 */
export async function fetchDefaultSkills(): Promise<DiscoveredSkill[]> {
  const results = await searchSkillsAPI("obra/superpowers");

  return results
    .filter((r) => r.source === DEFAULT_SOURCE)
    .map((r) => ({
      name: r.name,
      description: "",
      installName: r.source,
      sourceUrl: `https://skills.sh/${r.slug}`,
      relevance: 0,
      matchedTags: [],
      installs: r.installs,
      isDefault: true,
    }));
}

/**
 * Search the skills.sh API for each tag, deduplicate results by skill name
 * (keeping the variant with the most installs), and rank by relevance.
 *
 * @param tags - Array of search terms (e.g., ["react", "typescript", "nextjs"])
 * @returns Deduplicated skills sorted by relevance (highest first), then installs, then name
 */
export async function discoverSkillsForTags(
  tags: string[],
): Promise<DiscoveredSkill[]> {
  if (tags.length === 0) return [];

  const skillMap = new Map<string, DiscoveredSkill>();

  for (const tag of tags) {
    const results = await searchSkillsAPI(tag);

    for (const result of results) {
      const key = result.name;
      const existing = skillMap.get(key);

      if (existing) {
        // Bump relevance for new tag match
        if (!existing.matchedTags.includes(tag)) {
          existing.relevance += 1;
          existing.matchedTags.push(tag);
        }
        // Keep the higher-installs variant's source info
        if (result.installs > existing.installs) {
          existing.installName = result.source;
          existing.sourceUrl = `https://skills.sh/${result.slug}`;
          existing.installs = result.installs;
        }
      } else {
        skillMap.set(key, {
          name: result.name,
          description: "",
          installName: result.source,
          sourceUrl: `https://skills.sh/${result.slug}`,
          relevance: 1,
          matchedTags: [tag],
          installs: result.installs,
          isDefault: false,
        });
      }
    }
  }

  return Array.from(skillMap.values()).sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    if (b.installs !== a.installs) return b.installs - a.installs;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Discover skills: fetch defaults (obra/superpowers) + tag-based results,
 * merge and deduplicate by name.
 *
 * @param tags - Array of search terms from project detection
 * @returns Merged, deduped skills with defaults first
 */
export async function discoverSkills(
  tags: string[],
): Promise<DiscoveredSkill[]> {
  const [defaults, tagResults] = await Promise.all([
    fetchDefaultSkills(),
    discoverSkillsForTags(tags),
  ]);

  // Merge: start with defaults, then add tag results
  const merged = new Map<string, DiscoveredSkill>();

  for (const skill of defaults) {
    merged.set(skill.name, skill);
  }

  for (const skill of tagResults) {
    const existing = merged.get(skill.name);
    if (existing) {
      // Default exists — merge tag info into it
      existing.relevance += skill.relevance;
      for (const tag of skill.matchedTags) {
        if (!existing.matchedTags.includes(tag)) {
          existing.matchedTags.push(tag);
        }
      }
      if (skill.installs > existing.installs) {
        existing.installs = skill.installs;
      }
    } else {
      merged.set(skill.name, skill);
    }
  }

  // Sort: defaults first, then by relevance, then installs
  return Array.from(merged.values()).sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    if (b.installs !== a.installs) return b.installs - a.installs;
    return a.name.localeCompare(b.name);
  });
}
