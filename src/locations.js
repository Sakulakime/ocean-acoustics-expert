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
 * @property {string} codexDir Codex's config folder: `CODEX_HOME` when absolute, else `~/.codex`.
 * @property {string} opencodeDir OpenCode's user config folder: `XDG_CONFIG_HOME/opencode`, else `~/.config/opencode`.
 * @property {string} deepseekDir DeepSeek-TUI's config folder: `DEEPSEEK_HOME` when absolute, else `~/.deepseek`.
 */

/**
 * Resolve the install locations from the environment: `HOME`,
 * `XDG_DATA_HOME`, `XDG_CONFIG_HOME`, `CLAUDE_CONFIG_DIR`, `CODEX_HOME`
 * and `DEEPSEEK_HOME`.
 * @returns {Locations}
 */
export function installLocations() {
  const { XDG_DATA_HOME, XDG_CONFIG_HOME, CLAUDE_CONFIG_DIR, CODEX_HOME, DEEPSEEK_HOME } = process.env;
  const home = homedir();
  const dataDir = join(absoluteOr(XDG_DATA_HOME, join(home, ".local", "share")), "ocean-acoustics-expert");
  return {
    home,
    dataDir,
    knowledgeBase: join(dataDir, "knowledge"),
    matlabHelpers: join(dataDir, "matlab"),
    pathMap: join(dataDir, "local-paths.yaml"),
    manifest: join(dataDir, "manifest.json"),
    backups: join(dataDir, "backups"),
    sharedSkills: join(home, ".agents", "skills"),
    claudeDir: absoluteOr(CLAUDE_CONFIG_DIR, join(home, ".claude")),
    codexDir: absoluteOr(CODEX_HOME, join(home, ".codex")),
    opencodeDir: join(absoluteOr(XDG_CONFIG_HOME, join(home, ".config")), "opencode"),
    deepseekDir: absoluteOr(DEEPSEEK_HOME, join(home, ".deepseek")),
  };
}

/**
 * @param {string|undefined} value A path from the environment.
 * @param {string} fallback
 * @returns {string} The value when it is an absolute path, else the fallback.
 */
function absoluteOr(value, fallback) {
  return value && isAbsolute(value) ? value : fallback;
}
