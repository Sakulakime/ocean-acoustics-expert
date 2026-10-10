---
title: COA Benchmark Cases
type: benchmark-cases
primary_source: 01-source-coa.md
source_pdf: sources/jensen-2011-computational-ocean-acoustics.pdf
status: active
---

# COA Benchmark Cases

This note catalogues the canonical test environments that *Computational Ocean Acoustics* (COA, 2nd ed.) uses across chapters 1-8. Each case gives its exact parameters, says where COA shows it, which solver families it validates, and what COA treats as the reference solution. Use it to pick test environments that reviewers will recognise, or to reproduce a COA figure in a new solver or dataset.

## How to read this note

- Every case is a `###` heading under `## Cases`, with four blocks: **Environment**, **COA references**, **Validates** and **Reference solutions**. `check` enforces the four blocks.
- Parameters are COA's own numbers. Where COA does not state a parameter in the text (for example a receiver depth that appears only on a figure axis), the case says so; read the figure on the cited page.
- Page references are PDF pages of `sources/jensen-2011-computational-ocean-acoustics.pdf`. PDF page = book page + 19 in Ch. 1 and Ch. 2, + 18 in Ch. 3 and Ch. 4, + 17 in Ch. 5, + 16 in Ch. 6, and + 15 in Ch. 7 and Ch. 8.
- Attenuation in dB/λ is per wavelength of the medium named. "Validates" lists the method families the case exercises in COA: ray, wavenumber integration (WI/FFP), normal modes, PE, FD/FE, and broadband synthesis.

## Cases by solver family

| Family | Cases |
|---|---|
| Ray | Dickins seamount; parabolic bottom profile; Munk profile (interpolation and false caustics) |
| Wavenumber integration (FFP) | Pekeris waveguide (aliasing, contours); elastic-bottom Pekeris waveguide; Bucker waveguide; head-wave problem |
| Normal modes | Pekeris waveguide (trapped and leaky modes); Munk profile; 3-D conical seamounts |
| PE | NORDA PE Workshop Pekeris test; ASA wedge; 2-D wedge mode cutoff; Dickins seamount; sloping elastic bottom; 3-D wedge; Lloyd-mirror image solution (starters) |
| FD/FE | Sloping elastic bottom (FE reference); spherical shell near the seabed |
| Broadband | Pekeris waveguide (mode dispersion); Munk profile (deep-water pulses); 3-D wedge (pulses); head-wave problem |

## Cases

### Pekeris waveguide
An isovelocity water layer over a fluid halfspace. COA's canonical shallow-water case, reused with different parameters in Ch. 2, 4, 5 and 8.

**Environment**
- Ch. 2 and Ch. 4 version (Fig. 2.25): water depth D = 100 m, pressure-release surface; water c1 = 1500 m/s, ρ1 = 1000 kg/m³; bottom halfspace c2 = 1800 m/s, ρ2 = 1800 kg/m³. Source at 36 m; receivers at 36 m and 46 m.
- Frequencies: 20 Hz for the Green's function and TL (Fig. 2.29), 35 Hz for the three mode shapes (Fig. 2.27). Bottom attenuation 1.0 dB/λ against lossless in Fig. 2.30; 0.5 dB/λ in the Ch. 4 FFP runs (Figs. 4.6 and 4.8), TL at 46 m out to 15 km.
- Ch. 5 version (Fig. 5.5): D = 100 m, source at 25 m, receiver at 50 m, water 1500 m/s and 1000 kg/m³, bottom c_b = 2000 m/s, ρ_b = 1000 kg/m³. COA states no frequency for the mode plots of Fig. 5.8.
- Ch. 8 version (Fig. 8.6): D = 100 m, source at 25 m, water 1500 m/s and 1000 kg/m³, bottom 1600 m/s, 1500 kg/m³, 0.2 dB/λ. Mode cutoffs from eq. (8.89): 10.8, 32.3, 53.9 and 75.4 Hz for modes 1-4. Pulse centred at 50 Hz with 50 Hz bandwidth; at 30 km the arrivals span about 20.06-20.74 s.
- §5.14 pulse version (Fig. 5.39a): 100 m deep, water 1500 m/s, bottom 1600 m/s and 1800 kg/m³, source at 40 m, 100 Hz centre frequency, 50 Hz bandwidth, 20 km range.

**COA references**
- §2.4.5, PDF pp. 137-151: geometry Fig. 2.25 (PDF p. 138); Hankel-transform kernel eq. (2.176) (PDF p. 138); characteristic equation eq. (2.186) (PDF p. 140); mode cutoff frequencies eq. (2.191) (PDF p. 144); modes at 35 Hz Fig. 2.27 (PDF p. 143); dispersion Fig. 2.28 (PDF p. 145); field at 20 Hz Fig. 2.29 (PDF p. 147); lossy versus lossless bottom Fig. 2.30 (PDF p. 150).
- §4.5, PDF pp. 281-289: aliasing sketch Fig. 4.5 (PDF p. 282); real-axis FFP versus exact solution Fig. 4.6 (PDF p. 285); complex contour integration Fig. 4.8 (PDF p. 289).
- §5.5, PDF pp. 366-373: schematic Fig. 5.5 (PDF p. 367); characteristic equation eq. (5.81) (PDF p. 372); EJP and Pekeris branch cuts Figs. 5.6-5.7 (PDF pp. 369, 372); selected trapped and leaky modes Fig. 5.8 (PDF p. 373).
- §8.5.2, PDF pp. 651-655: schematic Fig. 8.6 (PDF p. 651); dispersion curves Fig. 8.7 and cutoff eq. (8.89) (PDF p. 652); pulse eq. (8.90) and received pulse Fig. 8.8 (PDF p. 653); time series Fig. 8.9 and snapshot Fig. 8.10 (PDF pp. 654-655).
- §5.14, PDF p. 456: shallow-water pulse Fig. 5.39a.
- §5.12.3, PDF pp. 437-439: a 10 m rigid sphere at mid-depth in a 100 m Pekeris waveguide, 1.5 kHz, source at 30 m and 500 m range (Figs. 5.26-5.27). COA gives no bottom parameters for this example in the text.

**Validates**
- Wavenumber integration: kernel structure (discrete, continuous and evanescent spectra), FFP aliasing and complex-contour integration (Ch. 4).
- Normal modes: trapped versus leaky modes and the choice of branch cut (Ch. 2, Ch. 5), modal attenuation by perturbation versus exact complex roots (Ch. 2, §2.4.5.5).
- Broadband synthesis: geometric dispersion, group velocity and the Airy phase (Ch. 8).

**Reference solutions**
- The exact integral-transform (wavenumber-integration) solution is the reference: Fig. 4.6b compares FFP against the "exact solution", and Fig. 4.8b reaches it with M = 1024 contour samples. COA §4.5, PDF pp. 285, 288-289.
- Fig. 2.30 is computed by wavenumber integration; COA warns that perturbational modal attenuation misses the changed interference pattern in this high-attenuation, few-mode case. COA §2.4.5.5, PDF p. 151.
- The Ch. 8 pulses are Fourier syntheses of normal-mode solutions. COA §8.5.2, PDF p. 653.

### Munk profile
COA's idealized deep-water sound channel, used for normal modes, ray interpolation, broadband pulses and 3-D seamount scattering.

**Environment**
- Sound speed, eq. (5.83): $c(z)=1500\left[1+\epsilon\left(\tilde z-1+e^{-\tilde z}\right)\right]$ m/s with $\epsilon=0.00737$ and $\tilde z=2(z-1300)/1300$, $z$ in metres; the channel axis is at 1300 m.
- §5.6 modal case: homogeneous halfspace bottom with density 1000 kg/m³ and sound speed 1600 m/s; 50 Hz. Mode 30 has phase speed 1525.9 m/s and loop length $L_{30}=57.4$ km. TL with source at 100 m: modes 1-63 waterborne, 64-102 bottom-bounce, 103-400 leaky. COA does not state the water depth in the text; read Fig. 5.9.
- Ray examples (§3.7.4): source at 1000 m, 500 Hz; c-linear versus cubic-spline interpolation (Fig. 3.32) and n²-linear versus spline TL (Fig. 3.33).
- Deep-water pulse (Fig. 5.39b): source at 900 m, 22.5 Hz centre frequency, 15 Hz bandwidth, 2000 km range.
- 3-D seamount variant: see the "Conical seamounts in a Munk ocean" case.

**COA references**
- §5.6, PDF pp. 373-377: eq. (5.83) (PDF p. 373); profile Fig. 5.9 and modes Fig. 5.10 (PDF p. 374); ray equivalent of mode 30 Fig. 5.11 (PDF p. 375); loop length eqs. (5.86)-(5.87) (PDF p. 376); TL with waterborne, bottom-bounce and leaky modes Fig. 5.12 (PDF p. 377).
- §5.7.3, PDF pp. 391-392: shooting instability and parallel shooting for the Munk profile's two turning points.
- §3.7.4, PDF pp. 229-231: Figs. 3.32-3.33.
- §5.14, PDF p. 456: Fig. 5.39b.
- Ch. 5 Problems 5.1 and 5.3, PDF pp. 466-467.

**Validates**
- Normal modes: mode finding with two turning points, WKB view, ray–mode analogy, mode-set truncation (Ch. 5).
- Ray: profile interpolation and false caustics; Gaussian beams smooth the caustics (Ch. 3).
- Broadband: deep-water modal arrival order (Ch. 5 §5.14).

**Reference solutions**
- No analytic solution exists; COA computes the modes numerically (§5.7). COA §5.6, PDF p. 373.
- For the ray-interpolation study the full-wave reference is a normal-mode solution, and the spline fit agrees with it best (Fig. 3.33). COA §3.7.4, PDF pp. 229-231.

### ASA wedge
The upslope wedge from the range-dependent benchmark problems the Acoustical Society of America solicited in 1987 (Jensen and Ferla 1990, COA Ch. 6 ref. [40]). COA uses it to expose energy-conservation errors of one-way PEs on stair-stepped slopes.

**Environment**
- Isovelocity water c1 = 1500 m/s, ρ1 = 1000 kg/m³, over a homogeneous fluid bottom c2 = 1700 m/s, ρ2 = 1500 kg/m³, α2 = 0.5 dB/λ; critical angle about 28°.
- Water depth 200 m at the source, decreasing linearly to 0 at 4 km range: a slope of about 2.86°.
- Source depth 100 m; frequency 25 Hz.
- COA does not state the receiver depth of the TL curves in Fig. 6.8 in the text; read the figure.

**COA references**
- §6.7, PDF pp. 522-523: setup on PDF p. 522; test environment and TL comparisons Fig. 6.8a-c (PDF p. 523).
- Chapter note: `chapters/ch06-parabolic-equations.md`, "Energy conservation at sloping interfaces".

**Validates**
- PE: energy conservation at stair-stepped sloping interfaces, angular limits (Thomson–Chapman too narrow-angled for a 28° critical angle) and level accuracy of the wide-angle Claerbout PE.
- Two-way coupled modes, as the reference.

**Reference solutions**
- A full-spectrum, two-way coupled-mode solution (solid curves in Fig. 6.8b-c). The split-step Thomson–Chapman PE, eq. (6.41), shows phase errors but an accurate mean level; the finite-difference Claerbout PE, eq. (6.43), has negligible phase error but runs about 2 dB low at longer ranges. The backscattered field from the coupled-mode result is 40-50 dB below the outgoing field. COA §6.7, PDF p. 522.
- COA does not name the coupled-mode code.

### Wedge with mode cutoff (2-D upslope)
A flat-then-sloping penetrable wedge, after Jensen and Kuperman (1980), showing mode conversion and cutoff during upslope propagation.

**Environment**
- Homogeneous water 1500 m/s over a homogeneous bottom of 1700 m/s (critical angle about 28°), 0.5 dB/λ, 1500 kg/m³.
- Bottom flat to 5 km, then sloping toward the surface at 1.55°. Frequency 25 Hz, source depth 180 m.
- Three trapped modes; each is cut off on the slope and radiates into the bottom as a beam. COA states the starting water depth only on the figure axis; read Fig. 6.11.

**COA references**
- §6.9.2, PDF pp. 531-532: setup on PDF p. 532; TL contours Fig. 6.11 (PDF p. 530).
- Ch. 6 Problem 6.4, PDF p. 543: mode count and nominal cutoff depths for this wedge.

**Validates**
- PE: wide-angle propagation with a Greene starter in a range-dependent duct; mode conversion and cutoff.
- Normal modes (for cutoff analysis, Problem 6.4).

**Reference solutions**
- COA gives no reference solution: the field is generated with a split-step Thomson–Chapman PE, eq. (6.41), initialized with Greene's source, eq. (6.102). COA §6.9.2, PDF p. 532.

### 3-D wedge (truncated wedge)
A truncated wedge for horizontal refraction, used for CW in §6.9.5 and for pulses in §8.5.3, after Sturm (2005).

**Environment**
- Bottom depth 380 m in the deep part, a linear slope of 2.86° over 7.2 km in the x-direction, ending at 20 m.
- Point source at the slope mid-point, where the depth is 200 m; source depth 40 m; 25 Hz (CW) or a 25 Hz Hanning-weighted four-period pulse, eq. (8.90), of length 0.16 s.
- Water 1500 m/s over a homogeneous fluid bottom of 1700 m/s, 0.5 dB/λ, 1500 kg/m³ (critical grazing angle about 28°). Three propagating modes at the source.
- Receivers: horizontal slice at 30 m depth; cross-slope (φ = 90°) line at 30 m to 25 km; vertical arrays A1 (16 km) and A3 (25 km) cross-slope in 200 m of water.

**COA references**
- §6.9.5, PDF pp. 533-539: geometry Fig. 6.15 (PDF p. 535); N×2-D versus 3-D TL Fig. 6.16 (PDF p. 536); cross-slope TL Fig. 6.17 (PDF p. 537); horizontal ray deflection Fig. 6.18 (PDF p. 537); horizontally refracted mode paths Fig. 6.19 (PDF p. 538); single-mode 3-D TL Fig. 6.20 (PDF p. 539); vertical-plane contours Fig. 6.21 (PDF p. 540).
- §8.5.3, PDF pp. 655-659: geometry Fig. 8.11 (PDF p. 656); mode paths Fig. 8.12 (PDF p. 657); stacked time series at A1 and A3 Figs. 8.13-8.14 (PDF pp. 658-659).
- 3-D Padé PE, eq. (6.213), §6.8.1, PDF p. 527.

**Validates**
- PE: fully 3-D PE versus N×2-D, horizontal refraction. N×2-D and 3-D agree to about 17 km cross-slope; beyond it the 3-D level drops about 10 dB to 25 km as mode 2 turns away from the apex. COA §6.9.5, PDF p. 536.
- Normal modes and rays: horizontally refracted mode paths (ray–mode analogy).
- Broadband: modal arrival structure with and without horizontal refraction.

**Reference solutions**
- Sturm's fully 3-D wide-angle Padé PE, eq. (6.213), is the reference; the N×2-D result is the approximation it is compared with. COA §6.8.1 and §6.9.5, PDF pp. 527, 535-536; §8.5.3, PDF p. 656.

### Dickins seamount
Long-range deep-water propagation across a steep seamount, computed with a ray model in Ch. 3 and a PE in Ch. 6. COA names it the Dickins seamount in §3.6.3 and points there to the PE result of §6.9.3, which uses the same frequency and source depth.

**Environment**
- Frequency 230 Hz; source depth 18 m; ranges to 100 km.
- Seamount with a slope of about 14°, its peak about 500 m below the surface; it blocks the deep refracted paths in the first 20 km.
- Water: a measured North-Pacific sound-speed profile, the same all along the track (heavy line on Fig. 6.12, axis 1460-1510 m/s). COA does not tabulate it.
- Bottom: homogeneous, 1800 m/s, 0.5 dB/λ, 1500 kg/m³. Water depth away from the seamount is shown only on the figure axes (to about 3000-3500 m).
- Beyond the mount energy travels in a channel near 500 m depth and in convergence zones with a cycle of about 40 km.

**COA references**
- §3.6.3, PDF pp. 208-211: piecewise-linear (faceted) boundary reflection, eqs. (3.117)-(3.126) (PDF pp. 208-209); ray trace and TL Fig. 3.21 (PDF p. 210).
- §6.9.3, PDF p. 532: parameters; TL contours Fig. 6.12 (PDF p. 530).
- Subject index: "Numerical examples of ray solutions: Dickins seamount, 192" (book page 192 = PDF p. 210).

**Validates**
- Ray: reflection from a piecewise-linear bathymetry and the choice of boundary interpolation (Ch. 3).
- PE: split-step standard PE over strongly range-dependent bathymetry (Ch. 6).

**Reference solutions**
- COA gives no exact reference: the ray TL "compares well" with the PE result of §6.9.3. COA §3.6.3, PDF p. 210.
- The PE field is a split-step implementation of the standard PE, eq. (6.27), initialized with a Gaussian source, eq. (6.101), and heavily smoothed. COA §6.9.3, PDF p. 532.

### Conical seamounts in a Munk ocean (3-D)
A mid-ocean seamount scattering problem for 3-D spectral coupled modes.

**Environment**
- Water depth 5000 m with a Munk profile, axis at 1300 m (eq. (5.83)).
- Two conical seamounts of radius 20 km and heights 1000 m and 3800 m.
- Source 10 Hz at 100 km from the summit, source depth 100 m (Fig. 5.34).
- Bottom: c_b = 2000 m/s, ρ_b = 1000 kg/m³, α_b = 0.1 dB/λ (Fig. 5.34 labels).
- Outputs: TL in a horizontal plane at 300 m depth; scattered mode amplitudes for mode-10 incidence. At 10 Hz λ is about 150 m, so ring sectors must be under 75 m (λ/2); 512 sectors satisfy it, 128 sectors (about 4λ/3) do not.

**COA references**
- §5.13.3, PDF pp. 446-455: spectral coupled-mode field eq. (5.326) (PDF p. 449); scenario Fig. 5.34 (PDF p. 451); TL Fig. 5.35 (PDF p. 452); top view Fig. 5.36 (PDF p. 453); scattered mode amplitude eq. (5.337) (PDF p. 452); scattered mode amplitudes with 512 sectors Fig. 5.37 (PDF p. 454); with 128 equidistant or random sectors Fig. 5.38 (PDF p. 455).
- Chapter note: `chapters/ch05-normal-modes.md`, "Three-dimensional environments and horizontal refraction".

**Validates**
- Normal modes: 3-D spectral coupled modes versus N×2-D coupled modes; azimuthal and radial discretization.

**Reference solutions**
- The 3-D spectral coupled-mode solution is the reference; N×2-D coupled modes capture the 1000 m seamount but underestimate the shadow behind the 3800 m one. COA §5.13.3, PDF pp. 450-452.

### NORDA PE Workshop Pekeris test (test problem 3B)
A near-bottom shallow-water Pekeris test first presented at the 1981 NORDA PE Workshop (Davis, White and Cavanagh 1982, COA Ch. 6 ref. [4]).

**Environment**
- Isovelocity water 1500 m/s, 100 m deep, over a homogeneous bottom of 1590 m/s (critical angle 19.4°), density ratio 1.2, 0.5 dB/λ.
- Source and receiver near the bottom at 99.5 m; 250 Hz. There are 11 propagating modes with angles between 1.7° and 18.5°.
- Starter variant (§6.4.2): source and receiver on the bottom (100 m) and the density ratio raised to 2.0, at 250 Hz.

**COA references**
- §6.2.4, PDF pp. 484-486: setup on PDF p. 484; standard versus wide-angle PE against FFP, Fig. 6.2 (PDF p. 486).
- §6.4.2, PDF pp. 497-498: starter variant and Fig. 6.3 (PDF p. 497).
- Chapter note: `chapters/ch06-parabolic-equations.md`, "Phase errors and angular limitations" and "Starting fields and source representation".

**Validates**
- PE: angular limits and phase errors (Tappert versus Claerbout); analytic versus modal starters near an interface.
- Wavenumber integration, as the reference.

**Reference solutions**
- An FFP (wavenumber-integration) solution is the reference for Fig. 6.2; the wide-angle Claerbout PE matches it and the standard PE does not. Both PE runs use a modal starter. COA §6.2.4, PDF pp. 484-485.
- For the starter variant the reference is the Claerbout PE with a modal source that includes the bottom boundary condition; Greene's source is about 2.5 dB off. COA §6.4.2, PDF p. 497.

### Sloping elastic bottom (PE benchmark scenarios)
Upslope propagation over an elastic seabed, from Jensen et al.'s benchmark scenarios for range-dependent seismo-acoustic models (2008, COA Ch. 6 ref. [55]).

**Environment**
- Homogeneous water 1500 m/s, 1000 kg/m³; constant depth 600 m out to 2 km, then a 3.6° slope until the depth reaches 100 m (Fig. 6.13).
- Homogeneous elastic bottom, two types: bottom 1 cp = 2000 m/s, cs = 800 m/s (moraine); bottom 2 cp = 2400 m/s, cs = 1200 m/s (chalk). Both: αp = 0.2 dB/λp, αs = 0.2 dB/λs, ρ = 2000 kg/m³.
- Frequency 15 Hz, source depth 100 m, receiver depth 30 m, ranges to 10 km.

**COA references**
- §6.9.4, PDF pp. 533-534: environment and table Fig. 6.13 (PDF p. 533); TL for fluid PE, elastic PE and FE reference Fig. 6.14 (PDF p. 534).
- §6.3, PDF p. 488: the elastic PE and its earlier benchmark, an elastic wedge in the PE Workshop II proceedings (1991, ref. [29]); COA gives no parameters for that wedge.

**Validates**
- PE: one-way elastic PE versus fluid PE; shear changes TL by 10-15 dB for bottom 1 and 40-50 dB for bottom 2 at longer ranges.
- FD/FE: full-spectrum two-way finite-element reference (Ch. 7).

**Reference solutions**
- A full-spectrum, two-way finite-element propagation code (Ch. 7) is the reference; the elastic PE falls right on it, so backscatter is negligible, and the PE is about 100 times faster. COA §6.9.4, PDF p. 533.

### Waveguide with an elastic bottom
COA's Pekeris waveguide of Fig. 2.25 with shear added to the bottom, to show the Scholte interface wave.

**Environment**
- Water depth 100 m, water 1500 m/s; bottom halfspace cp = 1800 m/s, ρ2 = 1800 kg/m³, shear speed cs = 600 m/s, then a low-shear variant with cs = 300 m/s.
- Source at 95 m, receiver at 99 m, 20 Hz.
- The Scholte-wave pole sits near kr = 0.24 m⁻¹ for cs = 600 m/s and near kr = 0.47 m⁻¹ for cs = 300 m/s.

**COA references**
- §4.10.1, PDF pp. 315-318: Green's function and TL, cs = 600 m/s, Fig. 4.15 (PDF p. 316); cs = 300 m/s, Fig. 4.16 (PDF p. 317).

**Validates**
- Wavenumber integration with elastic layers: shear leakage of the trapped and virtual modes, interface waves.
- Normal modes with elastic bottoms, by comparison with §5.10.

**Reference solutions**
- Wavenumber integration is the method used; the fluid-bottom (Pekeris) result is the comparison (dashed curves). COA names no other reference. COA §4.10.1, PDF pp. 315-317.

### Bucker waveguide
A fluid waveguide suggested by Bucker as a benchmark for propagation models, with a strong bottom density contrast and few real-axis modes.

**Environment**
- Water depth 240 m; water density 1000 kg/m³; fluid-bottom halfspace density 2100 kg/m³ (Fig. 4.17).
- Sound speeds: shown only in the profile of Fig. 4.17; COA says the speed contrast is very small and does not give the values in the text.
- 100 Hz point source at 30 m; receiver at 90 m.

**COA references**
- §4.10.2, PDF pp. 318-319: profile Fig. 4.17 (PDF p. 318); Green's function and TL, full versus discrete spectrum, Fig. 4.18 (PDF p. 319).

**Validates**
- Wavenumber integration against normal modes that keep only real-axis modes: the continuous spectrum matters even at long ranges.
- PE: COA notes that some earlier PE implementations had difficulty with its density contrast.

**Reference solutions**
- The full-spectrum wavenumber-integration solution is exact for this environment; the discrete-spectrum (normal-mode) solution is the comparison. COA §4.10.2, PDF pp. 318-319.

### Parabolic bottom profile
A ray-model test of bathymetry interpolation from McGirr et al.'s 1985 evaluation of range-dependent ray models (COA Ch. 3 ref. [29]).

**Environment**
- Bottom depth $z=0.002\,b\sqrt{1+r/c}$, eq. (3.127), with $b=250000$ and $c=250$; $r$ and $z$ in metres. A source at the origin sits at the focus, so bottom-reflected rays should emerge parallel to the surface.
- Ranges to 20 km; bathymetry sampled every 25 m in depth. COA does not state the sound speed in the text.

**COA references**
- §3.6.3, PDF pp. 210-212: eq. (3.127) (PDF p. 210); faceted-boundary ray trace Fig. 3.22 (PDF p. 211); interpolated-normal remedy Fig. 3.23 (PDF p. 212).

**Validates**
- Ray: boundary interpolation (piecewise-linear facets versus interpolated normals).

**Reference solutions**
- The focusing geometry itself: ideally the reflected rays are parallel to the surface. COA gives no numerical reference. COA §3.6.3, PDF p. 211.

### Lloyd-mirror image solution
A point source below a pressure-release surface in a homogeneous medium. Its exact two-path solution is the benchmark COA uses for numerical wave codes and for PE starting fields.

**Environment**
- Homogeneous water, 1500 m/s; pressure-release surface; no bottom.
- Ch. 1 example: 150 Hz (λ = 10 m), source at 25 m, receiver at 200 m; five Lloyd-mirror beams from eq. (1.29).
- Ch. 6 starter test: 100 Hz, source at 75 m, density 1000 kg/m³, no attenuation; ten beams from 2.87° to 71.8°; losses compared along a 500 m radius.

**COA references**
- §1.4.2.1, PDF pp. 36-39: image solution eqs. (1.19)-(1.20) (PDF p. 37); beam count eq. (1.29) (PDF p. 38); TL Fig. 1.9 (PDF p. 39).
- §6.4.3, PDF pp. 498-501: reference eq. (6.109) (PDF p. 498); beam directions eq. (6.110) (PDF p. 499); radiation patterns Figs. 6.4-6.5 (PDF pp. 500-501).

**Validates**
- Any wave-equation solver against an exact solution (Ch. 1); PE starters (Gaussian, Greene, Thomson) propagated by the Tappert, Thomson–Chapman and Claerbout PEs (Ch. 6).

**Reference solutions**
- The exact image solution, eq. (1.19) or (6.109). In a homogeneous medium the Thomson–Chapman PE has no phase errors and can also serve as reference. COA §1.4.2.1, PDF p. 39; §6.4.3, PDF p. 499.

### Head-wave problem
Two fluid halfspaces with a pulse source above the interface, to separate direct, reflected, transmitted and head waves in time.

**Environment**
- Two lossless fluid halfspaces of equal density, 1500 m/s above and 2500 m/s below.
- Point source 50 m above the interface; wavelet eq. (8.87) with centre frequency 100 Hz.
- Snapshots at 20, 60 and 120 ms; the reflected wave shows a critical-angle effect beyond 53°.

**COA references**
- §8.5.1, PDF pp. 648-650: wavelet eq. (8.87) (PDF p. 648); schematic Fig. 8.4 (PDF p. 649); snapshots Fig. 8.5 (PDF p. 650).

**Validates**
- Broadband and time-domain wavenumber integration (time-marched FFP); the head wave, which classical ray theory misses.

**Reference solutions**
- Computed directly in the time domain with Porter's time-marched FFP technique. COA gives no other reference. COA §8.5.1, PDF p. 650.

### Spherical shell near the seabed
Target-scattering benchmarks for an elastic spherical shell proud on, buried in, or half-buried in a sediment, after Zampolli et al. (COA Ch. 7 refs. [32], [61]).

**Environment**
- Water cp = 1500 m/s, ρ = 1000 kg/m³; sediment cp = 1600 m/s, ρ = 1800 kg/m³, 0.5 dB/λ; fiberglass casing cp = 3500 m/s, cs = 1400 m/s, ρ = 3000 kg/m³; solid filling cp = 2500 m/s, cs = 1200 m/s, ρ = 2000 kg/m³ (Table 7.1).
- Outer radius 0.5 m, shell 1 cm thick; critical angle about 20°; plane-wave insonification at 15° (subcritical) and 25° (supercritical); farfield points 50 m from the centre; 100 Hz-10 kHz in 5 Hz steps.
- Three placements: proud on the seabed, buried 20 cm below the interface, half-buried.

**COA references**
- §7.6.2, PDF pp. 605-612: geometry Fig. 7.20 and Table 7.1 (PDF p. 606); proud-shell target strength Fig. 7.21 (PDF p. 608); buried and half-buried geometry Fig. 7.22 (PDF p. 609); target strength Figs. 7.23-7.24 (PDF pp. 611-612).

**Validates**
- FD/FE: FE with PML for scattering in a layered medium; the virtual source concept (VSC, boundary-element family).

**Reference solutions**
- FE-PML and VSC cross-check each other; for the half-buried shell COA calls the lower part of the band "of benchmark quality", and the VSC runs were limited to 5.5 kHz. COA §7.6.2, PDF p. 610.

## Other COA test environments, not catalogued as cases

These COA examples recur but are field illustrations rather than reproducible benchmarks, or COA gives too few numbers:
- Mediterranean ocean front (Maltese front) and the North-Pacific seamount measured by Chapman and Ebbeson, compared with PE predictions in Figs. 1.18-1.19, §1.4.4, PDF pp. 51-54.
- Ice-covered Arctic profile with a 4 m elastic ice plate (cp = 3500 m/s, cs = 1800 m/s), 20 Hz source at 100 m: §4.10.4, PDF pp. 323-327, reused for matched-field processing in §10.7.1.2, PDF pp. 753-761. COA gives the profile only as a figure.
- Warm-core eddy for coupled versus adiabatic modes, 50 Hz, source at 300 m: §5.11.4, PDF pp. 428-429.
- Generic deep-water pulse environment, source at 1000 m: §8.5.5, PDF pp. 662-666.
- Isovelocity waveguide with a rigid bottom (100 m, 100 Hz, 13 modes): §5.4, PDF pp. 361-366; covered in `chapters/ch05-normal-modes.md`.

## Related notes

- `chapters/ch02-wave-propagation-theory.md`, `chapters/ch04-wavenumber-integration.md`, `chapters/ch05-normal-modes.md`, `chapters/ch06-parabolic-equations.md`, `chapters/ch07-fd-fe-methods.md`, `chapters/ch08-broadband-modeling.md`
- `chapters/ch03-ray-methods.md`
- `workflows/model-selection.md`
- `runbooks/kraken-runbook.md`, `runbooks/ram-runbook.md`, `runbooks/bellhop-runbook.md`
