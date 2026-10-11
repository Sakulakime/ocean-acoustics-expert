import { emitKeypressEvents } from "node:readline";

/**
 * Terminal prompts for interactive commands, with no dependencies: a
 * checkbox list and a yes/no question. Each prompt's state changes are a
 * pure function of the keys pressed, so they can be tested without a terminal.
 */

/**
 * @typedef {object} Choice
 * @property {string} value Returned when the choice is checked.
 * @property {string} label
 * @property {string} [hint] Shown after the label.
 */

/**
 * @typedef {object} CheckboxState
 * @property {number} cursor Index of the highlighted choice.
 * @property {boolean[]} checked One flag per choice.
 * @property {"open"|"done"|"cancelled"} status
 * @property {string|null} message Shown instead of the key help, until the next key.
 */

/**
 * A key as readline reports it.
 * @typedef {{name?: string, ctrl?: boolean}} Key
 */

const KEY_HELP = "  up/down move · space toggle · a all · enter confirm · esc cancel";

/**
 * @param {Choice[]} choices
 * @param {string[]} selected Values checked at the start.
 * @returns {CheckboxState}
 */
export function initialCheckbox(choices, selected) {
  return { cursor: 0, checked: choices.map((choice) => selected.includes(choice.value)), status: "open", message: null };
}

/**
 * @param {CheckboxState} state
 * @param {Key} key
 * @returns {CheckboxState} The state after the key; unchanged once the prompt is closed.
 */
export function checkboxKey(state, key) {
  if (state.status !== "open") return state;
  if (isCancel(key)) return { ...state, status: "cancelled" };
  const count = state.checked.length;
  const next = { ...state, message: null };
  switch (key.name) {
    case "up":
    case "k":
      return { ...next, cursor: (state.cursor - 1 + count) % count };
    case "down":
    case "j":
      return { ...next, cursor: (state.cursor + 1) % count };
    case "space":
      return { ...next, checked: state.checked.map((on, index) => (index === state.cursor ? !on : on)) };
    case "a": {
      const all = state.checked.every(Boolean);
      return { ...next, checked: state.checked.map(() => !all) };
    }
    case "return":
    case "enter":
      return state.checked.some(Boolean)
        ? { ...next, status: "done" }
        : { ...next, message: "  Select at least one with space, or press esc to cancel." };
    default:
      return state;
  }
}

/**
 * @param {string} title
 * @param {Choice[]} choices
 * @param {CheckboxState} state
 * @returns {string[]} The lines of an open prompt.
 */
export function renderCheckbox(title, choices, state) {
  const rows = choices.map((choice, index) => {
    const pointer = index === state.cursor ? ">" : " ";
    const box = state.checked[index] ? "[x]" : "[ ]";
    return `${pointer} ${box} ${choice.label}${choice.hint ? `  (${choice.hint})` : ""}`;
  });
  return [`? ${title}`, ...rows, state.message ?? KEY_HELP];
}

/**
 * Ask the user to check any of the choices.
 * @param {object} input
 * @param {NodeJS.ReadStream} input.input A terminal.
 * @param {NodeJS.WritableStream} input.output
 * @param {string} input.title
 * @param {Choice[]} input.choices
 * @param {string[]} input.selected Values checked at the start.
 * @returns {Promise<string[]|null>} The checked values in choice order, or null when cancelled.
 */
export function promptCheckbox({ input, output, title, choices, selected }) {
  return new Promise((resolve) => {
    let state = initialCheckbox(choices, selected);
    let drawn = 0;
    const draw = (lines) => {
      // Move back over the previous frame and clear it before drawing the next.
      const erase = drawn > 0 ? `\x1b[${drawn}A\r\x1b[0J` : "";
      output.write(`${erase}${lines.join("\n")}\n`);
      drawn = lines.length;
    };
    const stop = listenForKeys(input, (key) => {
      state = checkboxKey(state, key);
      if (state.status === "open") return draw(renderCheckbox(title, choices, state));
      stop();
      const values = choices.filter((_, index) => state.checked[index]).map((choice) => choice.value);
      const labels = choices.filter((_, index) => state.checked[index]).map((choice) => choice.label);
      draw([state.status === "done" ? `✔ ${title} ${labels.join(", ")}` : `✖ ${title} cancelled`]);
      output.write("\x1b[?25h");
      resolve(state.status === "done" ? values : null);
    });
    output.write("\x1b[?25l");
    draw(renderCheckbox(title, choices, state));
  });
}

/**
 * Ask a yes/no question; enter takes the default.
 * @param {object} input
 * @param {NodeJS.ReadStream} input.input A terminal.
 * @param {NodeJS.WritableStream} input.output
 * @param {string} input.question
 * @param {boolean} [input.defaultYes]
 * @returns {Promise<boolean>} False when the user says no or cancels.
 */
export function promptConfirm({ input, output, question, defaultYes = true }) {
  return new Promise((resolve) => {
    output.write(`? ${question} ${defaultYes ? "(Y/n)" : "(y/N)"} `);
    const stop = listenForKeys(input, (key) => {
      const answer = confirmKey(key, defaultYes);
      if (answer === null) return;
      stop();
      output.write(`${answer ? "yes" : "no"}\n`);
      resolve(answer);
    });
  });
}

/**
 * @param {Key} key
 * @param {boolean} defaultYes
 * @returns {boolean|null} The answer the key gives, or null for a key that gives none.
 */
export function confirmKey(key, defaultYes) {
  if (isCancel(key) || key.name === "n") return false;
  if (key.name === "y") return true;
  if (key.name === "return" || key.name === "enter") return defaultYes;
  return null;
}

/**
 * Ctrl+C arrives as a key, not a signal, while the terminal is in raw mode.
 * @param {Key} key
 */
function isCancel(key) {
  return (key.ctrl === true && key.name === "c") || key.name === "escape" || key.name === "q";
}

/**
 * Put the terminal in raw mode and pass each key to a handler.
 * @param {NodeJS.ReadStream} input
 * @param {(key: Key) => void} onKey
 * @returns {() => void} Stops listening and restores the terminal.
 */
function listenForKeys(input, onKey) {
  emitKeypressEvents(input);
  const wasRaw = input.isRaw === true;
  input.setRawMode(true);
  const listener = (_text, key) => {
    if (key) onKey(key);
  };
  input.on("keypress", listener);
  input.resume();
  return () => {
    input.off("keypress", listener);
    input.setRawMode(wasRaw);
    input.pause();
  };
}
