import { runCheck } from "./check.js";

const USAGE = `Usage: ocean-acoustics-expert <command> [options]

Commands:
  check    Validate the knowledge base`;

const COMMANDS = {
  check: runCheck,
};

/**
 * Dispatch a CLI invocation.
 * @param {string[]} argv Arguments after the executable and script path.
 * @returns {number} Process exit code: 0 ok, 1 failed check, 2 usage error.
 */
export function main(argv) {
  const [command, ...rest] = argv;
  const handler = COMMANDS[command];
  if (!handler) {
    console.error(USAGE);
    return 2;
  }
  return handler(rest);
}
