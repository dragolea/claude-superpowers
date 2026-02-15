import type { Skill, SkillsRegistry, SourcesRegistry } from "./types.js";

export function getSkillsByCategories(
  registry: SkillsRegistry,
  categories: string[],
): Skill[] {
  return registry.skills.filter((s) => categories.includes(s.category));
}

export function getSkillByName(
  registry: SkillsRegistry,
  name: string,
): Skill | undefined {
  return registry.skills.find((s) => s.name === name);
}

export function getAllCategories(registry: SkillsRegistry): string[] {
  return Object.keys(registry.categories);
}

export function getCategoryName(
  registry: SkillsRegistry,
  catId: string,
): string {
  return registry.categories[catId]?.name ?? catId;
}

export function getCategoryDesc(
  registry: SkillsRegistry,
  catId: string,
): string {
  return registry.categories[catId]?.description ?? "";
}

export function isCategoryRecommended(
  registry: SkillsRegistry,
  catId: string,
): boolean {
  return registry.categories[catId]?.recommended ?? false;
}

export function getPresetCategories(
  registry: SkillsRegistry,
  presetName: string,
): string[] | null {
  return registry.presets[presetName]?.categories ?? null;
}

export function getAllPresetNames(registry: SkillsRegistry): string[] {
  return Object.keys(registry.presets);
}

export function getSourceUrl(
  sources: SourcesRegistry,
  sourceId: string,
): string {
  return sources.sources[sourceId]?.base_url ?? "";
}
