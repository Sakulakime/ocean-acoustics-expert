---
title: Template - KRAKEN .env + .flp (Pekeris normal-mode case)
type: template
method_family: normal-modes
status: active
---

# KRAKEN Template — annotated `.env` + `.flp`

A golden, runnable normal-mode pair for a simple **Pekeris / iso-speed**
waveguide: a 100 m iso-velocity water column (1500 m/s) over a fluid halfspace
(1800 m/s). Every line is annotated with its field meaning and units. The two
KRAKEN-only lines (`cLow cHigh`, `RMax`) and the trailing-`/` usage are called out
explicitly. Field semantics live in `kraken-runbook.md`; the shared `.env` SSP /
halfspace rules are in `bellhop-runbook.md`.

Run it with (no extension; runs both stages):

```matlab
kraken( 'pekeris' )            % writes pekeris.mod + pekeris.prt, then field -> pekeris.shd.mat
plotmode( 'pekeris' )          % mode shapes + wavenumbers
plotshd( 'pekeris.shd.mat' )   % TL surface
```

## `pekeris.env`

```text
'Pekeris iso-speed waveguide'   ! Line 1: title (single quotes mandatory)
50.0                            ! Line 2: frequency, Hz
1                               ! Line 3: NMEDIA = 1 medium (the water column)
'NVW'                           ! Line 4: top option -> N2-linear interp / Vacuum top / dB-per-wavelength alphaI
0  0.0  100.0                   ! SSP header for medium 1: N=0 (auto mesh) | sigma=0 (flat interface, m) | depth=100 m (medium bottom)
    0.0  1500.0  /              ! SSP row: z=0 m, cp=1500 m/s; cs/rho/alphaI/betaI inherit (0/1/0/0); the / TERMINATES the row so defaults apply
  100.0  1500.0  /              ! SSP row: z=100 m == header depth -> THIS equality ends the SSP block (not N)
'A'  0.0                        ! Bottom option = Acousto-elastic halfspace | bottom sigma=0 (m). 'A' REQUIRES the next line
  100.0  1800.0  0.0  1.8  0.5  /  ! Bottom halfspace: z=100 m (== deepest SSP depth) | cp=1800 | cs=0 (fluid) | rho=1.8 g/cm3 | alphaI=0.5 | betaI inherits; / ends row
1500.0  1800.0                  ! *** KRAKEN-ONLY line X1: cLow cHigh in m/s -> phase-speed window for the modal search ***
0.0                             ! *** KRAKEN-ONLY line X2: RMax in km -> 0 is fine; field's .flp supplies the range vector ***
1                               ! NSz = number of source depths
36.0                            ! Sz = 36 m source depth (1 value, no / since N==count)
51                              ! NRz = number of receiver depths
0.0  100.0  /                   ! Rz: with / -> linspace(0, 100, 51) m (give exactly 2 values: first last)
```

Notes keyed to the file:

- **`cLow cHigh = 1500.0 1800.0` (m/s).** `cLow` sits at the iso water speed
  (1500), `cHigh` at the bottom speed (1800) so the whole trapped ladder is kept.
  Modes with phase speed outside this window are discarded silently. These are
  **m/s**, not km. To keep leaky modes too, run `krakenc` and raise `cHigh` above
  1800 (or use `1e9`).
- **`RMax = 0.0` (km).** Legal and idiomatic; the receiver-range axis comes from
  the `.flp`. Set it `>=` the largest `.flp` receiver range if you make it nonzero.
- **No trailing `/` on the cLow/cHigh and RMax lines** — they are read by bare
  `fscanf`+`fgetl`. Adding one is harmless but unnecessary.
- **Trailing `/` on every SSP and halfspace data row** that omits sticky columns
  (essentially all of them). It terminates the row so the omitted
  `cs/rho/alphaI/betaI` inherit; drop it and the parser reads the next row's
  numbers into this row and desyncs.
- **Last SSP row depth (100 m) == header depth (100 m)** — that equality, not
  `N`, is what ends the SSP block.
- **No** receiver-range line, run-type, or beam block here — those are BELLHOP
  concepts. Ranges live in the `.flp` below.

## `pekeris.flp`

```text
'Pekeris iso-speed waveguide'   ! Line 1: title (single quotes; /, alone = empty-title default)
'RA'                            ! Line 2: option -> R = cylindrical coords | A = adiabatic modes (range-independent here, so A vs C is moot)
9999                            ! Line 3: MLimit = max modes field uses (big sentinel = keep all KRAKEN found)
1                               ! Line 4: NProf = number of environment profiles
0.0                             ! Line 5: rProf = profile ranges in KM; single profile at 0 km (range-independent run)
501                             ! Line 6: NRr = number of receiver ranges
0.0  10.0  /                    ! Line 7: Rr in KM -> linspace(0, 10, 501) km (with / give first last only)
1                               ! Line 8: NSz = number of source depths
36.0                            ! Line 9: Sz = 36 m (matches the .env source depth)
51                              ! Line 10: NRz = number of receiver depths
0.0  100.0  /                   ! Line 11: Rz in M -> linspace(0, 100, 51) m
51                              ! Line 12: Nro = number of receiver range-displacements. MUST equal NRz (51) for the Fortran field.exe
0.0  /                          ! Line 13: ro in M -> all zeros; the / replicates the single 0.0 to all 51 entries
```

Notes keyed to the file:

- **Option `'RA'`**: position 1 `R` = cylindrical (the norm); position 2 `A` =
  adiabatic. For a range-independent case the A/C choice does not matter; switch
  to `'RC'` (coupled) for strong range dependence with `NProf > 1`.
- **`MLimit = 9999`** caps the modes summed; this sentinel keeps everything KRAKEN
  produced. The real count is whatever fell inside `[cLow, cHigh]`.
- **`NProf = 1`, `rProf = 0.0`** is the range-independent signature. For
  range-dependent runs, `NProf > 1` with one profile range (km) per mode set, the
  first at exactly 0 km, and `NProf` must equal the number of `.mod` sets.
- **Units split**: `rProf` and `Rr` are **km**; `Sz`, `Rz`, `ro` are **m**.
- **Order is fixed** in the reader: receiver ranges (`Rr`) come **before** source
  depths.
- **Final `ro` (range-displacement) block: the count MUST equal `NRz`, and the
  values must be all zeros.** The Fortran `field.exe` enforces `NRro == NRz` and
  aborts with `*** FATAL ERROR *** Number of range offsets, NRro, not equal to
  number of depths, NRz` otherwise. Use the replicate-one shorthand `0.0 /`,
  which expands the single `0.0` to all `NRz` entries (this is what the shipped
  `MunkK.flp` / `DickinsFlatK.flp` do: `501` then `0.0 /`). Caveat: the MATLAB
  `field.m` does NOT enforce this (it reads `ro` with `readvector` and only
  checks `max(abs(ro))==0`), so a wrong count like `Nro=1` runs fine through
  MATLAB but crashes the Fortran binary — always size it to `NRz`.
- **`/` shorthand**: with `/`, give exactly two values (`first last`) for an
  auto-`linspace`; without `/`, give exactly `N` explicit values.
