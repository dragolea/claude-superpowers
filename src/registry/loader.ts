import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillsRegistry, SourcesRegistry, AgentsRegistry } from "./types.js";

const REGISTRY_URL =
  "https://raw.githubusercontent.com/dragolea/claude-superpowers/main/registry";

/**
 * Resolve the local registry directory.
 * Works both from source (src/) and from the bundled dist/.
 */
function findRegistryDir(): string | null {
  // When running from repo: check relative to package root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Try: repo root / registry
  const candidates = [
    join(__dirname, "..", "..", "registry"), // from dist/bin.js
    join(__dirname, "..", "registry"), // from src/registry/loader.ts (dev)
    join(process.cwd(), "registry"), // from cwd
  ];

  for (const dir of candidates) {
    if (existsSync(join(dir, "skills.json"))) {
      return dir;
    }
  }
  return null;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function loadLocalOrRemote<T>(filename: string): Promise<T> {
  const localDir = findRegistryDir();
  if (localDir) {
    const content = await readFile(join(localDir, filename), "utf-8");
    return JSON.parse(content) as T;
  }
  return fetchJSON<T>(`${REGISTRY_URL}/${filename}`);
}

let _skillsCache: SkillsRegistry | null = null;
let _sourcesCache: SourcesRegistry | null = null;
let _agentsCache: AgentsRegistry | null = null;

export async function loadSkillsRegistry(): Promise<SkillsRegistry> {
  if (!_skillsCache) {
    _skillsCache = await loadLocalOrRemote<SkillsRegistry>("skills.json");
  }
  return _skillsCache;
}

export async function loadSourcesRegistry(): Promise<SourcesRegistry> {
  if (!_sourcesCache) {
    _sourcesCache = await loadLocalOrRemote<SourcesRegistry>("sources.json");
  }
  return _sourcesCache;
}

export async function loadAgentsRegistry(): Promise<AgentsRegistry> {
  if (!_agentsCache) {
    _agentsCache = await loadLocalOrRemote<AgentsRegistry>("agents.json");
  }
  return _agentsCache;
}
