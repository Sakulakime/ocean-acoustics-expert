import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BIN = fileURLToPath(new URL("../../bin/ocean-acoustics-expert.js", import.meta.url));

/**
 * Run the CLI as a subprocess, the project's single test seam.
 * @param {string[]} args
 * @returns {{status: number|null, stdout: string, stderr: string}}
 */
export function runCli(args) {
  const result = spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
