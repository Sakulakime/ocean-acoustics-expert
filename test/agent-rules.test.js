import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { installPaths, runInstaller, writeHome, writePackage } from "./helpers/install.js";

/**
 * Install into a fake home and return the rendered agent and router texts.
 * @param {import("node:test").TestContext} t
 * @param {boolean} [allHarnesses] Render all four harnesses instead of only Claude.
 * @returns {[string, string][]} Label and text of each rendered file.
 */
function renderedRules(t, allHarnesses = false) {
  const pkg = writePackage(t);
  const home = writeHome(t, allHarnesses ? {
    ".codex/config.toml": "",
    ".config/opencode/opencode.json": "{}\n",
    ".dsh/settings.yaml.imported": "{}\n",
  } : {});
  const paths = installPaths(home);
  const args = allHarnesses
    ? ["install", ...["claude", "codex", "opencode", "deepseek"].flatMap((name) => ["--harness", name])]
    : ["install"];
  const result = runInstaller(pkg, home, args);
  assert.equal(result.status, 0, result.stderr);
  return [
    ["agent", readFileSync(paths.agent, "utf8")],
    ["router", readFileSync(join(paths.sharedSkill, "SKILL.md"), "utf8")],
    ...(allHarnesses ? [
      ["codex", readFileSync(join(home, ".codex/agents/ocean-acoustics-expert.toml"), "utf8")],
      ["opencode", readFileSync(join(home, ".config/opencode/agents/ocean-acoustics-expert.md"), "utf8")],
      ["deepseek", readFileSync(join(home, ".dsh/skills/ocean-acoustics-expert/SKILL.md"), "utf8")],
    ] : []),
  ];
}

/**
 * The numbered steps of the "Mandatory retrieval order" section, each with
 * any sub-bullets that follow it.
 * @param {string} text
 * @returns {string[]}
 */
function retrievalSteps(text) {
  const section = text.match(/^## Mandatory retrieval order\n([^]*?)(?=^## |(?![^]))/m);
  assert.ok(section, "no Mandatory retrieval order section");
  return section[1].split(/^(?=\d+\. )/m).filter((step) => /^\d+\. /.test(step));
}

test("agent and router state the v1 retrieval order, ending in a page-range read of a book PDF", (t) => {
  for (const [label, text] of renderedRules(t)) {
    const steps = retrievalSteps(text);
    const stepOf = (pattern) => steps.findIndex((step) => pattern.test(step));

    assert.equal(steps.length, 5, `${label}: expected five retrieval steps`);
    assert.equal(stepOf(/00-hub\.md/), 0, `${label}: hub first`);
    assert.equal(stepOf(/routing-map\.yaml/), 1, `${label}: routing map second`);
    assert.equal(stepOf(/concept-index\.yaml/), 2, `${label}: concept index third`);
    const notes = steps[3];
    for (const family of [/chapters\//, /solvers\//, /runbooks\//, /visualization\.md/, /benchmark[- ]case/i, /source note/i]) {
      assert.match(notes, family, `${label}: the note step names ${family}`);
    }
    assert.match(steps[4], /page range/, `${label}: fallback is a page-range read`);
    assert.match(steps[4], /\/sources\//, `${label}: fallback reads a PDF in sources/`);
  }
});

test("agent and router define both evidence tags, with an example of each, for every claim", (t) => {
  for (const [label, text] of renderedRules(t)) {
    assert.match(text, /`\[textbook: <source> <section\/pages>\]`/, `${label}: textbook tag format`);
    assert.match(text, /`\[inference\]`/, `${label}: inference tag format`);
    assert.match(text, /\[textbook: COA [^\]<>]*\d+-\d+\]/, `${label}: textbook tag example with a page range`);
    assert.match(text, /[^`]\[inference\]/, `${label}: inference tag example`);
    assert.match(text, /every claim/i, `${label}: every claim carries a tag`);
  }
});

test("agent and router name the book in every textbook tag and allow no other tags", (t) => {
  for (const [label, text] of renderedRules(t)) {
    assert.match(text, /\[textbook: (?!COA )[^\]<>`]+ \d{4} §[^\]<>`]*\d+-\d+\]/, `${label}: textbook tag example for another book`);
    assert.match(text, /never a note file/i, `${label}: a note file is not a textbook source`);
    assert.match(text, /only these two tags/i, `${label}: no tags beyond textbook and inference`);
    assert.match(text, /even when the request/i, `${label}: the tag rules hold however a request words them`);
    assert.match(text, /without tags/i, `${label}: the sources-used list carries no tags`);
  }
});

test("agent and router check the hub or routing map before assuming optional notes exist", (t) => {
  for (const [label, text] of renderedRules(t)) {
    assert.match(text, /when present/i, `${label}: benchmark cases and source notes are optional`);
  }
});

test("agent and router tell the agent to search for literal text", (t) => {
  for (const [label, text] of renderedRules(t)) {
    assert.match(text, /literal/i, `${label}: literal search hint`);
    assert.match(text, /regex|regular expression/i, `${label}: regex metacharacter hint`);
  }
});

test("agent and router drop paper evidence and Zotero", (t) => {
  for (const [label, text] of renderedRules(t)) {
    assert.doesNotMatch(text, /\[paper:/, `${label}: no paper tag`);
    assert.doesNotMatch(text, /zotero/i, `${label}: no Zotero mention`);
    assert.doesNotMatch(text, /uncurated/i, `${label}: no uncurated evidence`);
  }
});

test("agent and router take exact equations from the notes and read a PDF only when the notes lack them", (t) => {
  for (const [label, text] of renderedRules(t)) {
    const lines = text.split("\n").filter((line) => /exact equations/i.test(line));
    assert.ok(lines.length > 0, `${label}: mentions exact equations`);
    for (const line of lines) {
      assert.match(line, /notes do not give|not present in the notes/i, `${label}: "${line.trim()}" sends equations to the PDF only when the notes lack them`);
    }
  }
});

test("agent and router answer from the notes and name the pages when a book PDF is missing", (t) => {
  for (const [label, text] of renderedRules(t)) {
    assert.match(text, /each user supplies the books/i, `${label}: says the books are user-supplied`);
    assert.match(text, /is not in `[^`]+\/sources\/`[^.]*, answer from the notes, say plainly that a book fallback is needed, and name the book and the PDF page range/, `${label}: missing-book rule`);
  }
});

test("rendered rules select books by topic and make proactive cross-book checks observable", (t) => {
  for (const [label, text] of renderedRules(t, true)) {
    assert.match(text, /book-selection\.md/, `${label}: shared source-selection policy`);
    for (const field of ["primary_book", "cross_check_books", "cross_check_reason", "cross_check_status"]) {
      assert.ok(text.includes(field), `${label}: records ${field}`);
    }
    assert.doesNotMatch(text, /COA is the default book|COA.*first, and reads targeted/, `${label}: no global COA priority`);
    assert.match(retrievalSteps(text)[4], /cross-book check/, `${label}: PDF step covers a missing cross-book check`);
  }
});
