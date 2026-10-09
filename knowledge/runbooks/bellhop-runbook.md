---
title: Runbook - BELLHOP (Linux + MATLAB, AT toolbox)
type: runbook
method_family: ray-methods
status: active
---

# BELLHOP Runbook

Operational guide for running BELLHOP from the local Acoustics Toolbox (AT)
install on Linux through MATLAB. Covers environment setup, the run recipe, the
`.env` file format, reading and plotting outputs, gotchas, and model choice.
For physics background see `../solvers/solver-bellhop.md` and
`../chapters/ch03-ray-methods.md`.

## Environment and paths

The Linux binaries carry a `.exe` suffix but are genuine Linux ELF executables
(`file bellhop.exe` -> `ELF 64-bit LSB pie executable, x86-64 ... GNU/Linux`).

```
AT root:    /home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4
binaries:   <AT>/linux-bin/      bellhop.exe, bellhop3d.exe, field.exe, field3d.exe
matlab src: <AT>/Matlab/         bellhop.m, ReadWrite/, Plot/
matlab:     /usr/local/bin/matlab
```

`bellhop.m` resolves the binary with `which('bellhop.exe')` and shell-runs
`! "<fullpath>" filename`. So on Linux the binary must still be named
`bellhop.exe` (it is) and `<AT>/linux-bin` must be on the MATLAB path.

Required `addpath` (run once per session):

```matlab
AT = '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4';
addpath( genpath( fullfile( AT, 'Matlab' ) ) );   % ReadWrite, Plot, etc.
addpath( fullfile( AT, 'linux-bin' ) );           % so which('bellhop.exe') resolves
global units jkpsflag                              % used by plotray/plotshd
units = 'km';                                      % 'km' or 'm' for range axis
jkpsflag = 0;                                       % 0 = normal figures, 1 = fixed pub size
which bellhop.exe                                   % must print <AT>/linux-bin/bellhop.exe
which read_shd                                      % must resolve in ReadWrite/
```

If the executable bit is missing: `chmod +x <AT>/linux-bin/bellhop.exe`.

## How to run (MATLAB recipe)

`casename.env` must live in the current MATLAB `pwd` because the shell command
runs there and BELLHOP appends `.env` itself.

```matlab
cd /path/to/case          % directory containing case.env
bellhop( 'case' )         % NO .env extension; runs <AT>/linux-bin/bellhop.exe case
```

Output files by run type (first letter of the run-type string):

| File | Produced by | Read with |
|---|---|---|
| `case.prt` | every run (text log) | text editor; read first on failure |
| `case.shd` | TL field: `C` / `I` / `S` | `read_shd`, `plotshd` |
| `case.ray` | ray `R` / eigenray `E` | `plotray` |
| `case.arr` | arrivals `A` (ascii) / `a` (binary) | `read_arrivals_asc` / `read_arrivals_bin` |

End-to-end:

```matlab
bellhop( 'case' )
figure; plotshd( 'case.shd' )                          % TL field run
[ Title, PlotType, freqVec, freq0, atten, Pos, p ] = read_shd( 'case.shd' );
figure; plotray( 'case.ray' )                          % ray / eigenray run
[ Arr, Pos ] = read_arrivals_asc( 'case.arr' );        % arrivals run
```

## ENV file format

The MATLAB reader uses Fortran free-format `fscanf`/`fgetl`, not
line-position parsing. Two rules drive most malformed files:

1. **SSP rows are NOT counted by `N`.** Reading stops when a row depth equals
   the medium bottom depth. The declared `N` is mesh points, unrelated to row
   count.
2. **Text after the numbers is ignored.** Numbers, quoted tokens, and `/` are
   load-bearing; the `! comment` is decoration.

This is the BELLHOP path only. BELLHOP files do NOT carry the SCOOTER/KRAKEN
`cLow cHigh` / `RMax` lines.

### Line-by-line structure (range-independent)

| Line | Field | Rule |
|---|---|---|
| 1 | Title | text inside single quotes `'...'` (quotes mandatory) |
| 2 | Frequency | one float, Hz |
| 3 | NMEDIA | integer; usually 1 (water column layers only) |
| 4 | Top option | quoted, per-character (see below) |
| 4a | Francois-Garrison | only if top char 4 = `F`: `T S pH z_bar` |
| 4b | Top halfspace | only if top char 2 = `A`: same columns as bottom halfspace |
| 5+ | SSP block | per medium: `N sigma depth` header + data rows |
| - | Bottom option + sigma | quoted option then a sigma float |
| - | Bottom halfspace | only if bottom char 1 = `A` |
| - | NSD + source depths (m) | count then values |
| - | NRD + receiver depths (m) | count then values |
| - | NR + receiver ranges (**km**) | count then values |
| - | Run type | quoted |
| - | NBEAMS | integer (0 = auto) |
| - | Launch angles (deg) | `ALPHA1 ALPHA2 /` |
| - | STEP ZBOX RBOX | `step(m) zbox(m) rbox(km)` |
| last | Cerveny lines | only for Cerveny beam types |

### Top option string (per character)

| Pos | Field | Letters |
|---|---|---|
| 1 | SSP interpolation | `N`=N²-linear, `C`=C-linear, `P`=PCHIP, `S`=spline, `Q`=quadrilateral (range-dependent, reads `.ssp`), `H`=hexahedral 3D, `A`=analytic |
| 2 | Top BC | `V`=vacuum (usual), `A`=acousto-elastic halfspace (adds 4b), `R`=rigid, `F`=refl-coef file |
| 3 | Attenuation units | `N`=nepers/m, `F`=dB/(m·kHz), `M`=dB/m, `W`=dB/wavelength, `Q`=Q, `L`=loss tangent |
| 4 | Added vol. attenuation | `T`=Thorp, `F`=Francois-Garrison (adds 4a), blank=none |
| 5 | Dev options | `*`/`~` placeholder |
| 6 | Beam-index flag | `I` -> extra integer on NBEAMS line |

Unit trap: position 3 reinterprets the αI column of every SSP/halfspace line.
`W` (dB/wavelength) is the usual BELLHOP default.

### SSP block (the trap zone)

Header line per medium: `N  sigma  depth` = mesh points (0 = auto),
interfacial RMS roughness (m, usually 0), and the medium bottom depth (m).

Data rows, up to 6 sticky columns each: `z(m)  cp(m/s)  cs(m/s)  rho(g/cm³)
alphaI  betaI`. Omitted columns keep the previous value, so most rows are just
`z c /`. The trailing `/` is REQUIRED on any row that omits sticky columns
(i.e. essentially every row): the reader (`read_env_core.m`) does six
unconditional `fscanf('%f',1)` per row, and the `/` is what terminates the line
so the sticky-column defaults apply. Drop it and the parser reads the NEXT
row's `z c` into this row's `cs/rho/...`, desyncs, and BELLHOP dies with a
misleading "imaginary sound speed > real part" fatal error. Only the `! comment`
text after the `/` is decoration.

Critical: the last SSP row depth MUST equal the header `depth`, because that is
what terminates row reading. The row count is independent of `N`.

### Bottom option + halfspace

Option line: quoted string then a sigma float, e.g. `'A' 0.0`. Char 1: `V`=vacuum,
`A`=acousto-elastic halfspace (requires the line below), `R`=rigid, `F`=refl-coef
file, `G`=grain-size. Note: `G` is accepted by the compiled binary only — the AT
MATLAB readers (`topbot.m`, used by `validate_bellhop_env` / `plotssp` / `read_env`)
support just `V A R F W P` and will error on `G`. For grain-size bottoms, call the
binary directly and skip the MATLAB-side validator/plotters. The halfspace line
exists iff char 1 = `A`:

`z(m)  cp(m/s)  cs(m/s)  rho(g/cm³)  alphaI  betaI` — top depth must equal the
deepest SSP depth; `cs`=0 for a fluid bottom. Speeds ≈ 1500-2000, rho ≈ 1-2;
do not swap columns.

### Source / receiver / range vectors

Each is a count line then a values line. If the values line contains `/`, up to
2 numbers are read and `linspace(v1, v2, N)` is generated; without `/` you must
list exactly `N` values. Depths are meters; **ranges are kilometers**.

### Run-type line

Char 1 (calculation): `R`=ray, `E`=eigenray, `I`=incoherent TL, `S`=semicoherent
TL, `C`=coherent TL, `A`/`a`=arrivals ascii/binary. Unknown char 1 is fatal.

Char 2 (beam type): `G`=geometric hat (default), `B`=geometric Gaussian,
`S`=simple Gaussian, `C`/`R`=Cerveny Cartesian/ray-centered (require two extra
trailing lines). Char 3 = beam shift; char 4 = `R` point source / `X` line source.

A bare single letter is valid (char 2 defaults to `G`). `'CG'` (coherent
geometric) needs no trailers; `'CC'`/`'CR'` (Cerveny) require them.

### Beam fan and ray box

`NBEAMS` (0 = auto), then `ALPHA1 ALPHA2 /` in degrees (negative = downward;
must be equally spaced for TL runs). Last numeric line: `STEP(m) ZBOX(m)
RBOX(km)`. Set ZBOX slightly above water depth and RBOX slightly above max
range or rays get clipped.

A complete annotated template lives in `bellhop-env-template.md`.

## Reading outputs

`read_shd` returns, in order: `PlotTitle, PlotType, freqVec, freq0, atten, Pos,
pressure`.

```matlab
[ PlotTitle, PlotType, freqVec, freq0, atten, Pos, pressure ] = read_shd( 'case.shd' );
[ ... ] = read_shd( 'case.shd', freq );      % pick frequency
[ ... ] = read_shd( 'case.shd', xs, ys );    % pick source (km)
```

- `Pos.r.z` = receiver depths (column), `Pos.r.r` = receiver ranges (row),
  `Pos.s.z` = source depths.
- Pressure is complex. The `read_shd.m` header advertises 5-D, but the binary
  reader actually returns 4-D `pressure(Ntheta, Nsz, Nrz, Nrr)` — index it that
  way (this is what `plotshd` does).

Arrivals: `[Arr, Pos] = read_arrivals_asc(file)` or `..._bin(file)`. `Arr` is a
struct array `Arr(Nrr, Nrz, Nsz)` (2D) with fields `Narr`, complex `A`, complex
`delay`, declination angles, `NumTopBnc`, `NumBotBnc`. The reader verifies the
`'2D'`/`'3D'` flag and errors on mismatch. If binary output is garbled, set
`marker_len = 2` in `read_arrivals_bin.m`.

## Plotting conventions

`plotshd`, `plotray`, `plotssp` all draw a **depth axis pointing DOWN**
(reversed y) and use the global `units` for the range axis (`'km'` or `'m'`).

- `plotshd` computes `TL = -20*log10(abs(pressure))` (floors values < 1e-37),
  draws `pcolor` with a reversed jet colormap and a colorbar in dB, and titles
  the figure with the case name. Limits are auto-set from median/std of TL.
- `plotray` colors rays by boundary interaction: black = surface+bottom, blue =
  bottom only, green = surface only, red = direct (no bounce).
- `plotssp` reads the `.env` directly (no BELLHOP run needed), plots
  compressional speed (raw points + interpolated curve) and shear in red if any
  nonzero `betaR`, with range "Sound Speed (m/s)" vs depth.
- Always set `global units jkpsflag` before plotting to avoid empty-global
  warnings.

When making custom TL plots, follow the same conventions: depth axis down,
range in km, `TL = -20*log10(abs(p))`, reversed/jet colormap with a dB colorbar,
and the case name in the title.

## Gotchas checklist

- SSP last-row depth must equal the medium bottom depth (terminates reading).
- `N` on the SSP header is mesh points, not row count — do not force them equal.
- Ranges and RBOX are km; all depths, STEP, and ZBOX are m. Most common error.
- In source/receiver/range lines: give exactly 2 values with `/`, or exactly
  `N` values without `/`. Extra values before `/` are dropped.
- Bottom (or top) option `A` requires its halfspace line, and vice versa.
- `'CC'`/`'CR'` need the two Cerveny trailer lines; `'CG'`/`'CB'`/`'CS'` must not.
- Top option char 4 = `F` requires the T/S/pH/z_bar line.
- Single quotes are mandatory around title, top option, bottom option, run type.
- Never add SCOOTER-style `cLow cHigh` / `RMax` lines to a BELLHOP file.
- Halfspace: speeds ≈ 1500-2000 m/s, density ≈ 1-2 g/cm³; don't swap columns.
- Attenuation-units letter (top char 3) must match the αI column values.
- ZBOX > water depth and RBOX > max range (~1%) or rays get clipped.
- SSP depths must be monotonically increasing; don't over-sample (forces tiny
  steps). Run `plotssp` to inspect spline wiggles.
- A blank/all-zero `.shd` means rays never reached receivers: box too small,
  fan too narrow or wrong sign, receiver at zero range, or non-TL run type.
- Read `.prt` first on any failure; it names the offending block.

A terse yes/no version is in `bellhop-checklist.md`.

## When to use BELLHOP vs KRAKEN vs RAM

- **BELLHOP (rays/Gaussian beams)**: high frequency (wavelength ≪ environment
  scale), arrival structure, travel times, eigenrays, multipath geometry, fast
  TL screening, quick range-dependent looks. Weakest at low-frequency coherent
  interference and near caustics/shadow zones.
- **KRAKEN (normal modes)**: low-to-moderate frequency waveguides where modal
  interference dominates the coherent field, modal dispersion/group speed, and
  matched-field replicas. The regime where rays are weakest.
- **RAM (range-dependent PE)**: strongly range-dependent environments needing a
  full-wave one-way field — diffraction, shadow-zone filling, coherent
  long-range propagation that rays cannot represent.

Use KRAKEN or RAM as cross-checks whenever coherent phase structure near
caustics or in shadow zones is in question. See `../workflows/model-selection.md`.

## Cross-links

- `bellhop-env-template.md`
- `bellhop-checklist.md`
- `../solvers/solver-bellhop.md`
- `../chapters/ch03-ray-methods.md`
- `../chapters/ch08-broadband-modeling.md`
- `../workflows/model-selection.md`
