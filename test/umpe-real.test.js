import assert from "node:assert/strict";
import test from "node:test";
import { parseUmpeReal } from "../src/umpe-real.js";

test("UMPE decimal conversion: decide both sides of a binary32 tie before rounding", () => {
  // The lower neighbor at the second midpoint is odd: a true tie rounds up.
  const ulp = 2 ** -23;
  for (const [token, value] of [
    ["1.0000000596046448", 1 + ulp], ["1.0000000596046447", 1],
    ["1.000000059604644775390625", 1], ["100000005960464477539062500001D-29", 1 + ulp],
    [".10000001788139343261718749E1", 1 + ulp], ["1.000000178813934326171875", 1 + 2 * ulp],
    ["1.000000178813934326171876", 1 + 2 * ulp],
  ]) {
    assert.equal(parseUmpeReal(token), value, token);
    assert.equal(parseUmpeReal(`-${token}`), -value, token);
  }
});

test("UMPE decimal conversion: ties next to zero and overflow, without huge powers for user input", () => {
  // 2**-150 is halfway from zero to the smallest binary32 subnormal.
  const tiny = 5n ** 150n, huge = 2n ** 128n - 2n ** 103n;
  for (const [token, expected] of [
    [`${tiny}E-150`, 0], [`${tiny - 1n}E-150`, 0], [`${tiny + 1n}E-150`, 2 ** -149],
    [String(huge - 1n), (2 - 2 ** -23) * 2 ** 127], [String(huge), Infinity],
    [String(huge + 1n), Infinity], ["1e999999999", Infinity], ["1e-999999999", 0],
  ]) {
    assert.equal(parseUmpeReal(token), expected, token);
    assert.equal(parseUmpeReal(`-${token}`), -expected, token);
  }
});
