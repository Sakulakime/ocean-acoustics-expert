---
title: Runbook - KRAKEN (Linux + MATLAB, AT toolbox)
type: runbook
method_family: normal-modes
status: active
---

# KRAKEN Runbook

Operational guide for running KRAKEN (and `KRAKENC`) from the local Acoustics
Toolbox (AT) install on Linux through MATLAB. Covers when to reach for normal
modes, the two-stage workflow, the `.env` and `.flp` file formats, the call
chain, reading and plotting outputs, physics semantics, and gotchas. For physics
background see `../solvers/solver-kraken.md`, `../chapters/ch05-normal-modes.md`,
and `../chapters/ch08-broadband-modeling.md`. The `.env` SSP and halfspace rules
are shared with BELLHOP and are not repeated in full here — see
`bellhop-runbook.md` for those, and this file for what KRAKEN adds.

## When to use KRAKEN

KRAKEN is a normal-mode model. It is the right tool for low-to-moderate
frequency waveguides where the coherent field is built from a small number of
trapped modes:

- Shallow water at low frequency: few dominant trapped modes, ideal for KRAKEN.
- Deep sound channel / long-range axial propagation and modal dispersion.
- Matched-field replicas, waveguide-invariant work, group-speed / dispersion
  studies — anything that needs the coherent modal interference structure.

It is weakest where the mode count explodes (high frequency — switch to BELLHOP)
or where strong range dependence demands a full two-way / PE field. See the
model-selection guidance at the end and `../workflows/model-selection.md`.

`kraken` solves for **real** wavenumbers (trapped modes) and adds attenuation
perturbatively; `krakenc` solves in the **complex** wavenumber plane to capture
leaky/radiating modes and elastic-bottom physics. They share the same files and
downstream readers; only the eigenvalue physics differs (see Semantics below).

## Environment and paths

The Linux binaries carry a `.exe` suffix but are genuine Linux ELF executables
(`file kraken.exe` -> `ELF 64-bit LSB pie executable, x86-64 ... for GNU/Linux 3.2.0`).

```
AT root:    {{at_2020}}
binaries:   <AT>/linux-bin/      kraken.exe, krakenc.exe, field.exe, bounce.exe
matlab src: <AT>/Matlab/         kraken.m, krakenc.m, Kraken/field.m, ReadWrite/, Plot/
matlab:     matlab (on PATH)
```

`kraken.m` resolves the binary with `which('kraken.exe')` (`kraken.m:8`) and
shell-runs `! "<fullpath>" filename` (`kraken.m:13`); `krakenc.m` does the same
with `which('krakenc.exe')` (`krakenc.m:9,14`). So on Linux the binary must still
be named `kraken.exe`/`krakenc.exe` (it is) and `<AT>/linux-bin` must be on the
MATLAB path. If `which('kraken.exe')` returns empty, `kraken.m:11` throws
`kraken.exe not found in your Matlab path`.

Required `addpath` (run once per session):

```matlab
AT = '{{at_2020}}';
addpath( genpath( fullfile( AT, 'Matlab' ) ) );   % kraken.m, field.m, read_modes, read_shd, plotmode, plotshd, plottlr, read_flp
addpath( fullfile( AT, 'linux-bin' ) );           % so which('kraken.exe') resolves
global units jkpsflag                              % used by plotshd.m:13
units = 'km';                                      % 'km' or 'm' for range axis
jkpsflag = 0;                                       % 0 = normal figures, 1 = fixed pub size
which kraken.exe                                    % must print <AT>/linux-bin/kraken.exe
which field.exe                                     % only needed if you run the Fortran field
```

`genpath` is required: `field.m` lives in `Matlab/Kraken/`, the readers in
`Matlab/ReadWrite/`, and the plotters in `Matlab/Plot/` — not in the `Matlab/`
root. If the executable bit is missing: `chmod +x <AT>/linux-bin/*.exe`.

## The two-stage workflow

KRAKEN runs as **two stages**, driven by two files (`case.env` and `case.flp`):

1. **`kraken` (or `krakenc`)** reads `case.env`, computes the normal modes, and
   writes `case.mod` (binary modes) + `case.prt` (text print/diagnostics).
2. **`field`** reads `case.flp` + `case.mod`, sums the modes, and writes the
   pressure/shade file — `case.shd.mat` from the MATLAB `field.m`, or `case.shd`
   from the Fortran `field.exe`.

The MATLAB wrappers chain the stages for you: `kraken.m:23` and `krakenc.m:20`
both end with `field( filename )`, so a single `kraken('case')` call runs **both**
stages. `filename` is passed through verbatim with **no extension** — KRAKEN
appends `.env`, `field` appends `.mod`. Always call with the bare case name.

| Stage | Command | Reads | Writes |
|---|---|---|---|
| 1. Modes | `kraken.exe case` | `case.env` | `case.mod` (binary modes), `case.prt` (text log) |
| 2. Field | `field( 'case' )` | `case.flp`, `case.mod` | `case.shd.mat` (MATLAB) or `case.shd` (Fortran) |

`field.m` hard-codes its I/O: it reads modes from `[FileRoot '.mod']`
(`field.m:33`), the field parameters via `read_flp(FileRoot)` -> `case.flp`
(`field.m:16`), and saves with `save([FileRoot '.shd.mat'], ...)` (`field.m:115`).

### How to run (MATLAB recipe)

Place `case.env` and `case.flp` in the current MATLAB `pwd`, then:

```matlab
cd /path/to/case          % directory containing case.env and case.flp
kraken( 'case' )          % NO extension; runs modes + field (field() fires inside)
```

To re-run just the field stage (after editing the `.flp`, without recomputing
modes):

```matlab
field( 'case' )           % reads case.mod + case.flp, writes case.shd.mat
```

`krakenc` is the complex/leaky-mode variant: same two-stage workflow, same file
set (`case.env` -> `case.mod` + `case.prt` -> field), and `krakenc.m:20` also
calls `field`. Use it when leaky modes, elastic bottoms, or accurate near-field
/ attenuation matter (see Semantics). The mode file it writes is read by exactly
the same `read_modes`.

End-to-end:

```matlab
kraken( 'case' )
figure; plotmode( 'case' )                  % mode shapes + wavenumbers
figure; plotshd( 'case.shd.mat' )           % TL field surface
figure; plottlr( 'case.shd.mat', 50 )       % TL vs range at 50 m receiver depth
[ Modes ] = read_modes( 'case.mod', 0 );    % modes struct (freq=0 -> single-freq)
[ Title, PlotType, freqVec, freq0, atten, Pos, p ] = read_shd( 'case.shd.mat' );
```

## ENV file format (KRAKEN)

The reader (`read_env.m` -> `read_env_core.m`) is Fortran free-format
(`fscanf`/`fgetl`), not column-positional. The same two rules as BELLHOP apply,
so they are stated tersely here — see `bellhop-runbook.md` for the full
treatment:

1. **SSP rows are NOT counted by `N`.** Row reading stops when a row's depth
   equals the medium bottom depth (`read_env_core.m:191`); `N` is mesh points.
2. **Text after the numbers/`/` is decoration.** Only numbers, quoted tokens,
   and the trailing `/` are load-bearing; the `! comment` is ignored. Commas
   between values are tolerated (`gulf_rd.env` has rows like `0.0, 1536.00 /`).

### What KRAKEN adds vs BELLHOP

`read_env.m:21-35` runs the shared `read_env_core` (title -> bottom halfspace,
**identical to BELLHOP** — the SSP block, top/bottom option strings, and
acousto-elastic halfspace columns are the same; do not re-learn them here, see
`bellhop-runbook.md`). Then, for `SCOOTER/KRAKEN/KRAKENC/KRAKEL/SPARC`, it reads
**two extra lines that BELLHOP never has**:

- `cLow cHigh` — phase-speed limits in **m/s** (`read_env.m:22-25`)
- `RMax` — maximum range in **km** (`read_env.m:27-29`)

They sit **after the bottom halfspace block and before the source/receiver depth
blocks**. `readszrz` then reads source + receiver depths (`read_env.m:47`).
KRAKEN does **not** read receiver ranges, a run-type line, or any beam block from
the `.env` — those concepts live in the `.flp` (or do not exist for modes).
Compare `MunkK.env` (ends at the NRz/Rz line) against the BELLHOP `MunkB.env`
which continues with ranges + run type + beam fan.

### Line-by-line structure (range-independent, single profile)

| Line | Field | Rule / source |
|---|---|---|
| 1 | Title | text inside single quotes `'...'` (`read_env_core.m:29-32`) |
| 2 | Frequency | one float, Hz (`:36`) |
| 3 | NMEDIA | integer; number of media layers (`:40`). KRAKEN routinely uses >1 (water + sediment) |
| 4 | Top option | quoted, per-character (`:44-57`); same letters as BELLHOP — see `bellhop-runbook.md` |
| 4a | Francois-Garrison | only if top char 4 = `F`: `T S pH z_bar` (`:109-113`) |
| 4b | Top halfspace | only if top char 2 = `A`: `z cp cs rho alphaI betaI` (`topbot.m:46-53`) |
| 5+ | SSP block, repeated NMEDIA times | per medium: header `N sigma depth` then data rows (`:148-225`) |
| - | Bottom option + sigma | quoted option char + sigma float, e.g. `'A' 0.0` (`:229-241`) |
| - | Bottom halfspace | only if bottom char 1 = `A`: `z cp cs rho alphaI betaI` (`topbot.m:46-53`) |
| **X1** | **`cLow cHigh`** | **KRAKEN-only**; two floats, **m/s** (`read_env.m:22-23`) |
| **X2** | **`RMax`** | **KRAKEN-only**; one float, **km** (`read_env.m:27`) |
| - | NSz + source depths | count then values, **m** (`readszrz.m:16`) |
| - | NRz + receiver depths | count then values, **m** (`readszrz.m:31`) |

There is **no** receiver-range line, no run-type line, and no beam block in a
KRAKEN `.env`.

### Top / bottom option strings, SSP, and halfspace (shared with BELLHOP)

These blocks parse exactly as in BELLHOP — full letter tables are in
`bellhop-runbook.md`. The KRAKEN-relevant points:

- **Top option**: real KRAKEN files use `'NVW'` (N²-linear interp, vacuum top,
  dB/wavelength αI units) — `MunkK.env:4`, `gulf_rd.env:4`. Dickins uses `'CVW'`.
  The reader pads to 7 chars (`:48`), so trailing blanks (`'NVW   '` in
  `pekeris.env:4`) are fine.
- **SSP block, one per medium**: header `N sigma depth` = mesh points (`0` =
  auto at 20 pts/wavelength, `:197-205`), interfacial RMS roughness in m (usually
  0), and the **medium bottom depth** in m. Data rows are up to 6 sticky columns
  `z(m) cp(m/s) cs(m/s) rho(g/cm³) alphaI betaI`; omitted columns inherit the
  previous row, so most rows are just `z c /` (e.g. `200.0 1530.29 /`). Two hard
  dependencies carry over: the **last row depth of each medium MUST equal that
  medium's header `depth`** (the only thing that ends the row loop,
  `:191-194`), and `N` is mesh points, independent of row count — do not force
  them equal.
- **Bottom option + halfspace**: option line is a quoted char + sigma float
  (`'A' 0.0`); the halfspace line `z cp cs rho alphaI betaI` exists iff char 1 =
  `A`, with top depth = deepest SSP depth, `cs=0` for fluid bottoms, speeds ≈
  1500-2000 m/s, rho ≈ 1-2 g/cm³. Example `MunkK.env:33-34`: `'A' 0.0` then
  `5000.0 1600.00 0.0 1.8 0.8 /`.

**Range-dependence note.** Within a single `.env`, layering comes from NMEDIA
(e.g. `gulf_rd.env` has 3 media: 0-1500 m water, 1500-5000 m, 5000-5100 m), not
from repeating the title block. A *true* multi-profile range-dependent run (`'Q'`
interp) reads SSP slices from a side-car `.ssp` file, with the range axis driven
by the `.flp` `NProf/rProf` list — KRAKEN is run once per profile range and
`field` assembles them. Do **not** stack multiple title blocks in one KRAKEN
`.env` expecting range-dependence: the reader reads exactly one core block, then
`cLow/cHigh/RMax/depths`, and returns.

### The two KRAKEN-only lines (nail the placement)

Immediately after the bottom halfspace (`read_env.m:22-29`):

```
1500  1600          ! cLow cHigh (m/s)   <- phase-speed window for the modal search
0                   ! RMax (km)          <- max range; 0 is common (field uses .flp ranges)
```

Real values: `MunkK.env:35-36` -> `1500 1600` / `0`; `pekeris.env:10-11` ->
`1000.0 2000` / `30.0`; `DickinsFlatK.env:31-32` -> `1400.0 2000.0` / `0.0`.

Rules and traps:

- **`cLow cHigh` are m/s** (phase speeds), NOT km. Modes with phase speed outside
  `[cLow, cHigh]` are discarded — set `cLow` at or just below the slowest water
  speed and `cHigh` at/above the bottom speed (or `1e9` to keep all). This is the
  central physical control; see Semantics for what gets dropped silently.
- **`RMax` is km.** `0` is legal and common (the range vector comes from the
  `.flp`). Set it `>=` the largest `.flp` receiver range when nonzero.
- These two lines have **no trailing `/`** in practice (bare `fscanf` + `fgetl`).
  Adding `/` is harmless but unnecessary.
- **Never** put these lines in a BELLHOP `.env`; conversely **never** omit them
  from a KRAKEN `.env` — `readszrz` would then consume `cLow cHigh` as source
  depths and desync everything downstream.

### Source / receiver depth blocks

Both use the `readvector` shorthand (`readszrz.m` + `readvector.m`):

- Line A: count `N` (integer).
- Line B: either exactly `N` explicit values, **or** `first last /` (the `/`
  triggers `linspace(first,last,N)`), or `value /` to replicate one value `N`
  times (`readvector.m:22-42`).

```
2                   ! NSz
25 250 /            ! Sz (m)        <- 2 values + / kept verbatim (N=2)
1001                ! NRz
0 5000 /            ! Rz (m)        <- linspace(0,5000,1001)
```

`/` rule: with `/`, give exactly 2 values (first, last) — `sscanf(...,2)` reads
only the first two (`readvector.m:27`). Without `/`, give exactly `N` values.
Depths are **m**.

## FLP file format (consumed by `field`)

Read by `read_flp.m`. The `.flp` defines what `field` does with the modes:
profile ranges, receiver ranges, source/receiver depths, and the coordinate +
coupling option. Order (top to bottom): title, option, MLimit, profile ranges,
receiver ranges, source depths, receiver depths, receiver range-displacements.

### Line-by-line structure

| Line | Field | Rule / source |
|---|---|---|
| 1 | Title | text inside single quotes; `/,` alone = empty-title default (`read_flp.m:16-22`) |
| 2 | Option string | quoted; coordinate + coherence/coupling letters (`:25-40`); see below |
| 3 | MLimit | integer — max number of modes to include (`:43`). Use a big sentinel (`9999`/`999999`) to keep all |
| 4 | NProf | integer count of profiles (`:51` via `readvector`) |
| 5 | rProf | profile ranges, **km** — `N` values or `first last /` (`:51`) |
| 6 | NRr | integer count of receiver ranges (`:63` via `readr`->`readvector`) |
| 7 | Rr | receiver ranges, **km** (converted to m internally at `:64`) — `first last /` or explicit |
| 8 | NSz | source-depth count (`:66`->`readszrz.m:16`) |
| 9 | Sz | source depths, **m** |
| 10 | NRz | receiver-depth count (`readszrz.m:31`) |
| 11 | Rz | receiver depths, **m** |
| 12 | Nro | count of receiver range-displacements / array tilt (`read_flp.m:72`) |
| 13 | ro | range offsets, **m** — must be all zero (`field.m` has no tilt; `:87-89` errors if any `!= 0`) |

### Option string (`read_flp.m:25-40`)

Position 1 = coordinate system, position 2 = field type / mode-coupling, optional
position 3 = component (defaults to `O` omni if option <= 2 chars, `:31-33`;
`Comp` defaults to `P`, `:36-40`).

| Pos | Field | Letters |
|---|---|---|
| 1 | Coordinates | `R`=cylindrical (r,z) — the norm, `X`=Cartesian |
| 2 | Field type / coupling | `C`=**coupled modes** (range-dep, exact), `A`=**adiabatic** (range-dep, approx). Also seen: `P`/`B`/`O` selecting range-displacement variants in some builds |
| 3 | Component | optional; omni by default |

Observed values: `'RA'` (cylindrical adiabatic — `MunkK.flp:2`, `gulf_ri.flp:2`,
`BroadBand/MunkK.flp:2`); `'RC'` (cylindrical coupled — `gulf_cm.flp:2`,
`wedge/fieldNew.flp:2`, `Dickins/field_rd.flp:2`, `step/stepK_rd.flp:2`);
`'RP'`/`'RBO'` (range-displacement variants in some `field` builds —
`MunkAnalytic.flp:1`, `Noise/Pekeris/pekeris.flp:1`).

The adiabatic-vs-coupled choice is purely the **2nd letter**: `A` (adiabatic,
cheap, for slowly varying environments) vs `C` (coupled, exact, the right choice
for strong range dependence — wedge, seamount). Note the *coherent/incoherent* TL
summation for KRAKEN is a `field`/plotting concern, not a separate first-class
`.env` run-type letter as in BELLHOP.

### Profile ranges — the range-dependent driver

`rProf` (km) lists the ranges at which environment profiles are defined. For a
**range-independent** run, `NProf=1` and `rProf=0.0` (`MunkK.flp:4-5`,
`Dickins/field_ri.flp:4-5`). For **range-dependent** runs, `NProf>1`:

- `gulf_cm.flp`: `NProf=8`, `rProf = 0 12.5 25 37.5 50 75 100 125` km — one
  KRAKEN `.mod` per profile range, assembled by `field` with `'RC'`.
- `step/stepK_rd.flp`: `NProf=4`, `rProf = 0 50 51 100` km.
- `wedge/fieldNew.flp`: `NProf=51` via `0.0 4.0 /` (linspace of 51 profiles, 0->4 km).

So **`NProf` must equal the number of mode sets (`.mod` files) produced**; a
mismatch makes `field` read the wrong replica or run off the list.

### Counts, `/` shorthand, and unit/ordering traps

- Every count/value pair uses the same `readvector` rule as the `.env`: `N` then
  exactly `N` explicit values, or `first last /` to auto-`linspace`, or `value /`
  to replicate. With `/`, only the first two values are read (`readvector.m:27`).
- `rProf` and `Rr` are **km** (`read_flp.m:54`; `:64` divides Rr by 1000 to m
  internally). `Sz`/`Rz`/`ro` are **m**.
- Fixed order: receiver ranges (`Rr`) come **before** source depths in the `.flp`
  (`read_flp.m:63` before `:66`). `write_fieldflp.m` writes NRR->SD->RD; the
  canonical reader `read_flp.m` reads ranges->SD->RD — trust the **reader** order.
- The final `ro` block is mandatory in the modern reader (`read_flp.m:72`) and
  **must be all zeros** — any nonzero raises `'field.m does not implement receiver
  range offsets'` (`:87-89`). Older `.flp` files (`gulf_ri.flp`) end at the `RR`
  block and pre-date this line.
- `MLimit` is just an upper cap; the actual mode count is whatever KRAKEN found
  within `[cLow, cHigh]`. Use `9999`/`999999` to keep all.

## Reading outputs

### `read_modes` — reads `case.mod`

```matlab
[ Modes ] = read_modes( filename, freq )            % all modes
[ Modes ] = read_modes( filename, freq, modes )     % subset by index vector
```

`filename` **includes** the extension (`read_modes.m:8`); `.mod` dispatches to
the binary reader (`read_modes.m:32-51`: `.mod`->binary, `.moa`->ascii,
`.mat`->MATLAB). `freq` selects the closest frequency for broadband mode files
(use `freq=0` if single-frequency).

The returned `Modes` struct (`read_modes_bin.m`, post-processed in
`read_modes.m`):

| Field | Meaning | Notes |
|---|---|---|
| `Modes.M` | number of modes | scalar (`read_modes_bin.m:109`) |
| `Modes.k` | horizontal wavenumbers | complex column vector, length `M` (`:201-202`). Phase speed = `2*pi*freq ./ real(Modes.k)`; mode attenuation ∝ `imag(Modes.k)` |
| `Modes.phi` | modal eigenfunctions (mode shapes) | complex `single`, size `NMat × length(modes)` — rows = depth samples, cols = modes (`:166-172`) |
| `Modes.z` | depth samples | length `Ntot` (`:93`) |
| `Modes.freqVec` | frequency vector | length `Nfreq` (`:88`) |
| `Modes.title` | title string | 80 chars (`:60`) |
| `Modes.Nfreq` / `Modes.Nmedia` | freq count / media count | (`:61-62`) |
| `Modes.N` / `Modes.Mater` | depth points / material per medium | (`:72-73`) |
| `Modes.depth` / `Modes.rho` | interface depths / densities per medium | (`:82-83`) |
| `Modes.Top` / `Modes.Bot` | halfspace boundary info | `.bc/.cp/.cs/.rho/.depth`; plus computed `.k2/.gamma/.phi` when `bc=='A'` (`read_modes.m:60-82`) |

Dimensions in one line: `Modes.phi` is `[depth-points × num-modes]`, `Modes.k`
is `[num-modes × 1]`, `Modes.z` is `[depth-points × 1]`.

`read_modes_bin` uses a `persistent` file handle (`read_modes_bin.m:44`) to
stream successive modesets — call `clear read_modes_bin` before a fresh read to
rewind (as `plotmode.m:22` and `field.m:14,58` do).

### `read_shd` — reads `case.shd` / `case.shd.mat`

```matlab
[ PlotTitle, PlotType, freqVec, freq0, atten, Pos, pressure ] = read_shd( filename );
[ ... ] = read_shd( filename, freq );          % select frequency
[ ... ] = read_shd( filename, xs, ys );        % select source (x,y)
```

Include the extension so it doesn't grab the wrong file (`read_shd.m:13`).
`pressure` is advertised as a **5-D complex array** `p(Nfreq, Ntheta, Nsd, Nrd,
Nrr)` (`read_shd.m:16`). Geometry comes back in `Pos`: `Pos.s.z` (source depths),
`Pos.r.z` (receiver depths), `Pos.r.r` (receiver ranges).

Note: the bundled MATLAB `field.m` saves `case.shd.mat` with `pressure` shaped
`(Nfreq, NSz, NRz, NRr)` (`field.m:52,115`) — the 4-D form without a bearing
axis; `read_shd`/`plotshd` index with a fixed `itheta = 1`.

## Plotting

`plotmode`, `plotshd`, `plottlr` all draw a **depth axis pointing DOWN** and use
the global `units` (`'km'`/`'m'`) for the range axis. Set `global units jkpsflag`
before plotting.

### Mode shapes — `plotmode`

```matlab
plotmode( 'case' )                 % all modes from case.mod (.mod appended automatically)
plotmode( 'case', freq )           % all modes at freq
plotmode( 'case', freq, [1 5 9] )  % selected mode indices
```

`.mod` is appended if no extension (`plotmode.m:25-29`); it calls `read_modes`
(`:32-37`) and produces three figures: (1) wavenumbers in the complex plane
`plot(real(Modes.k), imag(Modes.k), 'o')` (`:67-72`); (2) a `pcolor` of
`real(phi)` vs mode index and depth, symmetric colorbar, depth reversed
(`:84-98`); (3) line plots of up to 10 mode shapes — `real(phi)` solid,
`imag(phi)` dashed — vs depth (`:104-125`). The component is extracted with
`get_component(Modes, 'N')` (`:45`).

### TL surface — `plotshd`

```matlab
plotshd( 'case.shd.mat' )                 % first freq/bearing/source depth
plotshd( 'case.shd.mat', freq )           % a specific frequency
plotshd( 'case.shd.mat', m, n, p )        % into subplot (m,n,p)
plotshd( 'case.shd.mat', freq, m, n, p )  % both
```

It fixes `itheta=1`, `isz=1`, squeezes to 2-D `pressure(Nrd, Nrr)`
(`plotshd.m:18-19,43`). The TL conversion is the core line:

```matlab
tlt = -20.0 * log10( abs( pressure ) );   % plotshd.m:87  ->  TL = -20*log10(|p|)
```

NaNs/Infs/zeros are floored first (`:82-86`); colorbar limits auto-set from
median ± 0.75·std with `tlmin = tlmax - 50` (`:90-94`). Drawn with `pcolor`,
reversed `jet`, depth axis reversed; falls back to a TL-vs-range or TL-vs-depth
line plot if only one range/depth exists (`:106-137`). `units='km'` switches the
range axis to km (`:49-52`).

### TL slice vs range — `plottlr`

```matlab
plottlr( 'case.shd.mat', rdt )   % rdt = receiver depth(s) in metres (scalar or vector)
```

Reads with `read_shd`, fixes `itheta=1`, `isd=1`, converts range to km
(`plottlr.m:21-24`). Same TL definition `tlt = -20*log10(abs(pressure))`
(`:26-28`). It interpolates onto the requested depth(s) `rdt` via
`interp1(Pos.r.z, TLtemp, rdt)` (`:33-39`), then plots TL (dB, axis reversed) vs
range (km), one curve per depth with an auto legend (`:41-56`).

When making custom TL plots, follow the same conventions: depth axis down, range
in km, `TL = -20*log10(abs(p))`, reversed/jet colormap with a dB colorbar, case
name in the title.

## Semantics and gotchas

Physics basis: COA Ch. 5 (normal modes), Ch. 8 (broadband), and the AT Fortran
source (`Kraken/kraken.f90`, `Kraken/krakenc.f90`, `KrakenField/field.f90`),
which is the ground truth the binaries execute.

### The `cLow / cHigh` phase-speed window (the central control)

KRAKEN computes only modes whose horizontal phase speed `c = ω/Re(k)` falls in
`[cLow, cHigh]` (m/s). This is not cosmetic — it defines which part of the modal
spectrum is computed at all. Low-order modes (steep, near-axial) have phase
speeds near the minimum water speed; high-order modes approach the bottom speed.

- **`cLow` (lower edge)** sets the steepest mode kept. KRAKEN clamps it:
  `cLow = MAX(cLow, cMin)` where `cMin` is the minimum medium speed (reduced to
  `0.85*cMin` for an elastic bottom, to admit the Scholte interface wave).
  Setting `cLow` well below `cMin` does nothing (silently raised); setting it too
  high above `cMin` drops genuine trapped low-order modes.
- **`cHigh` (upper edge) — the decisive one** is the cutoff between *trapped*
  (`c < c_bottom`, real eigenvalues) and *radiating/leaky* (`c > c_bottom`,
  complex eigenvalues) modes. Selection is literally "keep modes with
  `ω²/c² > ω²/cHigh²`". In **kraken** (real solver) `cHigh` is internally capped
  at the bottom shear/compressional speed. In **krakenc** you deliberately set it
  *above* the bottom speed to capture leaky modes.

### `kraken` vs `krakenc`

- **kraken**: real wavenumbers for trapped modes, attenuation added
  perturbatively. Fast and correct when the field is dominated by waterborne
  trapped energy (typical shallow-water, low-freq, moderate-range regime). Cannot
  represent modes that radiate into the bottom.
- **krakenc**: complex wavenumbers directly — captures leaky (virtual) modes
  whose phase speed exceeds the bottom speed and whose imaginary wavenumber
  encodes radiation loss. Use it for short-to-moderate range (leaky modes not yet
  died off), **elastic bottoms** (shear conversion, Scholte waves), accurate
  near-field/near-bottom levels or attenuation, or a tabulated complex reflection
  coefficient.
- **Rule of thumb**: far-field + lossy bottom + only trapped energy -> kraken is
  enough. Bottom-interacting / leaky energy or elastic media -> krakenc with
  `cHigh` pushed above `c_bottom`. The mode files are interchangeable downstream.

### Mode count `M` and convergence

`M` is an **output**, not an input: KRAKEN finds every eigenvalue inside
`[cLow, cHigh]` (hard internal ceiling 3000). The field is a coherent sum over
the retained `M` modes. Convergence: as you widen `cHigh` and refine the mesh,
TL stops changing at the ranges/depths of interest. Near source and near bottom,
more modes are needed; in the far field high-order modes attenuate away. KRAKEN
solves on successively finer meshes and **Richardson-extrapolates** to the
zero-mesh limit — trust the extrapolated `k`, but still verify TL stability under
refinement.

### `.flp` field options (coherent / incoherent / adiabatic / coupled)

`field` synthesizes pressure from the mode file under the `.flp` option string
(parsed per character in `field.f90`). The full option semantics, including the
source-type (pos 1) and beam-pattern (pos 3) characters, expand on the table
above:

- **Coherent**: sum complex modal pressures with phase — true interference /
  striations. Required for matched-field replicas, waveguide-invariant work, any
  phase-sensitive processing.
- **Incoherent**: sum modal magnitudes, discarding cross-mode phase — smoothed,
  range-averaged TL with no fringes, for energy-level / sonar-equation work.
  **Incoherent is not allowed with coupled modes** (field errors out).
- **Adiabatic (`A`)**: each local mode evolves independently with range, no
  energy exchange. Cheap, correct when range dependence is weak/slow.
- **Coupled (`C`)**: full inter-mode energy transfer at each profile transition.
  Correct for strong range dependence (sloping bottom, fronts), more expensive.

### Range-dependent handling via multiple profiles

KRAKEN treats range dependence as a stack of range-independent profiles (up to
1000) written into a combined mode file. The `.flp` lists the profile ranges
(`rProf`, km), and **the first profile must be at 0 km**. `field` interpolates
modes between profiles and stitches them with the adiabatic or coupled rule from
option char 2. Range dependence is thus a two-part contract: profiles in the
`.env`, their ranges in the `.flp`, coupling physics by the option char.

### Gotchas

1. **`cHigh` too low -> trapped modes silently missing.** Symptom: TL too high
   (field too weak), interference structure too coarse, missing near-bottom
   energy; the far field can look plausible while mid-range levels are wrong. Fix:
   set `cHigh` to/just above the bottom compressional speed for kraken; widen it
   and confirm `M` and TL stop changing.
2. **`cHigh` set for leaky modes but run with kraken -> leaky energy
   mishandled.** Near-source/near-bottom levels and attenuation are wrong; won't
   match RAM at short range. Fix: use **krakenc** with `cHigh` above `c_bottom`;
   for elastic bottoms krakenc is mandatory (Scholte/shear physics, `cMin`
   auto-reduced to `0.85*cMin`).
3. **`cLow` too low (no effect) or too high (drops axial modes).** KRAKEN clamps
   `cLow = MAX(cLow, cMin)`. Leave `cLow` at or slightly below the minimum water
   speed; do not raise it past `cMin` to "speed up" the run.
4. **Too-coarse depth mesh `N` -> wrong/missing high-order modes.** TL fails to
   converge as you refine. Fix: ≳ 10-20 points per vertical wavelength of the
   highest mode over the deepest, fastest layer; rely on mesh-doubling +
   Richardson extrapolation and confirm `k` and TL are stable.
5. **`RMax` (`.env`) mismatched with `.flp` ranges.** Truncated/empty field
   beyond some range, or interpolation that stops short. Fix: set `RMax` >= the
   largest `.flp` receiver range; ensure the first `.flp` profile range is exactly
   0 km and profile ranges are monotonic and in range.
6. **Mode-count truncation via `MLimit` (`.flp` line 3).** Smoothed/under-strong
   field even though KRAKEN found plenty of modes; near-field detail lost. Fix:
   set `MLimit` large enough for all energetically significant modes (check the
   `.prt` mode/phase-speed table), then confirm TL is insensitive to raising it.
7. **Coherent vs incoherent confusion.** Missing fringes (incoherent by
   accident) or unexpectedly spiky TL (smooth wanted). Use coherent for
   interference/dispersion/MFP; incoherent only for range-averaged energy.
   Incoherent + coupled is rejected by field.
8. **Adiabatic used where coupling is needed.** Wrong levels over sloping bottoms
   / fronts; disagreement with RAM. Fix: switch option char 2 to coupled (`C`);
   cross-check adiabatic vs coupled whenever range dependence is not weak.
9. **Frequency-regime misuse.** Huge mode counts / slow runs / poor accuracy at
   high frequency. KRAKEN is a low-to-moderate-frequency waveguide tool; as
   frequency rises, ray methods (BELLHOP) become natural. See
   `../workflows/model-selection.md`.
10. **Treating broadband output as physics when it is synthesis design.**
    Apparent pulse spreading that is actually a frequency-grid/windowing artifact.
    Broadband (Ch. 8) Fourier-synthesizes many narrowband fields; ensure adequate
    frequency sampling and bandwidth before reading dispersion/group-delay.
11. **Cross-checks.** Use **RAM** (range-dependent PE) when strong range
    dependence, shadow-zone filling, or coherent long-range propagation is in
    question (if KRAKEN-adiabatic and RAM disagree, suspect mode coupling).
    **BELLHOP** at higher frequency or for arrival/multipath geometry.
    **SCOOTER** to validate cleanly layered (range-independent) environments,
    especially near-field and leaky-mode behavior.
12. **Don't transplant BELLHOP/SCOOTER conventions blindly.** The `cLow cHigh` /
    `RMax` lines belong in KRAKEN/SCOOTER `.env` files and must **not** appear in a
    BELLHOP `.env` (and vice versa — BELLHOP beam/box lines have no place in a
    KRAKEN file). Read the `.prt` log first on any failure; it names the offending
    block.

A terse yes/no version is in `kraken-checklist.md`; a runnable annotated pair is
in `kraken-template.md`.

## When to use KRAKEN vs BELLHOP vs RAM

- **KRAKEN (normal modes)**: low-to-moderate frequency waveguides where modal
  interference dominates the coherent field, modal dispersion/group speed, and
  matched-field replicas. The regime where rays are weakest. `krakenc` for leaky
  modes / elastic bottoms.
- **BELLHOP (rays/Gaussian beams)**: high frequency, arrival structure, travel
  times, eigenrays, multipath geometry, fast TL screening.
- **RAM (range-dependent PE)**: strongly range-dependent environments needing a
  full-wave one-way field — diffraction, shadow-zone filling, coherent long-range
  propagation. Also the reference cross-check when KRAKEN-adiabatic is in doubt.

See `../workflows/model-selection.md`.

## Cross-links

- `kraken-template.md`
- `kraken-checklist.md`
- `bellhop-runbook.md` (shared `.env` SSP / halfspace / option-string rules)
- `../solvers/solver-kraken.md`
- `../chapters/ch05-normal-modes.md`
- `../chapters/ch08-broadband-modeling.md`
- `../workflows/model-selection.md`
