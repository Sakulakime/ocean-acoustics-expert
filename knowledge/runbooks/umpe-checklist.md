---
title: Runbook - UMPE pre-run checklist
type: runbook
method_family: parabolic-equations
status: active
---

# UMPE Pre-Run Checklist

Terse yes/no validation before running UMPE. Answer every item "yes" or fix it
first. The biggest killers are a binary built without `-fno-automatic`, a
sediment depth typed where a thickness belongs, and a real number written
without a decimal point. Detailed rationale and source citations are in
`umpe-runbook.md`; annotated input files are in `umpe-input-template.md`.

Run `ocean-acoustics-expert validate_umpe_inp <case-dir>` first (defaults to the
current directory). Exit 0 means the checked records passed; a diagnostic names
the first bad record. It checks fixed-width numbers, list counts, environment
blocks and whether basement depth minus sediment thickness leaves water. It
cannot identify an absolute interface depth that also fits as a thickness;
compare with independent water depths. Geometry is checked on the input knot
grids, not by simulating roughness or marching. With an automatic range step,
check the resolved step against knot spacings in the log. The preflight accepts
the plain numeric layout of `umpe-input-template.md` (one interface row per
line, no comments or Fortran repetition syntax), not every list-directed dialect.
It checks `pefiles.inp` record structure, not output selection, derived record
lengths, build flags, convergence or field accuracy.

## Build

- [ ] Binary built with `-fno-automatic` (plus `-O2 -std=legacy`)?
- [ ] `ave.f:15` reads `nn2 = (nn-1)/2` (no `ifix` on an integer)?
- [ ] Trailing Ctrl-Z byte (0x1A) of the distributed `qtime.f` and `qdate.f`
      removed?

## Files and directory

- [ ] `pefiles.inp` present in the run directory (fixed name)?
- [ ] Its lines 1-2 name the actual `perun.inp` and `peenv.inp`?
- [ ] Line 38 of `pefiles.inp` is `1 1 1` when a TL field is wanted?
- [ ] Fresh directory per case (outputs are overwritten in place)?
- [ ] Not running through `examples/*/ex.scr` (needs GMT/gnuplot, deletes
      outputs)?

## perun.inp

- [ ] Exactly 32 lines, labels unchanged, colon in column 33, value from
      column 34?
- [ ] Every fixed-width real value written with a decimal point (`70.0`, not `70`)?
- [ ] Integer switches within columns 34-38?
- [ ] PE type 1-5, density smoothing 1-2, starting field 1-3, units 1 for the unmodified source?
- [ ] Units 1 means ranges in km and depths in m everywhere, in both input
      files?
- [ ] Not both `# OF ROUGHNESS REALIZATIONS` > 1 and `NUMBER OF FREQUENCIES`
      > 1 (the run aborts)?
- [ ] If PE type 3: aware the code uses the LOGPE kinetic operator there?
- [ ] `# TL DEPTHS` ≤ 10 and `# BB RANGES` ≤ 3 (one of four slots is needed for the sentinel)?
- [ ] `RMS SOURCE WIDTH + SOURCE TAPER WIDTH` ≤ 90° (example README; not
      checked by the code)?
- [ ] `REF. SOUND SPEED` near the depth-averaged water speed?
- [ ] `MAX COMPUTATIONAL DEPTH` (`HD`) such that the deepest basement is
      above `0.75*HD`, with margin?
- [ ] Output range window inside `[0, MAXIMUM RANGE]`, depth window inside
      `[0, HD]`?
- [ ] FFT size 0 (auto) or a power of 2 ≤ 4096; range step 0.0 (auto) or not
      larger than the ideal step the log prints?

## peenv.inp

- [ ] Order: `ISEED`, `NSS` + profiles, `NB` + rows, `NBS` + rows, `NS` +
      rows, `NSB` + rows?
- [ ] `NSS` and `NB` in 1-100; `NBS`, `NS`, `NSB` in 0-100?
- [ ] Each SSP block header is `ZV(km) NSSD`, first profile at `ZV = 0.0`?
- [ ] Each profile ≤ 512 depth points, or ≤ 511 when the code appends `HD`?
- [ ] Every basement and sediment row has all 10 fields?
- [ ] **Sediment second field is a THICKNESS (m), not a depth?**
- [ ] With sediment, basement `BD` = water depth + sediment thickness?
- [ ] Thickness 0.0 where there is no sediment?
- [ ] Ranges in every list increase and only the first entry is at 0.0?
- [ ] Attenuation in dB/(km·Hz): `1000*alpha_lambda/c` from dB/λ?
- [ ] Density as a ratio to water (`RDEN`), not g/cm³ unless water is 1.0?
- [ ] `NS` rows give wind speed (m/s); `NSB` rows give equivalent rms height
      (m)?

## After the run

- [ ] `grep -n "ERROR\|WARNING" umpe.log` empty, or every line understood?
      (`STOP : <date>` appears even after an input error.)
- [ ] No "COMPUTATIONAL DEPTH TOO SMALL" in the log?
- [ ] "Range skip factor being increased" understood if present?
- [ ] `tlgmt.bin` size = `botgmt.dat` rows × output depth points × 4 bytes?
- [ ] `tlgmt.bin` reshaped with the `botgmt.dat` row count, not the log's
      "RANGE POINTS"?
- [ ] Depth axis built as `(i+0.5)*HD/(N/2)` from the log's `N` and `HD`
      (for `DSTRT = 0`, depth skip 1)?
- [ ] 170 dB cells treated as clipped, not as physics?
- [ ] Plot follows `../visualization.md` (jet_r, adaptive 50 dB window,
      depth down, water mask from `sedgmt.dat`)?
- [ ] Convergence checked: halved range step and doubled FFT size give the
      same TL?

## Cross-links

- `umpe-runbook.md`
- `umpe-input-template.md`
- `ram-checklist.md`
