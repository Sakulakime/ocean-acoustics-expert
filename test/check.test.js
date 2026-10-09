import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runCli } from "./helpers/cli.js";
import { conceptIndexWith, writeKnowledgeBase } from "./helpers/knowledge-base.js";

const BUNDLED_CASE_COUNT = JSON.parse(
  readFileSync(new URL("../checks/route-selection-cases.json", import.meta.url), "utf8"),
).cases.length;

test("check passes on the bundled authoring copy", () => {
  const result = runCli(["check"]);

  assert.equal(result.status, 0, result.stderr);
});

test("check runs every bundled route-selection case against the authoring copy", () => {
  const result = runCli(["check"]);

  assert.ok(BUNDLED_CASE_COUNT >= 11);
  assert.match(result.stdout, new RegExp(`OK ${BUNDLED_CASE_COUNT} route-selection cases passed`));
});

test("check fails when a route-selection case resolves to the wrong route", (t) => {
  const kb = writeKnowledgeBase(t, {
    "cases.json": JSON.stringify({
      cases: [
        {
          name: "ssp goes to ray methods",
          prompt: "How does the sound speed profile bend rays?",
          expected: {
            concept_key: "sound_speed_profile",
            bucket: "ray_methods",
            primary_notes: ["chapters/ch01.md"],
            secondary_notes: [],
            fallback_windows: ["fundamentals.environment"],
          },
        },
      ],
    }),
  });

  const result = runCli(["check", "--kb", kb, "--cases", join(kb, "cases.json")]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /route-selection "ssp goes to ray methods": expected route "ray_methods", got "fundamentals"/);
});

test("check reports a knowledge base it cannot load instead of crashing", (t) => {
  const kb = writeKnowledgeBase(t, { "routing-map.yaml": "routes:\n  fundamentals\n" });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL cannot load knowledge base .*routing-map\.yaml.*line 2/);
  assert.doesNotMatch(result.stderr, /\n\s+at /);
});

test("check reports route-selection cases it cannot load instead of crashing", (t) => {
  const kb = writeKnowledgeBase(t, { "cases.json": "{ not json" });

  for (const casesPath of [join(kb, "cases.json"), join(kb, "missing.json")]) {
    const result = runCli(["check", "--kb", kb, "--cases", casesPath]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /FAIL cannot load route-selection cases .*(cases|missing)\.json/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  }
});

test("check rejects routing-map syntax outside the supported YAML subset", async (t) => {
  const unsupported = {
    "an inline comment": ["routes:", "  fundamentals:", "    notes:", "      - chapters/ch01.md # main"],
    "a quoted flow item containing a comma": ["routes:", "  fundamentals:", '    trigger_keywords: [ssp, "a, b"]'],
    "a mapping inside a sequence": ["routes:", "  fundamentals:", "    notes:", "      - path: chapters/ch01.md"],
    "a flow mapping": ["routes:", "  fundamentals:", "    fallback_windows: {environment: 20-39}"],
    "a duplicate key": ["routes:", "  fundamentals:", "    notes: []", "  fundamentals:", "    notes: []"],
  };

  for (const [construct, lines] of Object.entries(unsupported)) {
    await t.test(construct, (st) => {
      const kb = writeKnowledgeBase(st, { "routing-map.yaml": `${lines.join("\n")}\n` });

      const result = runCli(["check", "--kb", kb]);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /FAIL cannot load knowledge base .*routing-map\.yaml: line \d+/);
    });
  }
});

test("check treats a __proto__ route name as ordinary data", (t) => {
  const kb = writeKnowledgeBase(t, {
    "routing-map.yaml": "routes:\n  __proto__:\n    notes:\n      - chapters/missing.md\n",
    "concept-index.yaml": JSON.stringify({ concepts: [] }),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /route __proto__: note chapters\/missing\.md does not exist/);
});

test("check fails when a route lists a note that does not exist", (t) => {
  const kb = writeKnowledgeBase(t, {
    "routing-map.yaml": [
      "routes:",
      "  fundamentals:",
      "    notes:",
      "      - chapters/ch01.md",
      "      - chapters/missing.md",
      "",
    ].join("\n"),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /route fundamentals.*chapters\/missing\.md/);
});

test("check fails when a concept points at a note that does not exist", (t) => {
  const kb = writeKnowledgeBase(t, {
    "concept-index.yaml": conceptIndexWith({ secondary_notes: ["chapters/missing.md"] }),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /concept sound_speed_profile.*chapters\/missing\.md/);
});

test("check fails when a concept cites a fallback window the routing map does not define", (t) => {
  const kb = writeKnowledgeBase(t, {
    "concept-index.yaml": conceptIndexWith({ fallback_windows: ["fundamentals.bottom_loss"] }),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /concept sound_speed_profile.*fallback window fundamentals\.bottom_loss/);
});

test("check fails when a concept belongs to a route the routing map does not define", (t) => {
  const kb = writeKnowledgeBase(t, {
    "concept-index.yaml": conceptIndexWith({ bucket: "ray_methods" }),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /concept sound_speed_profile: route ray_methods is not defined in the routing map/);
});

test("check fails when a concept cites a fallback window of another route", (t) => {
  const kb = writeKnowledgeBase(t, {
    "routing-map.yaml": [
      "routes:",
      "  fundamentals:",
      "    notes:",
      "      - chapters/ch01.md",
      "  ray_methods:",
      "    notes:",
      "      - chapters/ch01.md",
      "    fallback_windows:",
      "      derivation: 176-194",
      "",
    ].join("\n"),
    "concept-index.yaml": conceptIndexWith({ fallback_windows: ["ray_methods.derivation"] }),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /concept sound_speed_profile: fallback window ray_methods\.derivation does not belong to route fundamentals/);
});

test("check reports fallback-window references that collide with built-in property names", (t) => {
  const kb = writeKnowledgeBase(t, {
    "concept-index.yaml": conceptIndexWith({ fallback_windows: ["constructor.name"] }),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /fallback window constructor\.name is not defined in the routing map/);
});

test("check fails when the hub references a note that does not exist", (t) => {
  const kb = writeKnowledgeBase(t, {
    "00-hub.md": "# Hub\n\n- Fundamentals: `chapters/ch01.md`\n- Regression: `../hooks/tests/regression.js`\n- Solvers: `solvers/`\n",
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /hub: reference solvers\/ does not exist/);
  assert.match(result.stderr, /hub: reference \.\.\/hooks\/tests\/regression\.js does not exist/);
  assert.doesNotMatch(result.stderr, /chapters\/ch01\.md/);
});
