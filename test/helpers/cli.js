import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BIN = fileURLToPath(new URL("../../bin/ocean-acoustics-expert.js", import.meta.url));

/**
 * Run the CLI as a subprocess, the project's single test seam.
 * @param {string[]} args
 * @param {{bin?: string, env?: Record<string, string>}} [options] The CLI script to run
 *   (default: this checkout's) and the full environment (default: inherited).
 * @returns {{status: number|null, stdout: string, stderr: string}}
 */
export function runCli(args, { bin = BIN, env } = {}) {
  const result = spawnSync(process.execPath, [bin, ...args], { encoding: "utf8", env });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
