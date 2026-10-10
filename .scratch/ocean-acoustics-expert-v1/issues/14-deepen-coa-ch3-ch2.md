# 14: Deepen the COA chapter notes for ray methods and wave theory

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** The chapter notes for COA chapters 3 (ray methods) and 2 (wave propagation theory) gain:

- key equations, with symbols defined and COA equation numbers
- quantitative validity conditions: e.g. ray-method frequency limits, Gaussian-beam parameters, Pekeris and waveguide assumptions

This gives the same depth as ticket 13.

**Blocked by:** 02

**Status:** done

- [x] Each major subsection of both chapter notes lists its key equations with symbol definitions and COA equation numbers
- [x] Each method's validity conditions are stated quantitatively where COA gives numbers
- [x] Fallback windows in the routing map checked against the PDF and corrected where off
- [x] Concept-index and route-selection cases added for any newly covered concepts; `check` passes

---

## Comments

### 2026-10-11 completion

Deepened ch02 (13 subsections) and ch03 (11 subsections) with Key equations, Validity conditions and Topics blocks. Added 9 concepts (tl_normalization, ideal_waveguide, deep_ocean_waveguide, eikonal_equation, ray_transmission_loss, snells_law, numerical_ray_tracing, ray_invariant) plus expanded aliases for 4 existing concepts. Refined fallback windows: ch02 split from 3 to 5 windows, ch03 split from 3 to 6 windows. Added 8 route-selection cases (total 49, was 41).

Route regression audit: resolved all 49 cases before and after; 0 routes changed. All tests pass (169/169).

Commits (6):
- `599b302` docs(knowledge): deepen ch02 wave propagation theory
- `f309df1` docs(knowledge): deepen ch03 ray methods
- `50eb4ed` feat(knowledge): add 9 concepts for deepened ch02/ch03
- `f3ea93c` refactor(knowledge): refine ch02/ch03 fallback windows
- `cd79d46` test(checks): add 8 route cases for deepened ch02/ch03 concepts
- `f9cc1f5` docs(knowledge): mark ch02 and ch03 as deepened in hub
