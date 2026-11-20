---
title: Runbook - UMPE (Linux, gfortran build)
type: runbook
method_family: parabolic-equations
status: active
---

# UMPE Runbook

Operational guide for building and running UMPE (University of Miami
Parabolic Equation, Kevin B. Smith, v1.1, 1994), a split-step Fourier PE model
in Fortran 77, on a Linux workstation with a modern gfortran, and for reading
its `tlgmt.bin` / `botgmt.dat` / `tldr.NNN` outputs. For physics background see
`../solvers/solver-umpe.md` and `../chapters/ch06-parabolic-equations.md`; for the RAM counterpart see
`ram-runbook.md`.

Provenance. Every format statement below was checked against the Fortran source
or the UMPE manual (`UMPE.pdf`, Smith, 1994). Source citations are `file:line`
in the UMPE source tree; `pemp.f`, `phase2.f`, `ssi.f`, `initk.f` and `phase1.f`
are unmodified from the distributed `UMPE.zip`, so the line numbers hold for a
fresh unpack. Manual citations use the printed page number, with the PDF page
in parentheses (PDF page = printed page + 2). Behaviour marked "observed" was
seen in test runs on Linux with gfortran 15.2. Guidance with no source behind
it is marked `[inference]`.

## When to use UMPE

UMPE marches a one-way field in range with the split-step Fourier (SSF)
algorithm: a diffraction step in vertical wavenumber and a refraction step in
depth, with FFTs between them (manual §11, p. 64 (PDF 66)). Pick it for:

- **Comparing PE approximations.** One integer switches between five
  operator pairs (manual §1, pp. 14-15 (PDF 16-17); dispatch in
  `phase1.f:53,58` and `phase2.f:778,781`):

  | Type | Name | Kinetic operator | Potential operator |
  |---|---|---|---|
  | 1 | SPE (standard, narrow-angle) | \(\tfrac12(k/k_0)^2\) | \(-\tfrac12(n^2-1)\) |
  | 2 | Variant SPE | \(\tfrac12(k/k_0)^2\) | \(-(n-1)\) |
  | 3 | Variant WAPE | \(1-\sqrt{1-(k/k_0)^2}\) | \(-\tfrac12(n^2-1)\) |
  | 4 | WAPE (wide-angle) | \(1-\sqrt{1-(k/k_0)^2}\) | \(-(n-1)\) |
  | 5 | LOGPE | \(-\ln\cos(k/k_0)\) | \(-\ln n\) |

  The table is the manual's. **The code differs for type 3:** `phase1.f`
  builds the SPE kinetic operator for types 1-2 (`phase1.f:53-56`), the
  wide-angle one only for type 4 (`phase1.f:58-62`), and the LOGPE one for
  everything else (`phase1.f:67-71`). So type 3 runs with
  \(-\ln\cos(k/k_0)\) and the SPE potential, not the Variant WAPE the manual
  describes. Whether that is intended is not documented; check before using
  type 3 in a comparison.

- **Stochastic rough interfaces.** Rough bottom, sediment and sea surface
  (wind speed), plus an equivalent bubble layer, with several random
  realizations averaged incoherently (manual p. 70 (PDF 72); `phase2.f:222-283`).
- **Broadband runs.** Several frequencies across a band, Fourier-synthesized
  into time-domain TL (manual §5). Use up to three ranges with the unmodified
  source; the fourth slot is needed for a sentinel (`pemp.f:242-244,569`).

Compared with RAM (`ram-runbook.md`):

- RAM uses split-step Padé. It has no separate narrow-angle switch: `np` on
  line 5 of `ram.in` is the number of Padé terms. `np = 1` is the setting
  closest to a narrow-angle PE, but it is not the same approximation as UMPE
  type 1, so the two can only be compared qualitatively. `[inference]`
- UMPE uses one constant range step and one constant reference speed \(c_0\)
  per run (manual §11, p. 64 (PDF 66)). COA notes that split-step Fourier is
  efficient for long-range, narrow-angle propagation with little bottom
  interaction and loses its advantage in wide-angle, bottom-interacting
  problems (see the split-step subsection of
  `../chapters/ch06-parabolic-equations.md`). For strongly bottom-interacting
  shallow-water cases RAM is usually the cheaper accurate choice. `[inference]`
- Neither model computes backscatter.

## Environment and paths

UMPE is independent of the Acoustics Toolbox. Resolve `{{umpe_root}}` through
`local-paths.yaml` before using these recipes. If it is unset, reinstall with
`--umpe-root <dir>` pointing to the unpacked source (not the executable or a case).

```
source + makefile: {{umpe_root}}/*.f, {{umpe_root}}/makefile
manual:            {{umpe_root}}/UMPE.pdf   (sections 11 and 12)
examples:          {{umpe_root}}/examples/ex*/   (perun.inp, peenv.inp, pefiles.inp, README)
```

## Building with modern gfortran

The distributed makefile has `FC = f77` and `FFLAGS = -g`. For a stock
range-index build with gfortran 15.2:

1. **`FFLAGS = -g -O2 -fno-automatic -std=legacy`.** `-fno-automatic` is the
   one that matters. `phase2` reads the whole environment into local arrays on
   its first call only (the read block is skipped afterwards, `phase2.f:80`)
   and initialises its range-interpolation cursors `IS`, `IB`, `IBS`, `ISU`,
   `ISUB` and the bracketing ranges `ZV2`, `ZB2`, ... only when `IZ = 0`
   (`phase2.f:389-410`). Later calls, one per range step, rely on those locals
   keeping their values. There is no `SAVE` statement in `pemp.f`, `phase2.f`
   or `ssi.f`; the code assumes the static locals of the compilers it was
   written for `[inference]`. Without
   `-fno-automatic`, observed: the same input crashed 3 of 3 times, with
   SIGSEGV or SIGBUS at `phase2.f:438` (`ZV2=ZV(IS)`); an `-O0
   -ffpe-trap=invalid,zero,overflow` build stopped first with SIGFPE at
   `ssi.f:24`, called from `phase2.f:442`.
2. **`ave.f:15`:** `nn2 = ifix((nn-1)/2)` becomes `nn2 = (nn-1)/2`. gfortran
   rejects it: "type mismatch in argument 'a'; pass 'INTEGER(4)' to
   'REAL(4)'" (observed).
3. **`qtime.f`, `qdate.f`:** delete the trailing DOS Ctrl-Z byte (0x1A) that
   the files in the distributed `UMPE.zip` end with.
   gfortran stops with "Non-numeric character in statement label" otherwise,
   with or without `-std=legacy` (observed).

`-std=legacy` only suppresses warnings: a build without it also works, but
prints "Fortran 2018 deleted feature" warnings (shared DO termination,
arithmetic IF), which are harmless. On Ubuntu `f77` is a symlink to gfortran,
so `FC = f77` can stay.

```bash
build_dir=$(mktemp -d)
cp "{{umpe_root}}"/*.f "{{umpe_root}}/makefile" "$build_dir/"
cd "$build_dir"
# Apply edits 2 and 3 above if the source is not already adapted, then:
make FC=gfortran FFLAGS="-g -O2 -fno-automatic -std=legacy"
# debug build: add -fcheck=bounds -ffpe-trap=invalid,zero,overflow
```

Observed with the debug flags plus `-fno-automatic`: a 70 km, 150 Hz,
N = 4096 run finishes cleanly. Its TL matched the plain `-O2` build to within
0.1 dB in 99.95 % of cells (max difference 2.2 dB), so use the plain build for
production numbers.

### Preserve the official ex4b input (MKS range-index fix)

Stock v1.1 undercounts some inclusive output windows (`pemp.f:312-321,1036-1039`).
In `ex4b`, `60.00 80.00 2` selects 60.01, 60.03, …, **80.01 km**: 1001
records although the log predicts 1000. With bottom TL enabled, accessing
`TLB(1001)` exceeds the array bound (`pemp.f:19,1132`). The plotting script
`examples/ex4b/gmtf.t3` expects 1000 ranges × 171 depths.

To keep the three original input files, apply the supplied patch **once in a
separate build directory** containing the compiler-adapted sources above. The
patch changes only output indexing; neither the propagation operator nor the
100-km march changes. Partial windows use `(start, end]` on the actual marched
metre coordinates. A full window (`end = ZMAX`) keeps the rounded final march
step, even if that step is slightly beyond the nominal `ZMAX`. Installation never patches `{{umpe_root}}` or its binary.

```bash
# From that source copy, not the original tree. Verify the stock pemp.f first.
echo '937cc70b89361cb2a3f3432d681fd51f10530af14750c655537009e1c437f2fd  pemp.f' | sha256sum -c - &&
  patch --fuzz=0 --forward -p1 < "{{knowledge_base}}/runbooks/patches/umpe-v1.1-mks-range.patch" &&
  make -B FC=gfortran FFLAGS="-g -O2 -fno-automatic -std=legacy -fcheck=bounds"
```

From a fresh case directory containing the original `ex4b` inputs, run
`ocean-acoustics-expert validate_umpe_inp --patched-range-index .` and then
**that rebuilt binary**. The flag declares which index rule to check; it does
not detect, patch, or execute a binary. Expect 1000 records from 60.01 to
79.99 km at 20-m intervals (`tlgmt.bin`: 684000 bytes on the tested build).

If using the stock solver, omit the flag. In a **case copy only**, change
`perun.inp` line 31 to `60.00 79.99 2` after the colon; leave the 100-km
propagation maximum alone. Its eight requested outputs matched the patched
run byte for byte. Raising the skip to 3 is safe but yields only 667 records.
From a repository checkout, repeat the eight official example checks with
`python3 scripts/verify-umpe-examples.py <UMPE_ROOT>` (requires Python 3.10+,
Node.js, gfortran and patch; builds and runs in temporary directories).

## How to run

`umpe` takes no arguments. It opens the fixed file name `pefiles.inp` in the
current directory (`pemp.f:54,73`); `pefiles.inp` names the run-parameter file
and the environment file (`pemp.f:76-81`). Only `pefiles.inp` has a fixed name
(manual p. 65 (PDF 67)).

```bash
mkdir -p /path/to/umpe_run && cd /path/to/umpe_run
cp /path/to/case/perun.inp /path/to/case/peenv.inp /path/to/case/pefiles.inp .
ocean-acoustics-expert validate_umpe_inp . && /path/to/umpe_build/umpe > umpe.log 2>&1
grep -n "ERROR\|WARNING" umpe.log      # must be empty or understood
tail -2 umpe.log                       # last line: STOP : <date>
ls -l tlgmt.bin botgmt.dat tldr.001
```

- Do not use `examples/*/ex.scr` as the run method. They are csh scripts that
  call GMT (`rawtogrd`, `grdimage`), gnuplot and ghostscript, and they delete
  every `*.dat`, `*.bin` and `tldr.*` output at the end (`ex1a/ex.scr:20-24`).
- Run time, observed: 70 km, 150 Hz, N = 4096, range step 3.26 m: about 4 s.
- **`STOP : <date>` does not prove success.** Input errors jump to label 9000
  ("ERROR IN RUN. CHECK INPUT PARAMETERS.") or 999, and both end in the same
  `STOP` line (`pemp.f:1406-1408`). "ERROR IN SPECIFIED OUTPUT RANGES" stops
  before marching (`pemp.f:306-310`). "ERROR: COMPUTATIONAL DEPTH TOO SMALL!"
  does not stop the run at all (`pemp.f:661-664`; observed exit 0). Always grep
  the log.
- An environment-count error in `phase2` (for example `NSS = 0`) prints a
  message and returns (`phase2.f:100-104`), but the run then crashed with
  SIGSEGV (observed), and the buffered message was lost from the log.
- Outputs are overwritten in place: use one directory per case.

The read-only `validate_umpe_inp` command follows the first two filenames in
`pefiles.inp` and checks the parameter and environment records before a run.
See `umpe-checklist.md` for its scope and the remaining manual checks.

## perun.inp: run parameters

32 fixed lines. Each line is a 32-character label, a colon in column 33 and the
value from column 34 (manual p. 69 (PDF 71)). The code skips the first 33
characters with `format(33x,...)` (`pemp.f:158-162`), so the label text is
never parsed, but its width is: keep the shipped labels unchanged, as the
manual asks.

Field formats (`pemp.f:158-162`), which decide what you may type:

| Format | Used for | Rule |
|---|---|---|
| `a30` | title | 30 characters |
| `i5` | integer switches, `NFREQ`, `N` | integer within columns 34-38 |
| `f14.6` | most reals | **always write a decimal point**: `70` is read as `0.000070` |
| `g14.8` | range step | write a decimal point |
| `a80` + list-directed | TL depths, BB ranges, output windows | free format |

The decimal-point trap is real: with `MAXIMUM RANGE` written as `70`, the run
stopped with "ERROR IN SPECIFIED OUTPUT RANGES" (observed), because an
`f14.6` edit descriptor inserts six implied decimals when the field has no
point.

Fields in order (`pemp.f:166-252`; manual pp. 69-71 (PDF 71-73)). Units shown
are for `units = 1`. The manual also specifies ft, ft/s and nm (`units = 2`),
but the unmodified English-units branch does not initialize the range-step
count `NZ` used by the march (`pemp.f:277,390-528,837`). Use MKS for runs.

| # | Label | Meaning |
|---|---|---|
| 1 | `TITLE` | free text |
| 2 | `TYPE OF PE APPROX. (1-5)` | operator pair, table above |
| 3 | `TYPE DENSITY SMOOTHING (1,2)` | 1 = tanh, 2 = cubic spline (manual §2.1.2) |
| 4 | `TYPE OF STARTING FIELD (1-3)` | 1 = Gaussian, 2 = wide-angle, 3 = vertical array (`initk.f:48-70`; manual §7) |
| 5 | `TYPE OF INPUT DATA UNITS (1,2)` | 1 = MKS with ranges in km; 2 = English with ranges in nm. Outputs are always MKS |
| 6 | `APPLY SURFACE FILTER? (0,1)` | 1 = remove surface reflections (manual §8) |
| 7 | `APPROX OR EXACT SURF? (0,1)` | rough-surface scatter method (manual §4.2) |
| 8 | `# OF ROUGHNESS REALIZATIONS` | integer ≥ 1 |
| 9 | `RANGE AVERAGE TL CURVES? (0,1)` | running range average of line outputs |
| 10 | `RANGE TO AVERAGE OVER (km,nm)` | averaging window |
| 11 | `SL(...)` | source level; affects only particle-velocity and pressure outputs, not TL (`examples/ex1a/README`) |
| 12 | `SOURCE DEPTH (m,ft)` | positive down |
| 13 | `REF. SOUND SPEED (m/s,ft/s)` | \(c_0\), constant for the run |
| 14 | `CENTER FREQUENCY (Hz)` | |
| 15 | `NUMBER OF FREQUENCIES` | 1 = CW; request a power of two up to 512 to preserve the frequency count (`pemp.f:572-582`) |
| 16 | `FREQUENCY BANDWIDTH (Hz)` | used only when field 15 > 1 |
| 17 | `FFT TRANSFORM SIZE` | 0 = automatic; rounded up to a power of 2, max 4096 for units 1 |
| 18 | `RANGE STEP SIZE (km,nm)` | 0.0 = automatic |
| 19 | `MAXIMUM RANGE (km,nm)` | |
| 20 | `MAX COMPUTATIONAL DEPTH (m,ft)` | `HD`; must exceed the deepest bottom, see below |
| 21 | `CENTRAL SOURCE ANGLE (DEG)` | beam steering |
| 22 | `SOURCE ARRAY LENGTH (m,ft)` | used only for starting field 3 |
| 23 | `RMS SOURCE WIDTH (DEG)` | source aperture |
| 24 | `SOURCE TAPER WIDTH (DEG)` | taper beyond field 23; keep 23 + 24 ≤ 90 ("cannot specify more than that", `examples/ex1a/README`; the code does not check it) |
| 25-27 | `DENSITY MIX`, `SSPEED MIX`, `SURF LOSS FCTN WIDTH` | in depth cells; 0.0 = automatic |
| 28 | `# TL DEPTHS, TL DEPTHS (m,ft)` | count ≤ 10, then the depths (`pemp.f:238-240`) |
| 29 | `# BB RANGES, BB RANGES (km,nm)` | reader accepts ≤ 4, but use ≤ 3: the sentinel `ZTIME(NZTL+1)` also needs a slot (`pemp.f:22,242-244,569`) |
| 30 | `BB EXTRACTION DEPTH (m,ft)` | broadband only |
| 31 | `MIN, MAX OUTPUT RANGE, NSKIP` | output range window and range-step decimation |
| 32 | `MIN, MAX OUTPUT DEPTH, NSKIP` | output depth window and depth-cell decimation |

A count above its limit in field 28 or 29 jumps to the 9000 error exit.

Automatic choices (MKS branch, `pemp.f:262-295`):

- Range step: \(\Delta r=2/\left(k_{\max}\sin^2\theta\right)\), with
  \(k_{\max}=2\pi f/c_0\) (upper band edge for broadband) and
  \(\theta=\max(\theta_{\rm rms}+\theta_{\rm taper},30^\circ)\) (`pemp.f:268`).
  A user step larger than this prints "RANGE STEP MAY BE TOO LARGE!".
- FFT size: `NT` \(=2k_{\max}\,HD\sin\theta/\pi\), rounded up to a power of 2
  and capped at 4096 (`pemp.f:281-283`); with \(\theta=90^\circ\) this gives a
  depth cell of about \(\lambda/2\). A user `N` smaller than `NT` prints "FFT
  SIZE MAY BE INADEQUATE." When `NT` itself is capped at 4096 there is no
  warning. The English-units branch does not cap a user `N` at 4096
  (`pemp.f:415`) although the arrays hold 4096 (`pemp.f:16`).
- Depth cell: `DELD = 2*HD/N` (`pemp.f:295`), so the real-ocean grid has
  `N/2` points over `HD`.

Constraints:

- **Realizations and frequencies.** Only one of fields 8 and 15 may exceed 1.
  With both > 1 the run stops before marching with "Cannot specify multiple
  freq and multiple realizations simultaneously." (`pemp.f:540-544`); the
  older comment at `pemp.f:190-193` only says the output "may be meaningless".
- **At most 1000 output ranges.** If the output window and `NSKIP` give more,
  stock v1.1 raises `NSKIP` based on its *estimated* count (`pemp.f:312-321`),
  not necessarily the number the march selects. Preflight checks the effective
  skip and the actual selected count; see the `ex4b` fix above.
- **`HD` and the sponge.** The deepest quarter of the real-ocean grid is an
  absorbing sponge (manual §8, p. 55 (PDF 57); "deepest 1/4" in
  `examples/ex1a/README`). If the deepest basement depth is at or below
  `0.75*HD` (`0.75*HD .LE. bdmax`), the log shows "ERROR: COMPUTATIONAL DEPTH
  TOO SMALL!" but the run continues (`pemp.f:661-664`). Keep the region of interest between the surface and the
  sponge, with margin.

## peenv.inp: environment

Read once, list-directed (free format), by `phase2.f:84-283`; manual pp. 71-73
(PDF 73-75). Units below are for `units = 1`.

```
ISEED
NSS
  ZV(km)  NSSD               (profile 1; first profile at range 0.0)
  NSSD rows: depth(m)  c(m/s)
  ... NSS profiles in all
NB
  NB rows: ZB(km) BD(m) BV(m/s) BG(1/s) RDEN BLKMI(dB/km/Hz) SIGBOT(m) ALCBO(m) BSWS(m/s) BSWLKMI(dB/km/Hz)
NBS
  NBS rows: ZBS(km) BSD(m) BSV BSG RDENS BSLKMI SIGBOTS ALCBOS BSSWS BSSWLKMI
NS
  NS rows: ZS(km) wind_speed(m/s)
NSB
  NSB rows: ZSB(km) rms_height(m)
```

Field notes:

- **Basement rows (NB).** `BD` is the basement depth; `BV` the compressional
  speed at its top; `BG` the speed gradient below it; `RDEN` the density ratio
  to water; `BLKMI` the attenuation; `SIGBOT` and `ALCBO` the rms roughness and
  its correlation length; `BSWS` and `BSWLKMI` the shear speed and shear
  attenuation (`phase2.f:135-143`; manual p. 72 (PDF 74)). The manual spells the
  attenuations `BLKMI`/`BSWLKMI`; the source calls them `BLNMI`/`BSWLNMI`.
- **Sediment rows (NBS).** Same ten fields, but **the second field is a
  thickness, not a depth** (manual p. 72 (PDF 74)): the sediment top is at
  `BD - BSD` (`phase2.f:519-521`). A thickness ≤ 0 means no sediment at that
  range (`phase2.f:520-524`), and a sediment thinner than one depth cell is
  dropped (`phase2.f:574`). With a sediment present, the seafloor the field
  sees is `BD - BSD`, so `BD` must be the water depth plus the thickness.
- **Surface rows (NS).** The second value is wind speed (m/s, or knots for
  `units = 2`), converted internally to rms roughness \(0.1U^2/g\)
  (`phase2.f:222-235`).
- **Attenuation units** are dB/(km·Hz): the code multiplies by frequency
  (`phase2.f:162`). From dB per wavelength \(\alpha_\lambda\) at speed \(c\):
  \(\alpha = 1000\,\alpha_\lambda/c\), independent of frequency. Example:
  10 dB/λ at 1600 m/s is 6.25 dB/(km·Hz).

Counts and limits:

- `NSS` and `NB` must be 1-100; `NBS`, `NS` and `NSB` may be 0-100. Out of
  range, `phase2` prints "ERROR IN ENVIRONMENTAL INPUT FORMAT: <name>"
  (`phase2.f:100-104,129-133,170-174,216-220,255-259`). A zero count is
  replaced by one flat entry (`phase2.f:206-210,245-249,279-283`).
- Range arrays are declared 101 long (`phase2.f:33-43`): up to 100 entries plus
  the slot the code appends to hold the last values to infinity
  (`phase2.f:310-314,328-336,350-358`).
- Each sound-speed profile holds at most 512 depth points (`SS(512,101)`,
  `phase2.f:35`), and the read does not check `NSSD` against it
  (`phase2.f:106-110`). If the last depth is below `HD` numerically, allow at most 511 input points: extending to `HD` writes one more (`phase2.f:118-122`).
- **Ranges after the first entry must be > 0 and increasing.** The end of each
  range list is found at the first entry after the first whose range is ≤ 0
  (`phase2.f:298,320,342,362,371`), so a repeated `0.0` silently truncates
  the list. `[inference: from the loop exits]`
- A profile that stops short of `HD` is extended to `HD` with its last speed
  (`phase2.f:118-122`); no manual extrapolation is needed.

Interpolation (`phase2.f:504-541`): the environment is linear in range between
entries; sound speed is linear in depth (`ssi.f:19-25`), then smoothed by one
pass of a 1-2-1 filter (`ssi.f:27-35`).

## pefiles.inp: file names and output switches

44 lines (manual pp. 66-68 (PDF 68-70); reader `pemp.f:73-153`). File names are
read with `format(a50)` (`pemp.f:70`), so keep them under 50 characters. Each
output group is one line of integers, then its file names. The first integer is
0/1 (compute and write?); the second, third and fourth select the frequency
number, the roughness realization and the range step for which it is written.

| Lines | Integers | Files | Content |
|---|---|---|---|
| 1-2 | | `perun.inp`, `peenv.inp` | input files (names may change) |
| 3-5 | 1 | `tlb.dat`, `tlbave.dat` | TL along the basement interface |
| 6-8 | 1 | `tlbs.dat`, `tlbsave.dat` | TL along the sediment interface |
| 9-11 | 1 | `tls.dat`, `tlsave.dat` | TL along the surface |
| 12-19 | 1 each | `apvelrr.bin` ... `apvelzi.bin` | particle velocity, 4 files |
| 20-23 | 1 each | `prssrr.bin`, `prssri.bin` | complex pressure |
| 24-26 | 2 | `phase1r.dat`, `phase1i.dat` | k-domain propagator |
| 27-31 | 4 | `phase2r/i.dat`, `ssp.dat`, `potent.dat` | z-domain propagator, SSP, potential |
| 32-37 | 4 | `psikr/i.dat`, `psizr/i/t.dat` | field functions |
| 38-42 | 3 | `tlgmt.bin`, `botgmt.dat`, `sedgmt.dat`, `surfgmt.dat` | full TL field and interface depths |
| 43-44 | 1 | `finfield.dat` | final complex field |

For a CW TL field, set line 38 to `1 1 1` (write, frequency 1, realization 1;
`pemp.f:145-149,804-806`). With it at 0, no field is written (`examples/ex1a/README`).
A complete file is in `umpe-input-template.md`.

## Outputs and how to read them

| File | Format | Content |
|---|---|---|
| `tlgmt.bin` | direct-access unformatted, `REAL*4`, no record markers | one record per output range, each `ndump` TL values (dB re 1 m) over the output depths (`pemp.f:805-806,1067`) |
| `botgmt.dat` | ASCII `(1x,f10.3,2x,f9.3)` | range (km), basement depth (m), one row per `tlgmt.bin` record (`pemp.f:1071,1082`) |
| `sedgmt.dat` | same | range (km), sediment-top depth (m); equals `botgmt.dat` when there is no sediment (observed) |
| `surfgmt.dat` | same | range (km), surface displacement (m) |
| `tldr.NNN` | ASCII `(1x,2(e15.5))` | range (km), TL (dB) at TL depth NNN; written for every field-28 depth whatever `pefiles.inp` says (`pemp.f:826-829,1336-1339`) |
| `umpe.log` | stdout | echoed parameters, `N`, `HD`, range step, profiles, warnings |

Reading `tlgmt.bin` (little-endian on x86; file size = records × `ndump` × 4,
verified on a 975 × 2048 run):

```python
import numpy as np
bot = np.loadtxt("botgmt.dat")              # one row per output range
n_range = bot.shape[0]
raw = np.fromfile("tlgmt.bin", dtype="<f4")
n_depth = raw.size // n_range
tl = raw.reshape(n_range, n_depth).T        # rows = depth, cols = range
```

- **Range count: take it from `botgmt.dat`, not from the log.** In stock v1.1 the log's
  "RANGE POINTS" is `MZTOT`, a floored count (`pemp.f:314`), while the march
  writes a record at every step that passes the skip test (`pemp.f:1036-1039`).
  Observed: log 974, `tlgmt.bin` and `botgmt.dat` 975, `tldr.001` 974 (the
  line files loop over `MZTOT`, `pemp.f:1320`). Another run agreed at 698.
- **Depth axis.** Cell `i` is at depth \((i-0.5)\,\Delta d\) with
  \(\Delta d=HD/(N/2)\) (`ssi.f:20`, `pemp.f:295`). The output starts at cell
  `n2strt = max(int(DSTRT/DELD-0.5)+1,1)` and takes every `NSKIP`-th cell
  (`pemp.f:329-331,1049-1050`). For `DSTRT = 0` and depth `NSKIP = 1`, row `j`
  (0-based) is at \((j+0.5)\Delta d\). Read `N` and `HD` from `umpe.log`
  ("N(NO. OF POINTS IN DEPTH)=", "HD(COMP. DPTH...").
- **Saturation.** Power is clipped at \(10^{-17}\) before the log, so TL tops
  out at 170 dB (`pemp.f:1062`). Cells above a displaced (rough) surface are
  zeroed and also read 170 dB (`pemp.f:1060-1061`); with a flat surface none
  are. In the observed 150 Hz, 6500 m run, 29 % of cells were at 170 dB,
  almost all in the bottom and sponge, and 0.0001 % in the water.
- TL is referenced to 1 m with cylindrical spreading applied (`RZ = r0/Z`,
  `r0 = 1`, `pemp.f:56,851`).

## Plotting the TL field

Follow `../visualization.md`: `jet_r`, the AT2020 adaptive window
(median + 0.75 std, rounded to 10 dB, 50 dB span), depth axis down, and a
water mask. Mask with `sedgmt.dat` (the seafloor), which equals `botgmt.dat`
when there is no sediment.

```python
import re
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

log = open("umpe.log").read()
hd = float(re.search(r"HD\(COMP\. DPTH.*?=\s*([\d.]+)", log).group(1))
n = int(re.search(r"N\(NO\. OF POINTS IN DEPTH\)=\s*(\d+)", log).group(1))
deld = hd / (n // 2)

sed = np.loadtxt("sedgmt.dat")              # seafloor; one row per record
r_km, z_floor = sed[:, 0], sed[:, 1]
raw = np.fromfile("tlgmt.bin", dtype="<f4")
n_depth = raw.size // r_km.size
tl = raw.reshape(r_km.size, n_depth).T      # rows = depth, cols = range
z = (np.arange(n_depth) + 0.5) * deld       # DSTRT = 0, depth NSKIP = 1

water = z[:, None] < z_floor[None, :]
TL_MIN, TL_MAX = 30.0, 120.0                # clip bounds (visualization.md); set per case
tl = np.clip(tl, TL_MIN, TL_MAX)
v = tl[water & np.isfinite(tl)]
tlmax = 10.0 * round((np.median(v) + 0.75 * np.std(v)) / 10.0)
tlmin = tlmax - 50.0

cmap = plt.get_cmap("jet_r").copy()
cmap.set_bad("0.75")
fig, ax = plt.subplots(figsize=(9, 4))
im = ax.pcolormesh(r_km, z, np.ma.masked_where(~water, tl), cmap=cmap,
                   vmin=tlmin, vmax=tlmax, shading="nearest", rasterized=True)
ax.plot(r_km, z_floor, "k-", lw=1.0)
ax.set_ylim(z.max(), 0)                     # depth axis points down
ax.set_xlabel("Range (km)"); ax.set_ylabel("Depth (m)")
cb = fig.colorbar(im, ax=ax); cb.set_label("TL (dB re 1 m)"); cb.ax.invert_yaxis()
fig.tight_layout(); fig.savefig("tl_field.png", dpi=150)
```

Observed: this script runs on the template case in `umpe-input-template.md`.
`../visualization.md` shows clip bounds of 60-120 dB, which suit long-range
cases. On the 10 km template, 60 dB lifted the whole near field (5 % of water
cells are below 51 dB) and flattened the plot, so the snippet uses 30 dB. The
clip only removes non-physical spikes; the color window still comes from the
adaptive rule.

## Porting a RAM case

From `ram.in` (`ram-runbook.md`) to UMPE, field by field. `[inference]` unless
a citation is given.

| RAM | UMPE | Change |
|---|---|---|
| `rmax`, `rb`, `rp` in m | ranges in km | divide by 1000 |
| `freq zs` | fields 14, 12 | same units |
| `c0` | field 13 | same |
| `zmax` | field 20 `HD` | basement must stay above `0.75*HD` (`pemp.f:661`) |
| bathymetry `rb zb`, up to 1000 points | `NB` basement rows, at most 100 | resample to ≤ 100 points; `BD = zb` when there is no sediment |
| bottom `cb`, `rhob` (g/cm³), `attn` (dB/λ) | `BV`, `RDEN`, `BLKMI` | `RDEN = rhob/rho_water`; `BLKMI = 1000*attn/cb` |
| water SSP `z cw` per range | `ZV NSSD` blocks | at most 512 depths per profile, 100 profiles |
| `np` Padé terms | field 2 | no equivalent; see "When to use UMPE" |
| sponge built into `attn` near `zmax` | built in | drop the RAM sponge rows; UMPE's sponge is the deepest quarter of `HD` |

## Gotchas

- **No decimal point in a real field** of `perun.inp`: read as value × 10⁻⁶.
- **Sediment thickness entered as a depth.** `BSD` is a thickness below which
  the basement starts at `BD`; an absolute depth puts the seafloor at
  `BD - depth`, often near the surface or negative.
- **Built without `-fno-automatic`.** Random-looking crashes in `phase2` or
  `ssi`, unrelated to the input data.
- **`STOP` read as success.** Grep `umpe.log` for `ERROR` and `WARNING`.
- **Range count from the log.** Use `botgmt.dat` rows to reshape `tlgmt.bin`.
- **`HD` too shallow.** The sponge overlaps the basement and the run still
  finishes.
- **Too many environment entries.** Above 100 `NB` rows or 512 SSP depths;
  the first is caught, the second is not.
- **Realizations and frequencies both > 1.** The run stops at once.
- **PE type 3** runs the LOGPE kinetic operator, not the manual's Variant WAPE.
- **`ex.scr` scripts** need GMT and gnuplot and delete the outputs.

A terse yes/no version is in `umpe-checklist.md`.

## Cross-links

- `umpe-input-template.md`
- `umpe-checklist.md`
- `ram-runbook.md`
- `../chapters/ch06-parabolic-equations.md`
- `../visualization.md`
- `../workflows/model-selection.md`
