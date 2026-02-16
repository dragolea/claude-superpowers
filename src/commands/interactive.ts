import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { printBanner } from "../ui/banner.js";
import {
  loadSkillsRegistry,
  loadSourcesRegistry,
  loadAgentsRegistry,
} from "../registry/loader.js";
import {
  getAllCategories,
  getCategoryName,
  getCategoryDesc,
  isCategoryRecommended,
  getSkillsByCategories,
} from "../registry/skills.js";
import {
  getAllPluginCategories,
  getPluginCategoryName,
  getPluginCategoryDesc,
  isPluginCategoryRecommended,
  getPluginsByCategories,
} from "../registry/agents.js";
import { installSkills } from "../install/skills.js";
import {
  installPlugins,
  isClaudeCliAvailable,
  printClaudeCliError,
} from "../install/agents.js";
import { selectMenu } from "../prompts/select.js";
import { checkboxMenu } from "../prompts/checkbox.js";
import { selectScopeMenu, selectAgentScopeMenu } from "./search.js";
import { runDetection } from "./scan.js";
import { deriveTagsFromStack, shouldPreselectSkill, shouldPreselectPlugin } from "./preselect.js";
import type {
  InstallScope,
  SkillsRegistry,
  SourcesRegistry,
  AgentsRegistry,
  Skill,
} from "../registry/types.js";
import type { DetectionResult } from "../detect/patterns.js";

// ---- Skill Wizard ----

async function runSkillWizard(
  skillsRegistry: SkillsRegistry,
  sourcesRegistry: SourcesRegistry,
  scope: InstallScope,
  scopeSetByFlag: boolean,
  detection: DetectionResult | null,
): Promise<void> {
  let step = detection && detection.skillCats.length > 0 ? 3 : 1;
  let useDetection = step === 3;
  let projectLabel = "";
  let stackLabel = "";
  let selectedCategories: string[] = [];
  let skillNames: string[] = [];

  // Merge tags from detection
  const detectedSkillTags = detection?.skillTags.slice() ?? [];

  if (useDetection) {
    console.log(
      theme.dim(
        "  Pre-selecting relevant skill categories. Choose Back to pick manually.",
      ),
    );
  }

  while (true) {
    switch (step) {
      case 1: {
        // Project type
        console.log("");
        const result = await selectMenu(
          "What type of project are you working on?",
          [
            {
              label: "Web application",
              description: "React, Vue, Angular, Next.js, etc.",
              value: "web",
            },
            {
              label: "Mobile app",
              description: "React Native, Flutter, native iOS/Android",
              value: "mobile",
            },
            {
              label: "Backend / API",
              description: "Node.js, Python, Go, Rust, etc.",
              value: "backend",
            },
            {
              label: "CLI tool",
              description: "Command-line applications",
              value: "cli",
            },
            {
              label: "General / All",
              description: "Not project-specific, show everything",
              value: "general",
            },
          ],
        );

        if (!result) {
          process.exit(0);
        }
        projectLabel = result;
        console.log(`  ${theme.dim(`Selected: ${projectLabel}`)}`);
        step = 2;
        break;
      }

      case 2: {
        // Tech stack (contextual)
        stackLabel = "";
        if (projectLabel === "mobile") {
          const result = await selectMenu(
            "What mobile framework?",
            [
              { label: "React Native (Expo)", description: "JavaScript/TypeScript with Expo SDK", value: "expo" },
              { label: "React Native (bare)", description: "JavaScript/TypeScript without Expo", value: "react-native" },
              { label: "Flutter", description: "Dart cross-platform framework", value: "flutter" },
              { label: "Native iOS", description: "Swift / Objective-C", value: "ios" },
              { label: "Native Android", description: "Kotlin / Java", value: "android" },
            ],
            { showBack: true },
          );
          if (!result) {
            step = 1;
            continue;
          }
          stackLabel = result;
        } else if (projectLabel === "web") {
          const result = await selectMenu(
            "What web framework?",
            [
              { label: "React", description: "Component-based UI library", value: "react" },
              { label: "Next.js", description: "React framework with SSR/SSG", value: "nextjs" },
              { label: "Vue", description: "Progressive JavaScript framework", value: "vue" },
              { label: "Angular", description: "Full-featured TypeScript framework", value: "angular" },
              { label: "Other", description: "Vanilla JS, Svelte, etc.", value: "web-other" },
            ],
            { showBack: true },
          );
          if (!result) {
            step = 1;
            continue;
          }
          stackLabel = result;
        } else if (projectLabel === "backend") {
          const result = await selectMenu(
            "What backend stack?",
            [
              { label: "Node.js", description: "Express, NestJS, Fastify, etc.", value: "nodejs" },
              { label: "Python", description: "Django, FastAPI, Flask, etc.", value: "python" },
              { label: "Go", description: "Standard library, Gin, Echo, etc.", value: "go" },
              { label: "Rust", description: "Actix, Axum, Rocket, etc.", value: "rust" },
              { label: "Other", description: "Java, Ruby, PHP, etc.", value: "backend-other" },
            ],
            { showBack: true },
          );
          if (!result) {
            step = 1;
            continue;
          }
          stackLabel = result;
        }

        if (stackLabel) {
          console.log(`  ${theme.dim(`Selected: ${stackLabel}`)}`);
          const derived = deriveTagsFromStack(stackLabel);
          for (const t of derived.skillTags) {
            if (!detectedSkillTags.includes(t)) detectedSkillTags.push(t);
          }
        }

        step = 3;
        break;
      }

      case 3: {
        // Category selection
        const allCats = getAllCategories(skillsRegistry);
        const options = allCats.map((catId) => ({
          label: getCategoryName(skillsRegistry, catId),
          description: getCategoryDesc(skillsRegistry, catId),
          value: catId,
        }));

        // Pre-selection
        const preselected: string[] = [];
        if (useDetection && detection) {
          preselected.push(...detection.skillCats);
        } else {
          for (const catId of allCats) {
            if (isCategoryRecommended(skillsRegistry, catId)) {
              preselected.push(catId);
            }
          }
        }

        const result = await checkboxMenu(
          "Which skill categories do you want?",
          options,
          { preselected, showBack: true },
        );

        if (!result) {
          // Back: if from detection, go to manual step 1
          useDetection = false;
          if (
            projectLabel === "mobile" ||
            projectLabel === "web" ||
            projectLabel === "backend"
          ) {
            step = 2;
          } else {
            step = 1;
          }
          continue;
        }

        selectedCategories = result;

        if (selectedCategories.length === 0) {
          console.log(theme.warn("No categories selected. Exiting."));
          process.exit(0);
        }

        step = 4;
        break;
      }

      case 4: {
        // Per-skill picker with tag-based pre-selection
        const skills = getSkillsByCategories(
          skillsRegistry,
          selectedCategories,
        );

        // Deduplicate
        const seen = new Set<string>();
        const uniqueSkills: Skill[] = [];
        for (const s of skills) {
          if (!seen.has(s.name)) {
            seen.add(s.name);
            uniqueSkills.push(s);
          }
        }

        if (uniqueSkills.length === 0) {
          console.log(
            theme.warn("No skills found in selected categories. Exiting."),
          );
          process.exit(0);
        }

        const options = uniqueSkills.map((s) => ({
          label: s.name,
          description: s.description,
          value: s.name,
        }));

        const preselected = uniqueSkills
          .filter((s) => shouldPreselectSkill(s, detectedSkillTags))
          .map((s) => s.name);

        const result = await checkboxMenu("Select skills to install", options, {
          preselected,
          showBack: true,
        });

        if (!result) {
          step = 3;
          continue;
        }

        skillNames = result;

        if (skillNames.length === 0) {
          console.log(theme.warn("No skills selected. Exiting."));
          process.exit(0);
        }

        step = 5;
        break;
      }

      case 5: {
        // Scope + confirmation
        if (!scopeSetByFlag) {
          console.log("");
          const scopeResult = await selectScopeMenu();
          if (scopeResult) scope = scopeResult;
        }

        console.log("");
        console.log(theme.bold(`Skills to install (${skillNames.length}):`));
        console.log(theme.dim(`  Scope: ${scope}`));
        console.log("");
        for (const name of skillNames) {
          const skill = skillsRegistry.skills.find((s) => s.name === name);
          console.log(
            `  ${theme.success("+")} ${theme.bold(name)}  ${theme.dim(skill?.description ?? "")}`,
          );
        }
        console.log("");

        const confirm = await p.confirm({
          message: "Install these skills? (b to go back)",
        });

        if (p.isCancel(confirm)) {
          console.log(theme.warn("Installation cancelled."));
          process.exit(0);
        }

        if (!confirm) {
          step = 4;
          continue;
        }

        await installSkills(skillNames, skillsRegistry, sourcesRegistry, scope);
        return;
      }
    }
  }
}

// ---- Agent Wizard ----

async function runAgentWizard(
  agentsRegistry: AgentsRegistry,
  scope: InstallScope,
  scopeSetByFlag: boolean,
  detection: DetectionResult | null,
): Promise<void> {
  if (!(await isClaudeCliAvailable())) {
    printClaudeCliError();
    process.exit(1);
  }

  printBanner();

  const useDetection =
    detection !== null &&
    (detection.agentCats.length > 0 || detection.agentTags.length > 0);

  if (useDetection) {
    if (detection!.techs.length > 0) {
      console.log(
        `  ${theme.success("Detected:")} ${theme.bold(detection!.techs.join(", "))}`,
      );
    }
    if (detection!.archetypes?.length) {
      console.log(`  ${theme.dim("Project type:")} ${detection!.archetypes.join(", ")}`);
    }
    console.log(theme.dim("  Pre-selecting relevant plugin categories."));
  }

  let agentStep = 1;
  let selectedAgentCategories: string[] = [];
  let pluginNames: string[] = [];
  const detectedAgentTags = detection?.agentTags.slice() ?? [];

  while (true) {
    switch (agentStep) {
      case 1: {
        // Category selection
        const allCats = getAllPluginCategories(agentsRegistry);
        const options = allCats.map((catId) => ({
          label: getPluginCategoryName(agentsRegistry, catId),
          description: getPluginCategoryDesc(agentsRegistry, catId),
          value: catId,
        }));

        const preselected: string[] = [];
        if (useDetection && detection) {
          preselected.push(...detection.agentCats);
        } else {
          for (const catId of allCats) {
            if (isPluginCategoryRecommended(agentsRegistry, catId)) {
              preselected.push(catId);
            }
          }
        }

        console.log("");
        const result = await checkboxMenu(
          "Which plugin categories do you want?",
          options,
          { preselected, showBack: true },
        );

        if (!result) {
          console.log(theme.warn("Cancelled."));
          process.exit(0);
        }

        selectedAgentCategories = result;

        if (selectedAgentCategories.length === 0) {
          console.log(theme.warn("No categories selected. Exiting."));
          process.exit(0);
        }

        agentStep = 2;
        break;
      }

      case 2: {
        // Per-plugin picker
        const plugins = getPluginsByCategories(
          agentsRegistry,
          selectedAgentCategories,
        );

        if (plugins.length === 0) {
          console.log(
            theme.warn("No plugins found in selected categories. Exiting."),
          );
          process.exit(0);
        }

        const options = plugins.map((p) => ({
          label: p.name,
          description: `${p.description} (${p.agent_count} agents)`,
          value: p.name,
        }));

        const preselected = plugins
          .filter((p) => shouldPreselectPlugin(p, detectedAgentTags))
          .map((p) => p.name);

        const result = await checkboxMenu("Select plugins to install", options, {
          preselected,
          showBack: true,
        });

        if (!result) {
          agentStep = 1;
          continue;
        }

        pluginNames = result;

        if (pluginNames.length === 0) {
          console.log(theme.warn("No plugins selected. Exiting."));
          process.exit(0);
        }

        agentStep = 3;
        break;
      }

      case 3: {
        // Scope + confirmation
        if (!scopeSetByFlag) {
          console.log("");
          const scopeResult = await selectAgentScopeMenu();
          if (scopeResult) scope = scopeResult;
        }

        console.log("");
        console.log(theme.bold(`Plugins to install (${pluginNames.length}):`));
        console.log(theme.dim(`  Scope: ${scope}`));
        console.log("");
        for (const name of pluginNames) {
          const plugin = agentsRegistry.plugins.find((p) => p.name === name);
          if (plugin) {
            console.log(
              `  ${theme.success("+")} ${theme.bold(name)}@${plugin.marketplace} ${theme.dim(`(${plugin.agent_count} agents) ${plugin.description}`)}`,
            );
          }
        }
        console.log("");

        const confirm = await p.confirm({
          message: "Install these plugins? (b to go back)",
        });

        if (p.isCancel(confirm)) {
          console.log(theme.warn("Installation cancelled."));
          process.exit(0);
        }

        if (!confirm) {
          agentStep = 2;
          continue;
        }

        await installPlugins(pluginNames, agentsRegistry, scope);
        return;
      }
    }
  }
}

// ---- Main Interactive Command ----

export async function cmdInteractive(
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  printBanner();

  // Step 0: Choose what to install
  console.log("");
  const choice = await selectMenu("What do you want to do?", [
    {
      label: "Scan & install (Recommended)",
      description: "Auto-detect tech stack, pick skills + agents",
      value: "scan",
    },
    {
      label: "Skills",
      description: "77 curated skill files (.claude/skills/)",
      value: "skills",
    },
    {
      label: "Agents",
      description: "83 plugins from 2 marketplaces (via claude plugin CLI)",
      value: "agents",
    },
    {
      label: "Both",
      description: "Install skills first, then agents",
      value: "both",
    },
  ]);

  if (!choice) {
    process.exit(0);
  }

  let detection: DetectionResult | null = null;

  if (choice === "agents") {
    const s = p.spinner();
    s.start("Loading registry...");
    const agentsRegistry = await loadAgentsRegistry();
    s.stop("Registry loaded");
    detection = await runDetection();
    await runAgentWizard(agentsRegistry, scope, scopeSetByFlag, detection);
    return;
  }

  if (choice === "scan") {
    detection = await runDetection();
    if (detection.techs.length > 0) {
      console.log("");
      console.log(
        `  ${theme.success("Detected:")} ${theme.bold(detection.techs.join(", "))}`,
      );
      if (detection.archetypes?.length) {
        console.log(`  ${theme.dim("Project type:")} ${detection.archetypes.join(", ")}`);
      }
    } else {
      console.log("");
      console.log(
        `  ${theme.warn("No project signals detected.")} Falling back to manual selection.`,
      );
      console.log("");
    }
  }

  // Skills wizard
  const regSpinner = p.spinner();
  regSpinner.start("Loading registry...");
  const skillsRegistry = await loadSkillsRegistry();
  const sourcesRegistry = await loadSourcesRegistry();
  regSpinner.stop("Registry loaded");

  if (choice !== "scan") {
    // Run detection for pre-selection
    detection = await runDetection();
    if (detection.techs.length > 0) {
      console.log("");
      console.log(
        `  ${theme.success("Detected:")} ${theme.bold(detection.techs.join(", "))}`,
      );
    }
  }

  await runSkillWizard(
    skillsRegistry,
    sourcesRegistry,
    scope,
    scopeSetByFlag,
    detection,
  );

  if (choice === "both" || choice === "scan") {
    const agentSpinner = p.spinner();
    agentSpinner.start("Loading registry...");
    const agentsRegistry = await loadAgentsRegistry();
    agentSpinner.stop("Registry loaded");
    await runAgentWizard(agentsRegistry, scope, scopeSetByFlag, detection);
  }
}

export async function cmdAgentsInteractive(
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  const s = p.spinner();
  s.start("Loading registry...");
  const agentsRegistry = await loadAgentsRegistry();
  s.stop("Registry loaded");

  if (!(await isClaudeCliAvailable())) {
    printClaudeCliError();
    process.exit(1);
  }

  const detection = await runDetection();

  printBanner();

  if (detection.techs.length > 0) {
    console.log(
      `  ${theme.success("Detected:")} ${theme.bold(detection.techs.join(", "))}`,
    );
  }

  await runAgentWizard(agentsRegistry, scope, scopeSetByFlag, detection);
}
