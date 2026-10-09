# 03: Install into Claude Code (tracer bullet for the installer)

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADRs 0003, 0004)

**What to build:** Running the CLI's `install` for Claude Code makes Claude use the expert from this project. The steps:

- Render the agent from one harness-neutral template through a Claude adapter.
- Generate the local path map and the MATLAB configuration.
- Install the knowledge base once into the per-user data directory: a link to the authoring copy in link mode, a copy in copy mode.
- Place the router skill canonically in the shared skills folder, with a Claude symlink to it.
- Record everything in a manifest.

Overwritten files are backed up first, and the known legacy copies are cleaned up with backup. `status`, `uninstall` and `--restore` complete the round trip. After the tests pass, the installer runs for real on this machine.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Claude agent file rendered from the template: `tools: [Read, Grep, Glob]`, `model: inherit`, absolute path to the installed copy; no find-and-replace on existing files
- [ ] Local path map written with detected defaults, each overridable by a flag
- [ ] Link mode links the installed copy to the authoring copy and records the authoring root; link mode refuses when not run from a checkout
- [ ] Copy mode copies the knowledge base and records no authoring root
- [ ] Router skill canonical copy in the shared skills folder; Claude skills entry is a symlink to it
- [ ] Every overwritten file backed up into a timestamped backup folder in the data directory; manifest lists every file, link and backup
- [ ] Legacy cleanup with backup:
  - [ ] the current Claude agent file
  - [ ] the real-directory Claude router skill
  - [ ] the Claude knowledge folder
  - [ ] the broken router in the shared skills folder (`.Codex` paths)
  - [ ] the superseded route-selection test and its fixture in the Claude hooks tests folder
- [ ] `--dry-run` lists every write, link, backup and removal and changes nothing
- [ ] Re-running install with nothing changed is a no-op
- [ ] `status` prints version, mode, harnesses, paths and manifest summary
- [ ] `uninstall` removes exactly the manifest entries; `uninstall --restore` returns a fake home to its exact pre-install state
- [ ] All of the above covered by subprocess tests with an isolated fake home
- [ ] Real install on this machine done after reviewing its dry-run output
- [ ] Smoke in Claude Code from a project outside the home folder: a COA theory question is answered from chapter notes via the installed copy
