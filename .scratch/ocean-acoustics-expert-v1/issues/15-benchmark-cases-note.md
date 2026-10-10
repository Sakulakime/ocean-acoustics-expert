# 15: Benchmark cases note

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** A cross-chapter note catalogues the benchmark cases used in COA, so the expert can give exact, reproducible test environments and say which methods each case validates. It includes at least the Pekeris waveguide, the Munk profile, the ASA wedge and the Dickins seamount, plus the other canonical cases COA uses.

**Blocked by:** 02

**Status:** done, except the live-agent smoke (pending for the parent)

- [x] Each benchmark case has: environment parameters, COA figure and page references, solver families it validates, known reference solutions
- [x] Routing map and concept index route benchmark questions to the note; chapter notes link to it where they use a case
- [x] Route-selection cases added; `check` passes
- [ ] Smoke (routing verified; live-agent run pending): "give me the ASA wedge parameters and which solvers it validates" is answered from the note with a `[textbook: …]` tag

## Comments

**Done (2026-10-10), commits `21a6f9f`, `c9689a1`, `17efc7b`, `69963b0` and `f0805ee`.** `check` passes 55 route-selection cases, and the full suite has 172 tests.

**Note** (`knowledge/benchmark-cases.md`, `type: benchmark-cases`). 14 cases under `## Cases`, each with **Environment**, **COA references**, **Validates** and **Reference solutions**, plus a family-to-case table and a list of COA field examples not catalogued as cases (Maltese front, Arctic, warm-core eddy, generic deep water, isovelocity waveguide).

| Case | COA PDF pages |
|---|---|
| Pekeris waveguide (Ch. 2, 4, 5, 8 variants) | 137-151, 281-289, 366-373, 456, 651-655 |
| Munk profile | 373-377, 229-231, 391-392, 456 |
| ASA wedge | 522-523 |
| 2-D wedge mode cutoff | 530-532, 543 |
| 3-D (truncated) wedge | 533-540, 655-659 |
| Dickins seamount | 208-211, 530-532 |
| Conical seamounts in a Munk ocean | 446-455 |
| NORDA PE Workshop test 3B | 484-486, 497-498 |
| Sloping elastic bottom | 533-534, 488 |
| Waveguide with an elastic bottom | 315-317 |
| Bucker waveguide | 318-319 |
| Parabolic bottom profile | 210-212 |
| Lloyd-mirror image solution | 36-39, 498-501 |
| Head-wave problem | 648-650 |
| Spherical shell near the seabed | 605-612 |

- Page offsets: PDF = book + 19 (Ch. 1-2), + 18 (Ch. 3-4), + 17 (Ch. 5), + 16 (Ch. 6), + 15 (Ch. 7, 8 and 10).
- A throwaway script confirmed that all 107 cited figures and equations are printed on their cited PDF pages. Figure 6.12 (Dickins seamount PE) sits on PDF p. 530, two pages before its text. Eq. (5.83) glyphs that pdftotext drops were recovered from mutool's per-glyph text output; image reading was not available.
- Where COA gives no number the note says so: the ASA wedge receiver depth, the Munk water depth, the Bucker sound speeds, the parabolic-bottom sound speed, the Dickins profile (a measured North-Pacific profile shown only on Fig. 6.12), the Ch. 5 Pekeris frequency, and the parameters of the PE Workshop II elastic wedge.
- "Dickins seamount" is COA's name for the Ch. 3 ray case (PDF p. 210-211); the Ch. 6 §6.9.3 PE seamount shares its 230 Hz and 18 m source, and COA §3.6.3 points to it. The note treats them as one case and says so.

**Route `benchmark_cases`.** Notes: benchmark-cases.md, ch05, ch06, model-selection. No `chapter_span`: the cases span Ch. 1-8, and no code reads the field (only the routing map has it; `ocean_fluctuations` already omits it). A `note:` line says so. Twelve COA windows: `lloyd_mirror` 36-39, `pekeris_waveguide` 137-151, `ray_seamount_and_parabolic_bottom` 206-212, `ray_munk_interpolation` 229-231, `wi_numerical_examples` 315-319, `munk_profile` 373-377, `seamount_3d_modes` 446-455, `pe_workshop_tests` 482-501, `asa_wedge` 522-523, `pe_numerical_examples` 528-539, `fe_object_scattering` 605-612, `broadband_numerical_examples` 648-666. §5.6 and §6.9 are now covered.

**Concepts** (9 new, all on `benchmark_cases`): `benchmark_cases`, `munk_profile`, `asa_wedge`, `wedge_mode_cutoff`, `three_d_wedge`, `dickins_seamount`, `pe_workshop_test`, `sloping_elastic_bottom`, `bucker_waveguide`. No bare "wedge", "seamount", "munk" or "bucker" alias. `pekeris_waveguide` keeps its key, aliases and route and gains `benchmark-cases.md` as a secondary note. No `lloyd_mirror` or `head_wave_problem` concept: "head wave" already belongs to `lateral_wave`, and the existing starter-field line mentioning Lloyd-mirror beams should stay with `starter_field`; both cases are reachable through the route's trigger keywords.

**Route-selection cases** (14 new): the smoke prompt resolves to `asa_wedge` on `benchmark_cases` with `benchmark-cases.md` primary (and asserts the route's notes); one per new concept, including a Chinese 基准算例 prompt; four compound guards, each mutation-checked by adding an over-reaching alias and confirming the guard alone fails, then restoring: Munk-profile internal waves stay `internal_waves`, a wedge-shaped coastal waveguide keeps `mode_coupling`, 3-D normal modes around a seamount in a Munk ocean keep `three_dimensional_modes`, and wide-angle PE phase errors on the ASA wedge keep `pe_angle_limits`. Removing "asa wedge" fails the smoke case. The two Pekeris cases now expect the new secondary note.

**Route audit (story 13).** 2,450 HEAD prompts (note headings and bullets, trigger keywords, aliases, cases) resolved before and after. 10 change, all into `benchmark_cases`, and all are prompts that name a benchmark case:
- three Munk-profile lines in ch05 (two had no concept; one went to `leaky_modes`);
- two ASA wedge lines in ch06 (one had no concept, one went to `pe_angle_limits`), plus ch06's comparison line that cites "its ASA wedge reference" (from `parabolic_equation`);
- the 3-D wedge validity line (from `three_d_pe`);
- three ch06 lines naming sloping elastic bottoms or the PE Workshop II elastic wedge (from `elastic_pe`, `parabolic_equation` and `mode_cutoff`; the last is the §6.9 overview line).

Accepted on the rule of ticket 13: a prompt that names a benchmark case together with a method concept goes to the case when its alias is longer, and the case's concept lists the chapter note as a secondary note. The guards above pin the compound prompts that must not move.

**`check`** (TDD through the CLI): a note with `type: benchmark-cases` needs cases as `###` headings under `## Cases`, and each case needs the four blocks as bold label lines; each missing block is reported with file and case. Tests cover a missing block, a note with no cases, and a passing note whose blocks are in another order. Deepened chapter notes and benchmark cases share one subsection parser.

**Links.** The hub lists the note (retrieval step 3, source-of-truth list, topic map, related files); the routing map's policy names it. Chapter notes ch04, ch05, ch06, ch07 and ch08 link to it from the subsections that use a case. ch01 mentions no case. ch02 and ch03 were not edited (ticket 14 is rewriting them); the parent adds these links after the merge:
- ch02 "Pekeris waveguide, waveguide invariants, and deep-ocean structure": Cross-links, `benchmark-cases.md` (Pekeris waveguide, all COA variants).
- ch02 "Halfspace solutions and transmission-loss normalization" or wherever ticket 14 places the image solution: Cross-links, `benchmark-cases.md` (Lloyd-mirror image solution), if that section covers it.
- ch03 "Boundaries, attenuation, and weak interfaces": Cross-links, `benchmark-cases.md` (Dickins seamount and parabolic bottom profile, §3.6.3).
- ch03 "Numerical ray tracing and eigenray search": Cross-links, `benchmark-cases.md` (Munk profile interpolation and false caustics, §3.7.4).
- After merging, consider adding `chapters/ch03-ray-methods.md` to the `benchmark_cases` route notes.

**Smoke.** Routing answers the smoke prompt (case above). The live-agent run (answer from the note with a `[textbook: …]` tag) needs a reinstall and the paid CLIs, so it is pending for the parent.
