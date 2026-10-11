import assert from "node:assert/strict";
import { test } from "node:test";

import { checkboxKey, confirmKey, initialCheckbox, promptCheckbox, renderCheckbox } from "../src/prompt.js";
import { fakeTerminal } from "./helpers/terminal.js";

const CHOICES = [
  { value: "claude", label: "Claude Code", hint: "found at ~/.claude" },
  { value: "codex", label: "Codex" },
  { value: "deepseek", label: "DeepSeek-TUI (dst)" },
];

/** @param {string[]} names Key names pressed in order. */
function press(state, ...names) {
  return names.reduce((current, name) => checkboxKey(current, { name }), state);
}

test("a checkbox starts with the given values checked and the cursor on the first choice", () => {
  const state = initialCheckbox(CHOICES, ["deepseek"]);
  assert.deepEqual(state.checked, [false, false, true]);
  assert.equal(state.cursor, 0);
  assert.equal(state.status, "open");
});

test("the cursor moves with arrows and vi keys and wraps at both ends", () => {
  const state = initialCheckbox(CHOICES, []);
  assert.equal(press(state, "up").cursor, 2);
  assert.equal(press(state, "down", "down", "down").cursor, 0);
  assert.equal(press(state, "j", "k", "j").cursor, 1);
});

test("space toggles the highlighted choice and a toggles all of them", () => {
  const state = initialCheckbox(CHOICES, ["claude"]);
  assert.deepEqual(press(state, "space").checked, [false, false, false]);
  assert.deepEqual(press(state, "down", "space").checked, [true, true, false]);
  assert.deepEqual(press(state, "a").checked, [true, true, true]);
  assert.deepEqual(press(state, "a", "a").checked, [false, false, false]);
});

test("enter confirms only when something is checked", () => {
  const none = press(initialCheckbox(CHOICES, []), "return");
  assert.equal(none.status, "open");
  assert.match(none.message, /at least one/);
  assert.equal(press(none, "down").message, null);
  assert.equal(press(initialCheckbox(CHOICES, ["codex"]), "return").status, "done");
});

test("ctrl+c, esc and q cancel, and a closed prompt ignores further keys", () => {
  const state = initialCheckbox(CHOICES, ["claude"]);
  assert.equal(checkboxKey(state, { name: "c", ctrl: true }).status, "cancelled");
  assert.equal(press(state, "escape").status, "cancelled");
  const cancelled = press(state, "q");
  assert.equal(cancelled.status, "cancelled");
  assert.deepEqual(press(cancelled, "space", "return"), cancelled);
});

test("the rendered checkbox marks the cursor, the checked choices and the hints", () => {
  const lines = renderCheckbox("Install into which harnesses?", CHOICES, press(initialCheckbox(CHOICES, ["codex"]), "down"));
  assert.deepEqual(lines.slice(0, 4), [
    "? Install into which harnesses?",
    "  [ ] Claude Code  (found at ~/.claude)",
    "> [x] Codex",
    "  [ ] DeepSeek-TUI (dst)",
  ]);
  assert.match(lines[4], /space toggle/);
});

test("a yes/no question takes y, n, enter for the default, and cancel as no", () => {
  assert.equal(confirmKey({ name: "y" }, false), true);
  assert.equal(confirmKey({ name: "n" }, true), false);
  assert.equal(confirmKey({ name: "return" }, true), true);
  assert.equal(confirmKey({ name: "return" }, false), false);
  assert.equal(confirmKey({ name: "c", ctrl: true }, true), false);
  assert.equal(confirmKey({ name: "x" }, true), null);
});

test("promptCheckbox reads keys from a terminal and restores it afterwards", async () => {
  const { input, output, written, type } = fakeTerminal();
  const answer = promptCheckbox({ input, output, title: "Pick", choices: CHOICES, selected: ["claude"] });
  await type("\x1b[B", " ", "\r");
  assert.deepEqual(await answer, ["claude", "codex"]);
  assert.equal(input.isRaw, false);
  assert.match(written(), /✔ Pick Claude Code, Codex/);
  assert.match(written(), /\x1b\[\?25h$/);
});
