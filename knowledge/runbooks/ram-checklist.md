---
title: Runbook - RAM pre-run checklist
type: runbook
method_family: parabolic-equations
status: active
---

# RAM Pre-Run Checklist

Terse yes/no validation before running a `ram.in`. Answer every item "yes" or
fix it first. The biggest killers are the meters-vs-km unit trap and a
missing/mis-ordered `-1 -1` sentinel. Detailed rationale is in `ram-runbook.md`;
an annotated template is in `ram-in-template.md`.

## Units (the #1 trap)

- [ ] Every range and depth is in METERS, not km (`rmax`, `dr`, `rs`, `rb`,
      `rp`, all depths)?
- [ ] If porting from a BELLHOP/KRAKEN `.env`, all km ranges multiplied by 1000?
- [ ] `rmax` is a realistic range in meters (e.g. 30000, not 30)?

## Header (exactly 5 lines)

- [ ] Line 1 title present (one line, content decorative)?
- [ ] Line 2 = `freq zs zr` (Hz, m, m); `zr` is the depth `tl.line` is sampled
      at?
- [ ] Line 3 = `rmax dr ndr`; `ndr` is an integer decimation factor ≥ 1, not a
      step size?
- [ ] Line 4 = `zmax dz ndz zmplt`; `ndz` ≥ 1 integer; `zmplt` ≤ `zmax`?
- [ ] `zmax` extends well below the real seabed into an absorbing layer?
- [ ] `zmplt` and `zmax` are sensible multiples of `dz`?
- [ ] Line 5 = `c0 np ns rs`; `np` ≤ compile limit (30 ram / 10 ramgeo)?
- [ ] `c0` near the depth-averaged water speed (commonly ~1500 m/s)?
- [ ] `np >= 6` (commonly 8) if steep / bottom-interacting angles matter?

## Sentinels (the -1 -1 rule)

- [ ] Bathymetry list ends with `-1 -1`?
- [ ] Each profile sub-block (water SSP, bottom SSP, density, attenuation) ends
      with its own `-1 -1`?
- [ ] Every `-1 -1` written as TWO values (lone `-1` can desync the parser)?
- [ ] Every block has at least one real data row BEFORE its sentinel (no empty
      block / immediate `-1 -1`)?

## Bathymetry block

- [ ] Rows are `rb zb` (range m, water depth m), range non-decreasing?
- [ ] Bathymetry NOT extended past `rmax` by hand (code auto-appends a flat
      point at `2*rmax`)?
- [ ] Bathymetry point count under the compile limit `mr` (1000 ram / 100
      ramgeo)?

## Profile group (count and order)

- [ ] Exactly four sub-blocks, in this order: water SSP `z cw`, bottom SSP
      `z cb`, density `z rhob`, attenuation `z attn`?
- [ ] None reordered, none omitted, none duplicated within a group?
- [ ] Units right: cw/cb in m/s, rhob in g/cm³, attn in dB/wavelength, depths in
      m?
- [ ] A single-row sub-block is intentional (means that value is constant over
      the whole grid)?

## Range-dependent updates (rp lines)

- [ ] Each `rp` is a single bare range value (m) on its own line — NOT a pair,
      NOT sentinel-terminated?
- [ ] `rp` appears AFTER a complete four-sub-block group and names where the
      NEXT group activates?
- [ ] `rp` values strictly increasing across groups?
- [ ] The final profile group has NO trailing `rp` (EOF ends the updates)?

## Run environment

- [ ] The case file is staged as a file literally named `ram.in` in the run
      directory (no command-line case name)?
- [ ] Running the WORKING ELF binary at
      `at_2023/RAM/ram.exe`, not the Mach-O macOS `ram.exe` that may resolve
      first on the MATLAB path?
- [ ] Fresh / dedicated directory so the previous `tl.grid` / `tl.line` are not
      silently overwritten?

## After the run

- [ ] Exit code 0 and both `tl.grid` and `tl.line` produced (non-trivial size)?
- [ ] The run did NOT terminate almost immediately (a telltale of km-instead-of-m
      `rmax`)?
- [ ] Reading `tl.grid` with `read_ram_tlgrid` (auto-detects record markers), NOT
      `RAMtoSHD_Old.m` or a hand-rolled offset?
- [ ] TL recovered as `-20*log10(abs(squeeze(pressure)))`; range divided by 1000
      only for display?
- [ ] Convergence confirmed: halved `dr` (and `dz` near a fast bottom) and raised
      `np`, results stable?

## Cross-links

- `ram-runbook.md`
- `ram-in-template.md`
- `../solvers/solver-ram.md`
