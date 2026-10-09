import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { runCli } from "./helpers/cli.js";
import { conceptIndexWith, writeDirectory, writeKnowledgeBase } from "./helpers/knowledge-base.js";

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

test("check fails when the resolved route does not list the notes a case expects of it", (t) => {
  const kb = writeKnowledgeBase(t, {
    "cases.json": JSON.stringify({
      cases: [
        {
          name: "ssp route lists the solver note",
          prompt: "How does the sound speed profile shape the field?",
          expected: {
            concept_key: "sound_speed_profile",
            bucket: "fundamentals",
            route_notes: ["chapters/ch01.md", "solvers/solver-bellhop.md"],
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
  assert.match(
    result.stderr,
    /route-selection "ssp route lists the solver note": expected route notes \["chapters\/ch01\.md","solvers\/solver-bellhop\.md"\], got \["chapters\/ch01\.md"\]/,
  );
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

test("check fails when a note contains an absolute machine path", async (t) => {
  const notes = {
    "a POSIX path in a chapter note": [
      "chapters/ch01.md",
      "---\nsource_pdf: /home/someone/Zotero/storage/ABCD1234/book.pdf\n---\n",
      /chapters\/ch01\.md:2: absolute path \/home\/someone\/Zotero\/storage\/ABCD1234\/book\.pdf/,
    ],
    "a path inside a MATLAB string": [
      "runbooks/run.md",
      "```matlab\nAT = '/opt/at/atWin10';\n```\n",
      /runbooks\/run\.md:2: absolute path \/opt\/at\/atWin10/,
    ],
    "a path in the routing map": [
      "routing-map.yaml",
      "primary_pdf: /Users/someone/book.pdf\nroutes:\n  fundamentals:\n    notes:\n      - chapters/ch01.md\n",
      /routing-map\.yaml:1: absolute path \/Users\/someone\/book\.pdf/,
    ],
    "a Windows drive path": [
      "chapters/ch01.md",
      "Binary: `C:\\Tools\\at\\bellhop.exe`\n",
      /chapters\/ch01\.md:1: absolute path C:\\Tools\\at\\bellhop\.exe/,
    ],
    "a home-relative path": [
      "chapters/ch01.md",
      "PDF lives in ~/Zotero/storage/ABCD1234\n",
      /chapters\/ch01\.md:1: absolute path ~\/Zotero\/storage\/ABCD1234/,
    ],
    "a path in bold": [
      "chapters/ch01.md",
      "The PDF is **/home/someone/book.pdf**.\n",
      /chapters\/ch01\.md:1: absolute path \/home\/someone\/book\.pdf;/,
    ],
    "a path after a dash or CJK punctuation": [
      "chapters/ch01.md",
      "PDF —/home/someone/a.pdf\n路径：/home/someone/b.pdf\n",
      /chapters\/ch01\.md:1: absolute path \/home\/someone\/a\.pdf[^]*chapters\/ch01\.md:2: absolute path \/home\/someone\/b\.pdf/,
    ],
    "a placeholder that climbs out of /path/to": [
      "chapters/ch01.md",
      "Run `cd /path/to/../../home/someone` first.\n",
      /chapters\/ch01\.md:1: absolute path \/path\/to\/\.\.\/\.\.\/home\/someone/,
    ],
    "a UNC path": [
      "chapters/ch01.md",
      "Share: \\\\fileserver\\acoustics\\at\n",
      /chapters\/ch01\.md:1: absolute path \\\\fileserver\\acoustics\\at/,
    ],
    "a Windows environment-variable path": [
      "chapters/ch01.md",
      "Zotero: %USERPROFILE%\\Zotero\\storage\n",
      /chapters\/ch01\.md:1: absolute path %USERPROFILE%\\Zotero\\storage/,
    ],
  };

  for (const [form, [note, content, message]] of Object.entries(notes)) {
    await t.test(form, (st) => {
      const kb = writeKnowledgeBase(st, { [note]: content });

      const result = runCli(["check", "--kb", kb]);

      assert.equal(result.status, 1);
      assert.match(result.stderr, message);
      assert.match(result.stderr, /point at book PDFs by their sources\/… path and name tools by logical name/);
    });
  }
});

test("check fails when a note uses an undefined logical name", (t) => {
  const kb = writeKnowledgeBase(t, {
    "runbooks/run.md": "Binary: `{{at_2099}}/RAM/ram.exe`\nTools: `{{ at_2020 }}/Matlab`\n",
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /runbooks\/run\.md:1: undefined logical name \{\{at_2099\}\}/);
  assert.match(result.stderr, /runbooks\/run\.md:2: undefined logical name \{\{ at_2020 \}\}/);
});

test("check rejects the retired Zotero storage logical name", (t) => {
  const kb = writeKnowledgeBase(t, { "01-source.md": "PDF: `{{zotero_storage}}/ABCD1234/`\n" });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /01-source\.md:1: undefined logical name \{\{zotero_storage\}\}/);
});

test("check accepts every logical name of the local path map", (t) => {
  const names = ["knowledge_base", "at_2023", "at_2020", "matlab_helpers", "authoring_root"];
  const kb = writeKnowledgeBase(t, {
    "runbooks/run.md": names.map((name) => `- \`{{${name}}}/sub/dir\``).join("\n"),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 0, result.stderr);
});

test("check does not mistake URLs, units, relative paths or placeholders for machine paths", (t) => {
  const kb = writeKnowledgeBase(t, {
    "chapters/ch01.md": [
      "DOI: https://doi.org/10.1007/978-1-4419-8678-8",
      "Speeds in m/s, attenuation in dB/λ, spreading as 1/r and (m/s)/km/h.",
      "Wavenumber $\\frac{\\omega}{c}/k/2$ and level in dB re 1 µPa²/Hz/m.",
      "See `../solvers/solver-ram.md` and `{{at_2020}}/Matlab/Plot/plotshd.m`.",
      "Run `cd /path/to/case` first.",
      "射线/简正模/抛物方程 都可用。",
      "",
    ].join("\n"),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 0, result.stderr);
});

test("check fails when a note points at a source PDF that does not exist", async (t) => {
  const notes = {
    "a mention in prose": [
      "chapters/ch01.md",
      "See also sources/colosi-2016-stochastic-ocean.pdf, pp. 1-20.\n",
      /chapters\/ch01\.md:1: source PDF sources\/colosi-2016-stochastic-ocean\.pdf does not exist/,
    ],
    "a mention right after CJK text": [
      "chapters/ch01.md",
      "参见sources/colosi-2016-stochastic-ocean.pdf第5页。\n",
      /chapters\/ch01\.md:1: source PDF sources\/colosi-2016-stochastic-ocean\.pdf does not exist/,
    ],
    "an upper-case extension": [
      "chapters/ch01.md",
      "PDF: `sources/COLOSI.PDF`\n",
      /chapters\/ch01\.md:1: source PDF sources\/COLOSI\.PDF does not exist/,
    ],
    "a subfolder of sources": [
      "chapters/ch01.md",
      "PDF: `sources/books/etter.pdf`\n",
      /chapters\/ch01\.md:1: source PDF sources\/books\/etter\.pdf does not exist/,
    ],
    "a path behind the knowledge-base logical name": [
      "routing-map.yaml",
      [
        "routes:",
        "  fundamentals:",
        "    notes:",
        "      - chapters/ch01.md",
        "    source_refs:",
        "      etter: \"{{knowledge_base}}/sources/etter-2018-modeling.pdf\"",
        "    fallback_windows:",
        "      environment: 20-39",
        "",
      ].join("\n"),
      /routing-map\.yaml:6: source PDF sources\/etter-2018-modeling\.pdf does not exist/,
    ],
    "a source_pdf field whose file name has spaces": [
      "chapters/ch01.md",
      "---\nsource_pdf: \"sources/Jensen 2011.pdf\"\n---\n",
      /chapters\/ch01\.md:2: source PDF sources\/Jensen 2011\.pdf does not exist/,
    ],
    "a primary_source_pdf field outside sources": [
      "00-hub.md",
      "---\nprimary_source_pdf: books/jensen.pdf\n---\n# Hub\n\n- Fundamentals: `chapters/ch01.md`\n",
      /00-hub\.md:2: source PDF books\/jensen\.pdf does not exist/,
    ],
  };

  for (const [form, [note, content, message]] of Object.entries(notes)) {
    await t.test(form, (st) => {
      const kb = writeKnowledgeBase(st, { [note]: content });

      const result = runCli(["check", "--kb", kb]);

      assert.equal(result.status, 1);
      assert.match(result.stderr, message);
    });
  }
});

test("check reports a missing source PDF once per line", (t) => {
  const kb = writeKnowledgeBase(t, { "chapters/ch01.md": "---\nsource_pdf: sources/missing.pdf\n---\n" });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.stderr.match(/source PDF sources\/missing\.pdf does not exist/g)?.length, 1, result.stderr);
});

test("check accepts notes that point at source PDFs present in the knowledge base", (t) => {
  const kb = writeKnowledgeBase(t, {
    "sources/jensen-2011-coa.pdf": "%PDF-1.4\n",
    "chapters/ch01.md": [
      "---",
      "source_pdf: sources/jensen-2011-coa.pdf",
      "---",
      "Read sources/jensen-2011-coa.pdf. Also `{{knowledge_base}}/sources/jensen-2011-coa.pdf`.",
      "Not book PDFs: https://example.org/sources/report.pdf, {{at_2020}}/sources/x.pdf, sources/x.pdf.bak.",
      "",
    ].join("\n"),
  });

  const result = runCli(["check", "--kb", kb]);

  assert.equal(result.status, 0, result.stderr);
});

test("check lints the bundled MATLAB helpers along with the authoring copy", () => {
  const result = runCli(["check"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /OK MATLAB helpers .*tools\/matlab/);
});

test("check fails when a MATLAB helper hard-codes a machine path or an undefined logical name", (t) => {
  const kb = writeKnowledgeBase(t);
  const helpers = writeDirectory(t, {
    "run_x.m": "function run_x( )\n    DEF.atRoot = '/home/someone/at';\nend\n",
    "README.md": "Binary: `{{at_2099}}/RAM/ram.exe`\n",
  });

  const result = runCli(["check", "--kb", kb, "--helpers", helpers]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /run_x\.m:2: absolute path \/home\/someone\/at/);
  assert.match(result.stderr, /README\.md:1: undefined logical name \{\{at_2099\}\}/);
});

test("check leaves the machine-specific local MATLAB configuration alone", (t) => {
  const kb = writeKnowledgeBase(t);
  const helpers = writeDirectory(t, {
    "oae_local_paths.m": "function paths = oae_local_paths( )\n    paths.at_2020 = '/home/someone/at';\nend\n",
    "oae_local_paths.m.example": "function paths = oae_local_paths( )\n    paths.at_2020 = '/path/to/at';\nend\n",
  });

  const result = runCli(["check", "--kb", kb, "--helpers", helpers]);

  assert.equal(result.status, 0, result.stderr);
});

test("check reports a MATLAB helpers folder it cannot load instead of crashing", (t) => {
  const kb = writeKnowledgeBase(t);

  const result = runCli(["check", "--kb", kb, "--helpers", join(kb, "missing")]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL cannot load MATLAB helpers .*missing/);
  assert.doesNotMatch(result.stderr, /\n\s+at /);
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
