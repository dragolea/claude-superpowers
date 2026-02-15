// ---- Skills Registry ----

export interface SkillCategory {
  name: string;
  description: string;
  recommended: boolean;
}

export interface SkillPreset {
  name: string;
  description: string;
  categories: string[];
}

export interface Skill {
  name: string;
  description: string;
  source: string;
  path: string;
  tags: string[];
  category: string;
}

export interface SkillsRegistry {
  version: string;
  categories: Record<string, SkillCategory>;
  presets: Record<string, SkillPreset>;
  skills: Skill[];
}

// ---- Sources Registry ----

export interface Source {
  name: string;
  base_url: string;
  repo_url: string;
  description: string;
}

export interface SourcesRegistry {
  sources: Record<string, Source>;
}

// ---- Agents Registry ----

export interface Marketplace {
  name: string;
  repo: string;
}

export interface AgentCategory {
  name: string;
  description: string;
  recommended: boolean;
}

export interface AgentPreset {
  name: string;
  description: string;
  categories: string[];
}

export interface Plugin {
  name: string;
  marketplace: string;
  description: string;
  agent_count: number;
  tags: string[];
  category: string;
}

export interface AgentsRegistry {
  version: string;
  marketplaces: Record<string, Marketplace>;
  categories: Record<string, AgentCategory>;
  presets: Record<string, AgentPreset>;
  plugins: Plugin[];
}

// ---- Shared ----

export type InstallScope = "project" | "user" | "local";
