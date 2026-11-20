#!/usr/bin/env python3
"""Opt-in execution and output-shape acceptance for the UMPE v1.1 MKS examples."""

import argparse
import math
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import tempfile


SOURCES = tuple(
    f"{name}.f" for name in
    "pemp initk phase1 phase2 ssi etagen fft842 ftime tloss ave qtime qdate datime".split()
)
INPUTS = ("pefiles.inp", "perun.inp", "peenv.inp")
# Patched log counts. A logged grid does not imply a requested 2-D TL field.
GRIDS = {
    "ex1a": (838, 512), "ex1b": (838, 512), "ex2": (355, 32),
    "ex3": (500, 512), "ex4a": (1000, 256), "ex4b": (1000, 171),
    "ex5": (500, 256), "ex6": (1000, 256),
}
INTERFACES = ("botgmt.dat", "sedgmt.dat", "surfgmt.dat")
BOTTOM_LINES = ("tlb.dat", "tlbave.dat", "tlbs.dat", "tlbsave.dat")
EX4B_PRODUCTS = ("tlgmt.bin", *INTERFACES, *BOTTOM_LINES)
EXPECTED_WARNINGS = {
    "WARNING: RANGE STEP MAY BE TOO LARGE!", "WARNING: FFT SIZE MAY BE INADEQUATE.",
}
PATCH = Path("knowledge/runbooks/patches/umpe-v1.1-mks-range.patch")
CLI = Path("bin/ocean-acoustics-expert.js")


class AcceptanceError(Exception):
    """The run did not match the documented example behavior."""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AcceptanceError(message)


def run(command: list[str], directory: Path) -> subprocess.CompletedProcess[str]:
    # Match the raw float32 reader and do not inherit Fortran unit overrides.
    env = {key: value for key, value in os.environ.items() if not key.startswith("GFORTRAN_")}
    env.update(LC_ALL="C", GFORTRAN_CONVERT_UNIT="little_endian")
    return subprocess.run(command, cwd=directory, env=env, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, text=True, errors="replace")


def success(result: subprocess.CompletedProcess[str], label: str) -> None:
    require(result.returncode == 0, f"{label}: exit {result.returncode}\n{result.stdout[-6000:]}")


def build(source: Path, target: Path, patch: Path | None = None) -> Path:
    target.mkdir()
    for filename in SOURCES:
        shutil.copyfile(source / filename, target / filename)
    # The only compatibility edits, on private copies, per the UMPE runbook.
    ave = target / "ave.f"
    original = ave.read_bytes()
    adapted, count = re.subn(rb"(?im)^([ \t]*nn2[ \t]*=[ \t]*)ifix\(\(nn-1\)/2\)",
                             rb"\g<1>(nn-1)/2", original)
    if count:
        require(count == 1, "ave.f: expected exactly one legacy IFIX assignment")
        ave.write_bytes(adapted)
    for filename in ("qdate.f", "qtime.f"):
        path = target / filename
        data = path.read_bytes()
        if data.rstrip().endswith(b"\x1a"):
            path.write_bytes(data.rstrip()[:-1].rstrip(b"\r\n") + b"\n")
    if patch is not None:
        success(run(["patch", "--batch", "--forward", "--fuzz=0", "-p1", "-i", str(patch)], target),
                "apply UMPE MKS range patch")
    success(run(["gfortran", "-g", "-O2", "-std=legacy", "-fno-automatic", "-fcheck=bounds",
                 *SOURCES, "-o", "umpe"], target), f"build {target.name} (see UMPE runbook)")
    print(f"PASS build {target.name} with -fcheck=bounds", flush=True)
    return target / "umpe"


def stage(source: Path, target: Path) -> None:
    target.mkdir()
    # Only copy inputs, never the shipped logs, reference fields or plot scripts.
    for filename in INPUTS:
        shutil.copyfile(source / filename, target / filename)
    rows = (target / "pefiles.inp").read_text(encoding="ascii").splitlines()
    require(len(rows) == 44 and [row.rstrip() for row in rows[:2]] == list(INPUTS[1:]),
            f"{source}: not the official file-list layout")
    for row in rows[2:]:
        fields = row.rstrip().split()
        require(bool(re.fullmatch(r"[A-Za-z0-9_]+\.[A-Za-z0-9_]+", row.rstrip()))
                or (bool(fields) and all(re.fullmatch(r"\d+", field) for field in fields)),
                f"{source}: expected local product names and unsigned selectors only: {row!r}")


def preflight(cli: Path, directory: Path, patched: bool = False, reject: bool = False) -> None:
    flags = ["--patched-range-index"] if patched else []
    result = run(["node", str(cli), "validate_umpe_inp", *flags, str(directory)], directory)
    if reject:
        require(result.returncode == 1 and
                re.search(r"perun\.inp:31:.*\b1001\s*>\s*1000\b", result.stdout) is not None,
                f"{directory.name}: expected stock preflight to reject 1001 > 1000, "
                f"got exit {result.returncode}\n{result.stdout}")
    else:
        success(result, f"{directory.name} preflight")
    print(f"PASS {directory.name} preflight ({'expected rejection' if reject else 'accepted'}): "
          f"{result.stdout.strip()}", flush=True)


def text_product(directory: Path, name: str, rows: int) -> list[float]:
    path = directory / name
    lines = path.read_text(encoding="ascii").splitlines()
    require(len(lines) == rows, f"{directory.name}/{name}: {len(lines)} rows, expected {rows}")
    coordinates = []
    for index, line in enumerate(lines, 1):
        fields = line.split()
        require(len(fields) == 2, f"{directory.name}/{name}:{index}: expected two columns")
        values = [float(field.replace("D", "E").replace("d", "e")) for field in fields]
        require(all(map(math.isfinite, values)), f"{directory.name}/{name}:{index}: non-finite value")
        coordinates.append(values[0])
    require(all(a < b for a, b in zip(coordinates, coordinates[1:])),
            f"{directory.name}/{name}: first column must be strictly increasing")
    return coordinates


def float32_product(directory: Path, name: str, samples: int) -> None:
    raw = (directory / name).read_bytes()
    require(len(raw) == 4 * samples,
            f"{directory.name}/{name}: {len(raw)} bytes, expected {4 * samples} ({samples} float32)")
    require(all(math.isfinite(value) for (value,) in struct.iter_unpack("<f", raw)),
            f"{directory.name}/{name}: non-finite float32 value")


def check_products(directory: Path, case: str) -> None:
    nr, nd = GRIDS[case]
    if case in {"ex1a", "ex3", "ex4a", "ex4b"}:
        float32_product(directory, "tlgmt.bin", nr * nd)
    else:
        require(not (directory / "tlgmt.bin").exists(), f"{directory.name}: unrequested TL field")
    products = INTERFACES if case in {"ex1a", "ex3", "ex4a", "ex4b"} else ()
    if case in {"ex4a", "ex4b"}:
        products += BOTTOM_LINES
    for name in products:
        ranges = text_product(directory, name, nr)
        if case == "ex4b":
            require(all(abs(r - (60.01 + i * 0.02)) <= 0.00051 for i, r in enumerate(ranges)),
                    f"{directory.name}/{name}: expected 1000 ranges from 60.01 to 79.99 km by 0.02 km")
    if case in {"ex1a", "ex1b", "ex2", "ex3"}:
        for name in (("tldr.001", "tldr.002") if case == "ex2" else ("tldr.001",)):
            ranges = text_product(directory, name, nr)
            if case == "ex2":
                require(6.98 < ranges[-1] <= 7.0,
                        f"{directory.name}/{name}: last of 355 ranges must be within 7 km")
    if case == "ex3":
        for name in ("phase2r.dat", "phase2i.dat", "ssp.dat", "potent.dat"):
            text_product(directory, name, nd * (2 if name.startswith("phase2") else 1))
    if case == "ex5":
        float32_product(directory, "bbtl.bin", 2 * 256 * nd)
        float32_product(directory, "rtimegmt.001", nd * 1024)
        times = text_product(directory, "tldt.001", 1024)
        require(all(abs(time - ((i + 1) * 0.005 - 2.56)) <= 1e-5
                    for i, time in enumerate(times)), f"{directory.name}: incorrect reduced-time axis")
    if case == "ex6":
        for name in ("prssrr.bin", "prssri.bin"):
            float32_product(directory, name, nr * nd)


def solve(binary: Path, directory: Path, case: str, expect_bounds_error: bool = False) -> None:
    result = run([str(binary)], directory)
    log = result.stdout
    for line in log.splitlines():
        if "WARNING" in line.upper():
            require(case in {"ex3", "ex4a", "ex4b", "ex6"} and " ".join(line.split()) in EXPECTED_WARNINGS,
                    f"{directory.name}: unexpected solver warning: {line.strip()}")
            print(f"  {directory.name}: expected {line.strip()}", flush=True)
    errors = re.findall(r"^.*\berror\b.*$", log, re.I | re.M)
    if expect_bounds_error:
        # gfortran may append this backtrace heading after the actual diagnostic.
        errors = [line for line in errors if line.strip() != "Error termination. Backtrace:"]
        require(result.returncode > 0 and len(errors) == 1 and re.fullmatch(
            r"Fortran runtime error: Index '1001' of dimension 1 of array 'tlb' above upper bound of 1000",
            errors[0].strip(), re.I) is not None,
            f"{directory.name}: expected TLB(1001) bounds error, got exit {result.returncode}\n{log[-6000:]}")
        print(f"PASS {directory.name}: expected exit {result.returncode}: {errors[0].strip()}", flush=True)
        return
    success(result, directory.name)
    require(not errors and re.search(r"^\s*STOP\s*:", log, re.M) is not None,
            f"{directory.name}: missing normal STOP or solver reported an error\n{log[-6000:]}")
    for axis, count in zip(("RANGE", "DEPTH"), GRIDS[case]):
        require(re.search(rf"\bWITH\s+{count}\s+{axis} POINTS\b", log) is not None,
                f"{directory.name}: expected {count} reported {axis.lower()} points")
    if case == "ex5":
        freqs = re.findall(r"Realization #\s+1\s+for FREQ =\s+(\d+\.\d+)", log)
        # This is UMPE's FFT ordering: 50..75 Hz, then the lower sideband.
        expected = [50 + (i if i <= 128 else i - 256) * 50 / 256 for i in range(256)]
        require(len(freqs) == 256 and all(abs(float(a) - b) <= 0.00501 for a, b in zip(freqs, expected)),
                f"{directory.name}: expected all 256 frequencies in UMPE order; got {len(freqs)} entries")
    check_products(directory, case)
    print(f"PASS {directory.name}: requested outputs verified", flush=True)


def check_grid_edges(examples: Path, tmp: Path, cli: Path, binary: Path) -> None:
    # Use an ex1a copy with only the range grid changed. In default REAL,
    # INT(.018/.006) is 2, but the third 6-m step is exactly at the 18-m edge.
    for name, dz, maximum, window, points, first, last in (
        ("grid-edge", "0.006", "1.0", "0.012 0.018 1", 1, 0.018, 0.018),
        ("rounded-full", "0.01", "1.006", "0.0 1.006 1", 101, 0.01, 1.01),
        ("partial-end", "0.01", "1.006", "0.0 1.005 1", 100, 0.01, 1.0),
    ):
        directory = tmp / name
        stage(examples / "ex1a", directory)
        deck = directory / "perun.inp"
        lines = deck.read_text(encoding="ascii").splitlines()
        for line, value in ((18, dz), (19, maximum), (31, window)):
            lines[line - 1] = lines[line - 1][:33] + value
        deck.write_text("\n".join(lines) + "\n", encoding="ascii")
        preflight(cli, directory, patched=True)
        result = run([str(binary)], directory)
        success(result, name)
        require("ERROR" not in result.stdout.upper() and re.search(r"^\s*STOP\s*:", result.stdout, re.M),
                f"{name}: incomplete march or solver error")
        ranges = text_product(directory, "botgmt.dat", points)
        float32_product(directory, "tlgmt.bin", points * GRIDS["ex1a"][1])
        require(math.isclose(ranges[0], first) and math.isclose(ranges[-1], last),
                f"{name}: expected first/last marched range {first}/{last}, got {ranges[0]}/{ranges[-1]}")
        print(f"PASS {name}: measured {points} ranges ({first}..{last} km)", flush=True)


def verify(source: Path, package: Path, temporary: Path) -> None:
    cli, patch = package / CLI, package / PATCH
    for path in (cli, patch):
        require(path.is_file(), f"missing {path}; --package-root must contain both the CLI and patch")
    for tool in ("node", "gfortran", "patch"):
        require(shutil.which(tool) is not None, f"required executable not found: {tool}")

    stock = build(source, temporary / "stock-build")
    fixed = build(source, temporary / "patched-build", patch)
    examples = source / "examples"
    check_grid_edges(examples, temporary, cli, fixed)
    for case in GRIDS:
        directory = temporary / f"stock-{case}"
        stage(examples / case, directory)
        preflight(cli, directory, reject=case == "ex4b")
        if case == "ex4b":
            solve(stock, directory, case, expect_bounds_error=True)

    for case in GRIDS:
        directory = temporary / f"patched-{case}"
        stage(examples / case, directory)
        preflight(cli, directory, patched=True)
        solve(fixed, directory, case)

    control = temporary / "stock-ex4b-79.99"
    stage(examples / "ex4b", control)
    deck = control / "perun.inp"
    lines = deck.read_bytes().splitlines(keepends=True)
    window = lines[30][33:]
    require(window.split() == [b"60.00", b"80.00", b"2"], "ex4b: unexpected original range window")
    lines[30] = lines[30][:33] + window.replace(b"80.00", b"79.99", 1)
    deck.write_bytes(b"".join(lines))
    preflight(cli, control)
    solve(stock, control, "ex4b")
    for name in EX4B_PRODUCTS:
        require((control / name).read_bytes() == (temporary / "patched-ex4b" / name).read_bytes(),
                f"ex4b: {name} differs between patched original and stock 79.99 km control")
    print("PASS ex4b: all eight products byte-identical to stock 79.99 km control")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, epilog=(
        "Requires Node.js, gfortran and patch. Builds and runs in a private temporary directory; "
        "ex5 runs all 256 frequencies and can take several minutes. No plotting tools needed."
    ))
    parser.add_argument("umpe_root", type=Path, metavar="UMPE_ROOT", help="UMPE v1.1 source and examples tree")
    parser.add_argument("--package-root", type=Path, default=Path(__file__).resolve().parents[1],
                        help="repository or extracted npm package directory (default: script's repository)")
    args = parser.parse_args()
    try:
        with tempfile.TemporaryDirectory(prefix="verify-umpe-") as directory:
            verify(args.umpe_root.resolve(), args.package_root.resolve(), Path(directory))
    except (AcceptanceError, OSError, ValueError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        return 1
    print("PASS UMPE v1.1 MKS examples (execution and output shape, not numerical validation)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
