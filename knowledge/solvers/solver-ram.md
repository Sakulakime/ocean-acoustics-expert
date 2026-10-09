---
title: Solver - RAM
type: solver-note
method_family: parabolic-equations
status: active
---

# RAM

## Method family
RAM is a parabolic-equation solver. In the COA map it belongs with forward-marching full-wave approximations for practical range-dependent propagation.

## Best for
- Forward propagation in range-dependent environments
- Long-range or operational TL prediction with more wave fidelity than rays
- Shallow-water and shelf problems where interference and diffraction matter
- Cases where one needs a practical engineering default for coherent propagation

## Not for
- Problems where strong backscatter is central
- Questions demanding globally exact two-way solutions
- Geometries that violate the angular validity of the chosen PE approximation
- Cases where detailed local scattering is better treated by FD / FE / BE methods

## Common controls
- Frequency and reference sound speed
- Range step and depth step
- Approximation order or wide-angle settings
- Starter-field choice
- Bathymetry handling and bottom attenuation
- Absorbing layer / domain truncation settings
- Output grid for TL, phase, or complex pressure

## Validation checks
- Run step-size convergence in both range and depth
- Check sensitivity to starter choice near the source region
- Verify that changing approximation order does not alter the main conclusion
- Watch for energy-loss or artificial-gain behavior over long ranges
- Cross-check against KRAKEN in weakly range-dependent waveguides and against Bellhop in high-frequency path-dominated cases

## Cross-links
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`
- `workflows/model-selection.md`
