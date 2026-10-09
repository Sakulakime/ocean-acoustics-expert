---
title: Runbook - RAM (Linux + MATLAB, AT toolbox)
type: runbook
method_family: parabolic-equations
status: active
---

# RAM Runbook

Operational guide for running RAM (Collins' split-step Pade range-dependent
parabolic-equation model) on a Linux + MATLAB workstation, reading its
`tl.grid` / `tl.line` outputs, and avoiding the format traps. RAM is the model
of choice for range-dependent ocean acoustics: a sloping bottom, a front, or a
range-varying SSP where a full-wave one-way field is needed. For physics
background see `../solvers/solver-ram.md` and
`../chapters/ch06-parabolic-equations.md`.

## When to use RAM

RAM is a forward-marching, one-way full-wave solver. It factors the Helmholtz
operator into outgoing/incoming branches and propagates only the outgoing
branch in range, stepping `r -> r + dr` while solving an implicit tridiagonal
system in depth at each step. Pick it for:

- **Strongly range-dependent environments** — downslope/upslope bathymetry,
  fronts, range-varying SSP. RAM re-derives the depth operators
  (`updat -> profl -> epade -> matrc`) whenever the environment changes, so it
  handles range dependence naturally and far more cheaply than FD/FE.
- **Coherent full-wave structure** — diffraction, interference, ducting,
  shadow-zone filling that rays (BELLHOP) cannot represent.
- **Long-range low-to-moderate-frequency propagation** where modal/PE coherent
  phase structure matters.

The trade-off baked into the one-way factorization: **no backscatter** and no
globally exact two-way solution, plus accuracy bounded by the angular validity
of the chosen number of Pade terms `np`. See
`../workflows/model-selection.md` for cross-checks against BELLHOP and KRAKEN.

## Environment and paths

RAM is **not** part of the AT `.env`/`.flp` family. It is a standalone single
binary that reads a file literally named `ram.in` from the current directory
and writes `tl.grid` / `tl.line` there.

```
working ELF binary: /home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/at_2023/RAM/ram.exe
example input:      /home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/at_2023/RAM/ram.in
matlab src:         <AT>/atWin10_2020_11_4/Matlab/ReadWrite/read_ram_tlgrid.m
matlab:             /usr/local/bin/matlab
```

Two binary/path traps to avoid:

- RAM does **not** take a case name or any command-line arguments. It always
  reads `ram.in` from the current working directory. This is hard-coded in the
  Fortran: `open(unit=1,status='old',file='ram.in')` (`ram1.5.f:57`).
- The AT MATLAB wrapper `ram.m` calls `which('ram.exe')` then `! ram.exe`
  (`atWin10_2020_11_4/Matlab/ram.m:8-9`). On this machine the `ram.exe` that
  tends to resolve first on the MATLAB path is a **Mach-O (macOS) binary** that
  will NOT execute on Linux. Use the ELF binary at the `at_2023/RAM` path above
  (run it directly, or ensure that directory is first on the MATLAB path).

A smoke test confirms the ELF binary works: copying the shipped `ram.in` into a
scratch dir and running the binary produces `tl.grid` (~1.6 MB) and `tl.line`
(~28 KB) with exit code 0.

## How to run (Linux recipe)

RAM is a single binary with no arguments. Stage your case as `ram.in`, run, and
read the outputs from the same directory.

```bash
# 1. Make a clean scratch dir for this case and enter it
mkdir -p /home/jay/temp/ram_run && cd /home/jay/temp/ram_run

# 2. Put your case file in place AS ram.in (the filename is FIXED).
#    Either copy your case file and rename it to ram.in ...
cp /path/to/my_case.in ram.in
#    ... or copy the shipped example to start from:
# cp /home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/at_2023/RAM/ram.in .

# 3. VALIDATE before launching (catches the fatal traps cheaply).
#    In MATLAB: validate_ram_in('ram.in')  -- must PASS before you run.
#    A FAIL here (e.g. a full-line comment, a missing -1 -1 sentinel, or
#    km-where-meters-expected) would otherwise crash RAM or give a garbage field.

# 4. Run the WORKING Linux ELF binary directly (no arguments)
/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/at_2023/RAM/ram.exe

# 5. Confirm outputs (check SIZE and exit code, not just existence:
#    a crashed run still leaves a ~68 B header-only tl.grid + 0 B tl.line)
ls -l tl.grid tl.line
```

> CRITICAL — never put a full comment line into `ram.in`. RAM does `read(1,*)`
> on every line and parses the first token as a number; a line beginning with
> `#`, `c`, `!`, or `----` aborts with `Bad real number in item 1 of list
> input` (`ram1.5.f:213`). Only bare-word labels placed AFTER the required
> numbers are safe. `validate_ram_in` flags such lines for you.

Because the filename is fixed, there is no `casename` concept. If you keep
multiple cases, store them under their own names (e.g. `wedge.in`, `flat.in`)
and `cp wedge.in ram.in` immediately before running. Re-running overwrites
`tl.grid` / `tl.line` in place, so use a fresh directory per case or move the
outputs out afterward. The AT `clean.m` deletes `tl.grid` and `tl.line` from
the current folder (`atWin10_2020_11_4/Matlab/clean.m:18-22`) for a reset.

### Optional: driving it from MATLAB

Do not rely on the stock `ram.m` (it may resolve the macOS binary). Either
prepend the working directory to the path so `which('ram.exe')` finds the ELF
build, or call the binary by full path:

```matlab
addpath('/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/at_2023/RAM', '-begin');
cd('/home/jay/temp/ram_run');   % dir containing ram.in
system('/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/at_2023/RAM/ram.exe');
```

The Slicer helper `run_ram.m` follows this same pattern on UNIX: it `cd`s into
the calc dir, writes a small `ram.sh` that runs the binary and captures `$?`
into `ram.rc`, then calls `read_ram_tlgrid` and converts to TL via
`-20*log10(squeeze(pressure))` (`Slicer/run_ram.m:42-67,122-123`). For a manual
run the wrapper is unnecessary — calling the ELF binary directly is enough.

## ram.in format

Reverse-engineered from the Fortran reader (ground truth, `ram1.5.f` / for
RAMGEO `ramgeo1.5.f`), confirmed against the MATLAB writers
(`Slicer/write_ram_in.m`, `ReadWrite/write_env_RAM.m`) and five real samples.
The reader code is byte-for-byte identical between RAM v1.5 (`ram.in`) and
RAMGEO v1.5g (`ramgeo.in`); only the open filename and one binary-header write
differ.

Every line is read with Fortran list-directed input (`read(1,*)`), so fields
are whitespace-separated and **column position is irrelevant** — leading
spaces, tabs, single vs. multiple spaces all parse identically. Trailing text
after the required numbers is ignored, which is why samples carry inline labels
like `freq zs zr` with no delimiter. The title line is consumed by a bare
`read(1,*)` (`setup` L96) that reads nothing into a variable, so its content is
decorative; quotes around it are optional.

### Fixed header — exactly 5 lines, in this order

Read by `setup` L96-100 (`ram1.5.f`).

| Line | Fields | Units | Meaning |
|---|---|---|---|
| 1 | title | — | Discarded label line. Must exist (one line consumed unconditionally). |
| 2 | `freq zs zr` | Hz, **m**, **m** | Source frequency; source depth; receiver depth for `tl.line`. `zr` sets the receiver grid index `ir = ifix(1+zr/dz)`. |
| 3 | `rmax dr ndr` | **m**, **m**, int | Max range; range march step; **range output decimation** for `tl.grid`. |
| 4 | `zmax dz ndz zmplt` | **m**, **m**, int, **m** | Max computational depth; depth grid step; **depth output decimation**; max plotted/output depth. |
| 5 | `c0 np ns rs` | **m/s**, int, int, **m** | Reference sound speed; # Pade terms; # stability constraints; range out to which stability constraints apply. |

Notes derived from the source:

- `nz = zmax/dz - 0.5` is the depth-grid point count (L126); `nzplt =
  zmplt/dz - 0.5` (L127). So `zmplt` must be ≤ `zmax`, and both should be
  sensible multiples of `dz`.
- `ndr` / `ndz` are pure **decimation factors** (every Nth grid point is written
  to `tl.grid`), NOT step sizes. Both must be ≥ 1. `dr` / `dz` still govern
  accuracy; decimate output, never coarsen the compute grid to shrink files.
- `np` (Pade terms) sets the valid propagation-angle aperture; it must not
  exceed compile-time `mp` (= 30 in `ram1.5.f`, = 10 in `ramgeo1.5.f`) or the
  run aborts with "Need to increase parameter mp". Typical `np` = 4-10; use
  `np >= 6` (commonly 8) when steep angles matter.
- `ns` is a numerical conditioning knob (stability constraints), not an angle
  knob; default `ns = 1`.
- `rs`: if `rs < dr` it is reset to `2*rmax` (L132), i.e. `rs = 0.0` means "apply
  stability constraints everywhere / never turn them off." Once `r >= rs`,
  `updat` sets `ns=0` and recomputes the Pade coefficients.
- `r` starts at `dr` and the march is `r=r+dr` until `r >= rmax`. The MATLAB
  writer pads `rmax` by one extra `ndr*dr` because RAM does not always output
  the last range.

### Bathymetry block — pairs terminated by `-1 -1`

Read by `setup` L106-112.

| Field | Units | Meaning |
|---|---|---|
| `rb` | **m** | Range of this bathymetry breakpoint. Must be non-decreasing. |
| `zb` | **m** | Water depth at that range. |
| `-1 -1` | — | **Sentinel** ending the bathymetry list. |

- The sentinel test checks **only the first number** (`rb(i).lt.0.0`, L108).
  `-1` alone would terminate the loop, but `read(1,*)` still needs a second
  value to satisfy `rb(i),zb(i)`, so always write `-1 -1`.
- Bottom depth is **linearly interpolated** between breakpoints as the field
  marches. A range-independent depth needs just one row; a sloping wedge uses
  two rows with different `zb` (e.g. `0 200` then `4000 0`).
- The code **auto-appends** a final flat point at `2*rmax` holding the last
  depth (L111-112), so you do NOT extend bathymetry past `rmax` yourself.
- Exceeding compile-time `mr` bathymetry points aborts (`mr` = 1000 in ram,
  100 in ramgeo).

### Profile group — four sub-blocks per range segment, in fixed order

After bathymetry, `setup` calls `profl` once for the initial profiles, then
`updat` re-calls `profl` every time the march crosses an update range
(`if(r.ge.rp)`). `profl` reads **four sub-blocks in this exact order**, each
terminated by its own `-1 -1`:

| # | Sub-block | Row format | Units | Sentinel |
|---|---|---|---|---|
| 1 | Water SSP | `z cw` | **m**, **m/s** | `-1 -1` |
| 2 | Bottom SSP | `z cb` | **m**, **m/s** | `-1 -1` |
| 3 | Density | `z rhob` | **m**, **g/cm³** | `-1 -1` |
| 4 | Attenuation | `z attn` | **m**, **dB/wavelength** | `-1 -1` |

The four sub-blocks are **mandatory and order-fixed** for every profile group.
Omitting one, reordering them, or dropping a sentinel desynchronizes the reader
and corrupts everything downstream (the next block's data is read as this
block's) with no error.

How `zread` parses each sub-block (`ram1.5.f` L207-238):

- The **first row is read unconditionally** (before the sentinel test), so each
  sub-block needs **at least one real data row before its `-1 -1`**. An empty
  block (immediate `-1 -1`) makes `zread` eat the sentinel as data and then read
  the next block's first row as its terminator — silent corruption.
- The sentinel test checks **only the depth** (`zi.lt.0.0`); both numbers are
  required because the `read` expects two.
- Values are placed on the grid by `i = 1.5 + zi/dz` (nearest node), gaps are
  **linearly interpolated**, the deepest specified value is **extended down to
  the grid bottom**, and the shallowest is **pinned to the surface**. So a
  single-row block = constant value everywhere (e.g. water SSP `0.0 1500.0`
  then `-1 -1` = 1500 m/s throughout).
- Bottom SSP / density / attenuation are profiles **vs. depth**, so
  `0.0 1550 / -1 -1` means "1550 m/s sediment from top to bottom of the grid."

The `/` slash sometimes seen on bottom rows (e.g. `0.00 1550.00 /`) is the
standard Fortran list-directed **input terminator**: it ends that `read` early.
With only `(zi,profi)` in the list it is harmless/decorative, and the writers
emit it on the sediment-speed line. Do not rely on it to skip required values.

Attenuation enters as dB per wavelength. Samples ramp it up at depth (e.g.
`0.0 0.5`, `900 0.5`, `1000 10.0`) to form an absorbing **sponge layer** near
`zmax` that suppresses bottom reflections — a modeling idiom, not a format rule.
Make `zmax` extend well below the real seabed into this absorber so the
artificial bottom truncation does not reflect energy back up; keep `zmplt` ≤ the
physical depth you care about (compute deep, store/plot shallow).

### Range-dependent profiles — the `rp` update-range line

After a complete four-sub-block group, `profl` does a trailing
`read(1,*,end=1)rp` (L193) that reads a **single bare number = the range (m) at
which the NEXT profile group takes effect**:

- If end-of-file is hit instead, `rp` is left at `2*rmax` ("no more updates") —
  the just-read profiles hold to the end. This is how a **range-independent**
  file ends: the last group simply has no `rp` line after its 4th `-1 -1`.
- If a number is present, `updat` triggers a re-read of the four sub-blocks
  once `r >= rp`, then reads the following `rp`, and so on.

A multi-segment file therefore looks like:

```
<header 5 lines>
<bathymetry pairs> -1 -1
<water SSP -1 -1> <bottom SSP -1 -1> <density -1 -1> <attn -1 -1>   # initial profile, valid from r=0
<rp_1>                                                              # next update range (m)
<water SSP -1 -1> <bottom SSP -1 -1> <density -1 -1> <attn -1 -1>   # profile applied from rp_1
<rp_2>
...
<final group, no trailing rp -> EOF ends updates>
```

The shipped `ram.in` has the initial group, then `25000.0` (the `rp`, in
meters), then a second group with no trailing `rp` (file ends at the 4th
`-1 -1`). `rp` values must be **strictly increasing** — out-of-order or
duplicate ranges break the `updat` refresh logic and apply the wrong
environment over the wrong interval. It is a bare single number on its own line,
NOT a pair and NOT sentinel-terminated.

A full line-annotated, runnable golden file is in `ram-in-template.md`; the
pre-run trap checks are in `ram-checklist.md`.

## Outputs and how to read them

Both files are opened by RAM at startup (`ram1.5.f:58-59`) and written into the
current directory.

| File | Format | Content | Read with |
|---|---|---|---|
| `tl.grid` | binary, unformatted Fortran | full 2-D TL field (depth × range), one depth column per output range step (`write(3)(tlg(j),j=1,lz)`, L486) | `read_ram_tlgrid` |
| `tl.line` | ASCII text | two columns `range  TL`, one row per range step (`write(2,*)r,tl`, L474), TL sampled at the receiver depth `zr` | `load('tl.line')` |

### Reading tl.line (the easy one)

`tl.line` is plain two-column ASCII. There is no `read_ram_tlline.m` anywhere in
the toolbox and none is needed. TL is sampled at the receiver depth `zr` (the
second number on line 2 of `ram.in`).

```matlab
d = load('tl.line');
plot( d(:,1)/1000, d(:,2) );   % range stored in m -> display km
axis ij;                       % TL grows downward
xlabel('Range (km)'); ylabel('TL (dB)');
```

### Reading tl.grid

Use the toolbox reader `read_ram_tlgrid.m`. It takes no arguments and reads
`tl.grid` from the **current directory**, so `cd` into the run dir first.

```matlab
cd('/home/jay/temp/ram_run');
[ PlotTitle, PlotType, freq, atten, Pos, pressure ] = read_ram_tlgrid();
```

Returned values (`read_ram_tlgrid.m:1,75-83`):

| Output | Meaning |
|---|---|
| `PlotTitle` | char, `'RAM'` |
| `PlotType` | char, `'rectilin'` |
| `freq` | scalar, source frequency (Hz), from the file header |
| `atten` | scalar `0` (placeholder for AT compatibility) |
| `Pos` | struct of geometry vectors (below) |
| `pressure` | 4-D array `pressure(1,1,1:lz,1:lr)` (AT `[freq, sd, rd, rr]` layout, single freq + single source depth) |

`Pos` fields:

- `Pos.s.z` — source depth `zs` (scalar, m).
- `Pos.r.z` — receiver-depth axis `(1:lz) * ndz * dz` (m), length `lz`.
- `Pos.r.range` — range axis `(1:lr) * ndr * dr` (m), where
  `lr = floor(rmax/(dr*ndr))`, length `lr`.

The reader stores **not** the raw pressure but the inverse-dB amplitude
`pressure = 10.^(-TL/20)` (L83). To recover TL in dB, invert that mapping:

```matlab
TL = -20 * log10( abs( squeeze( pressure ) ) );   % [lz x lr], dB
```

After `squeeze` the matrix is `[lz (depth) × lr (range)]` — rows = depth,
columns = range. This is exactly what `run_ram.m:123` does.

Heads-up on header parsing: `read_ram_tlgrid.m` auto-detects the Fortran
record-marker width (`ubit64` vs `ubit32`) and reads the full 15-field header
written at `ram1.5.f:161`. Do NOT hand-roll the offset — let the auto-detecting
reader determine the marker size. The older `RAMtoSHD_Old.m` assumes a
different, shorter header layout and is **not** compatible with this binary's
`tl.grid`.

## Plotting the TL field

Build the axes from `Pos`, convert range to km for display (the file stores
meters), put depth on a downward y-axis, and use a dB colorbar. Lower TL =
stronger field, so flip the colormap so strong field reads "hot."

```matlab
cd('/home/jay/temp/ram_run');
[ PlotTitle, ~, freq, ~, Pos, pressure ] = read_ram_tlgrid();

TL     = -20 * log10( abs( squeeze( pressure ) ) );  % [depth x range], dB
rng_km = Pos.r.range / 1000;   % input is meters -> display km
depth  = Pos.r.z;              % meters, downward

figure;
imagesc( rng_km, depth, TL );
axis ij;                       % depth increases downward
xlabel('Range (km)'); ylabel('Depth (m)');
title( sprintf('%s  TL field  (%.0f Hz)', PlotTitle, freq) );

cb = colorbar; ylabel(cb, 'TL (dB)');
caxis([ min(TL(:)), min(TL(:))+70 ]);   % ~70 dB window below the strongest value
colormap( flipud(jet) );                % low TL (strong field) reads bright
```

- `axis ij` makes depth grow downward (oceanographic convention); `imagesc`
  otherwise puts row 1 at the bottom.
- `Pos.r.range` and `Pos.r.z` are both meters straight from RAM; only the
  **display** divides range by 1000. Depth stays in meters.
- The `caxis` window controls contrast; adjust to taste. `flipud(jet)` /
  `flipud(parula)` makes high-energy regions bright, the usual TL-field reading.

## Gotchas

### METERS, not km — the catastrophic unit trap

RAM expresses **all ranges and depths in meters** — `rmax`, `dr`, `rs`, `rb`,
`rp` are all meters — whereas the AT models (BELLHOP/KRAKEN) take ranges in
**km**. There is no unit field and no validation; the number is taken
literally. The MATLAB writers convert explicitly (`rmax = 1000.0 *
Pos.r.range(end)`, `write_ram_in.m:75`). Feed km values into RAM (e.g. `30`
instead of `30000`) and the run is off by 1000x: `rmax` becomes tiny, the march
terminates almost immediately, and you get TL that looks plausible but is
physically meaningless. Always confirm meters when porting an AT environment.

### The `-1 -1` sentinel rule

There are exactly **five `-1 -1` sentinels per profile-bearing segment plus one
for bathymetry**:

| Sentinel location | Terminates | Tested field |
|---|---|---|
| After bathymetry pairs | bathymetry list | `rb < 0` (`setup` L108) |
| After water SSP rows | water `z cw` block | `zi < 0` (`zread` L219) |
| After bottom SSP rows | bottom `z cb` block | `zi < 0` |
| After density rows | `z rhob` block | `zi < 0` |
| After attenuation rows | `z attn` block | `zi < 0` |

Only the **first** number on a sentinel line is tested, but always write
`-1 -1` (two values) because the `read` expects two and a lone `-1` can leave
the parser mid-record. Every block must contain **at least one genuine data row
before** its sentinel. Drop or mis-order a sentinel and the fixed-format reader
keeps consuming the next block's numbers as if they belonged to the current one,
silently desynchronizing the whole file — bizarre TL, wrong bottom, or a crash
far from the real cause.

### Other traps

- **Wrong number of sub-blocks.** Must be exactly water-SSP, bottom-SSP,
  density, attenuation, in that order, every segment.
- **Empty profile sub-block** (immediate `-1 -1`). `zread` reads its first row
  unconditionally, so the sentinel is eaten as data.
- **`rp` written as a pair or sentinel-terminated.** It is a single bare range
  value on its own line.
- **`rp` not strictly increasing.** Out-of-order/duplicate ranges break the
  `updat` refresh logic.
- **`np > mp`** (compile limit 30 ram / 10 ramgeo) or too many bathymetry points
  (`> mr`) — hard abort.
- **`zmplt > zmax` or non-divisible `dz`** — distorts `nz` / `nzplt` grid counts.
- **Confusing `ndr` / `ndz` with step sizes.** They are integer output-decimation
  factors, not meters. Decimate output; never coarsen `dr` / `dz` to shrink files.
- **`np` too small for steep angles.** `np = 1`/`2` is the narrow-angle PE only;
  it under-predicts or misplaces steep bottom-interacting / downslope-converted
  arrivals. Use `np >= 6` (commonly 8) and verify by raising `np` — if
  conclusions change, you were angle-limited, not converged.
- **`dz` too large near a fast bottom.** A high-speed seabed gives short
  vertical wavelength and steep penetrating angles; coarse `dz` manufactures
  artificial TL banding at and below the water-sediment interface. Use several
  points per shortest vertical wavelength.
- **Too-coarse `dr`.** Accumulates range-integrated phase error: interference
  pattern drifts, TL develops striping that looks like physics but is numerical.
  Always do a `dr`-halving convergence check, finer over range-dependent media.
- **`c0` far from the water mean.** `c0` is the reference about which the
  operator is expanded; choose it near the depth-averaged water speed (commonly
  ~1500 m/s) so the Pade expansion stays accurate and the `np` aperture is
  actually achieved.
- **Wrong filename.** RAM reads a hard-coded `ram.in`; AI-generated wrappers
  that invent `--input foo.env` flags are ignored. Overwrite `ram.in` per run.
- **Wrong record-marker assumption when reading `tl.grid`.** Use
  `read_ram_tlgrid` (auto-detects 4-byte vs 8-byte markers and endianness);
  do not hand-roll the offset.

A terse yes/no version is in `ram-checklist.md`.

## When to use RAM vs BELLHOP vs KRAKEN

- **RAM (range-dependent PE)**: strongly range-dependent environments needing a
  full-wave one-way field — diffraction, shadow-zone filling, coherent
  long-range propagation, sloping bathymetry and fronts. No backscatter.
- **BELLHOP (rays/Gaussian beams)**: high frequency, arrival structure, travel
  times, eigenrays, multipath geometry, fast TL screening.
- **KRAKEN (normal modes)**: low-to-moderate-frequency waveguides where modal
  interference dominates, modal dispersion/group speed, matched-field replicas.

Use RAM or KRAKEN as cross-checks whenever coherent phase structure near
caustics or in shadow zones is in question. See `../workflows/model-selection.md`.

## Cross-links

- `ram-in-template.md`
- `ram-checklist.md`
- `../solvers/solver-ram.md`
- `../chapters/ch06-parabolic-equations.md`
- `../chapters/ch08-broadband-modeling.md`
- `../workflows/model-selection.md`
