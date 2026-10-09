import { fileURLToPath } from "node:url";

import { readDataFile } from "./data-file.js";

/** Route-selection cases shipped alongside the knowledge base. */
export const BUNDLED_ROUTE_SELECTION_CASES = fileURLToPath(
  new URL("../checks/route-selection-cases.json", import.meta.url),
);

/**
 * A prompt and the routing it must resolve to. Field names follow the cases file.
 * `route_notes`, when given, is the exact note list the resolved route must
 * have in the routing map; concepts alone never exercise a route's own notes.
 * @typedef {object} RouteSelectionCase
 * @property {string} name
 * @property {string} prompt
 * @property {{concept_key: string|null, bucket: string|null, route_notes?: string[],
 *   primary_notes: string[], secondary_notes: string[], fallback_windows: string[]}} expected
 */

/**
 * @param {string} casesPath
 * @returns {RouteSelectionCase[]}
 * @throws {import("./data-file.js").DataFileError}
 */
export function loadRouteSelectionCases(casesPath) {
  return readDataFile(casesPath, JSON.parse).cases ?? [];
}

/**
 * Resolve a prompt to a concept: the longest alias found in the prompt wins,
 * ties going to the alias that appears first.
 * @param {string} prompt
 * @param {import("./knowledge-base.js").Concept[]} concepts
 * @returns {import("./knowledge-base.js").Concept|null}
 */
export function resolveConcept(prompt, concepts) {
  const text = prompt.toLowerCase();
  let best = null;
  for (const concept of concepts) {
    for (const alias of concept.aliases) {
      const needle = alias.toLowerCase();
      const position = text.indexOf(needle);
      if (position === -1) continue;
      const better =
        !best ||
        needle.length > best.length ||
        (needle.length === best.length && position < best.position);
      if (better) best = { concept, length: needle.length, position };
    }
  }
  return best ? best.concept : null;
}

/** What a case without an `expected` block asserts: the prompt matches no concept. */
const EXPECT_NO_MATCH = {
  concept_key: null,
  bucket: null,
  primary_notes: [],
  secondary_notes: [],
  fallback_windows: [],
};

/**
 * Compare the routing a prompt resolves to with what the case expects.
 * Knowledge-base integrity (notes exist, windows defined) is checked separately
 * for every concept, so it is not repeated here.
 * @param {RouteSelectionCase} routeCase
 * @param {import("./knowledge-base.js").KnowledgeBase} kb
 * @returns {string[]} Problems; empty when the case passes.
 */
export function evaluateCase(routeCase, kb) {
  const expected = routeCase.expected ?? EXPECT_NO_MATCH;
  const resolved = resolveConcept(routeCase.prompt, kb.concepts);
  if (!resolved) {
    return expected.concept_key === null ? [] : [`expected concept ${expected.concept_key}, got no match`];
  }

  const comparisons = [
    ["concept", expected.concept_key, resolved.key],
    ["route", expected.bucket, resolved.route],
    ["primary notes", expected.primary_notes ?? [], resolved.primaryNotes],
    ["secondary notes", expected.secondary_notes ?? [], resolved.secondaryNotes],
    ["fallback windows", expected.fallback_windows ?? [], resolved.fallbackWindows],
  ];
  if (expected.route_notes) {
    comparisons.push(["route notes", expected.route_notes, kb.routes.get(resolved.route)?.notes ?? []]);
  }
  return comparisons
    .filter(([, wanted, actual]) => JSON.stringify(wanted) !== JSON.stringify(actual))
    .map(([label, wanted, actual]) => `expected ${label} ${JSON.stringify(wanted)}, got ${JSON.stringify(actual)}`);
}
