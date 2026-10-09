---
title: Solver - Bellhop
type: solver-note
method_family: ray-methods
status: active
---

# Bellhop

## Method family
Bellhop is a ray / Gaussian-beam solver. In the COA map it belongs with ray methods, especially for high-frequency propagation, eigenrays, and travel-time structure.

## Best for
- High-frequency propagation where geometric path structure is physically meaningful
- Arrival analysis, eigenrays, and multipath interpretation
- Fast transmission-loss screening in range-dependent settings
- Problems where travel time and path geometry matter more than exact low-frequency interference

## Not for
- Low-frequency coherent waveguide fields where modal interference dominates
- Cases where diffraction and shadow-zone filling are central
- Problems requiring strong elastic-bottom wave physics
- Trusting fine null structure near caustics without a wave-method check

## Common controls
- Sound-speed profile and interpolation choice
- Bathymetry and boundary options
- Launch-angle fan and beam window
- Ray step size and integration settings
- Geometric-ray vs Gaussian-beam style options
- Source / receiver geometry and frequency grid

## Validation checks
- Increase launch-angle density until arrivals and TL are stable
- Reduce step size and confirm path geometry does not change materially
- Check sensitivity to SSP interpolation and bathymetry smoothing
- Inspect caustics and shadow zones rather than trusting raw amplitudes there
- Cross-check against KRAKEN or RAM when coherent phase structure matters

## Cross-links
- `chapters/ch03-ray-methods.md`
- `chapters/ch08-broadband-modeling.md`
- `workflows/model-selection.md`

## Runbook
For running BELLHOP from the local AT toolbox on Linux + MATLAB (paths, run
recipe, `.env` format, output reading, plotting conventions, gotchas):
- `../runbooks/bellhop-runbook.md` — main operational runbook
- `../runbooks/bellhop-env-template.md` — annotated golden `.env` template
- `../runbooks/bellhop-checklist.md` — pre-run validation checklist
