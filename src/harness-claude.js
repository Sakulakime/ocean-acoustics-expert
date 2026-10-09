import { dirname, join, relative } from "node:path";

import { renderPlaceholders } from "./template.js";

/**
 * Legacy paths of the hand-made Claude setup, relative to Claude's config
 * folder. The agent file and the router skill folder are replaced by install
 * output instead. The forced-skill-eval suite next to the regression test
 * belongs to Claude Scholar and stays.
 */
const LEGACY_PATHS = [
  "knowledge/ocean-acoustics",
  "hooks/tests/ocean-acoustics-route-selection-regression.js",
  "hooks/tests/fixtures/underwater-route-selection-cases.json",
];

/**
 * Claude Code: a read-only agent in the user agents folder, and each skill
 * as a symbolic link to its canonical folder in the shared skills folder.
 * @type {import("./install.js").Harness}
 */
export const CLAUDE_HARNESS = {
  name: "claude",
  configDir: (locations) => locations.claudeDir,
  units({ locations, template, variables, skills }) {
    const skillLinks = skills.map((skill) => {
      const path = join(locations.claudeDir, "skills", skill.name);
      return { kind: "link", path, target: relative(dirname(path), skill.path) };
    });
    return [
      ...LEGACY_PATHS.map((path) => ({ kind: "absent", path: join(locations.claudeDir, path) })),
      ...skillLinks,
      {
        kind: "file",
        path: join(locations.claudeDir, "agents", `${template.name}.md`),
        content: renderClaudeAgent(template, variables),
      },
    ];
  },
};

/**
 * @param {import("./template.js").AgentTemplate} template
 * @param {Record<string, string|null>} variables
 * @returns {string}
 */
function renderClaudeAgent(template, variables) {
  return [
    "---",
    `name: ${template.name}`,
    `description: ${JSON.stringify(template.description)}`,
    "model: inherit",
    "color: cyan",
    "tools: [Read, Grep, Glob]",
    "---",
    "",
    renderPlaceholders(template.body, variables, "agent template"),
  ].join("\n");
}
