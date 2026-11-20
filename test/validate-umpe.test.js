import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runCli } from "./helpers/cli.js";
import { writeDirectory } from "./helpers/knowledge-base.js";

const template = readFileSync(new URL("../knowledge/runbooks/umpe-input-template.md", import.meta.url), "utf8");
const [run, env, files] = [...template.matchAll(/^```\n([\s\S]*?)^```$/gm)].map((match) => match[1].trimEnd().split("\n"));

function preflight(t, { runRows = run, envRows = env, fileRows = files, args = [] } = {}) {
  const dir = writeDirectory(t, {
    "pefiles.inp": fileRows.join("\r\n"),
    [fileRows[0]]: runRows.join("\r\n"),
    [fileRows[1]]: envRows.join("\r\n"),
  });
  return runCli(["validate_umpe_inp", ...args, dir]);
}

function parameter(line, value) {
  return run.with(line - 1, run[line - 1].slice(0, 33) + value);
}

function checkError(result, expected) {
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, expected);
}

test("UMPE: published template passes, including renamed inputs and CRLF", (t) => {
  const result = preflight(t, { fileRows: files.with(0, "parameters.in").with(1, "environment.in") });
  assert.equal(result.status, 0, result.stderr);
});

for (const [line, value, error] of [
  [19, "70", /:19:.*decimal point/], [18, "1E-3", /:18:.*decimal point/],
  [17, "  4096", /5-column/], [17, "4097", /4096/], [15, "513", /512/],
  [15, "3", /power of two/], [28, "11", /NDTL/], [29, "5", /NZTL/],
  [29, "4 1 2 3 4", /sentinel/], [28, "2 30.0", /declared 2/],
  [28, "1 30.0 40.0", /declared 1/], [31, "1.0 2.0 0", /output skip/],
]) {
  test(`UMPE: parameter line ${line} rejects '${value}'`, (t) => {
    checkError(preflight(t, { runRows: parameter(line, value) }), error);
  });
}

test("UMPE: misplaced fixed column and a truncated parameter deck fail", (t) => {
  checkError(preflight(t, { runRows: run.with(3, " " + run[3]) }), /:4:.*column 33/);
  checkError(preflight(t, { runRows: run.slice(1) }), /expected 32/);
});

test("UMPE: exact safe list limits, Fortran D notation and packed SSP records pass", (t) => {
  const runRows = parameter(28, "10 " + Array(10).fill("30").join(" "));
  runRows[28] = parameter(29, "3 1 2 3")[28];
  runRows[17] = parameter(18, "1.0D-3")[17];
  const result = preflight(t, { runRows, envRows: [...env.slice(0, 3), env.slice(3, 6).join(","), ...env.slice(6)] });
  assert.equal(result.status, 0, result.stderr);
});

for (const [index, label] of [[1, "NSS"], [10, "NB"], [13, "NBS"], [15, "NS"], [16, "NSB"]]) {
  test(`UMPE: bounds on ${label}`, (t) => {
    for (const n of [101, index === 1 || index === 10 ? 0 : -1]) {
      checkError(preflight(t, { envRows: env.with(index, String(n)) }), new RegExp(`${label}: expected integer`));
    }
  });
}

test("UMPE: SSP capacity reserves a slot only when extending to HD", (t) => {
  function profile(n, end) {
    return [...env.slice(0, 2), `0.0 ${n}`, ...Array.from({ length: n }, (_, i) => `${end * i / (n - 1)} 1500`), ...env.slice(6)];
  }
  for (const [n, end] of [[511, 599], [512, 600]]) {
    const result = preflight(t, { envRows: profile(n, end) });
    assert.equal(result.status, 0, result.stderr);
  }
  checkError(preflight(t, { envRows: profile(512, 599) }), /NSSD=512.*HD/);
  checkError(preflight(t, { envRows: env.with(2, "0.0 513") }), /NSSD.*512/);
});

test("UMPE: checks thickness on both interface grids, not just sediment rows", (t) => {
  const basement = (r, z) => `${r} ${z} 1700 0 2 0 0 0 0 0`;
  const sediment = (r, z) => `${r} ${z} 1550 0 1.5 0 0 0 0 0`;
  const rows = [...env.slice(0, 10), "3", basement(0, 100), basement(5, 20), basement(10, 150), "2", sediment(0, 0), sediment(10, 40), "0", "0"];
  checkError(preflight(t, { envRows: rows }), /range 5.*depth 20 minus sediment thickness 20/);
  checkError(preflight(t, { envRows: rows.with(16, sediment(10, -1)) }), /negative sediment thickness/);
  for (const envRows of [rows.with(16, sediment(10, 39)), [...env.slice(0, 13), "0", "0", "0"]]) {
    const result = preflight(t, { envRows });
    assert.equal(result.status, 0, result.stderr);
  }
});

test("UMPE: truncated, malformed and trailing environment records fail with location", (t) => {
  checkError(preflight(t, { envRows: env.slice(0, -1) }), /:17: missing NSB/);
  checkError(preflight(t, { envRows: env.with(11, "0 100") }), /:12: NB row: expected 10/);
  checkError(preflight(t, { envRows: [...env, "1"] }), /:18: unexpected/);
});

test("UMPE: accepts all five environment blocks at the 100-entry limit", (t) => {
  const hundred = (make) => Array.from({ length: 100 }, (_, i) => make(i));
  const result = preflight(t, { envRows: ["1", "100", ...hundred(i => `${i} 2\n0 1500 600 1500`),
    "100", ...hundred(i => `${i} 100 1700 0 2 0 0 0 0 0`), "100", ...hundred(i => `${i} 20 1550 0 1.5 0 0 0 0 0`),
    "100", ...hundred(i => `${i} 0`), "100", ...hundred(i => `${i} 0`)] });
  assert.equal(result.status, 0, result.stderr);
});

test("UMPE: missing named input fails; extra CLI arguments are usage errors", (t) => {
  const dir = writeDirectory(t, { "pefiles.inp": "missing.inp\nwater.inp\n" });
  checkError(runCli(["validate_umpe_inp", dir]), /missing\.inp/);
  assert.equal(runCli(["validate_umpe_inp", dir, "extra"]).status, 2);
});

test("UMPE: rejects unsupported grids and reversed output windows", (t) => {
  for (const [line, value, error] of [[5, "2", /does not set NZ/], [13, "0.0", /reference speed/],
    [31, "8.0 2.0 1", /output window/], [17, "2", /FFT size/]]) {
    checkError(preflight(t, { runRows: parameter(line, value) }), error);
  }
});

test("UMPE: single advance cannot skip two sediment knots on an explicit step", (t) => {
  const envRows = [...env.slice(0, 13), "3", ...["0 0", "0.01 0", "0.02 90"].map(pair => `${pair} 1550 0 1.5 0 0 0 0 0`), "0", "0"];
  checkError(preflight(t, { runRows: parameter(18, "0.025"), envRows }), /step crosses multiple knots/);
});

test("UMPE: the solver still needs output records when outputs are disabled", (t) => {
  checkError(preflight(t, { fileRows: files.slice(0, 2) }), /44 file-list records/);
  checkError(preflight(t, { fileRows: files.with(37, "0 0") }), /:38: expected 3/);
});

// Recreate the shipped ex4b range grid without redistributing its input files.
function rangeDeck(window, extra = {}) {
  const values = { 18: "0.01", 19: "100.00", 31: window, ...extra };
  return run.map((row, i) => Object.hasOwn(values, i + 1) ? row.slice(0, 33) + values[i + 1] : row);
}

const fixedIndex = ["--patched-range-index"];

test("UMPE: stock checks actual selections, including after automatic skip adjustment", (t) => {
  for (const skip of [1, 2]) {
    checkError(preflight(t, { runRows: rangeDeck(`60.00 80.00 ${skip}`) }), /perun\.inp:31:.*1001 > 1000.*NSKIP=2/);
  }
  for (const [window, expected] of [["60.00 79.99 2", 1000], ["60.00 80.00 3", 667],
    ["0.00 100.00 10", 1000], ["0.00 100.00 1", 1000], ["0.00 0.29 1", 30]]) {
    const result = preflight(t, { runRows: rangeDeck(window) });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`stock: ${expected} output ranges`));
  }
});

test("UMPE: fixed MKS indexing preserves the ex4b window, validates empty windows and still checks the deck", (t) => {
  for (const skip of [1, 2]) {
    const result = preflight(t, { runRows: rangeDeck(`60.00 80.00 ${skip}`), args: fixedIndex });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /patched: 1000 output ranges.*NSKIP=2/);
  }
  checkError(preflight(t, { runRows: rangeDeck("60.00 60.001 2"), args: fixedIndex }), /:31:.*no marched step/);
  checkError(preflight(t, { runRows: rangeDeck("60.00 80.00 2", { 18: "1" }), args: fixedIndex }), /decimal point/);
  assert.equal(runCli(["validate_umpe_inp", ...fixedIndex, ...fixedIndex]).status, 2);
  assert.equal(runCli(["validate_umpe_inp", "--unknown"]).status, 2);
});

test("UMPE: automatic MKS step uses frequency, bandwidth and source width; stock reports the ex2 phantom row", (t) => {
  const ex2 = { 18: "0.0", 19: "7.000", 14: "25.000", 23: "60.0000", 24: "20.00000" };
  for (const args of [[], fixedIndex]) {
    const result = preflight(t, { runRows: rangeDeck("0.00 7.00 1", ex2), args });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /355 output ranges/);
    if (!args.length) assert.match(result.stderr, /356.*355/);
    else assert.doesNotMatch(result.stderr, /356/);
  }
  const broadband = preflight(t, { runRows: rangeDeck("0.00 7.00 1", { ...ex2, 15: "2", 16: "50.0" }), args: fixedIndex });
  assert.equal(broadband.status, 0, broadband.stderr);
  assert.match(broadband.stdout, /711 output ranges/);
});

test("UMPE: large stock grids count AMOD aliases, without iterating over every marching step", (t) => {
  checkError(preflight(t, { runRows: rangeDeck("0.00 100.00 1", { 18: "0.0000000001" }) }), /32-bit/);
  // Independent gfortran REAL/AMOD loop over 20 million integer indices: 1003 and 1.
  checkError(preflight(t, { runRows: rangeDeck("0.00 100.00 1", { 18: "0.000005" }) }), /1003 > 1000.*NSKIP=19981/);
  const sparse = preflight(t, { runRows: rangeDeck("0.00 99.99999 19999999", { 18: "0.000005" }) });
  assert.equal(sparse.status, 0, sparse.stderr);
  assert.match(sparse.stdout, /stock: 1 output range/);
});


test("UMPE: patched partial windows compare marched metres; full windows retain the last actual step", (t) => {
  for (const [window, dz, maximum, count] of [
    ["0.012 0.018 1", "0.006", "1.0", 1], ["0.018 0.024 1", "0.006", "1.0", 1],
    ["0.00 1.006 1", "0.01", "1.006", 101], ["0.00 1.005 1", "0.01", "1.006", 100],
  ]) {
    const result = preflight(t, { runRows: rangeDeck(window, { 18: dz, 19: maximum }), args: fixedIndex });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`patched: ${count} output range`));
  }
});

test("UMPE: a platform-sensitive automatic step cannot certify an ambiguous index", (t) => {
  const auto = { 18: "0.0", 19: "1.0", 14: "150.0", 23: "30.38", 24: "0.0" };
  for (const args of [[], fixedIndex]) {
    checkError(preflight(t, { runRows: rangeDeck("0 0.124453753 1", auto), args }), /automatic.*explicit.*step/i);
  }
});
