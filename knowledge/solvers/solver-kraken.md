---
title: Solver - KRAKEN
type: solver-note
method_family: normal-modes
status: active
---

# KRAKEN

## Method family
KRAKEN is a normal-mode solver. In the COA map it belongs with modal waveguide methods for low to moderate frequency propagation, dispersion, and replica-field work.

## Best for
- Low to moderate frequency waveguide propagation
- Shallow-water and deep-water environments where modal structure is informative
- Dispersion, group velocity, and modal interference studies
- Replica-field generation for matched-field style analyses in waveguide settings

## Not for
- High-frequency cases better handled by ray ideas
- Strongly range-dependent environments if treated only with a simple adiabatic view
- Problems dominated by backscatter or locally complicated scattering geometry
- Situations where horizontal 3D structure is the main physical effect unless coupling is handled explicitly

## Common controls
- Frequency and source / receiver depths
- Water-column and bottom layering, density, and attenuation
- Boundary conditions at surface and bottom
- Depth mesh / layer representation
- Mode search window, mode count, and cutoff handling
- Choice of adiabatic or coupled-mode follow-on workflow when range dependence enters

## Validation checks
- Confirm the retained mode set is numerically stable under mesh refinement
- Check TL convergence as the number of included modes increases
- Inspect mode shapes and normalization for obvious numerical pathologies
- Compare adiabatic and coupled treatments when range dependence is not weak
- Cross-check against SCOOTER in layered environments and against RAM in range-dependent cases

## Cross-links
- `chapters/ch05-normal-modes.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`
- `workflows/model-selection.md`
