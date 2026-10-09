import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** A minimal, valid knowledge base: one route, one concept, one chapter note. */
const MINIMAL_KNOWLEDGE_BASE = {
  "00-hub.md": "# Hub\n\n- Fundamentals: `chapters/ch01.md`\n",
  "routing-map.yaml": [
    "routes:",
    "  fundamentals:",
    "    trigger_keywords: [sound speed profile, SSP]",
    "    notes:",
    "      - chapters/ch01.md",
    "    fallback_windows:",
    "      environment: 20-39",
    "",
  ].join("\n"),
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
