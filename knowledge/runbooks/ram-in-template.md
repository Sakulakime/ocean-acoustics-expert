---
title: Runbook - RAM golden ram.in template
type: runbook
method_family: parabolic-equations
status: active
---

# RAM Golden ram.in Template

A complete, runnable `ram.in`, derived field-by-field from the shipped
known-good example `at_2023/RAM/ram.in` (which runs to clean `tl.grid` /
`tl.line` with exit code 0). The block below contains ONLY content RAM can
parse — bare-word labels after the numbers, no full comment lines — so it is
copy-paste runnable as-is (verified: exit 0, 1.6 MB `tl.grid`).

Note on this example: it shows a sloping bottom (true range dependence in
bathymetry). It also carries a second profile group after an `rp` update line,
but `rp = 25000 m` exceeds `rmax = 4000 m`, so the march never reaches it and
the second group is INACTIVE in this run. To actually exercise a profile
update, set `rp` to a value inside `(dr, rmax)`.

Field meanings are specified in `ram-runbook.md`; pre-run checks are in
`ram-checklist.md`.

Remember the cardinal rules before editing:

- **Every range and depth is in METERS** — there is no unit field.
- Each variable-length block ends with a `-1 -1` sentinel; only the first number
  is tested, but write both.
- The profile group is always four sub-blocks in fixed order: water SSP, bottom
  SSP, density, attenuation.
- A line must START with a number. Trailing bare-word labels are ignored by
  `read(1,*)`, but a line beginning with `#`/`c`/`!`/`----` aborts the run.

```
range-dependent example
25.0 40.0 30.0            freq(Hz)  zs(m)  zr(m)
4000.0 5.0 1             rmax(m)  dr(m)  ndr
1000.0 1 2 1000.0        zmax(m)  dz(m)  ndz  zmplt(m)
1500.0 8 1 0.0           c0(m/s)  np  ns  rs(m)
   0.0 200.0             rb(m)  zb(m)  -- bathymetry breakpoint
4000.0 400.0
-1 -1
   0 1500               water SSP: z(m)  cw(m/s)
3000 1500
-1 -1
0.0 1700                bottom SSP: z(m)  cb(m/s)
-1 -1
0.0 1.5                 density: z(m)  rhob(g/cm^3)
-1 -1
   0.0  0.5             attenuation: z(m)  attn(dB/wavelength)
 900.0  0.5
1000.0 10.0
-1 -1
25000.0                 rp: next-group update range (m); here rp>rmax so the 2nd group never activates
   0 1500
3000 1500
-1 -1
0.0 1700
-1 -1
0.0 1.5
-1 -1
   0.0  0.5
 900.0  0.5
1000.0 10.0
-1 -1
```

> CRITICAL — comment style: RAM's reader does `read(1,*)` on every line and
> tries to parse the FIRST token as a number. A line that *begins* with
> non-numeric text (`#`, `c`, `!`, `----`, ...) aborts the run with
> `Bad real number in item 1 of list input` (`ram1.5.f:213`). Only **bare-word
> labels placed AFTER the required numbers** (as above) are safe — the read
> stops once it has its numbers. Never put a full comment line into `ram.in`.

(File ends at the 4th `-1 -1` of the second group. Because there is no trailing
`rp` line, the last profiles hold to `rmax`.)

## How to read the structure

- **Header is exactly 5 lines** (title + four numeric lines), always in this
  order. `zr` on line 2 is the depth `tl.line` is sampled at; `zmplt` and
  `ndz*dz` set the output extent and spacing of `tl.grid`.
- **Bathymetry** is `rb zb` pairs (range, water depth), non-decreasing in range,
  linearly interpolated between breakpoints, sentinel-terminated. Two rows with
  different `zb` make the slope here (200 m -> 400 m over 4000 m). One row would
  be range-independent depth.
- **Profile group** = four sub-blocks, always water-SSP, bottom-SSP, density,
  attenuation, each with at least one data row then its own `-1 -1`. A
  single-row sub-block means that value is constant over the whole grid.
- **`rp` line** is a single bare range in meters; it names where the NEXT group
  takes effect and must be strictly increasing across groups. Omit it after the
  final group so EOF ends the updates.

## Minimal range-independent skeleton

If you do not need range dependence, use one bathymetry row and a single profile
group with no `rp` line (this is `ramgeo.in` modulo values):

```
my title line
25.0 50.0 30.0           freq(Hz)  zs(m)  zr(m)
10000.0 50.0 1           rmax(m)  dr(m)  ndr
2000.0 2.0 2 800.0       zmax(m)  dz(m)  ndz  zmplt(m)
1500.0 5 1 0.0           c0(m/s)  np  ns  rs(m)
0.0 200.0                rb(m)  zb(m)  -- flat 200 m bottom
-1 -1
0.0 1500.0               water SSP: z(m)  cw(m/s)
-1 -1
100.0 1700.0             bottom SSP: z(m)  cb(m/s)
-1 -1
100.0 1.5                density: z(m)  rhob(g/cm^3)
-1 -1
100.0 0.1                attenuation: z(m)  attn(dB/wavelength)
1900.0 10.0
-1 -1
```

## Variants from this base

- **Range-independent**: use the skeleton above — one bathymetry row, one
  profile group, no `rp` line.
- **More range segments**: after each complete four-sub-block group, add an `rp`
  (strictly increasing) then another full group. The final group gets no `rp`.
- **Sloping wedge**: two bathymetry rows with different `zb` (e.g. `0 200` then
  `4000 0`).
- **Wider angular aperture (steep paths)**: raise `np` on header line 5 (e.g. 8)
  up to the compile limit (30 ram / 10 ramgeo).
- **Finer accuracy**: reduce `dr` and/or `dz`; keep `ndr`/`ndz` to control output
  size separately (they are decimation factors, not step sizes).

## Cross-links

- `ram-runbook.md`
- `ram-checklist.md`
- `../solvers/solver-ram.md`
