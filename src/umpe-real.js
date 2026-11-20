// UMPE reads decimal fields directly into default Fortran REAL (binary32).
// A binary64 intermediate is exact enough except at a binary32 midpoint.
const bits = new DataView(new ArrayBuffer(4));

// Compare the decimal input magnitude with the exact midpoint n * 2**e.
// Its exact decimal coefficient has at most 113 digits, even for subnormals.
function compareMidpoint(token, n, e) {
  const edge = (e >= 0 ? BigInt(n) << BigInt(e) : BigInt(n) * 5n ** BigInt(-e)).toString();
  const [mantissa, exponent = "0"] = token.replace(/^[+-]/, "").split(/[dDeE]/);
  const [whole, fraction = ""] = mantissa.split(".");
  const digits = (whole + fraction).replace(/^0+/, "");
  const order = digits.length + Number(exponent) - fraction.length;
  const edgeOrder = edge.length + Math.min(e, 0);
  if (order !== edgeOrder) return Math.sign(order - edgeOrder);
  // Same decimal order: compare significant digits, padding with trailing zeros.
  const prefix = digits.slice(0, edge.length).padEnd(edge.length, "0");
  if (prefix !== edge) return prefix < edge ? -1 : 1;
  return /[1-9]/.test(digits.slice(edge.length)) ? 1 : 0;
}

/** Read one decimal token with round-to-nearest, ties-to-even semantics. */
export function parseUmpeReal(token) {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[dDeE][+-]?\d+)?$/.test(token)) return NaN;
  const x = Number(token.replace(/[dD]/, "e"));
  const rounded = Math.fround(x);
  if (!Number.isFinite(x) || x === rounded) return rounded;
  const mag = Math.abs(x);
  bits.setFloat32(0, Math.abs(rounded));
  const lower = bits.getUint32(0) - Number(Math.abs(rounded) > mag);
  const exp = lower >>> 23;
  const significand = (lower & 0x7fffff) + (exp ? 0x800000 : 0);
  const n = 2 * significand + 1, e = Math.max(exp, 1) - 127 - 24;
  if (mag !== n * 2 ** e) return rounded;
  const side = compareMidpoint(token, n, e);
  if (!side) return rounded; // An exact decimal tie: fround already picked even.
  bits.setUint32(0, lower + Number(side > 0));
  return x < 0 ? -bits.getFloat32(0) : bits.getFloat32(0);
}
