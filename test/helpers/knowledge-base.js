import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** A minimal, valid knowledge base: one route, one concept, one chapter note. */
export const MINIMAL_KNOWLEDGE_BASE = {
  "00-hub.md": "# Hub\n\n- Fundamentals: `chapters/ch01.md`\n",
  "routing-map.yaml": routingMapWithWindows(["      environment: 20-39"]),
  "concept-index.yaml": JSON.stringify({
    concepts: [
      {
        key: "sound_speed_profile",
        aliases: ["sound speed profile"],
        bucket: "fundamentals",
        primary_notes: ["chapters/ch01.md"],
        secondary_notes: [],
        fallback_windows: ["fundamentals.environment"],
      },
    ],
  }),
  "chapters/ch01.md": "# Chapter 1\n",
};

/**
 * Write a fixture knowledge base to a temp directory that is removed after the test.
 * @param {import("node:test").TestContext} t
 * @param {Record<string, string>} overrides Relative path to file content, replacing or adding files.
 * @returns {string} Absolute path of the knowledge-base root.
 */
export function writeKnowledgeBase(t, overrides = {}) {
  return writeDirectory(t, { ...MINIMAL_KNOWLEDGE_BASE, ...overrides });
}

/**
 * Write files to a temp directory that is removed after the test.
 * @param {import("node:test").TestContext} t
 * @param {Record<string, string>} files Relative path to file content.
 * @returns {string} Absolute path of the directory.
 */
export function writeDirectory(t, files) {
  const root = mkdtempSync(join(tmpdir(), "oae-kb-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = join(root, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}

/**
 * A routing map with the minimal knowledge base's one route and the given fallback windows.
 * @param {string[]} windowLines Lines under `fallback_windows:`, indented six spaces.
 * @returns {string}
 */
export function routingMapWithWindows(windowLines) {
  return [
    "routes:",
    "  fundamentals:",
    "    trigger_keywords: [sound speed profile, SSP]",
    "    notes:",
    "      - chapters/ch01.md",
    "    fallback_windows:",
    ...windowLines,
    "",
  ].join("\n");
}

/**
 * A concept-index file with one concept, overriding fields of the minimal concept.
 * @param {object} fields
 * @returns {string}
 */
export function conceptIndexWith(fields) {
  return JSON.stringify({
    concepts: [
      {
        key: "sound_speed_profile",
        aliases: ["sound speed profile"],
        bucket: "fundamentals",
        primary_notes: ["chapters/ch01.md"],
        secondary_notes: [],
        fallback_windows: [],
        ...fields,
      },
    ],
  });
}

/**
 * A chapter note of chapter 5 with the given major subsections.
 * @param {Record<string, string>} subsections Heading to body.
 * @param {{frontmatter?: string[]}} [options] Frontmatter lines (default: a deepened chapter 5 note).
 * @returns {string}
 */
export function chapterNote(subsections, { frontmatter = ["type: chapter-note", "chapter: 5", "status: deepened"] } = {}) {
  return [
    "---",
    ...frontmatter,
    "---",
    "# Chapter 5",
    "",
    "## Major subsections",
    "",
    ...Object.entries(subsections).flatMap(([heading, body]) => [`### ${heading}`, body, ""]),
    "## Key sections from the TOC",
    "- 5.11 Normal Modes for Range-Dependent Environments (PDF p. 419)",
    "",
  ].join("\n");
}

/** The four blocks every case of a benchmark-cases note has, with sample content. */
export const BENCHMARK_CASE_BLOCKS = {
  Environment: "- Water 1500 m/s over a 1700 m/s bottom",
  "COA references": "- Fig. 6.8, §6.7, PDF pp. 522-523",
  Validates: "- PE",
  "Reference solutions": "- Two-way coupled modes",
};

/**
 * A benchmark-cases note with the given cases.
 * @param {Record<string, string[]>} cases Case heading to the names of the
 *   blocks it has, drawn from BENCHMARK_CASE_BLOCKS.
 * @returns {string}
 */
export function benchmarkCasesNote(cases) {
  return [
    "---",
    "type: benchmark-cases",
    "---",
    "# Benchmark cases",
    "",
    "## Cases",
    "",
    ...Object.entries(cases).flatMap(([heading, blocks]) => [
      `### ${heading}`,
      ...blocks.flatMap((block) => [`**${block}**`, BENCHMARK_CASE_BLOCKS[block]]),
      "",
    ]),
    "## Other COA examples",
    "**Validates**",
    "- Not a case: blocks outside ## Cases do not count",
    "",
  ].join("\n");
}
