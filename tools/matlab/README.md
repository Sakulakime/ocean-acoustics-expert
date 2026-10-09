# cc_helpers — safe BELLHOP wrappers

Two MATLAB helpers that wrap the local Acoustics Toolbox (AT) BELLHOP so an AI
agent or a user cannot easily launch a malformed run:

- `validate_bellhop_env.m` — parses a `.env` file and reports every problem it
  finds with the offending **line number** and a concrete **fix hint**, then
  prints a PASS/FAIL summary and returns a logical.
- `run_bellhop.m` — sets up the MATLAB path, validates the `.env`, runs
  `bellhop`, then reads the `.shd` and draws a transmission-loss plot
  (optionally rays).

## Important: the binaries are ELF, not Windows

The executables in
`/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4/linux-bin`
are named `*.exe` (e.g. `bellhop.exe`) but are **genuine Linux ELF
executables**, confirmed with `file`:

```
bellhop.exe: ELF 64-bit LSB pie executable, x86-64 ... for GNU/Linux 3.2.0
```

`bellhop.m` resolves the binary with `which('bellhop.exe')`, so the literal
name `bellhop.exe` must be on the MATLAB path on Linux too. `run_bellhop`
handles this for you. If you ever see a "Permission denied" error, make the
binary executable once:

```bash
chmod +x /home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4/linux-bin/bellhop.exe
```

## Required path setup

`run_bellhop` adds these for you, but to use the validator or the AT scripts
directly, add both the AT MATLAB tree and the `linux-bin` directory:

```matlab
AT = '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4';
addpath( genpath( fullfile( AT, 'Matlab' ) ) );   % read_shd, plotshd, plotray, ...
addpath( fullfile( AT, 'linux-bin' ) );           % so which('bellhop.exe') resolves
addpath( '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/cc_helpers' );

% sanity checks
which bellhop.exe      % must print <AT>/linux-bin/bellhop.exe
which read_shd         % must resolve to <AT>/Matlab/ReadWrite/read_shd.m
```

## Usage

`casename.env` must live in the current working directory (`pwd`), because the
binary runs in `pwd`. Pass the case name **without** the `.env` extension.

```matlab
cd /path/to/case            % directory containing Pekeris.env

validate_bellhop_env( 'Pekeris.env' );   % .env extension optional
run_bellhop( 'Pekeris' );                % validates, runs, plots TL
```

`validate_bellhop_env` returns `true`/`false` so you can gate your own scripts:

```matlab
if ~validate_bellhop_env( 'Munk.env' )
    error( 'Fix the .env before running.' );
end
```

### `run_bellhop` options (Name-Value)

| Name        | Type    | Default       | Meaning                                              |
|-------------|---------|---------------|------------------------------------------------------|
| `AtRoot`    | char    | local install | AT install root (holds `Matlab/` and `linux-bin/`).  |
| `PlotRays`  | logical | `false`       | Also call `plotray` (ray/eigenray runs only).        |
| `Freq`      | numeric | `NaN`         | Frequency to select from a broadband `.shd`.         |
| `Validate`  | logical | `true`        | Run the validator first (keep `true`).               |

```matlab
run_bellhop( 'Munk', 'PlotRays', false, 'Freq', 50 );
```

## What the validator checks

Failures (`FAIL`) block the run; `WARN`/`INFO` are advisory.

- Title, top-option, bottom-option, run-type are single-quoted.
- Frequency positive, NMEDIA >= 1.
- Valid SSP interpolation letter and attenuation-units letter (top option).
- SSP depths strictly increasing; the **last SSP row depth equals the medium
  bottom depth** (the true terminator, not the declared mesh-point count `N`).
- Declared `NSD`/`NRD`/`NR` counts vs their value rows, honouring the `/`
  linspace shorthand.
- Trailing `/` present where the canonical writer emits it.
- `ZBOX` (m) exceeds the deepest receiver/SSP depth; `RBOX` (km) exceeds the
  max receiver range.
- Range block looks like km, not m (heuristic).
- Conditional lines present/absent consistently: Francois-Garrison line iff
  top-opt char 4 = `F`; bottom halfspace line iff bottom-opt char 1 = `A`;
  Cerveny trailer (two lines) iff run-type char 2 in {`C`,`R`}.

### Scope

These helpers target single-environment **BELLHOP** `.env` files. They are not
for SCOOTER/KRAKEN/SPARC files (which carry extra `cLow cHigh` / `RMax` lines)
nor for multi-environment batch files such as `wedge.env`.

## Output files by run type

| Output         | Run type                         | Read/plot with        |
|----------------|----------------------------------|-----------------------|
| `casename.prt` | every run (text log)             | text editor           |
| `casename.shd` | Coherent `C` / Incoherent `I` / Semi `S` | `read_shd`, `plotshd` |
| `casename.ray` | Ray `R` / Eigenray `E`           | `plotray`             |
| `casename.arr` | Arrivals `A` (ascii) / `a` (binary) | `read_arrivals_asc/bin` |

If a TL run produces no `.shd` (or an empty one), `run_bellhop` points you to
`casename.prt`, which always appears and is the first place to look when a run
fails.

# cc_helpers — safe RAM (PE) wrappers

Two more MATLAB helpers wrap the RAM parabolic-equation model the same way the
BELLHOP helpers do: validate first, then run and plot.

- `validate_ram_in.m` — parses a `ram.in` file and reports every problem with
  the offending **line number** and a concrete **fix hint**, then prints a
  PASS/FAIL summary and returns a logical.
- `run_ram.m` — validates the input, stages it as `ram.in`, runs the working
  ELF binary directly, then reads `tl.grid` and draws a TL field plot.

## Important: use the verified ELF binary, not which('ram.exe')

The working Linux RAM binary on this machine is the **ELF 64-bit** build at:

```
/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/at_2023/RAM/ram.exe
```

The stock AT wrapper `ram.m` resolves the binary with `which('ram.exe')` and
calls `! ram.exe`. On this machine the `ram.exe` that tends to land first on
the MATLAB path is a **Mach-O (macOS) binary** that will NOT execute on Linux.
`run_ram` sidesteps this entirely: it calls the verified ELF path above with
`system()`, never `which`. Override it with the `'RamBin'` option if needed.

## Important: the input filename is FIXED as `ram.in`

RAM has no case-name concept. It always opens a file named literally `ram.in`
from the current working directory (hard-coded `open(file='ram.in')` in
`ram1.5.f`). So `run_ram` copies your input to `ram.in` in the run directory
before launching if it is not already named that. Keep multiple cases under
their own names (e.g. `wedge.in`, `flat.in`) and let `run_ram` stage them.
Re-running overwrites `tl.grid`/`tl.line` in place, so `run_ram` clears the
stale outputs first and uses the input's own directory as the run directory by
default (override with `'RunDir'`).

## Important: every range and depth is in METERS

RAM is **not** part of the AT `.env`/`.flp` family. BELLHOP/KRAKEN take ranges
in **km**; RAM takes every range and depth (`rmax`, `dr`, `rs`, `rb`, `rp`,
`zs`, `zr`, `zmax`, `zmplt`, all profile depths) in **METERS**. Putting km
values (e.g. `30` instead of `30000`) silently produces a run that terminates
almost immediately because `rmax` is tiny. `validate_ram_in` raises a
heuristic **WARN** when `rmax` looks like km (small `rmax` with `dr < 1`).

## Usage

```matlab
cd /home/jay/temp/ram_run        % directory that will hold ram.in + outputs

validate_ram_in( 'ram.in' );     % line-level checks, returns true/false
run_ram( 'ram.in' );             % validates, runs the ELF binary, plots TL
```

`run_ram` accepts the same name-value style as `run_bellhop`:

| Name       | Type    | Default                         | Meaning                                              |
|------------|---------|---------------------------------|------------------------------------------------------|
| `RamBin`   | char    | `at_2023/RAM/ram.exe` (ELF)     | Full path to the working RAM binary.                 |
| `AtRoot`   | char    | local install                   | AT root holding `Matlab/` (for `read_ram_tlgrid`).   |
| `RunDir`   | char    | folder of the input file        | Directory to stage `ram.in` and run in.              |
| `Validate` | logical | `true`                          | Run `validate_ram_in` first (keep `true`).           |

### What `validate_ram_in` checks

Failures (`FAIL`) block the run; `WARN`/`INFO` are advisory.

- Title line present; line 2 `freq zs zr` (freq > 0); line 3 `rmax dr ndr`
  (`dr > 0`, `ndr >= 1`); line 4 `zmax dz ndz zmplt` (`dz > 0`, `zmplt <= zmax`);
  line 5 `c0 np ns rs` (`c0` ~1400-1550, `np` typically 4-8 and `<= 30`).
- Bathymetry block ends with `-1 -1`, ranges non-decreasing.
- Each profile group has exactly four ordered sub-blocks (water SSP, bottom
  SSP, density, attenuation), each with `>= 1` real row, strictly increasing
  depths, and a `-1 -1` sentinel.
- `rp` profile-update ranges are single bare numbers and strictly increasing.
- METERS-vs-km trap flagged heuristically (see above).

### Outputs

| Output    | Format                  | Read/plot with                              |
|-----------|-------------------------|---------------------------------------------|
| `tl.grid` | binary (Fortran)        | `read_ram_tlgrid` (what `run_ram` plots)    |
| `tl.line` | ascii `range  TL` (m,dB)| `d = load('tl.line'); plot(d(:,1)/1000,d(:,2))` |
| `ram.log` | captured console output | text editor (first place to look on failure)|

If `tl.grid` is missing after a run, `run_ram` points you to `ram.log` in the
run directory; the most common cause is km-not-METERS ranges making `rmax`
tiny so RAM terminates immediately.

## KRAKEN

KRAKEN is the Acoustics Toolbox **normal-mode** model. Two more helpers wrap it
the same way the BELLHOP helpers do:

- `validate_kraken_files.m` — validates **both** `casename.env` and
  `casename.flp` with line-level diagnostics (file + line number + fix hint),
  including the cross-file check that the env `RMax` covers the `.flp` receiver
  ranges. Prints a PASS/FAIL summary and returns a logical.
- `run_kraken.m` — sets up the MATLAB path, validates both files, clears stale
  outputs, runs `kraken` (or `krakenc`), and draws a transmission-loss plot
  (optionally mode shapes).

### Two-stage workflow

KRAKEN runs in two stages, and the AT MATLAB wrapper chains them for you
(`kraken.m` ends by calling `field`):

1. **`kraken`** (or **`krakenc`**) reads `casename.env`, computes the normal
   modes, and writes `casename.mod` (binary modes) + `casename.prt` (text log).
2. **`field`** reads `casename.flp` + `casename.mod`, sums the modes, and writes
   the pressure field. The bundled MATLAB `field.m` saves `casename.shd.mat`;
   the Fortran `field.exe` writes a binary `casename.shd`.

`krakenc` is the complex/leaky-mode solver: it searches the complex-wavenumber
plane and captures leaky (radiating) modes and bottom-loss attenuation that the
real-axis `kraken` search misses. Pass `'Complex', true` to `run_kraken` for it.

### Important: the binaries are ELF, not Windows (same as BELLHOP)

`kraken.exe`, `krakenc.exe`, and `field.exe` in
`/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4/linux-bin`
are named `*.exe` but are **genuine Linux ELF executables** (`ELF 64-bit LSB
... for GNU/Linux 3.2.0`). `kraken.m` resolves the binary with
`which('kraken.exe')` and `krakenc.m` with `which('krakenc.exe')`, so the
literal `.exe` names must be on the MATLAB path on Linux too. If you ever see a
"Permission denied" error, set the executable bit once:

```bash
chmod +x /home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4/linux-bin/*.exe
```

### Required path setup

`run_kraken` adds these for you, but to call the validator or the AT scripts
directly, add the AT MATLAB tree **recursively** (`field.m` lives in
`Matlab/Kraken/`, the readers in `Matlab/ReadWrite/`, the plotters in
`Matlab/Plot/` — `genpath` is required) plus the `linux-bin` directory:

```matlab
AT = '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/atWin10_2020_11_4';
addpath( genpath( fullfile( AT, 'Matlab' ) ) );   % kraken, field, read_shd, plotshd, plotmode, read_flp, ...
addpath( fullfile( AT, 'linux-bin' ) );           % so which('kraken.exe'/'field.exe') resolves
addpath( '/home/jay/WorkContent/Underwater_Acoustics/ACOUSTICS-TOOLS/cc_helpers' );

% sanity checks
which kraken.exe       % must print <AT>/linux-bin/kraken.exe
which field.exe        % must print <AT>/linux-bin/field.exe
which read_shd         % must resolve to <AT>/Matlab/ReadWrite/read_shd.m
```

### Usage (two-stage)

Both `casename.env` and `casename.flp` must live in the current working
directory (`pwd`), because the binary runs in `pwd`. Pass the case name
**without** any extension.

```matlab
cd /path/to/case            % directory containing MunkK.env + MunkK.flp

validate_kraken_files( 'MunkK' );   % checks BOTH .env and .flp
run_kraken( 'MunkK' );              % validates, runs kraken + field, plots TL
```

`validate_kraken_files` returns `true`/`false` so you can gate your own scripts:

```matlab
if ~validate_kraken_files( 'MunkK' )
    error( 'Fix the .env/.flp before running.' );
end
```

#### `run_kraken` options (Name-Value)

| Name        | Type    | Default       | Meaning                                                       |
|-------------|---------|---------------|---------------------------------------------------------------|
| `AtRoot`    | char    | local install | AT install root (holds `Matlab/` and `linux-bin/`).           |
| `Complex`   | logical | `false`       | Run `krakenc` (complex/leaky-mode solver) instead of `kraken`.|
| `PlotModes` | logical | `false`       | Also call `plotmode` (wavenumbers + mode shapes).             |
| `Freq`      | numeric | `NaN`         | Frequency to select from a broadband `.shd`.                  |
| `Validate`  | logical | `true`        | Run the validator first (keep `true`).                        |

```matlab
run_kraken( 'pekeris', 'Complex', true, 'PlotModes', true );
```

<!-- KRAKEN_PLACEHOLDER -->

### What `validate_kraken_files` checks

Failures (`FAIL`) block the run; `WARN`/`INFO` are advisory. The KRAKEN `.env`
carries the same core block as BELLHOP **plus** two extra lines and **omits**
the receiver-range / run-type / beam block (those are BELLHOP-only); the `.flp`
is a separate file consumed by `field`.

`.env`:
- Title / top-option / bottom-option single-quoted; frequency positive;
  NMEDIA >= 1; valid SSP-interpolation and attenuation-units letters.
- SSP depths strictly increasing; the **last SSP row depth of each medium equals
  that medium's bottom depth** (the true terminator, not the mesh-point count `N`).
- KRAKEN-only `cLow cHigh` line: two phase speeds in **m/s**, `cLow < cHigh`,
  both plausible (set the window to span water-to-bottom speeds or modes get
  dropped silently).
- KRAKEN-only `RMax` line in **km** (`0` is legal — `field` uses the `.flp` ranges).
- Bottom halfspace line present iff bottom-option char 1 = `A`.
- `NSz`/`NRz` declared counts match their value rows (honouring the `/` shorthand).

`.flp`:
- Title (quoted, or `/` to reuse the mode-file title); option string single-quoted.
- Coordinate letter (char 1) in {`R`,`X`}; field-type/coupling letter (char 2)
  in {`C`=coupled, `A`=adiabatic, plus `P`/`B`/`O` assembly variants}.
- `MLimit` positive (use a big sentinel like `9999` to keep all modes).
- `NProf`/`NRr`/`NSz`/`NRz` counts match their value rows; `NProf` must equal the
  number of mode sets for range-dependent runs.
- Receiver range-offset (array-tilt) block, if present, is all zeros
  (`read_flp.m:87` errors on any nonzero value; `field` does not implement tilt).

Cross-file:
- If `RMax` in the `.env` is `> 0`, it must be `>=` the max receiver range in the
  `.flp` (both in km). `RMax = 0` defers to the `.flp` ranges and skips this check.

### Output files by stage

| Output            | Stage / command              | Read/plot with                |
|-------------------|------------------------------|-------------------------------|
| `casename.mod`    | Modes — `kraken`/`krakenc`   | `read_modes`, `plotmode`      |
| `casename.prt`    | Modes — `kraken`/`krakenc`   | text editor (first place to look on failure) |
| `casename.shd.mat`| Field — MATLAB `field( ... )`| `read_shd`, `plotshd` (what `run_kraken` plots) |
| `casename.shd`    | Field — Fortran `field.exe`  | `read_shd`, `plotshd`         |

`run_kraken` clears `.mod`/`.shd`/`.shd.mat`/`.prt` before each run so a failed
run cannot be mis-plotted from a stale field. If the modes stage produces no
`.mod`, or the field stage produces no usable `.shd`/`.shd.mat`, it points you to
`casename.prt` — always the first place to look when a KRAKEN run fails (e.g. a
`cLow`/`cHigh` window that excluded all modes).
