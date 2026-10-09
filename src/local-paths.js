/**
 * Schema of the local path map (ADR 0004). Notes never contain machine paths:
 * they name a machine-specific location by a logical name written `{{name}}`,
 * e.g. `{{at_2023}}/RAM/ram.exe`, and the generated `local-paths.yaml` maps
 * each name to a path on this machine. Book PDFs are not machine-specific:
 * they ship inside the knowledge base (ADR 0005).
 */

/**
 * @typedef {object} LocalPath
 * @property {string} name Logical name, written `{{name}}` in notes.
 * @property {string} description What lives at the location.
 * @property {boolean} [linkModeOnly] Only link-mode installs define it.
 */

/** @type {LocalPath[]} */
export const LOCAL_PATHS = [
  {
    name: "knowledge_base",
    description: "Installed copy of the knowledge base",
  },
  {
    name: "at_2023",
    description: "Acoustics Toolbox 2023 tree; holds the working Linux RAM binary RAM/ram.exe",
  },
  {
    name: "at_2020",
    description:
      "Acoustics Toolbox 2020 tree (atWin10_2020_11_4); holds the MATLAB scripts in Matlab/ (plotting included) and the BELLHOP and KRAKEN binaries in linux-bin/",
  },
  {
    name: "matlab_helpers",
    description: "MATLAB solver helpers: validators and runners for BELLHOP, KRAKEN and RAM",
  },
  {
    name: "authoring_root",
    description: "Project checkout holding the authoring copy of the knowledge base",
    linkModeOnly: true,
  },
];

/** Every logical name the local path map defines. */
export const LOGICAL_NAMES = new Set(LOCAL_PATHS.map((entry) => entry.name));
