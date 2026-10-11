import { PassThrough } from "node:stream";

/**
 * A terminal made of streams: keys typed into its input, text written to its output.
 */
export function fakeTerminal() {
  const input = Object.assign(new PassThrough(), {
    isTTY: true,
    isRaw: false,
    setRawMode(mode) {
      this.isRaw = mode;
      return this;
    },
  });
  const output = new PassThrough();
  const chunks = [];
  output.on("data", (chunk) => chunks.push(chunk.toString()));
  return {
    input,
    output,
    written: () => chunks.join(""),
    /** Type keys one at a time, letting the prompt handle each before the next. */
    async type(...keys) {
      for (const key of keys) {
        input.write(key);
        await new Promise((resolve) => setImmediate(resolve));
      }
    },
  };
}
