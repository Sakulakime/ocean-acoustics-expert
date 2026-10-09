---
title: Solver - OASES
type: solver-note
method_family: layered-fluid-elastic-wavenumber-integration
status: active
---

# OASES

## Method family
OASES is a layered fluid-elastic spectral solver centered on wavenumber integration. In the COA map it sits closest to wavenumber-integration methods, with strong links to elastic media, scattering, reverberation, and array-field prediction.

## Best for
- Layered fluid-elastic environments with detailed boundary and bottom physics
- Reflection, transmission, and seabed-coupled propagation in stratified settings
- Scattering and reverberation studies built on layered waveguide assumptions
- Array field prediction and replica generation when the layered model is appropriate

## Not for
- Strongly range-dependent coastal environments without a layered approximation
- Fast first-look screening where Bellhop or RAM is enough
- Very local geometric detail better treated by FE / BE methods
- Using a layered solver to stand in for genuinely complex 3D bathymetry

## Common controls
- Water-column, sediment, and elastic-layer parameterization
- Density, compressional / shear speeds, and attenuation
- Boundary condition setup at surface and bottom
- Wavenumber / angle / frequency sampling
- Scattering or reverberation switches where relevant
- Source type, array geometry, and requested field outputs

## Validation checks
- Check spectral sampling and contour settings for numerical stability
- Verify reflection / transmission behavior against simpler layered benchmarks
- Compare with SCOOTER in fluid-only or simpler layered cases
- Perturb elastic and attenuation parameters to see whether conclusions are structurally stable
- Confirm that layered assumptions still match the physical environment before trusting detailed output

## Cross-links
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`
- `chapters/ch09-ambient-noise.md`
- `chapters/ch10-signals-in-noise.md`
- `workflows/model-selection.md`
