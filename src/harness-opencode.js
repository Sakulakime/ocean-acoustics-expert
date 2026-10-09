import { join } from "node:path";

import { TOOLBOX_PATHS } from "./path-map.js";
import { renderPlaceholders } from "./template.js";

/**
 * Tools the expert must not use in OpenCode: edit (which also covers write
 * and patch), the shell, the web, and task, which would let it hand work to
 * an agent that may write. OpenCode's `tools` field is a deprecated
 * name-to-boolean map, not Claude's list, so the permission block is what
 * keeps the agent read-only.
 */
const DENIED_TOOLS = ["edit", "bash", "webfetch", "websearch", "task"];

/**
 * OpenCode: a read-only subagent in the user agents folder of OpenCode's
 * config folder. OpenCode reads the skills from the shared skills folder
 * itself, so it gets no skill entries of its own.
 * @type {import("./install.js").Harness}
 */
export const OPENCODE_HARNESS = {
  name: "opencode",
  configDir: (locations) => locations.opencodeDir,
  units({ locations, template, variables, linkTargets }) {
    return [
      {
        kind: "file",
        path: join(locations.opencodeDir, "agents", `${template.name}.md`),
        content: renderOpencodeAgent(template, variables, readableDirs(locations, variables, linkTargets)),
      },
    ];
  },
};

/**
 * Folders outside the working directory the agent may read without a
 * permission prompt: the data folder, which holds the installed copy and the
 * MATLAB helpers; in link mode, the package folders they link to, because
 * OpenCode's grep reports matches by their resolved paths; and each toolbox
 * tree that is set.
 * @param {import("./locations.js").Locations} locations
 * @param {Record<string, string|null>} variables
 * @param {string[]} linkTargets
 * @returns {string[]}
 */
function readableDirs(locations, variables, linkTargets) {
  const toolboxes = TOOLBOX_PATHS.map((entry) => variables[entry.name]).filter((path) => typeof path === "string");
  return [locations.dataDir, ...linkTargets, ...toolboxes];
}

/**
 * What OpenCode needs on top of the shared rules. Its read tool attaches a
 * whole PDF whatever page range is asked for (a book is tens of megabytes),
 * so the permission block blocks PDFs and the agent names page ranges instead.
 */
const HARNESS_NOTE = `## Harness note: OpenCode

OpenCode cannot read a page range of a PDF: opening one attaches the whole book, which fails, so reading the PDFs in \`{{knowledge_base}}/sources/\` is blocked. This replaces step 5 of the retrieval order and the fallback rules below. When the notes do not settle a question, answer from the notes, say plainly that a book fallback is needed, and name the book and the PDF page range to read (from the route, the concept entry or a source note), so the user can check it or ask again in Claude Code or Codex.

`;

/**
 * The agent markdown. OpenCode names the agent after the file. Its own
 * defaults ask before any read outside the project; the rules here come
 * after them, and OpenCode applies the last matching rule, with `*`
 * matching across folders. The PDF rule adds to OpenCode's own read
 * defaults (which ask before reading `.env` files) instead of replacing them.
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
    "  read:",
    '    "*.pdf": deny',
    "  external_directory:",
    ...readable.map((dir) => `    ${JSON.stringify(`${dir}/**`)}: allow`),
    "---",
    "",
    renderPlaceholders(HARNESS_NOTE + template.body, variables, "agent template"),
  ].join("\n");
}
