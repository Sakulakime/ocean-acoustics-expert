# 13: Deepen the COA chapter notes for normal modes and parabolic equations

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** The chapter notes for COA chapters 5 (normal modes) and 6 (parabolic equations) gain:

- key equations, with symbols defined and COA equation numbers
- quantitative validity conditions: e.g. PE angle limits, adiabatic and coupled-mode assumptions, mode-count and cutoff behaviour

The expert can then justify solver choices for data generation without going to the PDF.

**Blocked by:** 02

**Status:** done

- [x] Each major subsection of both chapter notes lists its key equations with symbol definitions and COA equation numbers
- [x] Each method's validity conditions are stated quantitatively where COA gives numbers
- [x] Fallback windows in the routing map checked against the PDF and corrected where off
- [x] Concept-index and route-selection cases added for any newly covered concepts; `check` passes

## Comments

**Done (2026-10-10), commits `703501c`, `8f173b1` and `05427d6`.** `check` passes 41 route-selection cases, and the full suite has 169 tests.

**Chapter notes** (`status: deepened`). Every major subsection now has three blocks:
- **Key equations**: inline LaTeX, symbols defined, COA equation number, section and PDF page.
- **Validity conditions**: COA's numbers where it gives them, each with section and PDF page.
- **Topics**: the old topic list, corrected.

| Note | Subsections | Equation numbers cited |
|---|---|---|
| ch05 | 9; §5.12 (scattering from objects) is new, and §5.13 and §5.14 are now separate | 109 |
| ch06 | 10, aligned to COA sections | 103 |

Validity conditions include:
- cutoff frequency and mode counts;
- about 10 points per wavelength, with Richardson extrapolation;
- Sturm and Prüfer limits;
- coupled-mode range steps under λ/2;
- PE angle limits at phase errors of 0.002 and 0.0002;
- starter–propagator pairings;
- Δz ≤ λ/4, and Δr of 2-5 Δz or 20-50 Δz;
- energy loss on stair-stepped slopes;
- N×2-D versus 3-D.

Where COA gives no number, the note says so. Examples: no quantitative adiabatic criterion, and no typical β in Ch. 5.

The notes also fix errors in the old ones:
- energy conservation is a vertical-interface condition on stair-stepped slopes, not marching drift (§6.7);
- the split-step error analysis is about range-gradient and splitting terms, not numerical dispersion;
- the elastic-PE topics belonged to §6.5.4 and §6.6.1.

**How the notes were checked.**
- Drafts were written from the PDF.
- A script confirmed that every cited `eq. (n.m) … PDF p. N` is printed on that page.
- Equations whose glyphs pdftotext drops (minus, π, ρ) were read from rendered page images: (5.13)-(5.18), (5.81)-(5.82), (5.176), (5.180)-(5.181), (5.210)-(5.212), (5.271), (5.279), (5.307), (5.320), (5.342).
- Quantitative claims were checked against the PDF text.
- A two-axis review spot-checked more and found no wrong number.

**Fallback windows.**
- **Names unchanged; six COA ranges corrected** to section boundaries (a section ends on the page where the next one starts, unless that one starts at the top of a page):

  | Window | Before | After |
  |---|---|---|
  | `derivation_and_greens_function` | 354-372 | 354-373 |
  | `perturbation_and_group_velocity` | 402-420 | 402-408 |
  | `range_dependence_and_mode_coupling` | 420-442 | 419-430 |
  | `derivation_and_limits` | 473-492 | 473-488 |
  | `starters_and_split_step` | 493-512 | 488-513 |
  | `energy_and_3d` | 519-528 | 522-527 |

  The PDF outline points §5.7 and §5.11 one page late; their headings sit at the bottom of PDF pp. 377 and 419.
- **Six new windows** for sections no window covered:
  - `normal_modes`: `numerical_methods_and_mode_counting` 377-402, `elastic_media` 408-419, `scattering_from_objects` 430-439, `three_dimensional_modes` 440-455;
  - `wave_propagation_theory`: `waveguide_invariant_realistic` 455-462, which is §5.14. It sits there because the `waveguide_invariant` concept is on that route, and a comment in the routing map says so;
  - `parabolic_equations`: `fd_fe_solutions` 513-521.
- **Page offsets.** Ch. 5 is PDF = book + 17 throughout, and Ch. 6 is + 16. The blank versos at book pp. 456 and 530 are missing from the PDF, so the frontmatter spans stand.
- **Still uncovered:** §5.6 (Munk profile, 373-377) and §6.9 (numerical examples, 528-539). Both are benchmark material for ticket 15.

**Concepts and routes.**
- 11 new concepts: `mode_cutoff`, `leaky_modes`, `mode_counting`, `modal_attenuation`, `elastic_normal_modes`, `waveguide_target_scattering`, `three_dimensional_modes`, `pe_angle_limits`, `ifd_pe`, `energy_conserving_pe`, `three_d_pe`.
- Wider aliases:
  - `mode_coupling` takes the adiabatic aliases and "one-way coupled modes", instead of a separate concept that would have taken the existing "Compare adiabatic modes and mode coupling" case away from it;
  - `starter_field` takes the analytic starters and "starting field(s)";
  - `split_step_fourier` takes "split-step PE".
- `rational_approximation` reads `derivation_and_limits` (§6.2.3) first (user's decision); `waveguide_invariant` gains the §5.14 window.
- 22 new route-selection cases. Guards, each mutation-checked: the adiabatic equation of state matches no concept, and implicit finite differences for the wave equation stay on `wave_equation`. Four compound prompts from the review keep their old routes: adiabatic or coupled modes with internal waves, the adiabatic waveguide invariant, and the mode count of the Pekeris waveguide.
- "self-starter" was left off `starter_field`: it would have moved Collins & Siegmann's elastic-PE line off `elastic_pe` and lost its window.

**Route audit (story 13).**
- 2,057 HEAD prompts (note headings and bullets, trigger keywords, aliases, cases) were resolved before and after.
- Only four change route, all from `parabolic_equation`, which the bare alias "pe" matched inside "perturbation", "dependent" and "upper": two §5.9 headings go to `modal_attenuation`, the glossary's "Adiabatic modes" goes to `mode_coupling`, and a KRAKEN runbook line goes to `mode_cutoff`.
- Eight more move to a more specific concept on the same route.
- Accepted: a prompt that names a new, more specific concept together with an older concept goes to the new one when its alias is longer. Examples: "3D PE with a PML" goes to `three_d_pe` instead of `pml`; "leaky modes of the Pekeris problem" goes to `leaky_modes`, whose notes include ch02.

**`check`** (TDD through the CLI):
- a deepened chapter note needs a chapter number and major subsections, and every major subsection must cite an equation of its own chapter, such as (5.18);
- a note whose frontmatter check cannot parse is reported once, by its own rule; before, it would crash the new rule or be reported again through a fallback window.

**Agent and hub.**
- The hub says which chapter notes are deepened and to take equations and validity limits from them first.
- The agent's fallback rule now sends exact equations to a PDF only when the notes do not give them. The router already said this. A new test in `test/agent-rules.test.js` covers it.
- This reaches the harnesses only after a reinstall, which waits for the user's approval. The per-harness smokes would then need re-running.

**Gap for `/domain-modeling`:** "deepened" (a chapter note with key equations and validity conditions) is not in `GLOSSARY.md`.
