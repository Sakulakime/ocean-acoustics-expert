// UMPE v1.1 MKS, default REAL (binary32) and INTEGER (signed 32-bit).
// See pemp.f:56-60,263-277,312-322,564,837-846,1036-1039.
const f = Math.fround;
const LIMIT = 1000;
const INT_MAX = 2 ** 31 - 1;

/** Largest step satisfying a monotone comparison (0 if none). */
function lastTrue(nz, accept) {
  let lo = 0, hi = nz;
  while (lo < hi) {
    const mid = hi - Math.floor((hi - lo) / 2);
    if (accept(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// Compare the same metre coordinates as the march. For example, .018/.006
// rounds below 3 in binary32, while the third step is exactly 18 metres.
export function lastStepAt(nz, dzKm, rangeKm, inclusive = true) {
  const dz = f(f(dzKm) * 1000), edge = f(f(rangeKm) * 1000);
  return lastTrue(nz, i => inclusive ? f(dz * f(i)) <= edge : f(dz * f(i)) < edge);
}

export function automaticRangeSteps({ speed, frequency, nfreq, bandwidth, rms, taper }) {
  const pi = f(Math.PI);
  const top = nfreq === 1 ? f(frequency) : f(f(frequency) + f(f(bandwidth) / 2));
  const k = f(f(f(2 * pi) * top) / f(speed));
  const angle = f(Math.max(f(f(rms) + f(taper)), 30) / f(180 / pi));
  // A target libm's sinf is not necessarily the rounded JS Math.sin. Propagate
  // both adjacent binary32 magnitudes as well; an index-sensitive result is
  // not certified. The sign is immaterial because UMPE squares the sine.
  const bits = new DataView(new ArrayBuffer(4));
  bits.setFloat32(0, Math.abs(Math.sin(angle)));
  const center = bits.getUint32(0);
  return [...new Set([center, Math.max(0, center - 1), Math.min(0x3f800000, center + 1)].map(value => {
    bits.setUint32(0, value);
    const sin = bits.getFloat32(0);
    return f(f(f(2 / k) / f(sin * sin)) / 1000);
  }))];
}

// Beyond 2^24, AMOD(FLOAT(offset), FLOAT(skip)) can select several integer
// offsets (or none) for a single stride multiple. Count the preimage of each
// representable multiple instead of scanning a potentially enormous march.
function stockCount(maxOffset, skip) {
  const stride = f(skip);
  if (maxOffset <= 2 ** 24) return 1 + Math.floor(maxOffset / stride);
  let count = 1; // offset 0
  for (let x = stride; x <= f(maxOffset); x += stride) {
    if (f(x) === x) count += lastTrue(maxOffset, i => f(i) <= x) - lastTrue(maxOffset, i => f(i) < x);
  }
  return count;
}

function plan({ start, end, maxRange, skip, patched }, step) {
  const nz = Math.trunc(f(f(f(maxRange) / step) + 0.5));
  if (!Number.isFinite(step) || step <= 0 || !(nz >= 1 && nz < INT_MAX)) {
    throw new Error("range step must give a nonempty march representable by a 32-bit Fortran loop");
  }
  const first = 1 + (patched ? lastStepAt(nz, step, start) : Math.trunc(f(f(start) / step)));
  const last = patched ? (f(end) === f(maxRange) ? nz : lastStepAt(nz, step, end)) : 1 + Math.trunc(f(f(end) / step));
  const maxOffset = Math.min(nz, last) - first;
  if (maxOffset < 0) throw new Error("output window contains no marched step");
  const span = last - first + 1;
  const reported = patched ? s => 1 + Math.floor((span - 1) / s) : s => Math.trunc(f(f(span) / f(s)));
  // Find the first skip for which the Fortran estimate fits.
  if (reported(skip) > LIMIT) skip = lastTrue(span, s => reported(s) > LIMIT) + 1;
  const count = patched ? 1 + Math.floor(maxOffset / skip) : stockCount(maxOffset, skip);
  return { first, count, reported: reported(skip), skip };
}

/** Reject an unsafe grid or an automatic step whose rounding changes the result. */
export function outputRanges(grid, steps) {
  const plans = steps.map(step => {
    try { return plan(grid, step); } catch (error) { return { error: error.message }; }
  });
  const result = plans[0];
  if (plans.some(p => p.error !== result.error || p.first !== result.first || p.count !== result.count ||
      p.reported !== result.reported || p.skip !== result.skip)) {
    throw new Error("automatic DZKM is too close to an index boundary; specify an explicit range step in record 18 and rerun preflight");
  }
  if (result.error) throw new Error(result.error);
  if (result.count > LIMIT) {
    throw new Error(`stock range index selects ${result.count} > ${LIMIT} output ranges (reports ${result.reported}, effective NSKIP=${result.skip}); ` +
      "this exceeds the documented limit and can overrun enabled TL arrays; shorten the output window or use a verified range-index build");
  }
  return result;
}
