---
title: Runbook - UMPE input file templates (perun.inp, peenv.inp, pefiles.inp)
type: runbook
method_family: parabolic-equations
status: active
---

# UMPE Input File Templates

A complete, runnable three-file UMPE case: a 10 km shallow-water run at
100 Hz with a range-dependent sound-speed profile, a sloping basement and a
20 m sediment layer, using the WAPE (type 4) and a wide-angle starting field.
Verified: copied verbatim into a scratch directory and run with a
`-fno-automatic` gfortran build, it ends with `STOP`, prints no `ERROR` or
`WARNING`, and writes 698 range records × 171 depths to `tlgmt.bin`
(N = 512, HD = 600 m, range step 4.77 m).

Field meanings, limits and source citations are in `umpe-runbook.md`; pre-run
checks are in `umpe-checklist.md`.

Comment rules before editing:

- **No comments inside the files.** `perun.inp` is fixed-column (value from
  column 34); `peenv.inp` reads each sound-speed profile with one list-directed
  `READ` that spans several lines, so trailing text on a profile row is taken
  as the next number. The annotations live in the tables below, not in the
  files.
- **Real values in `perun.inp` need a decimal point.** `f14.6` reads `10` as
  `0.00001`.

## perun.inp

```
TITLE                           :template_sloping_sediment
TYPE OF PE APPROX. (1-5)        :4
TYPE DENSITY SMOOTHING (1,2)    :2
TYPE OF STARTING FIELD (1-3)    :2
TYPE OF INPUT DATA UNITS (1,2)  :1
APPLY SURFACE FILTER? (0,1)     :0
APPROX OR EXACT SURF? (0,1)     :0
# OF ROUGHNESS REALIZATIONS     :1
RANGE AVERAGE TL CURVES? (0,1)  :0
RANGE TO AVERAGE OVER (km,nm)   :1.0
SL(dB re uPa re 1m,1yd)         :200.000
SOURCE DEPTH (m,ft)             :50.000
REF. SOUND SPEED (m/s,ft/s)     :1500.000
CENTER FREQUENCY (Hz)           :100.000
NUMBER OF FREQUENCIES           :1
FREQUENCY BANDWIDTH (Hz)        :10.0
FFT TRANSFORM SIZE              :512
RANGE STEP SIZE (km,nm)         :0.0
MAXIMUM RANGE (km,nm)           :10.000
MAX COMPUTATIONAL DEPTH (m,ft)  :600.00
CENTRAL SOURCE ANGLE (DEG)      :0.
SOURCE ARRAY LENGTH (m,ft)      :20.0
RMS SOURCE WIDTH (DEG)          :80.0
SOURCE TAPER WIDTH (DEG)        :10.0
DENSITY MIX LENGTH (# DELD)     :0.0
SSPEED MIX LENGTH (# DELD)      :0.0
SURF LOSS FCTN WIDTH (# DELD)   :0.0
# TL DEPTHS, TL DEPTHS (m,ft)   :2  30.000 90.000
# BB RANGES, BB RANGES (km,nm)  :1  10.000
BB EXTRACTION DEPTH (m,ft)      :50.000
MIN, MAX OUTPUT RANGE, NSKIP    :0.00 10.00 3
MIN, MAX OUTPUT DEPTH, NSKIP    :0.00 400.00 1
```

Each label is exactly 32 characters, so the colon is in column 33. Copy the
labels; do not retype them.

| Line | Value here | Why |
|---|---|---|
| 2 | `4` | WAPE. Change to 1 (SPE) ... 5 (LOGPE) to compare approximations on the same environment; note that type 3 runs the LOGPE kinetic operator in this code (`umpe-runbook.md`) |
| 3 | `2` | cubic-spline density smoothing |
| 4 | `2` | wide-angle starting field; 1 = Gaussian, 3 = vertical array (uses line 22) |
| 5 | `1` | MKS: ranges km, depths m, speeds m/s |
| 6-10 | `0 0 1 0 1.0` | no surface filter, approximate surface method, one realization, no range averaging |
| 11 | `200.000` | source level; does not change TL |
| 12-14 | `50.000`, `1500.000`, `100.000` | source depth (m), \(c_0\) (m/s), frequency (Hz) |
| 15-16 | `1`, `10.0` | CW; bandwidth unused |
| 17 | `512` | FFT size. 0 would let the code pick 256 here (depth cell 4.7 m ≈ λ/3); 512 gives 2.3 m |
| 18 | `0.0` | automatic range step, \(2/(k_0\sin^2 90^\circ)\) = 4.77 m |
| 19-20 | `10.000`, `600.00` | max range (km); `HD` (m). Deepest basement 150 m < 0.75 × 600 = 450 m, clear of the sponge |
| 21-24 | `0. 20.0 80.0 10.0` | no steering; array length unused; 80° aperture + 10° taper = 90° |
| 25-27 | `0.0` | automatic mixing lengths |
| 28 | `2  30.000 90.000` | two TL-vs-range files, `tldr.001` at 30 m and `tldr.002` at 90 m |
| 29-30 | `1  10.000`, `50.000` | broadband settings, ignored for CW but must parse |
| 31 | `0.00 10.00 3` | output every 3rd range step; keeps the count under 1000 so the code need not raise it |
| 32 | `0.00 400.00 1` | output depths 0-400 m, every cell |

## peenv.inp

```
1
2
0.0 3
0.0 1500.0
50.0 1495.0
100.0 1492.0
5.0 3
0.0 1502.0
50.0 1496.0
150.0 1490.0
2
0.0  100.0 1700.0 0.0 2.00 0.2941 0.0 0.0 0.0 0.0
10.0 150.0 1700.0 0.0 2.00 0.2941 0.0 0.0 0.0 0.0
1
0.0  20.0 1550.0 0.0 1.50 0.3226 0.0 0.0 0.0 0.0
0
0
```

| Lines | Content | Notes |
|---|---|---|
| 1 | `ISEED` = 1 | random seed; matters only with rough interfaces |
| 2 | `NSS` = 2 | two sound-speed profiles |
| 3 | `0.0 3` | profile 1 at range 0.0 km, 3 depth points |
| 4-6 | `depth(m) c(m/s)` | stops at 100 m; the code extends the last speed to `HD` |
| 7 | `5.0 3` | profile 2 at 5 km; beyond the last profile the code holds it constant |
| 8-10 | `depth c` | |
| 11 | `NB` = 2 | two basement rows, linear in range between them |
| 12-13 | `ZB BD BV BG RDEN BLKMI SIGBOT ALCBO BSWS BSWLKMI` | basement top at 100 m (0 km) and 150 m (10 km); 1700 m/s, density ratio 2.0, 0.5 dB/λ = 1000 × 0.5 / 1700 = 0.2941 dB/(km·Hz); flat, no shear |
| 14 | `NBS` = 1 | one sediment row, constant in range |
| 15 | `ZBS BSD BSV ...` | **`BSD` = 20.0 is a thickness**: seafloor at 100 − 20 = 80 m (0 km) to 130 m (10 km), as `sedgmt.dat` confirms. 1550 m/s, ratio 1.5, 0.5 dB/λ = 0.3226 dB/(km·Hz) |
| 16 | `NS` = 0 | no rough surface |
| 17 | `NSB` = 0 | no bubble layer |

Wrong on purpose: writing `80.0` (the seafloor depth) as `BSD` would put the
seafloor at 100 − 80 = 20 m. The run would not complain.

## pefiles.inp

```
perun.inp
peenv.inp
0
tlb.dat
tlbave.dat
0
tlbs.dat
tlbsave.dat
0
tls.dat
tlsave.dat
0
apvelrr.bin
0
apvelri.bin
0
apvelzr.bin
0
apvelzi.bin
0
prssrr.bin
0
prssri.bin
0 1
phase1r.dat
phase1i.dat
0 1 1 0
phase2r.dat
phase2i.dat
ssp.dat
potent.dat
0 1 1 0
psikr.dat
psiki.dat
psizr.dat
psizi.dat
psizt.dat
1 1 1
tlgmt.bin
botgmt.dat
sedgmt.dat
surfgmt.dat
0
finfield.dat
```

44 lines. Every group stays in place even when switched off; only the integers
change.

| Line | Value | Meaning |
|---|---|---|
| 1-2 | `perun.inp`, `peenv.inp` | the two input files; any name under 50 characters |
| 3, 6, 9 | `0` | interface TL lines (basement, sediment, surface) off |
| 12-22 | `0` | particle velocity and complex pressure off |
| 24 | `0 1` | k-domain propagator off (second integer: frequency number) |
| 27, 32 | `0 1 1 0` | propagator / field dumps off (frequency, realization, range step) |
| **38** | **`1 1 1`** | **write the TL field for frequency 1, realization 1**; followed by its four file names |
| 43 | `0` | final complex field off |

`tldr.001`, `tldr.002` are written whatever this file says, one per depth on
line 28 of `perun.inp`.

## Variants from this base

- **Compare PE approximations:** copy the case into five directories and
  change only line 2 of `perun.inp` to 1 ... 5.
- **Range-independent:** `NSS` = 1 and `NB` = 1 with a single row each.
- **No sediment:** keep `NBS` = 1 with thickness `0.0`, or set `NBS` = 0 and
  delete the row; then `BD` is the seafloor.
- **Deep water:** raise `HD` so the deepest basement stays above `0.75*HD`,
  and leave `FFT TRANSFORM SIZE` at 0 to get the automatic size (capped at
  4096).
- **Gaussian starter:** line 4 = `1`, and narrow `RMS SOURCE WIDTH` to the
  aperture the PE type supports.
- **Rough sea surface:** `NS` = 1 with `0.0 <wind m/s>`; more realizations on
  line 8 of `perun.inp` (and keep `NUMBER OF FREQUENCIES` = 1).

## Cross-links

- `umpe-runbook.md`
- `umpe-checklist.md`
- `ram-in-template.md`
