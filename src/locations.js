import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

/**
 * Where the installer puts things for the current user (ADRs 0003, 0004).
 * @typedef {object} Locations
 * @property {string} home
 * @property {string} dataDir Per-user data directory holding the installed copy.
 * @property {string} knowledgeBase Installed copy of the knowledge base.
 * @property {string} matlabHelpers Installed MATLAB solver helpers.
 * @property {string} pathMap The generated local path map.
 * @property {string} manifest Record of everything the installer wrote.
 * @property {string} backups Folder of timestamped backup folders.
 * @property {string} sharedSkills Canonical skills folder, read by Codex and OpenCode.
 * @property {string} claudeDir Claude Code's user config folder.
 */

/**
 * Resolve the install locations from the environment: `HOME`,
 * `XDG_DATA_HOME` and `CLAUDE_CONFIG_DIR`.
 * @returns {Locations}
 */
export function installLocations() {
  const { XDG_DATA_HOME, CLAUDE_CONFIG_DIR } = process.env;
  const home = homedir();
  const dataHome = XDG_DATA_HOME && isAbsolute(XDG_DATA_HOME) ? XDG_DATA_HOME : join(home, ".local", "share");
  const dataDir = join(dataHome, "ocean-acoustics-expert");
  return {
    home,
    dataDir,
    knowledgeBase: join(dataDir, "knowledge"),
    matlabHelpers: join(dataDir, "matlab"),
    pathMap: join(dataDir, "local-paths.yaml"),
    manifest: join(dataDir, "manifest.json"),
    backups: join(dataDir, "backups"),
    sharedSkills: join(home, ".agents", "skills"),
    claudeDir: CLAUDE_CONFIG_DIR && isAbsolute(CLAUDE_CONFIG_DIR) ? CLAUDE_CONFIG_DIR : join(home, ".claude"),
  };
}
