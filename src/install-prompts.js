import { existsSync } from "node:fs";
import { sep } from "node:path";

import { promptCheckbox, promptConfirm } from "./prompt.js";

/**
 * The terminal an interactive install talks to.
 * @typedef {{input: NodeJS.ReadStream, output: NodeJS.WritableStream}} Terminal
 */

/**
 * Ask which harnesses to install into. The harnesses an earlier install
 * recorded start checked; on a first install, the harnesses present do.
 * @param {object} input
 * @param {Terminal} input.terminal
 * @param {import("./install.js").Harness[]} input.harnesses Every supported harness.
 * @param {import("./locations.js").Locations} input.locations
 * @param {string[]|undefined} input.recorded Harness names of the earlier install, if any.
 * @returns {Promise<string[]|null>} The chosen names, or null when cancelled.
 */
export function chooseHarnesses({ terminal, harnesses, locations, recorded }) {
  const present = (harness) => existsSync(harness.configDir(locations));
  const choices = harnesses.map((harness) => {
    const dir = homeRelative(harness.configDir(locations), locations.home);
    return { value: harness.name, label: harness.label, hint: present(harness) ? `found at ${dir}` : `not found at ${dir}` };
  });
  const selected = recorded ?? harnesses.filter(present).map((harness) => harness.name);
  return promptCheckbox({ ...terminal, title: "Install into which harnesses?", choices, selected });
}

/**
 * Show what install is about to change, naming every path it backs up, and
 * ask to go ahead.
 * @param {object} input
 * @param {Terminal} input.terminal
 * @param {import("./install-plan.js").Action[]} input.actions
 * @returns {Promise<boolean>}
 */
export function confirmActions({ terminal, actions }) {
  const backups = actions.filter((action) => action.op === "backup");
  const lines = [`Install will take ${actions.length} actions.`];
  if (backups.length > 0) {
    lines.push(`It first backs up ${backups.length} paths it did not write:`);
    lines.push(...backups.map((action) => `  ${action.path}`));
  }
  terminal.output.write(`${lines.join("\n")}\n`);
  return promptConfirm({ ...terminal, question: "Go ahead?" });
}

/**
 * @param {string} path
 * @param {string} home
 * @returns {string} The path with the home folder written as `~`.
 */
function homeRelative(path, home) {
  return path === home || path.startsWith(`${home}${sep}`) ? `~${path.slice(home.length)}` : path;
}
