import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readDataFile, readTextFiles } from "./data-file.js";
import { parseYaml } from "./yaml.js";

/** The knowledge base shipped with this package (the authoring copy when run from a checkout). */
export const BUNDLED_KNOWLEDGE_BASE = fileURLToPath(new URL("../knowledge/", import.meta.url));

/**
 * @typedef {object} Route
 * @property {string[]} notes Note paths relative to the knowledge-base root.
 * @property {Map<string, string>} fallbackWindows Window name to PDF page range.
 */

/**
 * @typedef {object} Concept
 * @property {string} key
 * @property {string[]} aliases
 * @property {string} route Name of the route the concept belongs to.
 * @property {string[]} primaryNotes
 * @property {string[]} secondaryNotes
 * @property {string[]} fallbackWindows Window references of the form "route.window".
 */

/**
 * @typedef {object} KnowledgeBase
 * @property {string} root
 * @property {string} hub Text of the hub note.
 * @property {Map<string, Route>} routes
 * @property {Concept[]} concepts
 * @property {Map<string, string>} texts Text of every note and data file,
 *   keyed by path relative to the root, in path order.
 */

/** Extensions of the files that make up a knowledge base's text. */
const TEXT_FILE = /\.(?:md|ya?ml|json)$/;

/**
 * Load the parts of a knowledge base that checks reason about.
 * @param {string} root Knowledge-base root directory.
 * @returns {KnowledgeBase}
 * @throws {import("./data-file.js").DataFileError}
 */
export function loadKnowledgeBase(root) {
  const read = (name, parse) => readDataFile(join(root, name), parse, name);
  const hub = read("00-hub.md", (text) => text);
  const routingMap = read("routing-map.yaml", parseYaml);
  // The concept index is JSON, which is valid YAML; it is parsed as JSON.
  const conceptIndex = read("concept-index.yaml", JSON.parse);
  return {
    root,
    hub,
    routes: toRoutes(routingMap?.routes),
    concepts: (conceptIndex?.concepts ?? []).map(toConcept),
    texts: readTextFiles(root, TEXT_FILE),
  };
}

/**
 * @param {KnowledgeBase} kb
 * @param {string} relativePath
 * @returns {boolean}
 */
export function noteExists(kb, relativePath) {
  return existsSync(join(kb.root, relativePath));
}

/**
 * @param {Concept} concept
 * @returns {string[]} Primary notes followed by secondary notes.
 */
export function conceptNotes(concept) {
  return [...concept.primaryNotes, ...concept.secondaryNotes];
}

/**
 * Split a "route.window" reference.
 * @param {string} ref
 * @returns {{route: string, window: string}|null} Null when the reference has no dot.
 */
export function parseWindowRef(ref) {
  const dot = ref.indexOf(".");
  return dot === -1 ? null : { route: ref.slice(0, dot), window: ref.slice(dot + 1) };
}

/**
 * @param {KnowledgeBase} kb
 * @param {string} ref A "route.window" reference.
 * @returns {boolean} Whether the routing map defines that fallback window.
 */
export function hasFallbackWindow(kb, ref) {
  const parsed = parseWindowRef(ref);
  return Boolean(parsed && kb.routes.get(parsed.route)?.fallbackWindows.has(parsed.window));
}

function toRoutes(rawRoutes) {
  const routes = new Map();
  for (const [name, route] of Object.entries(rawRoutes ?? {})) {
    routes.set(name, {
      notes: route?.notes ?? [],
      fallbackWindows: new Map(Object.entries(route?.fallback_windows ?? {})),
    });
  }
  return routes;
}

function toConcept(raw) {
  return {
    key: raw.key,
    aliases: raw.aliases ?? [],
    route: raw.bucket,
    primaryNotes: raw.primary_notes ?? [],
    secondaryNotes: raw.secondary_notes ?? [],
    fallbackWindows: raw.fallback_windows ?? [],
  };
}
