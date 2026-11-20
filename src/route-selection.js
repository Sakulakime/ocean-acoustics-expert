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

// Do not split the dots in a deck name or a relative path. Retain question
// marks so even a short question takes precedence over a narrative sentence.
const CLAUSE_BREAK = /(?<=[?!？！])\s*|[;；,，。\n]+|\.(?=\s|$)/u;
const ASK = /[?？]|^(?:how|what|which|where|why|please|show me|give me|explain)\b|怎么|如何|什么|哪种|为何|为什么|请/u;
const DECK_FORM = /\b(?:syntax|format|layout|configuration)\b|语法|格式|写法|字段顺序/u;
const FORM_HEADING = /^(?:(?:input|deck|file) )?(?:syntax|format|layout)\b|(?:语法|格式|写法)(?:要求)?$/u;

// Match the requested action ("how do I run", "please edit", or an
// imperative), not every verb in a question such as "when I run ...".
const ACTION_EN = /^(?:run|execute|configure|validate|specify|launch|build|set|edit|fill|enter|load|format|write|put)(?=\s|[?!]|$)/u;
const REQUEST_PREFIX_EN = /\b(?:please|(?:how|where) to|(?:do|can|could|should|would|must) (?:i|we|you)|(?:need|want|like|trying) to|help me(?: to)?)\s+/u;
const ACTION_ZH = /运行|执行|配置|设置|填写|填入|修改|编写|校验|加载|读入|导入|跑|写|填/u;
const REQUEST_PREFIX_ZH = /请|怎么|如何|怎样|能否|应该|需要|该/u;

// A completed action can introduce a question without a comma. Split at the
// temporal conjunction, not at a question word inside a phrase like 什么格式.
const AFTER_SETUP_ZH = /[之以]后\s*|后\s*(?=为什么|为何|如何|怎么|怎样|请问|应该|需要|什么|哪种)/u;
const REQUEST_CUE = /如何|怎么|怎样|为什么|为何|什么|哪种|请|应该|需要|能否|可否|是否|[吗呢](?=[?？]|$)|^(?:how|why|what|which|please)\b/u;

function mainRequest(clause, hasDeck) {
  const boundary = AFTER_SETUP_ZH.exec(clause);
  if (!boundary) return clause;
  const setup = clause.slice(0, boundary.index);
  if (!ACTION_ZH.test(setup)) return clause;
  const main = clause.slice(boundary.index + boundary[0].length);
  // A question mark alone does not start a new request. Keep the governing
  // cue in 如何把运行之后测得的 ... 写入 ..., but not the preamble in 请帮我解释 ... 之后为什么 ... .
  const newRequest = REQUEST_CUE.test(main) || (hasDeck(setup) && !REQUEST_CUE.test(setup));
  return newRequest && ASK.test(main) ? main : clause;
}

function asksForDeckWork(clause) {
  if (FORM_HEADING.test(clause) || (DECK_FORM.test(clause) && ASK.test(clause))) return true;
  if (clause.split(REQUEST_PREFIX_EN).some((part) => ACTION_EN.test(part))) return true;
  const request = clause.search(REQUEST_PREFIX_ZH);
  if (request >= 0) return ACTION_ZH.test(clause.slice(request));
  const verb = clause.search(ACTION_ZH);
  return verb === 0 || (verb > 0 && clause.startsWith("在"));
}

// Only a file reference, not a previous run mentioning the file, can supply
// the deck for an adjacent request ("Attached: path" or "In path, ...").
const LOCATOR_LABEL = /^(?:(?:in|see(?: attached)?|(?:i(?:'ve| have)? )?attached(?: file)?|attachments?|(?:the )?(?:file|deck)(?: is)?)\b|在|附件|文件)\s*[:：]?\s*/u;
const LOCATOR_PATH = /^(?:[\w.:/\\@~-]+|`[^`]+`|"[^"]+"|'[^']+')(?:\s*[里中内])?$/u;

// Keep paths, punctuation and adjacent Chinese prose valid, but reject longer
// Latin identifiers and names such as old_peenv.inp and peenv.inp.bak.
const UMPE_ALIAS_PREFIX = /[\p{Script=Latin}\p{N}_.-]$/u;
const UMPE_ALIAS_SUFFIX = /^(?:[\p{Script=Latin}\p{N}_-]|\.[\p{Script=Latin}\p{N}_-])/u;

function findUmpeAlias(text, alias) {
  for (let i = text.indexOf(alias); i !== -1; i = text.indexOf(alias, i + 1)) {
    if (
      !UMPE_ALIAS_PREFIX.test(text.slice(0, i)) &&
      !UMPE_ALIAS_SUFFIX.test(text.slice(i + alias.length))
    ) return i;
  }
  return -1;
}

/**
 * Prefer a UMPE deck request to a competing theory alias. Otherwise resolve
 * the actual question before its background, using longest alias, then position.
 * @param {string} prompt
 * @param {import("./knowledge-base.js").Concept[]} concepts
 * @returns {import("./knowledge-base.js").Concept|null}
 */
export function resolveConcept(prompt, concepts) {
  const text = prompt.toLowerCase();
  const umpe = concepts.find((concept) => concept.key === "umpe");
  const decks = (umpe?.aliases ?? []).map((alias) => alias.toLowerCase()).filter((alias) => alias.endsWith(".inp"));
  const hasDeck = (s) => decks.some((deck) => findUmpeAlias(s, deck) >= 0);
  if (hasDeck(text)) {
    const clauses = text.split(CLAUSE_BREAK).map((s) => s.trim()).filter(Boolean);
    // Keep the original clause for the deck identity, but only the main
    // request supplies intent and competing concepts.
    const requests = clauses.map((s) => mainRequest(s, hasDeck));
    const questions = requests.filter((s) => ASK.test(s));
    const deckClauses = clauses.map(hasDeck);
    const locators = clauses.map((s, i) => deckClauses[i] && LOCATOR_PATH.test(s.replace(LOCATOR_LABEL, "")));
    if (requests.some((s, i) =>
      (!questions.length || ASK.test(s)) &&
      (deckClauses[i] || locators[i - 1] || locators[i + 1]) && asksForDeckWork(s)
    )) {
      return umpe;
    }
    const questionText = questions.join("\n");
    if (questionText && questionText !== text) {
      const focused = longestAlias(questionText, concepts);
      if (focused) return focused;
    }
  }
  return longestAlias(text, concepts);
}

function longestAlias(text, concepts) {
  let best = null;
  for (const concept of concepts) {
    const isUmpe = concept.key === "umpe";
    for (const alias of concept.aliases) {
      const needle = alias.toLowerCase();
      if (!needle) continue;
      const position = isUmpe ? findUmpeAlias(text, needle) : text.indexOf(needle);
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
