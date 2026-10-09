---
title: Runbook - KRAKEN pre-run checklist
type: runbook
method_family: normal-modes
status: active
---

# KRAKEN Pre-Run Checklist

Terse yes/no validation before running a KRAKEN `.env` + `.flp` pair. Answer
every item "yes" or fix it first. Detailed rationale is in `kraken-runbook.md`;
an annotated runnable pair is in `kraken-template.md`. The shared `.env` SSP /
halfspace / option rules are covered in `bellhop-checklist.md`.

## `.env` structure and quoting

- [ ] Title, top option, and bottom option each wrapped in single quotes?
- [ ] NMEDIA matches the number of SSP blocks before the bottom option?
- [ ] The two KRAKEN-only lines (`cLow cHigh`, then `RMax`) present, **after** the
      bottom halfspace and **before** the source-depth block?
- [ ] No BELLHOP-only lines (receiver ranges, run type, beam/box) in the `.env`?

## `.env` SSP block (count == rows)

- [ ] For **each** medium, the last SSP row depth exactly equals that medium's
      header bottom depth (col 3)? (This equality, not `N`, ends the block.)
- [ ] You are NOT forcing the SSP row count to equal the header `N` (mesh points)?
- [ ] SSP depths strictly increasing within each medium, no duplicates?
- [ ] Deepest SSP point reaches the medium bottom depth?
- [ ] Every SSP row ends with `/` (so omitted sticky columns repeat correctly)?

## `.env` boundaries and halfspace

- [ ] If bottom option char 1 = `A`, the bottom halfspace line is present, with
      its top depth == the deepest SSP depth (i.e. medium bottom)?
- [ ] If top option char 2 = `A`, the top halfspace line is present?
- [ ] Halfspace columns: speeds ≈ 1500-2000 m/s, density ≈ 1-2 g/cm³ (not
      swapped)? `cs` = 0 for a fluid bottom?
- [ ] Attenuation-units letter (top option char 3) matches the αI column values?

## `.env` cLow / cHigh / RMax

- [ ] `cLow < cHigh`, both sane phase speeds in **m/s** (not km)?
- [ ] `cLow` at or just below the minimum water sound speed (it is clamped to
      `cMin` regardless, so do not raise it past `cMin`)?
- [ ] `cHigh` at or above the bottom sound speed so the whole trapped ladder is
      kept (push it above `c_bottom` only with **krakenc** for leaky modes)?
- [ ] `RMax` in **km**; either `0` (range vector from `.flp`) or `>=` the largest
      `.flp` receiver range?
- [ ] cLow/cHigh and RMax lines carry no stray `/` that could be misread (harmless
      but unnecessary)?

## `.env` source / receiver depths

- [ ] NSz / NRz each: either exactly 2 values with a trailing `/` (auto-linspace),
      or exactly N values with no `/`?
- [ ] Source and receiver depths in **meters**?

## `.flp` structure

- [ ] Title quoted? Option string quoted (e.g. `'RA'` / `'RC'`)?
- [ ] Option char 1 = `R` (cylindrical, the norm)? Char 2 = `A` (adiabatic) or
      `C` (coupled) chosen to match the range dependence?
- [ ] `MLimit` large enough to keep all energetically significant modes (sentinel
      like `9999` to keep every mode KRAKEN found)?

## `.flp` profiles and ranges (count == profiles)

- [ ] `NProf` equals the number of mode sets (`.mod` files) produced?
- [ ] First `rProf` value is exactly `0.0` km, ranges monotonic?
- [ ] Range-independent case uses `NProf = 1`, `rProf = 0.0`?
- [ ] `rProf` and `Rr` in **km**; `Sz`, `Rz`, `ro` in **m**?
- [ ] Max `.flp` receiver range (`Rr`) consistent with the `.env` `RMax` (RMax `0`
      or `>=` max Rr) and within the profile range span?

## `.flp` source/receiver blocks and ordering

- [ ] Receiver ranges (`Rr`) come **before** source depths in the file?
- [ ] NRr / NSz / NRz / Nro each obey the `/`-shorthand rule (2 values with `/`,
      or exactly N without)?
- [ ] Source depths consistent with the `.env` source depths if you intend them
      to match?
- [ ] Final `ro` (range-displacement / array-tilt) block present and **all
      zeros** (nonzero errors out)?

## Run environment

- [ ] `case.env` and `case.flp` both in the MATLAB `pwd`?
- [ ] `which kraken.exe` (or `krakenc.exe`) resolves to `<AT>/linux-bin/`?
- [ ] `global units jkpsflag` set before plotting?

## After the run

- [ ] `.prt` checked first if anything looks wrong (it names the offending block
      and lists the modes / phase speeds found)?
- [ ] `.mod` + `.prt` produced by stage 1, `.shd.mat` (MATLAB) or `.shd`
      (Fortran) by stage 2?
- [ ] Mode count `M` and TL stable as you widen `cHigh` and refine the mesh
      (convergence)?
- [ ] For range dependence: adiabatic vs coupled cross-checked when range
      dependence is not weak?

## Cross-links

- `kraken-runbook.md`
- `kraken-template.md`
- `bellhop-checklist.md` (shared `.env` SSP / halfspace rules)
- `../solvers/solver-kraken.md`
