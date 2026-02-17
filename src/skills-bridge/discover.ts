/**
 * Discover skills via the skills.sh search API.
 *
 * Wraps `searchSkillsAPI` from the `skills` package, providing
 * deduplication across multiple search tags and relevance ranking.
 */

import { searchSkillsAPI } from "skills/src/find.ts";
import type { DiscoveredSkill } from "../types.js";

/**
 * Search the skills.sh API for each tag, deduplicate results, and
 * rank by how many tags matched (relevance).
 *
 * @param tags - Array of search terms (e.g., ["react", "typescript", "nextjs"])
 * @returns Deduplicated skills sorted by relevance (highest first), then by name
 */
export async function discoverSkillsForTags(
  tags: string[],
): Promise<DiscoveredSkill[]> {
  if (tags.length === 0) return [];

  // Accumulator keyed by "source:name" to deduplicate across tags
  const skillMap = new Map<
    string,
    { skill: DiscoveredSkill; matchCount: number }
  >();

  // Search each tag independently; errors per-tag are swallowed by
  // searchSkillsAPI (it returns [] on failure).
  for (const tag of tags) {
    const results = await searchSkillsAPI(tag);

    for (const result of results) {
      const key = `${result.source}:${result.name}`;
      const existing = skillMap.get(key);

      if (existing) {
        // Skill already seen from a previous tag — bump relevance
        existing.matchCount += 1;
        existing.skill.relevance = existing.matchCount;
        if (!existing.skill.matchedTags.includes(tag)) {
          existing.skill.matchedTags.push(tag);
        }
      } else {
        skillMap.set(key, {
          matchCount: 1,
          skill: {
            name: result.name,
            description: "", // Search API does not return descriptions
            installName: result.source,
            sourceUrl: `https://skills.sh/${result.slug}`,
            relevance: 1,
            matchedTags: [tag],
          },
        });
      }
    }
  }

  // Sort: highest relevance first, then alphabetically by name for stability
  return Array.from(skillMap.values())
    .map((entry) => entry.skill)
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return a.name.localeCompare(b.name);
    });
}
