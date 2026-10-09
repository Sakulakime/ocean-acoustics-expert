---
title: Ocean Acoustics Glossary
type: glossary
status: expanded
---

# Ocean Acoustics Glossary

## Environment and waveguide structure

- **Sound-speed profile (SSP)**: Depth-varying sound speed that controls refraction, ducting, convergence, and shadow zones in the ocean waveguide. See `chapters/ch01-fundamentals.md`, `chapters/ch02-wave-propagation-theory.md`.
- **Mixed layer**: Near-surface layer with weak temperature variation and often increasing sound speed with depth; often associated with surface-duct behavior. See `chapters/ch01-fundamentals.md`.
- **Surface duct**: Near-surface trapping region caused by upward-refracting SSP structure, important for near-surface propagation and sonar performance. See `chapters/ch01-fundamentals.md`, `chapters/ch03-ray-methods.md`.
- **Thermocline**: Depth region where temperature drops rapidly and sound speed often decreases with depth. See `chapters/ch01-fundamentals.md`.
- **Deep sound channel**: Ocean region with a sound-speed minimum that supports long-range trapping near the channel axis. See `chapters/ch01-fundamentals.md`, `chapters/ch02-wave-propagation-theory.md`.
- **Deep sound channel axis**: Depth of minimum sound speed in the deep ocean channel, around which refracted energy can remain trapped. See `chapters/ch01-fundamentals.md`.
- **Ocean waveguide**: Ocean environment bounded by surface and bottom, with wave propagation shaped by SSP and boundaries. See `chapters/ch01-fundamentals.md`, `chapters/ch02-wave-propagation-theory.md`.
- **Range-dependent environment**: Environment whose properties vary horizontally as well as with depth. See `chapters/ch01-fundamentals.md`, `chapters/ch06-parabolic-equations.md`.
- **Horizontally stratified environment**: Environment whose properties depend only on depth, not range. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch04-wavenumber-integration.md`.
- **Layered medium**: Piecewise-stratified representation with discrete interfaces between layers. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch04-wavenumber-integration.md`.
- **Pekeris waveguide**: Canonical shallow-water waveguide model with water over a bottom halfspace. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch05-normal-modes.md`.
- **Deep-ocean waveguide**: Waveguide associated with deep-sound-channel structure and long-range trapping. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch05-normal-modes.md`.
- **Waveguide invariant**: Parameter describing interference-structure scaling in some waveguides. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch05-normal-modes.md`.
- **Mesoscale variability**: Oceanographic variability on large horizontal scales that can often be treated deterministically in propagation models. See `chapters/ch01-fundamentals.md`.
- **Microstructure variability**: Fine-scale ocean variability that can scatter higher-frequency sound and push modeling toward stochastic descriptions. See `chapters/ch01-fundamentals.md`.

## Boundaries, bottoms, and attenuation

- **Elastic bottom**: Seabed model including solid-medium response and shear effects. See `chapters/ch01-fundamentals.md`, `chapters/ch04-wavenumber-integration.md`, `chapters/ch07-fd-fe-methods.md`.
- **Bottom loss**: Propagation loss associated with seabed interaction, including penetration, conversion, and attenuation in the bottom. See `chapters/ch01-fundamentals.md`.
- **Volume attenuation**: Loss caused by absorption or other bulk-medium mechanisms rather than geometry or reflection. See `chapters/ch01-fundamentals.md`.
- **Boundary scattering**: Scattering caused by rough surfaces or interfaces such as the sea surface or seabed. See `chapters/ch01-fundamentals.md`.
- **Volume scattering**: Scattering caused by inhomogeneities within the water column or medium interior. See `chapters/ch01-fundamentals.md`.
- **Bubble layer / bubble suspension**: Water with entrained air bubbles whose effective sound speed can differ dramatically from bubble-free water. See `chapters/ch01-fundamentals.md`.
- **Quality factor Q**: Parameter used to characterize attenuation in compressional or shear waves. See `chapters/ch04-wavenumber-integration.md`.

## Governing equations and field theory

- **Wave equation**: Time-domain governing equation for acoustic disturbances derived from conservation laws and the equation of state. See `chapters/ch02-wave-propagation-theory.md`.
- **Nonlinear wave equation**: Higher-order acoustic wave equation retaining finite-amplitude terms. See `chapters/ch02-wave-propagation-theory.md`.
- **Linear wave equation**: Small-perturbation approximation underlying most operational underwater acoustics. See `chapters/ch02-wave-propagation-theory.md`.
- **Helmholtz equation**: Frequency-domain wave equation obtained from the wave equation by Fourier transformation in time. See `chapters/ch02-wave-propagation-theory.md`.
- **Velocity potential**: Scalar potential whose gradient gives particle velocity in suitable formulations. See `chapters/ch02-wave-propagation-theory.md`.
- **Displacement potential**: Potential formulation tied to displacement rather than velocity. See `chapters/ch02-wave-propagation-theory.md`.
- **Particle velocity**: Vector acoustic field quantity associated with fluid motion. See `chapters/ch02-wave-propagation-theory.md`.
- **Acoustic impedance**: Ratio linking pressure and particle velocity for plane-wave solutions. See `chapters/ch01-fundamentals.md`, `chapters/ch02-wave-propagation-theory.md`.
- **Green's function**: Field generated by an impulse or point source, used as the building block for many propagation formulations. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch09-ambient-noise.md`.
- **Green's theorem**: Integral identity used to express acoustic boundary-value problems in bounded or semi-infinite media. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch07-fd-fe-methods.md`.
- **Radiation condition**: Condition selecting outgoing rather than incoming waves in unbounded domains. See `chapters/ch02-wave-propagation-theory.md`.
- **Reciprocity**: Source-receiver interchange symmetry underlying time reversal, matched fields, and passive reconstruction arguments. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch10-signals-in-noise.md`.

## Core propagation observables

- **Transmission loss (TL)**: Reduction of acoustic intensity or pressure with propagation, usually reported in dB. See `chapters/ch01-fundamentals.md`, `chapters/ch02-wave-propagation-theory.md`.
- **Geometrical spreading**: Amplitude decay due to wavefront expansion, such as cylindrical or spherical spreading. See `chapters/ch02-wave-propagation-theory.md`, `chapters/ch03-ray-methods.md`.
- **Phase fidelity**: How well a method preserves phase information needed for coherent processing. See `workflows/model-selection.md`.
- **Replica field**: Predicted field used in coherent processing tasks such as matched-field processing. See `chapters/ch05-normal-modes.md`, `chapters/ch10-signals-in-noise.md`.

## Modeling families

- **Ray methods**: High-frequency asymptotic methods based on geometric acoustics. See `chapters/ch03-ray-methods.md`.
- **Eigenray**: Ray path satisfying source-receiver boundary conditions. See `chapters/ch03-ray-methods.md`.
- **Gaussian beam**: Ray-centered wave correction used to improve caustic and diffraction behavior. See `chapters/ch03-ray-methods.md`.
- **Wavenumber integration (WI)**: Spectral-integral approach natural for layered or horizontally stratified environments. See `chapters/ch04-wavenumber-integration.md`.
- **Fast Field Program (FFP)**: Practical implementation family for WI-style spectral calculations. See `chapters/ch04-wavenumber-integration.md`, `solvers/solver-scooter.md`.
- **Normal modes**: Waveguide representation as a sum over propagating modes. See `chapters/ch05-normal-modes.md`.
- **Adiabatic modes**: Range-dependent modal treatment assuming weak enough variation to neglect strong coupling. See `chapters/ch05-normal-modes.md`.
- **Mode coupling**: Transfer of energy between modes in range-dependent waveguides. See `chapters/ch05-normal-modes.md`.
- **Parabolic equation (PE)**: Forward-marching approximation to Helmholtz propagation used heavily in range-dependent acoustics. See `chapters/ch06-parabolic-equations.md`.
- **Wide-angle PE**: PE form designed to reduce angular phase error relative to small-angle approximations. See `chapters/ch06-parabolic-equations.md`.
- **Starter field**: Initial field used to launch a PE march. See `chapters/ch06-parabolic-equations.md`.
- **Split-step Fourier**: Standard PE numerical strategy alternating between spatial and spectral updates. See `chapters/ch06-parabolic-equations.md`.
- **Finite difference (FD)**: Direct grid-based discretization of differential equations. See `chapters/ch07-fd-fe-methods.md`.
- **Finite element (FE)**: Weak-form discretization using element basis functions. See `chapters/ch07-fd-fe-methods.md`.
- **Boundary element (BE / BEM)**: Surface-integral discretization based on Green's theorem. See `chapters/ch07-fd-fe-methods.md`.
- **Perfectly matched layer (PML)**: Absorbing boundary treatment for truncating open domains. See `chapters/ch07-fd-fe-methods.md`.
- **Virtual source concept**: Boundary-element interpretation used in scattering and far-field analysis. See `chapters/ch07-fd-fe-methods.md`.
- **Broadband modeling**: Time-domain or Fourier-synthesis treatment of signals with nontrivial bandwidth. See `chapters/ch08-broadband-modeling.md`.

## WI-specific spectral terms

- **Horizontal wavenumber**: Spectral variable over which WI decomposes the field. See `chapters/ch04-wavenumber-integration.md`.
- **Depth-separated wave equation**: ODE in depth obtained after transforming the horizontally stratified Helmholtz problem. See `chapters/ch04-wavenumber-integration.md`.
- **Hankel transform**: Cylindrical integral transform used to derive and invert WI field representations. See `chapters/ch04-wavenumber-integration.md`.
- **Direct Global Matrix (DGM)**: Numerically stable WI implementation based on global assembly of layer/interface equations. See `chapters/ch04-wavenumber-integration.md`.
- **Propagator matrix**: Recursive transfer-matrix style WI implementation across layers. See `chapters/ch04-wavenumber-integration.md`.
- **Invariant embedding**: Interpretation of recursive layered propagation where arrivals can be traced to interface additions. See `chapters/ch04-wavenumber-integration.md`.
- **Aliasing**: Numerical artifact from insufficient spectral sampling in wavenumber discretization. See `chapters/ch04-wavenumber-integration.md`.
- **Contour integration**: Complex-plane evaluation strategy for spectral integrals. See `chapters/ch04-wavenumber-integration.md`.
- **Evanescent regime**: Spectral regime where fields decay exponentially rather than propagate oscillatory energy. See `chapters/ch04-wavenumber-integration.md`.

## Modal and PE follow-on concepts

- **Group velocity**: Modal propagation speed of energy or pulse envelopes. See `chapters/ch05-normal-modes.md`.
- **Dispersion**: Frequency-dependent travel behavior, often central in modal broadband interpretation. See `chapters/ch05-normal-modes.md`, `chapters/ch08-broadband-modeling.md`.
- **Energy conservation in PE**: Numerical or approximation issue where PE marching can create artificial gain or loss. See `chapters/ch06-parabolic-equations.md`.

## Noise and signal processing

- **Ambient noise**: Background ocean noise field generated by distributed environmental and anthropogenic sources. See `chapters/ch09-ambient-noise.md`.
- **Cross-spectral density**: Frequency-domain correlation measure central to ambient-noise field structure. See `chapters/ch09-ambient-noise.md`.
- **Noise correlation**: Receiver-to-receiver correlation within the ambient-noise field. See `chapters/ch09-ambient-noise.md`.
- **Green's-function recovery**: Extraction of propagation information from noise correlations. See `chapters/ch09-ambient-noise.md`.
- **Beamforming**: Array processing that combines sensor data to emphasize specific directions or suppress interference. See `chapters/ch10-signals-in-noise.md`.
- **Matched-field processing (MFP)**: Localization or detection using predicted replica fields. See `chapters/ch10-signals-in-noise.md`.
- **Array gain**: Performance improvement achieved by coherent or incoherent array combination. See `chapters/ch10-signals-in-noise.md`.
- **Vector sensor**: Sensor measuring pressure and directional particle-motion components. See `chapters/ch01-fundamentals.md`, `chapters/ch10-signals-in-noise.md`.
- **Time reversal**: Propagation or signal-processing technique exploiting reciprocity and multipath structure. See `chapters/ch10-signals-in-noise.md`.
- **Sonar equation**: Bookkeeping framework linking source level, propagation loss, noise, and detection margin. See `chapters/ch10-signals-in-noise.md`.

## Practical evaluation terms

- **Model suitability**: Match between a method's assumptions and the actual environment, geometry, and bandwidth. See `workflows/model-selection.md`.
- **Numerical artifact**: Error introduced by discretization, truncation, aliasing, interpolation, or approximation. See `workflows/model-selection.md`.
- **Phase-coherent processing**: Analysis whose success depends on preserving phase, not only magnitude. See `workflows/model-selection.md`, `chapters/ch10-signals-in-noise.md`.
