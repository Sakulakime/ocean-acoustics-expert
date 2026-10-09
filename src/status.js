import { installLocations } from "./locations.js";
import { loadManifest, manifestCounts } from "./manifest.js";
import { describePathMap } from "./path-map.js";

/**
 * Print what is installed: version, mode, harnesses, paths and a summary of
 * the manifest.
 * @param {string[]} args No options.
 * @returns {number} Exit code: 0 shown, 1 unreadable manifest, 2 usage error.
 */
export function runStatus(args) {
  if (args.length > 0) {
    console.error(`status takes no arguments, got: ${args.join(" ")}`);
    return 2;
  }
  const locations = installLocations();
  const loaded = loadManifest(locations.manifest);
  if (!loaded) return 1;
  const { manifest } = loaded;
  if (!manifest) {
    console.log("ocean-acoustics-expert is not installed.");
    return 0;
  }

  const { files, links, backups } = manifestCounts(manifest);
  console.log(
    [
      `ocean-acoustics-expert ${manifest.version} is installed`,
      `mode: ${manifest.mode}`,
      `harnesses: ${manifest.harnesses.join(", ")}`,
      `data directory: ${locations.dataDir}`,
      `local path map: ${locations.pathMap}`,
      ...describePathMap(manifest.paths),
      `manifest: ${files} files, ${links} links, ${backups} backups`,
    ].join("\n"),
  );
  return 0;
}
