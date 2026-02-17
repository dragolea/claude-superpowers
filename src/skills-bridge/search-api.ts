/**
 * Vendored skills.sh search API client.
 *
 * Originally from the `skills` package (`skills/src/find.ts`).
 * Inlined here to avoid depending on the full package for a single fetch call.
 */

const SKILLS_API_BASE = process.env.SKILLS_API_URL || "https://skills.sh";

export interface SearchResult {
  name: string;
  slug: string;
  source: string;
  installs: number;
}

/**
 * Search the skills.sh API for skills matching the given query.
 *
 * @param query - Search term (e.g., "react", "typescript")
 * @returns Array of matching skills, or empty array on error
 */
export async function searchSkillsAPI(
  query: string,
  limit = 10,
): Promise<SearchResult[]> {
  try {
    const url = `${SKILLS_API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);

    if (!res.ok) return [];

    const data = (await res.json()) as {
      skills: Array<{
        id: string;
        name: string;
        installs: number;
        source: string;
      }>;
    };

    return data.skills.map((skill) => ({
      name: skill.name,
      slug: skill.id,
      source: skill.source || "",
      installs: skill.installs,
    }));
  } catch {
    return [];
  }
}
