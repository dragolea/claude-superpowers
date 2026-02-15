import type { Plugin, AgentsRegistry } from "./types.js";

export function getPluginsByCategories(
  registry: AgentsRegistry,
  categories: string[],
): Plugin[] {
  const seen = new Set<string>();
  const result: Plugin[] = [];
  for (const p of registry.plugins) {
    if (categories.includes(p.category) && !seen.has(p.name)) {
      seen.add(p.name);
      result.push(p);
    }
  }
  return result;
}

export function getPluginByName(
  registry: AgentsRegistry,
  name: string,
): Plugin | undefined {
  return registry.plugins.find((p) => p.name === name);
}

export function getAllPluginCategories(registry: AgentsRegistry): string[] {
  return Object.keys(registry.categories);
}

export function getPluginCategoryName(
  registry: AgentsRegistry,
  catId: string,
): string {
  return registry.categories[catId]?.name ?? catId;
}

export function getPluginCategoryDesc(
  registry: AgentsRegistry,
  catId: string,
): string {
  return registry.categories[catId]?.description ?? "";
}

export function isPluginCategoryRecommended(
  registry: AgentsRegistry,
  catId: string,
): boolean {
  return registry.categories[catId]?.recommended ?? false;
}

export function getPluginPresetCategories(
  registry: AgentsRegistry,
  presetName: string,
): string[] | null {
  return registry.presets[presetName]?.categories ?? null;
}

export function getAllPluginPresetNames(registry: AgentsRegistry): string[] {
  return Object.keys(registry.presets);
}

export function getMarketplaceRepo(
  registry: AgentsRegistry,
  marketplaceId: string,
): string {
  return registry.marketplaces[marketplaceId]?.repo ?? "";
}

export function getAllMarketplaceIds(registry: AgentsRegistry): string[] {
  return Object.keys(registry.marketplaces);
}
