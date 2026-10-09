---
title: Runbook - BELLHOP golden ENV template
type: runbook
method_family: ray-methods
status: active
---

# BELLHOP Golden ENV Template

A single complete, runnable `.env` for a simple Pekeris / iso-velocity
waveguide: 100 m water column, iso-velocity 1500 m/s, fluid sediment halfspace,
coherent TL run. Every line carries an inline comment (after `!`) stating its
meaning, unit, and any count dependency. Field meanings are specified in
`bellhop-runbook.md`; pre-run checks are in `bellhop-checklist.md`.

The comments are decoration to the parser (numbers, quoted tokens, and `/` are
load-bearing) but are kept here for human use.

```
'Pekeris iso waveguide, coherent'  ! line 1: title, MUST be in single quotes
200.0                              ! frequency, Hz (one float; narrowband per run)
1                                  ! NMEDIA: number of water-column media (not halfspaces)
'CVW'                              ! top opt: C-linear SSP / Vacuum top / dB-per-wavelength atten units
0  0.0  100.0                      ! SSP header: N mesh pts (0=auto) | sigma roughness (m) | medium bottom depth (m)
    0.0  1500.0  /                 ! SSP row: z=0 m, cp=1500 m/s; sticky cols [cs rho aI bI] keep defaults
  100.0  1500.0  /                 ! SSP row: z MUST equal header depth 100.0 -> terminates SSP reading
'A' 0.0                            ! bottom opt 'A'=acousto-elastic halfspace + sigma(m); 'A' REQUIRES next line
  100.0  1600.0  0.0  1.8  0.5  /  ! halfspace: z(m)=seabed | cp(m/s) | cs(m/s)=0 fluid | rho(g/cm3) | aI=0.5; bI omitted (defaults 0)
1                                  ! NSD: number of source depths (must match values below)
25.0 /                             ! source depth(s), m (NSD=1, single value)
51                                 ! NRD: number of receiver depths (drives linspace count)
0.0 100.0 /                        ! receiver depths, m: linspace(0,100,51) because '/' with 2 values + N>2
201                                ! NR: number of receiver ranges (drives linspace count)
0.0 10.0 /                         ! receiver ranges, KM: linspace(0,10,201) -- KM not m (unit trap)
'CG'                               ! run type: C=Coherent TL | G=geometric hat beams (no Cerveny trailers)
0                                  ! NBEAMS: number of launch beams (0 = auto-estimate)
-15.0 15.0 /                       ! launch angles, degrees: ALPHA1 ALPHA2 (equally spaced fan; neg=downward)
0.0  110.0  10.1                   ! STEP(m, 0=auto) | ZBOX(m) > water depth | RBOX(km) > max range
```

## How to read the count dependencies

- `NMEDIA` (line 3) = number of SSP header+rows blocks that follow before the
  bottom option.
- The SSP header's `N` is a mesh-point hint, NOT the number of data rows. Rows
  stop when a row depth equals the header bottom depth (here `100.0`).
- `NSD` / `NRD` / `NR`: with a trailing `/` you give 1 or 2 values and BELLHOP
  fabricates `N` of them (`linspace` for 2 values, replicate for 1). Without
  `/`, you must list exactly `N` explicit values.
- `NBEAMS` with a `/` launch-angle line behaves the same: 2 values -> equally
  spaced fan of `NBEAMS` rays.

## Variants from this base

- **Range-dependent SSP**: change top opt char 1 to `Q` (`'QVW'`), set SSP
  header `N` to `0`, and supply a sibling `case.ssp` file; bathymetry comes from
  a `case.bty`, not inline.
- **Thorp volume attenuation**: top opt char 4 = `T`, e.g. `'NAWT'`.
- **Francois-Garrison attenuation**: top opt char 4 = `F` (`'NAWF'`) and add a
  line `19.3 33.5 7.5 100.0` (`T S pH z_bar`) right after the top option.
- **Elastic bottom**: set the halfspace `cs` column nonzero (e.g. `800.0`).
- **Ray trace instead of TL**: run type `'R'` (writes `.ray`); eigenrays `'E'`;
  arrivals `'A'` (ascii) or `'a'` (binary, writes `.arr`).
- **Cerveny beams**: run type `'CC'` or `'CR'` and append the two trailer lines
  (`'MS' 1.0 10.0` then `3 5 'P'`).

## Cross-links

- `bellhop-runbook.md`
- `bellhop-checklist.md`
- `../solvers/solver-bellhop.md`
