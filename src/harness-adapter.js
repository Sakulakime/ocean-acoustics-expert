import { dirname, join, relative } from "node:path";

import { missingFields } from "./inspection.js";
import { renderPlaceholders } from "./template.js";
import { splitFrontmatter } from "./template.js";
import { parseYaml, YamlError } from "./yaml.js";

/**
 * Shared utilities for harness adapters.
 *
 * Each harness (Claude, Codex, OpenCode, DeepSeek) implements a standard
 * interface but may use these utilities to reduce duplication.
 */

/**
 * Render a Markdown-format agent file with frontmatter.
 * Used by Claude Code and DeepSeek-TUI.
 *
 * @param {import("./template.js").AgentTemplate} template
 * @param {Record<string, string|null>} variables Template variables.
 * @param {object} frontmatter Additional frontmatter fields.
 * @returns {string}
 */
export function renderMarkdownAgent(template, variables, frontmatter = {}) {
  const front = {
    name: template.name,
    description: JSON.stringify(template.description),
    ...frontmatter,
  };
  const lines = ["---"];
  for (const [key, value] of Object.entries(front)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push("---", "", renderPlaceholders(template.body, variables, "agent template"));
  return lines.join("\n");
}

/**
 * Plan skill installations as symbolic links to the shared skills folder.
 * Used by Claude Code and DeepSeek-TUI.
 *
 * @param {{name: string, path: string}[]} skills Canonical skill folders.
 * @param {string} targetDir Where to create the skill links (e.g., ~/.claude/skills).
 * @returns {import("./install-plan.js").Unit[]}
 */
export function planSkillLinks(skills, targetDir) {
  return skills.map((skill) => {
    const path = join(targetDir, skill.name);
    return { kind: "link", path, target: relative(dirname(path), skill.path) };
  });
}

/**
 * Plan an agent file unit.
 *
 * @param {string} path Where the agent file goes.
 * @param {string} content Rendered agent content.
 * @returns {import("./install-plan.js").Unit}
 */
export function planAgentFile(path, content) {
  return { kind: "file", path, content };
}

/**
 * Plan legacy path cleanup units.
 *
 * @param {string[]} relativePaths Paths relative to config dir.
 * @param {string} configDir The harness config directory.
 * @returns {import("./install-plan.js").Unit[]}
 */
export function planLegacyCleanup(relativePaths, configDir) {
  return relativePaths.map((path) => ({ kind: "absent", path: join(configDir, path) }));
}

/**
 * Inspect a Markdown-format agent file.
 * Used by Claude Code and DeepSeek-TUI.
 *
 * @param {string} text Agent file content.
 * @param {string[]} requiredFields Fields the harness needs to load the agent.
 * @returns {import("./inspection.js").Inspection}
 */
export function inspectMarkdownAgent(text, requiredFields) {
  const parts = splitFrontmatter(text);
  if (!parts) return { instructions: null, problems: ["has no YAML frontmatter"] };

  let frontmatter;
  try {
    frontmatter = parseYaml(parts.frontmatter);
  } catch (error) {
    if (!(error instanceof YamlError)) throw error;
    return { instructions: parts.body, problems: [`has frontmatter doctor cannot parse: ${error.message}`] };
  }

  if (frontmatter === null || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    return { instructions: parts.body, problems: ["has frontmatter that is not a mapping"] };
  }

  const problems = missingFields(frontmatter, requiredFields).map((field) => `lacks ${field} in its frontmatter`);
  return { frontmatter, instructions: parts.body, problems };
}

/**
 * Standard agent path in a config directory's agents/ subfolder.
 *
 * @param {string} configDir
 * @param {string} agentName
 * @param {string} extension File extension (e.g., ".md", ".toml").
 * @returns {string}
 */
export function agentPath(configDir, agentName, extension) {
  return join(configDir, "agents", `${agentName}${extension}`);
}
