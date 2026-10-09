---
title: Ocean Acoustics Solvers Hub
type: hub-note
status: active
---

# Ocean Acoustics Solvers Hub

Use these notes as the second layer between the COA chapter notes and solver-specific work.

## Quick routing table

| Solver | Method family | Best default use | Usually not the right first choice |
|---|---|---|---|
| [Bellhop](solver-bellhop.md) | Ray / Gaussian beam | High-frequency arrivals, eigenrays, fast path intuition, quick TL screening | Low-frequency coherent waveguide fields, diffraction-dominated cases |
| [KRAKEN](solver-kraken.md) | Normal modes | Low to moderate frequency waveguides, modal structure, dispersion, replica fields | High-frequency asymptotics, strongly range-dependent cases without coupling treatment |
| [RAM](solver-ram.md) | Parabolic equation | Forward propagation in range-dependent environments with wave effects and practical cost | Strong backscatter, two-way exact solutions, very wide-angle violations |
| [SCOOTER](solver-scooter.md) | Wavenumber integration / FFP | Layered media, spectral baselines, stratified environments, elastic-bottom sensitivity | Strong horizontal range dependence or strongly 3D bathymetry |
| [OASES](solver-oases.md) | Wavenumber integration in layered fluid-elastic media | Layered fluid-elastic propagation, scattering, reverberation, array field prediction | General range-dependent coastal bathymetry without layered assumptions |

## Shared validation habits

- Check the environment encoding before solver tuning: SSP, bathymetry, density, attenuation, and boundary conditions.
- Run one numerical convergence test that matches the solver family:
  - angle / beam sampling for Bellhop
  - mode count / mesh for KRAKEN
  - range-depth step and approximation order for RAM
  - spectral sampling and alias control for SCOOTER and OASES
- Cross-check with a neighboring family when near a method limit:
  - Bellhop vs RAM or KRAKEN
  - KRAKEN vs SCOOTER in layered cases
  - RAM vs KRAKEN for shallow-water coherence
  - SCOOTER vs OASES in simple layered cases

## Main cross-links

- `workflows/model-selection.md`
- `chapters/ch03-ray-methods.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`
