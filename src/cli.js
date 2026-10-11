import { runCheck } from "./check.js";
import { runDoctor } from "./doctor.js";
import { runInstall } from "./install.js";
import { runStatus } from "./status.js";
import { runUninstall } from "./uninstall.js";

const USAGE = `Usage: ocean-acoustics-expert <command> [options]

Commands:
  install    Install the expert into coding-agent harnesses; on a terminal, asks which ones
             [--harness <name>]... [--mode link|copy] [--dry-run] [--yes] [--at-2023 <dir>] [--at-2020 <dir>]
  status     Show what is installed
  doctor     Diagnose the installation; reports problems, changes nothing
  uninstall  Remove what install wrote [--restore: also put back its backups]
  check      Validate the knowledge base [--kb <dir>] [--cases <file>] [--helpers <dir>]`;

const COMMANDS = {
  install: runInstall,
  status: runStatus,
  doctor: runDoctor,
  uninstall: runUninstall,
  check: runCheck,
};

/**
 * Dispatch a CLI invocation.
 * @param {string[]} argv Arguments after the executable and script path.
 * @returns {Promise<number>} Process exit code: 0 ok, 1 failed check, 2 usage error, 130 cancelled.
 */
export async function main(argv) {
  const [command, ...rest] = argv;
  const handler = COMMANDS[command];
  if (!handler) {
    console.error(USAGE);
    return 2;
  }
  return handler(rest);
}
