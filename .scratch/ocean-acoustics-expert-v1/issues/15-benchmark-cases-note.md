# 15: Benchmark cases note

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** A cross-chapter note catalogues the benchmark cases used in COA, so the expert can give exact, reproducible test environments and say which methods each case validates. It includes at least the Pekeris waveguide, the Munk profile, the ASA wedge and the Dickins seamount, plus the other canonical cases COA uses.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Each benchmark case has: environment parameters, COA figure and page references, solver families it validates, known reference solutions
- [ ] Routing map and concept index route benchmark questions to the note; chapter notes link to it where they use a case
- [ ] Route-selection cases added; `check` passes
- [ ] Smoke: "give me the ASA wedge parameters and which solvers it validates" is answered from the note with a `[textbook: …]` tag
