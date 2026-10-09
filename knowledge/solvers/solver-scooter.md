---
title: Solver - SCOOTER
type: solver-note
method_family: wavenumber-integration
status: active
---

# SCOOTER

## Method family
SCOOTER is a wavenumber-integration / fast-field style solver. In the COA map it belongs with spectral methods for horizontally stratified or layered environments.

## Best for
- Layered or horizontally stratified environments
- Spectral baselines where exact wave treatment within the layered assumption matters
- Elastic-bottom sensitivity checks in simple range-independent settings
- Benchmarking modal or PE solutions against a stratified full-wave reference

## Not for
- Strongly range-dependent bathymetry or water-column changes
- Problems where a one-dimensional layered environment is a poor physical fit
- Highly local scattering geometry better handled by FE / BE methods
- Treating horizontal 3D complexity as a small correction

## Common controls
- Frequency and source / receiver geometry
- Layered medium definition, density, and attenuation
- Wavenumber sampling and spectral truncation limits
- Range grid and maximum range
- Contour or integration settings when available
- Output choice for pressure, TL, or field slices

## Validation checks
- Check aliasing sensitivity by refining spectral sampling
- Confirm truncation limits do not clip physically important contributions
- Compare results against KRAKEN in simple layered fluid cases
- Verify bottom-loss and elastic-layer behavior with small parameter perturbations
- Inspect whether apparent fine structure is numerical ringing rather than physics

## Cross-links
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch08-broadband-modeling.md`
- `workflows/model-selection.md`
