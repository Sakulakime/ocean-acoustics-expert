---
title: Solver - UMPE
type: solver-note
method_family: parabolic-equations
status: active
---

# UMPE

UMPE marches a one-way acoustic field in range. Its split-step Fourier method
alternates propagation in vertical-wavenumber space with medium updates in
physical depth. Choose it for forward diffraction and interference with a
range-dependent sound-speed profile and bottom, or to compare PE operators
while holding the environment and starter fixed. A wide-angle operator does
not recover backscatter. RAM is a related split-step Padé solver, not the same
discretization; its Padé order is not an UMPE model switch.

## Controls and checks

- Choose the PE approximation and starter separately. In this distribution
  type 3 uses the LOGPE kinetic operator; do not infer its behavior from the
  label alone. See the operator table in `../runbooks/umpe-runbook.md`.
- At fixed computational depth, double the FFT size to halve the depth cell;
  vary the range step independently. Compare TL on the same water-column grid
  and keep the basement above the absorbing layer starting at `0.75*HD`.
- Encode the basement as a depth and the overlying sediment as a thickness.
  Check the implied water depth against the intended bathymetry. A successful
  parse or a final `STOP` message is not a convergence check.

## Where to go next

- PE formulation and angular limits: `../chapters/ch06-parabolic-equations.md`.
- Source tree: `{{umpe_root}}`; build, invocation and outputs: `../runbooks/umpe-runbook.md`.
- Three-file case: `../runbooks/umpe-input-template.md`; preflight: `../runbooks/umpe-checklist.md`.
- RAM comparison: `solver-ram.md`.
