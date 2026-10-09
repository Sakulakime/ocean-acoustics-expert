import { readFileSync } from "node:fs";

import { parseYaml } from "./yaml.js";

/**
 * A harness-neutral agent template: identity in the frontmatter, the
 * instructions in the body. Harness adapters add their own frontmatter.
 * @typedef {object} AgentTemplate
 * @property {string} name
 * @property {string} description
 * @property {string} body Markdown instructions with `{{variable}}` placeholders.
 */

/**
 * @param {string} path
 * @returns {AgentTemplate}
 */
export function readAgentTemplate(path) {
  const text = readFileSync(path, "utf8");
  const match = text.match(/^---\n([^]*?)\n---\n\n?([^]*)$/);
  if (!match) throw new Error(`${path}: agent template has no frontmatter`);
  const { name, description } = /** @type {any} */ (parseYaml(match[1]));
  if (!name || !description) throw new Error(`${path}: agent template needs a name and a description`);
  return { name, description, body: match[2] };
}

/**
 * Replace every `{{variable}}` in a template text.
 * @param {string} text
 * @param {Record<string, string|null>} variables
 * @param {string} label Template name used in error messages.
 * @returns {string}
 * @throws {Error} When the text uses a variable that is undefined or unset.
 */
export function renderPlaceholders(text, variables, label) {
  return text.replace(/\{\{([^{}]*)\}\}/g, (placeholder, name) => {
    const value = Object.hasOwn(variables, name) ? variables[name] : null;
    if (value === null) throw new Error(`${label}: ${placeholder} has no value at install time`);
    return value;
  });
}
