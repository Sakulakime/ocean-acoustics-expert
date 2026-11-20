import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { automaticRangeSteps, lastStepAt, outputRanges } from "./umpe-range.js";
import { parseUmpeReal } from "./umpe-real.js";

// UMPE v1.1: pemp.f:158-252 and phase2.f:84-283. Keep records separate:
// a list-directed READ can span lines, but the next READ starts a new record.
function records(file) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  return lines.map((text, index) => ({ text, at: `${file}:${index + 1}` }));
}

function need(condition, at, message) {
  if (!condition) throw new Error(`${at}: ${message}`);
}

function integer(token, at, name, min, max) {
  const n = Number(token);
  need(/^[+-]?\d+$/.test(token) && Number.isSafeInteger(n) && n >= min && n <= max,
    at, `${name}: expected integer in [${min}, ${max}], got ${token}`);
  return n;
}

function real(token, at) {
  const value = parseUmpeReal(token);
  need(Number.isFinite(value),
    at, `expected a finite Fortran REAL number, got ${token}`);
  return value;
}

function tokens(text) {
  return text.trim().split(/\s*,\s*|\s+/);
}

const switches = new Map([
  [2, [1, 5]], [3, [1, 2]], [4, [1, 3]], [5, [1, 2]], [6, [0, 1]], [7, [0, 1]],
  [8, [1, 99999]], [9, [0, 1]], [15, [1, 512]], [17, [0, 4096]],
]);

function readRun(file, patched) {
  const rows = records(file);
  need(rows.length === 32, file, `expected 32 parameter records, got ${rows.length}`);
  const params = {};
  for (const [i, { text, at }] of rows.entries()) {
    const line = i + 1;
    need(/^[\x20-\x7e]{32}:/.test(text), at, "expected 32 ASCII label columns and colon in column 33");
    if (line === 1) continue; // Free-text title.
    const raw = text.slice(33).trimEnd();
    const isSwitch = switches.has(line);
    const list = [28, 29, 31, 32].includes(line);
    const width = list ? 80 : isSwitch ? 5 : 14;
    need(!raw.includes("\t") && raw.length <= width, at, `value exceeds or tabs across its ${width}-column field`);
    if (isSwitch) {
      params[line] = integer(raw.trim(), at, text.slice(0, 32).trim(), ...switches.get(line));
    } else if (!list) {
      params[line] = real(raw.trim(), at);
      need(raw.includes("."), at, "fixed-width real requires an explicit decimal point");
    } else if (line <= 29) {
      const [count, ...values] = tokens(raw);
      const n = integer(count, at, line === 28 ? "NDTL" : "NZTL", 0, line === 28 ? 10 : 4);
      need(line !== 29 || n < 4, at, "NZTL=4 leaves no slot for the ZTIME(NZTL+1) sentinel");
      // Shipped examples ex4a-ex6 retain one unused depth after a zero count.
      need(values.length === n || (n === 0 && values.length === 1), at, `declared ${n} values, found ${values.length}`);
      values.forEach((v) => real(v, at));
    } else {
      const fields = tokens(raw);
      need(fields.length === 3, at, "expected output minimum, maximum and skip");
      const start = real(fields[0], at), end = real(fields[1], at);
      const limit = params[line === 31 ? 19 : 20];
      need(0 <= start && start <= end && end <= limit, at, `output window must be ordered within [0, ${limit}]`);
      const skip = integer(fields[2], at, "output skip", 1, 2147483647);
      if (line === 31) params[line] = { start, end, skip };
    }
  }
  // pemp.f:572-582 silently changes a non-power-of-two frequency count.
  need((params[15] & (params[15] - 1)) === 0, rows[14].at, "NFREQ must be a power of two to preserve the requested count");
  need(params[8] === 1 || params[15] === 1, rows[14].at, "multiple frequencies and roughness realizations cannot be combined");
  need(params[20] > 0, rows[19].at, "HD must be positive");
  need(params[5] === 1, rows[4].at, "use MKS (units=1): unmodified English-units branch does not set NZ");
  need(params[13] > 0 && params[14] > 0, rows[13].at, "reference speed and center frequency must be positive");
  need(params[18] >= 0 && params[19] > 0, rows[18].at, "forward march requires nonnegative range step and positive maximum range");
  need(params[17] === 0 || (params[17] >= 4 && (params[17] & (params[17] - 1)) === 0), rows[16].at,
    "specify automatic FFT size (0) or a power of two from 4 through 4096");
  const maxRange = params[19];
  const step = Math.fround(params[18]);
  const steps = step ? [step] : automaticRangeSteps({
    speed: params[13], frequency: params[14], nfreq: params[15], bandwidth: params[16], rms: params[23], taper: params[24],
  });
  try {
    const ranges = outputRanges({ ...params[31], maxRange, patched }, steps);
    return { hd: params[20], step: params[18], maxRange, ranges, windowAt: rows[30].at };
  } catch (error) {
    throw new Error(`${rows[30].at}: ${error.message}`);
  }
}

// Each interface is linear between its own knots and constant beyond its last.
function atRange(curve, r) {
  const i = curve.findIndex((p) => p.r > r);
  if (i < 0) return curve.at(-1).z;
  const a = curve[i - 1], b = curve[i];
  return a.z + (b.z - a.z) * ((r - a.r) / (b.r - a.r));
}

function readEnvironment(file, { hd, step, maxRange }) {
  const rows = records(file);
  const f = Math.fround;
  // pemp.f:277,564,837-846. Check the whole march, not just the output window.
  // For DZKM=0 the solver chooses the step; knot crossings still need manual
  // verification with the actual solver step, independent of output indexing.
  const nz = step > 0 ? Math.trunc(f(f(maxRange / step) + 0.5)) : 0;
  need(!nz || Number.isFinite(f(f(1000 * step) * f(nz))), file, "explicit march range must be finite in REAL meters");
  let cursor = 0;
  function take(name, size) {
    while (cursor < rows.length && !rows[cursor].text.trim()) cursor++;
    need(cursor < rows.length, `${file}:${cursor + 1}`, `missing ${name}`);
    const { text, at } = rows[cursor++];
    const fields = tokens(text);
    need(size === undefined || fields.length === size, at, `${name}: expected ${size} fields, got ${fields.length}`);
    return { fields, at };
  }
  function count(name, min, max) {
    const { fields, at } = take(name, 1);
    return integer(fields[0], at, name, min, max);
  }
  function range(token, previous, at) {
    const km = real(token, at);
    const r = f(1000 * km);
    need(Number.isFinite(r), at, "range must be finite in REAL meters");
    need(previous === undefined ? r === 0 : r > previous.r, at, "ranges must start at zero and strictly increase in REAL meters");
    // phase2.f converts knots to meters and advances each cursor at most once
    // per step, on equality as well as overshoot. The zero knot is initialized
    // separately; nz + 1 denotes a knot that the march never reaches.
    const crossing = nz && r > 0 ? lastStepAt(nz, step, km, false) + 1 : 0;
    if (crossing > 0 && crossing <= nz) {
      need(crossing !== previous?.crossing, at, "one range step crosses multiple knots of the same environment list");
    }
    return { r, crossing };
  }
  count("ISEED", -2147483648, 2147483647);
  const profiles = count("NSS", 1, 100);
  let lastRange;
  for (let i = 0; i < profiles; i++) {
    const { fields, at } = take("SSP header", 2);
    lastRange = range(fields[0], lastRange, at);
    const n = integer(fields[1], at, "NSSD", 1, 512);
    const profile = [];
    while (profile.length < 2 * n) {
      const row = take("SSP depths and speeds");
      need(profile.length + row.fields.length <= 2 * n, row.at, `more than ${n} depth/speed pairs`);
      for (const token of row.fields) {
        const v = real(token, row.at);
        if (profile.length % 2 === 0) {
          need(v >= 0 && (!profile.length || v > profile.at(-2)), row.at, "SSP depths must be nonnegative and strictly increase");
        } else {
          need(v > 0, row.at, "SSP sound speed must be positive");
        }
        profile.push(v);
      }
    }
    const extendsToHD = profile.at(-2) < hd;
    need(n !== 512 || !extendsToHD, at, "NSSD=512 leaves no slot for extension to HD");
    need(n > 1 || extendsToHD, at, "SSP interpolation requires two depths after extension to HD");
  }
  function curve(name, min, width) {
    const n = count(name, min, 100);
    const points = [];
    for (let i = 0; i < n; i++) {
      const { fields, at } = take(`${name} row`, width);
      const knot = range(fields[0], points.at(-1), at);
      const [z] = fields.slice(1).map((v) => real(v, at));
      if (name === "NBS") need(z >= 0, at, "negative sediment thickness; use zero for no sediment");
      points.push({ ...knot, z, at });
    }
    return points;
  }
  const basement = curve("NB", 1, 10);
  const sediment = curve("NBS", 0, 10);
  curve("NS", 0, 2);
  curve("NSB", 0, 2);
  need(cursor === rows.length, rows[cursor]?.at, "unexpected records after NSB");
  // Difference of piecewise-linear functions: its minimum is at a knot of either grid.
  for (const { r, at } of [...basement, ...sediment]) {
    const bd = atRange(basement, r);
    const thickness = sediment.length ? atRange(sediment, r) : 0;
    need(bd < hd, at, `basement depth ${bd} must be inside HD=${hd}`);
    need(bd > thickness, at, `at range ${r / 1000} km, basement depth ${bd} minus sediment thickness ${thickness} leaves no water`);
  }
}

// pemp.f:73-153 reads these records even for disabled outputs. Check shape,
// not whether the user selected the intended frequencies or output products.
function checkFileList(rows, file) {
  need(rows.length === 44, file, `expected 44 file-list records, got ${rows.length}`);
  const flags = new Map([[3, 1], [6, 1], [9, 1], [12, 1], [14, 1], [16, 1], [18, 1],
    [20, 1], [22, 1], [24, 2], [27, 4], [32, 4], [38, 3], [43, 1]]);
  for (const [i, { text, at }] of rows.entries()) {
    const width = flags.get(i + 1);
    if (width) {
      const fields = tokens(text);
      need(fields.length === width, at, `expected ${width} output flag/selector integers`);
      for (const token of fields) integer(token, at, "output flag/selector", -2147483648, 2147483647);
    } else {
      need(text.trim() && Buffer.byteLength(text.trimEnd()) <= 50, at, "expected filename fitting A50");
    }
  }
}

/** Validate a run directory without opening output files or executing UMPE. */
export function validateUmpeCase(args) {
  const patched = args.includes("--patched-range-index");
  const positional = args.filter(arg => arg !== "--patched-range-index");
  if (positional.length > 1 || positional.some(arg => arg.startsWith("-")) ||
      args.length !== positional.length + Number(patched)) {
    console.error("Usage: ocean-acoustics-expert validate_umpe_inp [--patched-range-index] [case-dir]");
    return 2;
  }
  try {
    const dir = resolve(positional[0] ?? ".");
    const file = resolve(dir, "pefiles.inp");
    const rows = records(file);
    function input(i) {
      const name = rows[i]?.text.trimEnd();
      need(name && Buffer.byteLength(name) <= 50, `${file}:${i + 1}`, "expected an input filename fitting A50");
      return resolve(dir, name);
    }
    const grid = readRun(input(0), patched);
    readEnvironment(input(1), grid);
    checkFileList(rows, file);
    const { count, reported, skip } = grid.ranges;
    if (reported !== count) {
      console.warn(`${grid.windowAt}: stock UMPE reports ${reported} ranges but selects ${count}; TL line and field lengths can differ.`);
    }
    console.log(`UMPE input preflight passed (${patched ? "patched" : "stock"}: ${count} output ranges, effective NSKIP=${skip}).`);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}
