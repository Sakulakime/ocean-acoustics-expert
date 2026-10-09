import { join } from "node:path";

import { TOOLBOX_PATHS } from "./path-map.js";
import { renderPlaceholders } from "./template.js";

/**
 * Tools the expert must not use in OpenCode: edit (which also covers write
 * and patch), the shell and the web. OpenCode's `tools` field is a deprecated
 * name-to-boolean map, not Claude's list, so the permission block is what
 * keeps the agent read-only.
 */
const DENIED_TOOLS = ["edit", "bash", "webfetch", "websearch"];

/**
 * The authoring copy's folders that link mode links the installed copy to
 * (`knowledge` and `matlab` in the data folder), relative to the authoring root.
 */
const LINKED_FOLDERS = [["knowledge"], ["tools", "matlab"]];

/**
 * OpenCode: a read-only subagent in the user agents folder of OpenCode's
 * config folder. OpenCode reads the skills from the shared skills folder
 * itself, so it gets no skill entries of its own.
 * @type {import("./install.js").Harness}
 */
export const OPENCODE_HARNESS = {
  name: "opencode",
  configDir: (locations) => locations.opencodeDir,
  units({ locations, template, variables }) {
    return [
      {
        kind: "file",
        path: join(locations.opencodeDir, "agents", `${template.name}.md`),
        content: renderOpencodeAgent(template, variables, readableDirs(locations, variables)),
      },
    ];
  },
};

/**
 * Folders outside the working directory the agent may read without a
 * permission prompt: the data folder, which holds the installed copy and the
 * MATLAB helpers; in link mode, the authoring copy's folders they link to,
 * because OpenCode's grep reports matches by their resolved paths; and each
 * toolbox tree that is set.
 * @param {import("./locations.js").Locations} locations
 * @param {Record<string, string|null>} variables
 * @returns {string[]}
 */
function readableDirs(locations, variables) {
  const authoringRoot = variables.authoring_root;
  const linked = typeof authoringRoot === "string" ? LINKED_FOLDERS.map((parts) => join(authoringRoot, ...parts)) : [];
  const toolboxes = TOOLBOX_PATHS.map((entry) => variables[entry.name]).filter((path) => typeof path === "string");
  return [locations.dataDir, ...linked, ...toolboxes];
}

/**
 * The agent markdown. OpenCode names the agent after the file. Its own
 * defaults ask before any read outside the project; the rules here come
 * after them, and OpenCode applies the last matching rule, with `*`
 * matching across folders.
 * @param {import("./template.js").AgentTemplate} template
 * @param {Record<string, string|null>} variables
 * @param {string[]} readable Folders the agent may read.
 * @returns {string}
 */
function renderOpencodeAgent(template, variables, readable) {
  return [
    "---",
    `description: ${JSON.stringify(template.description)}`,
    "mode: subagent",
    "permission:",
    ...DENIED_TOOLS.map((tool) => `  ${tool}: deny`),
    "  external_directory:",
    ...readable.map((dir) => `    ${JSON.stringify(`${dir}/**`)}: allow`),
    "---",
    "",
    renderPlaceholders(template.body, variables, "agent template"),
  ].join("\n");
}
