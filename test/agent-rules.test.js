import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { installPaths, runInstaller, writeHome, writePackage } from "./helpers/install.js";

/**
 * Install into a fake home and return the rendered agent and router texts.
 * @param {import("node:test").TestContext} t
 * @returns {[string, string][]} Label and text of each rendered file.
 */
function renderedRules(t) {
  const pkg = writePackage(t);
  const home = writeHome(t);
  const paths = installPaths(home);
  const result = runInstaller(pkg, home, ["install"]);
  assert.equal(result.status, 0, result.stderr);
  return [
    ["agent", readFileSync(paths.agent, "utf8")],
    ["router", readFileSync(join(paths.sharedSkill, "SKILL.md"), "utf8")],
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
