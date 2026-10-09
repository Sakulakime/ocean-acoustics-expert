---
title: Runbook - BELLHOP pre-run checklist
type: runbook
method_family: ray-methods
status: active
---

# BELLHOP Pre-Run Checklist

Terse yes/no validation before running a `.env`. Answer every item "yes" or fix
it first. Detailed rationale is in `bellhop-runbook.md`; an annotated template
is in `bellhop-env-template.md`.

## Structure and quoting

- [ ] Title, top option, bottom option, and run type are each wrapped in single
      quotes?
- [ ] No SCOOTER/KRAKEN `cLow cHigh` or `RMax` lines present (BELLHOP omits
      them)?
- [ ] NMEDIA matches the number of SSP blocks before the bottom option?

## SSP block

- [ ] The last SSP row depth exactly equals the header bottom depth (col 3)?
- [ ] SSP depths strictly increasing, no duplicates?
- [ ] SSP not over-sampled (no excess points forcing tiny steps)?
- [ ] Deepest SSP point reaches at least the seabed / bathymetry depth?
- [ ] You are NOT forcing the SSP row count to equal the header `N`?
- [ ] Every SSP row ends with `/` (so omitted sticky columns repeat correctly)?

## Boundaries and halfspace

- [ ] If bottom option char 1 = `A`, the bottom halfspace line is present (and
      absent otherwise)?
- [ ] If top option char 2 = `A`, the top halfspace line is present?
- [ ] If top option char 4 = `F`, the T/S/pH/z_bar Francois-Garrison line is
      present?
- [ ] Halfspace columns: speeds ≈ 1500-2000 m/s, density ≈ 1-2 g/cm³ (not
      swapped)? `cs` = 0 for a fluid bottom?
- [ ] Attenuation-units letter (top option char 3) matches the αI column values?

## Counts and vectors

- [ ] NSD / NRD / NR each: either exactly 2 values with a trailing `/`, or
      exactly N values with no `/` (never >2 before `/`)?
- [ ] Source depths and receiver depths in meters; receiver ranges in km?

## Run type and beams

- [ ] Run-type char 1 is a valid letter (`R E I S C A a`)?
- [ ] If run type uses Cerveny beams (`'CC'`/`'CR'`), the two trailer lines are
      present; if geometric/Gaussian (`'CG'`/`'CB'`/`'CS'`), they are absent?
- [ ] Launch angles in degrees, equally spaced via `ALPHA1 ALPHA2 /` (required
      for TL runs)?
- [ ] Fan spans wide enough to illuminate every receiver, correct sign
      (negative = downward)?

## Ray box and units

- [ ] STEP in meters (0 = auto)?
- [ ] ZBOX (m) exceeds the deepest receiver / seabed by ~1% (unless
      intentionally clipping bottom bounces)?
- [ ] RBOX (km) exceeds the farthest receiver range by ~1%?
- [ ] Environment (SSP, bathymetry, altimetry) defined over the entire box,
      including negative ranges if rays turn back past the source?

## Run environment

- [ ] `case.env` is in the MATLAB `pwd`?
- [ ] `which bellhop.exe` resolves to `<AT>/linux-bin/bellhop.exe`?
- [ ] `global units jkpsflag` set before plotting?

## After the run

- [ ] `.prt` checked first if anything looks wrong (it names the offending
      block)?
- [ ] Output file matches the run type (`.shd` for C/I/S, `.ray` for R/E, `.arr`
      for A/a)?
- [ ] Not a blank/all-zero `.shd` (box too small, fan too narrow/wrong sign,
      receiver at zero range, or non-TL run type)?
- [ ] Convergence confirmed: doubled NBEAMS and halved STEP, results stable?

## Cross-links

- `bellhop-runbook.md`
- `bellhop-env-template.md`
- `../solvers/solver-bellhop.md`
