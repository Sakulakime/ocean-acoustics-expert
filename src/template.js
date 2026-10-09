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

/** A markdown file's YAML frontmatter block and the text after it. */
const FRONTMATTER = /^---\r?\n([^]*?)\r?\n---\r?\n([^]*)$/;

/**
 * @param {string} text
 * @returns {{frontmatter: string, body: string}|null} Null when the text does not start with a frontmatter block.
 */
export function splitFrontmatter(text) {
  const match = text.match(FRONTMATTER);
  return match ? { frontmatter: match[1], body: match[2] } : null;
}

/**
 * @param {string} path
 * @returns {AgentTemplate}
 */
export function readAgentTemplate(path) {
  const parts = splitFrontmatter(readFileSync(path, "utf8"));
  if (!parts) throw new Error(`${path}: agent template has no frontmatter`);
  const { name, description } = /** @type {any} */ (parseYaml(parts.frontmatter));
  if (!name || !description) throw new Error(`${path}: agent template needs a name and a description`);
  return { name, description, body: parts.body.replace(/^\r?\n/, "") };
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
