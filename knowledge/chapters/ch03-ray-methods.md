---
title: COA Chapter 3 - Ray Methods
type: chapter-note
chapter: 3
book_pages: 155-232
pdf_pages: 173-250
zotero_storage_key: B4W6S79R
status: expanded
---

# COA Chapter 3 - Ray Methods

## Summary
Ray methods treat propagation through geometric-acoustics ideas: rays, travel times, amplitudes, caustics, Gaussian beams, eigenrays, and asymptotic structure. They are central for intuition and fast high-frequency analysis.

## Core problem
How to approximate underwater sound propagation by tracking ray paths and associated amplitudes rather than solving the full wavefield directly.

## Method-selection snapshot
- Best when frequency is high enough that wavelength is small relative to environmental variation scales.
- Best for travel-time structure, multipath intuition, eigenray analysis, and fast scenario screening.
- Weak when diffraction, interference, low-frequency coherence, or caustic-dominated fields are central.

## Major subsections

### Geometric-acoustics setup and physical intuition
Ray methods emerge as the high-frequency asymptotic limit of the wave equation. The field is represented as a rapidly varying phase with a slowly varying amplitude, making the ray path the geometry of phase propagation.

**Key equations and topics**
- High-frequency ansatz: `p(r) ~ A(r) exp(i omega T(r))`
- Rays as curves normal to constant-phase surfaces
- Travel time `T(r)` as the primary phase quantity
- Slowness vector and local propagation direction
- Ray bending from sound-speed gradients

**Physical interpretation**
- Rays tell you where energy tends to go in a geometric sense.
- They are the fastest way to understand turning structure, ducting, deep-water convergence, and shallow-water multipath.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch02-wave-propagation-theory.md`

### Eikonal and transport equations
This is the mathematical core of the chapter. The eikonal equation determines phase or travel time, while the transport equation determines amplitude variation along a ray tube.

**Key equations and topics**
- Eikonal relation: `|grad T|^2 = 1 / c^2`
- Transport equation for amplitude conservation
- Jacobian or ray-tube area controls spreading
- Generic amplitude scaling: `A ∝ J^(-1/2)`
- Intensity from geometric spreading
- Initial conditions for launching ray fans

**Why it matters**
- Travel time is usually the most reliable ray output.
- Amplitude is asymptotic and becomes unreliable earlier than travel-time structure.

**Best-fit scenarios**
- Arrival prediction
- Multipath interpretation
- Travel-time sensitive analysis

**Cross-links**
- `chapters/ch05-normal-modes.md`
- `chapters/ch08-broadband-modeling.md`

### Stratified-media simplifications and classical ray laws
This subsection collects the practical laws that make ray methods intuitive in ocean acoustics.

**Key equations and topics**
- Conserved horizontal slowness in stratified media
- Turning points where vertical slowness vanishes
- Snell's law and Fermat's principle
- Alternate Hamiltonian forms of ray equations
- Reciprocity for source-receiver interchange

**Why it matters**
- This is the core intuition for deep sound channels, surface ducts, and bottom-limited paths.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch05-normal-modes.md`

### Ray anomalies, caustics, and shadow zones
Classical rays fail exactly where many interesting wave effects appear, so this section should always be treated as a warning label.

**Key equations and topics**
- Caustics occur when the Jacobian tends to zero
- Classical ray amplitude becomes singular at caustics
- Shadow zones contain no real-ray contribution in the simplest theory
- Validity requires wavelength much smaller than environmental variation scales

**Main limitations**
- Weak near turning-point singularities and caustics
- Poor for low-frequency coherent waveguide problems
- Does not naturally handle diffraction or strong interference

**Cross-links**
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`

### Gaussian beams as a regularized ray method
Gaussian beams are the chapter's main cure for classical ray singularities. They keep ray intuition while producing finite, smoother field estimates near caustics.

**Key equations and topics**
- Complex beam parameter and beam curvature
- Paraxial beam evolution about a central ray
- Beam superposition instead of single-ray summation
- Regularized amplitude through caustics

**Best-fit scenarios**
- High-frequency propagation with caustics or multipath
- Operational ray-based modeling where raw rays are too singular

**Limitations**
- Still asymptotic
- Accuracy depends on paraxial assumptions about the central ray

**Cross-links**
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch08-broadband-modeling.md`

### Boundaries, attenuation, and weak interfaces
This subsection groups the practical corrections needed for real ocean environments.

**Key equations and topics**
- Reflection and refraction at interfaces
- Surface and bottom interaction effects on amplitude and phase
- Weak interfaces and sound-speed discontinuities
- Attenuation through complex phase accumulation or complex sound speed

**Best-fit scenarios**
- Shallow-water, bottom-interacting, high-frequency analysis
- Fast boundary-loss sensitivity checks

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`

### Numerical ray tracing and eigenray search
This is the implementation-facing part of the chapter.

**Key equations and topics**
- Direct ODE integration of ray equations
- Cell methods for profile representation
- False caustics from interpolation or discretization
- Eigenray finding as a boundary-value search
- Travel-time branches and arrival labeling
- 3D ray tracing and Hamiltonian formulation

**Best-fit scenarios**
- Arrival prediction
- Source-receiver geometry inversion
- Fast first-look sonar interpretation

**Limitations**
- Sensitive to launch-angle sampling and environmental interpolation
- Arrival geometry may be right while coherent amplitude remains poor

**Cross-links**
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`

## Key sections from the TOC
- 3.3 Mathematical Derivation
- 3.4 Ray Anomalies
- 3.5 Gaussian Beams
- 3.7 Numerical Solution
- 3.8 Extensions and Related Techniques

## Research takeaways
- Use rays for geometric understanding first, then verify with wave methods when interference matters.
- Gaussian beams reduce classical ray pathologies but do not remove the asymptotic nature of the method.
- In shallow-water coherent processing, compare rays against modes or PE before trusting detailed field structure.

## Comparison to neighboring chapters
- Compared with `chapters/ch05-normal-modes.md`, rays give clearer path intuition but weaker low-frequency full-wave fidelity.
- Compared with `chapters/ch06-parabolic-equations.md`, rays are lighter and more intuitive but weaker for diffraction and coherent interference.

## Good follow-on notes
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch08-broadband-modeling.md`
- `workflows/model-selection.md`
