import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runCli } from "./helpers/cli.js";
import { writeDirectory } from "./helpers/knowledge-base.js";

const template = readFileSync(new URL("../knowledge/runbooks/umpe-input-template.md", import.meta.url), "utf8");
const [run, env, files] = [...template.matchAll(/^```\n([\s\S]*?)^```$/gm)].map((match) => match[1].trimEnd().split("\n"));

function preflight(t, { params = {}, environment = env, patched = false } = {}) {
  const runRows = run.map((row, i) => Object.hasOwn(params, i + 1) ? row.slice(0, 33) + params[i + 1] : row);
  const dir = writeDirectory(t, {
    "pefiles.inp": files.join("\n"),
    [files[0]]: runRows.join("\n"),
    [files[1]]: environment.join("\n"),
  });
  return runCli(["validate_umpe_inp", ...(patched ? ["--patched-range-index"] : []), dir]);
}

function sedimentKnots(...ranges) {
  return [...env.slice(0, 13), String(ranges.length + 1), env[14],
    ...ranges.map(range => `${range} 20 1550 0 1.5 0 0 0 0 0`), ...env.slice(15)];
}

function rejects(result, message) {
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, message);
}

test("UMPE REAL: rejects SSP depths that collapse to the same binary32 value", (t) => {
  const environment = env.with(4, "50 1495").with(5, "50.00000001 1492");
  rejects(preflight(t, { environment }), /peenv\.inp:6:.*SSP depths.*strictly increase/);
});

test("UMPE REAL: rejects overflow and checks positivity after underflow", (t) => {
  rejects(preflight(t, { environment: env.with(11, env[11].replace("1700.0", "1D39")) }), /peenv\.inp:12:.*finite Fortran REAL/);
  rejects(preflight(t, { environment: env.with(3, "0 1D-50") }), /peenv\.inp:4:.*sound speed must be positive/);
});

test("UMPE REAL: ZMAX and a slightly larger output end can round to the same value", (t) => {
  for (const patched of [false, true]) {
    const result = preflight(t, { params: { 18: "0.01", 19: "1.0", 31: "0.0 1.00000001 1" }, patched });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /100 output ranges/);
  }
});

test("UMPE REAL: explicit step crossings use meters, including equality at step 7", (t) => {
  const result = preflight(t, { params: { 18: "0.01" }, environment: sedimentKnots("0.07", "0.071") });
  assert.equal(result.status, 0, result.stderr);
  rejects(preflight(t, { params: { 18: "0.025" }, environment: sedimentKnots("0.01", "0.02") }),
    /peenv\.inp:17:.*step crosses multiple knots/);
});

test("UMPE REAL: distinct km inputs must remain strictly increasing after conversion to meters", (t) => {
  rejects(preflight(t, { environment: sedimentKnots("0.13000011444091797", "0.13000012934207916") }),
    /peenv\.inp:17:.*strictly increase/);
});

test("UMPE REAL: knot crossings stop at the rounded final march step, not ZMAX or the output window", (t) => {
  const environment = sedimentKnots("0.075", "0.079");
  const params = { 18: "0.01", 19: "0.076", 31: "0.0 0.04 1" };
  rejects(preflight(t, { params, environment }), /peenv\.inp:17:.*step crosses multiple knots/);
  const result = preflight(t, { params: { ...params, 19: "0.074" }, environment: sedimentKnots("0.071", "0.073") });
  assert.equal(result.status, 0, result.stderr);
});

test("UMPE REAL: processes environment knots near the end of a billion-step march", (t) => {
  // FLOAT(IZ) advances in multiples of 128 here; both distinct meter knots
  // first cross at IZ=1111099969, despite their separation in kilometer ratios.
  rejects(preflight(t, { params: { 18: "0.00000009", 19: "100.0", 31: "0.0 0.001 1" },
    environment: sedimentKnots("99.9990005493164", "99.99900817871094"), patched: true }),
  /peenv\.inp:17:.*step crosses multiple knots/);
});

test("UMPE REAL: a decimal just above a binary32 midpoint exceeds ZMAX despite a binary64 tie", (t) => {
  const params = { 18: "0.01", 19: "1.0" };
  for (const patched of [false, true]) {
    rejects(preflight(t, { params: { ...params, 31: "0 1.0000000596046448 1" }, patched }), /perun\.inp:31:.*within \[0, 1\]/);
    for (const end of ["1.0000000596046447", "1.000000059604644775390625"]) {
      const result = preflight(t, { params: { ...params, 31: `0 ${end} 1` }, patched });
      assert.equal(result.status, 0, result.stderr);
    }
  }
});
