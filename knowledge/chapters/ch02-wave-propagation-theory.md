---
title: COA Chapter 2 - Wave Propagation Theory
type: chapter-note
chapter: 2
book_pages: 65-154
pdf_pages: 84-172
source_pdf: sources/jensen-2011-computational-ocean-acoustics.pdf
status: deepened
---

# COA Chapter 2 - Wave Propagation Theory

## Summary
This chapter derives the wave framework behind the rest of COA. It covers the nonlinear and linear wave equations, the pressure, velocity and potential formulations, and the Helmholtz equation. It then builds Green's functions, Green's theorem and the radiation condition, the halfspace image solution and the TL normalization. The integral-transform (depth-separated) treatment of layered media follows, with plane-wave reflection and transmission and the ray displacement behind the lateral wave. The ideal and Pekeris waveguides (images, modes, dispersion, branch cuts, leaky modes, reciprocity, attenuation), waveguide invariants, deep-ocean $n^2$-linear and WKB solutions, and the principle of reciprocity close the chapter. COA states the point of the chapter itself: every numerical method of Chaps. 3–7 solves the same wave equation (2.26) with boundary and radiation conditions, after different analytical manipulations (§2.1.2.6).

## Core problem
How to formulate underwater sound mathematically so that later methods can be understood as exact solutions, approximations, or reorganizations of the same underlying wave problem.

## Method-selection snapshot
- Best when the question is about governing equations, field variables, Green's functions, reciprocity, TL normalization or canonical waveguide theory (ideal, Pekeris, $n^2$-linear).
- Best when one must compare propagation methods by what boundary-value problem they solve: stationary phase of the wavenumber integral gives rays (Ch. 3), direct quadrature gives wavenumber integration (Ch. 4), and residues give normal modes (Ch. 5) (§2.4.4.2).
- Weak when the real need is a solver-specific numerical recipe rather than the theory.

## Major subsections

### Nonlinear and linear wave equations
From conservation of mass, Euler's equation and the adiabatic equation of state, the chapter derives a nonlinear wave equation and then, by keeping first-order terms only, the linear acoustic wave equation (§2.1–2.1.2.1).

**Key equations** (COA §2.1–2.1.2.1)
- Mass, momentum and state, eqs. (2.1)–(2.3), §2.1, PDF p. 84: $\frac{\partial\rho}{\partial t}=-\nabla\cdot\rho\mathbf v$, $\frac{\partial\mathbf v}{\partial t}+(\mathbf v\cdot\nabla)\mathbf v=-\frac1\rho\nabla p(\rho)$, and $p=p_0+\rho'\left(\frac{\partial p}{\partial\rho}\right)_S+\frac12(\rho')^2\left(\frac{\partial^2p}{\partial\rho^2}\right)_S+\cdots$, where $\rho$ is density, $\mathbf v$ particle velocity, $p$ pressure, $S$ constant entropy, and primes denote small perturbations about the ambient state (subscript 0).
- Sound speed, eq. (2.4), §2.1, PDF p. 84: $c^2\equiv\left(\frac{\partial p}{\partial\rho}\right)_S$.
- Nonlinear wave equation, eq. (2.9), §2.1.1, PDF p. 85: $\frac{\partial^2\chi}{\partial t^2}=\nabla^2c^2(\chi+\beta\chi^2)+O(\theta\chi^2,\chi^3)+\cdots$, with density ratio $\chi=\rho'/\rho_0$, nonlinear parameter $\beta=1+(\rho/c)[\partial c(\rho_0)/\partial\rho]$, and $\theta$ the propagation angle from the main direction.
- Linearized equations, eqs. (2.10)–(2.12), §2.1.2, PDF p. 86: $\frac{\partial\rho'}{\partial t}=-\nabla\cdot(\rho_0\mathbf v)$, $\frac{\partial\mathbf v}{\partial t}=-\frac{1}{\rho_0}\nabla p'(\rho)$, $\frac{\partial p'}{\partial t}=c^2\left(\frac{\partial\rho'}{\partial t}+\mathbf v\cdot\nabla\rho_0\right)$; for constant $\rho_0$, $p'=\rho'c^2$ (2.13).
- Pressure wave equation, eqs. (2.14)–(2.15), §2.1.2.1, PDF p. 86: $\rho\nabla\cdot\left(\frac1\rho\nabla p\right)-\frac{1}{c^2}\frac{\partial^2p}{\partial t^2}=0$, which for constant density becomes $\nabla^2p-\frac{1}{c^2}\frac{\partial^2p}{\partial t^2}=0$.

**Validity conditions**
- Linearization requires small pressure and density perturbations and a particle velocity much smaller than the sound speed. COA §2.1, PDF p. 84.
- The convection term in (2.9) is evaluated only in the limit of small propagation angles about the main direction, the same paraxial approximation as the PE of Chap. 6. COA §2.1.1, PDF p. 85.
- Material properties $\rho_0$ and $c^2$ are taken time independent, because oceanographic time scales are much longer than acoustic ones. COA §2.1.2.1, PDF p. 86.
- COA gives no number for when nonlinear terms matter; Chap. 8 treats the nonlinear equation in the time domain. COA §2.1.1, PDF p. 85.

**Topics**
- Hydrodynamic equations and the adiabatic equation of state
- Nonlinear parameter and finite-amplitude effects
- Linear wave equation for pressure, with and without density gradients

**Physical interpretation**
- The linearization is the approximation that makes most operational underwater acoustics tractable.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch08-broadband-modeling.md`

### Field variables, source representation and solution approaches
The same linear physics is written for particle velocity, velocity potential and displacement potential, with a volume-injection source term (§2.1.2.2–2.1.2.6). COA then sorts the numerical methods by how they manipulate this equation.

**Key equations** (COA §2.1.2.2–2.1.2.5)
- Particle-velocity wave equation, eq. (2.16), §2.1.2.2, PDF p. 86: $\frac1\rho\nabla\left(\rho c^2\nabla\cdot\mathbf v\right)-\frac{\partial^2\mathbf v}{\partial t^2}=0$, a vector equation coupling the three velocity components.
- Velocity potential, eqs. (2.17) and (2.19), §2.1.2.3, PDF p. 87: $\mathbf v=\nabla\phi$ with $\nabla^2\phi-\frac{1}{c^2}\frac{\partial^2\phi}{\partial t^2}=0$.
- Plane-wave impedance, eq. (2.20), §2.1.2.3, PDF p. 87: $\frac{p}{v_x}=\rho_0c$.
- Displacement potential, eqs. (2.21)–(2.22), §2.1.2.4, PDF pp. 87-88: $\mathbf u=\nabla\psi$ with $\nabla^2\psi-\frac{1}{c^2}\frac{\partial^2\psi}{\partial t^2}=0$, where $\mathbf u$ is displacement.
- Pressure from the displacement potential, eqs. (2.23)–(2.25), §2.1.2.4, PDF p. 88: $p=-K\nabla^2\psi$ with bulk modulus $K=\rho c^2$, so $p=-\rho\frac{\partial^2\psi}{\partial t^2}$.
- Inhomogeneous wave equation, eq. (2.26), §2.1.2.5, PDF p. 88: $\nabla^2\psi-c^{-2}\frac{\partial^2\psi}{\partial t^2}=f(\mathbf r,t)$, where $f$ is the volume injection.

**Validity conditions**
- The velocity- and displacement-potential equations (2.19), (2.22) hold for varying sound speed but constant density only. Discrete density jumps are handled by interface conditions (continuity of pressure and displacement), and the potentials then become discontinuous. COA §2.1.2.3–2.1.2.4, PDF pp. 87-88.
- The velocity equation (2.16) involves derivatives of both density and sound speed, so it is rarely used except for uni-axial problems. COA §2.1.2.2, PDF p. 87.
- Methods that treat internal discontinuities as smooth transitions should be based on (2.14). FDM/FEM must resolve the field to a small fraction of a wavelength over hundreds to thousands of wavelengths, which limits their use in ocean acoustics. COA §2.1.2.6, PDF p. 89.

**Topics**
- Pressure, particle-velocity, velocity-potential and displacement-potential formulations
- Bulk modulus and Hooke's law for an ideal fluid
- Volume-injection sources
- FDM and FEM as direct discretizations; Chaps. 3–6 as hybrid analytical–numerical methods

**Why it matters**
- Different computational methods are built on different field variables even when they describe the same physics.

**Cross-links**
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch07-fd-fe-methods.md`

### Helmholtz equation and the narrowband viewpoint
The time–frequency Fourier transform reduces the wave equation to the Helmholtz equation, the basis of WI, NM and PE (§2.2).

**Key equations** (COA §2.2)
- Fourier pair, eqs. (2.27)–(2.28), §2.2, PDF p. 90: $f(t)=\frac{1}{2\pi}\int_{-\infty}^{\infty}f(\omega)e^{-i\omega t}d\omega$ and $f(\omega)=\int_{-\infty}^{\infty}f(t)e^{i\omega t}dt$.
- Helmholtz equation, eqs. (2.29)–(2.30), §2.2, PDF p. 90: $\left[\nabla^2+k^2(\mathbf r)\right]\psi(\mathbf r,\omega)=f(\mathbf r,\omega)$, with medium wavenumber $k(\mathbf r)=\omega/c(\mathbf r)$.
- Source-free Helmholtz equation, eq. (2.31), §2.2, PDF p. 91: $\left[\nabla^2+k^2(\mathbf r)\right]\psi(\mathbf r,\omega)=0$.

**Validity conditions**
- The reduction needs coefficients independent of time. It trades a lower-dimensional PDE for an inverse Fourier transform, worthwhile because many ocean-acoustic applications are narrowband. COA §2.2, PDF p. 90.
- Ocean experiments can have hundreds or thousands of boundary interactions, unlike seismics, which is why time-domain FDM/FEM never became widespread in ocean acoustics. COA §2.2, PDF pp. 90-91.
- No universal solution technique exists; the choice depends on dimensionality, the wavenumber variation $k(\mathbf r)$, boundary conditions, source–receiver geometry, and frequency and bandwidth. COA §2.2, PDF p. 91.

**Topics**
- Time dependence $e^{-i\omega t}$ convention
- Narrowband versus wideband processing (ocean acoustics versus seismics)
- Elliptic boundary-value character of the frequency-domain problem

**Physical interpretation**
- WI, normal modes and PE all inherit their legitimacy from this reduction.

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`

### Homogeneous media, coordinate systems and the free-field Green's function
Canonical solutions in homogeneous media (§2.3.1–2.3.2): plane, cylindrical and spherical waves and the point-source Green's function obtained from a small vibrating sphere.

**Key equations** (COA §2.3.1–2.3.2)
- Line-source (cylindrical) solutions, eq. (2.38), §2.3.1, PDF p. 93: $\psi(r)=CH_0^{(1)}(kr)=C[J_0(kr)+iY_0(kr)]$ or $DH_0^{(2)}(kr)=D[J_0(kr)-iY_0(kr)]$, diverging and converging cylindrical waves.
- Hankel asymptote, eq. (2.39), §2.3.1, PDF p. 93: $H_0^{(1)}(kr)\simeq\sqrt{\frac{2}{\pi kr}}e^{i(kr-\pi/4)}$ for $kr\to\infty$, so line-source amplitude decays as $r^{-1/2}$.
- Point-source (spherical) solutions, eq. (2.42), §2.3.1, PDF p. 94: $\psi(r)=(A/r)e^{ikr}$ or $(B/r)e^{-ikr}$, decaying as $r^{-1}$.
- Point-source field, eq. (2.50), §2.3.2, PDF p. 95: $\psi(r)=-S_\omega\frac{e^{ikr}}{4\pi r}$, with source strength $S_\omega=4\pi a^2U(\omega)$ (volume injection, m³) for a sphere of radius $a$ and surface displacement $U$.
- Free-field Green's function, eqs. (2.52)–(2.53), §2.3.2, PDF p. 95: $g_\omega(\mathbf r,\mathbf r_0)=\frac{e^{ikR}}{4\pi R}$, $R=|\mathbf r-\mathbf r_0|$, satisfying $\left[\nabla^2+k^2\right]g_\omega=-\delta(\mathbf r-\mathbf r_0)$.
- Time-domain Green's function and symmetry, eqs. (2.55)–(2.56), §2.3.2, PDF p. 96: $g_t(\mathbf r,\mathbf r_0)=\frac{\delta(R/c-t)}{4\pi R}$ and $g_\omega(\mathbf r,\mathbf r_0)=g_\omega(\mathbf r_0,\mathbf r)$.

**Validity conditions**
- The simple point source is a sphere small compared with the wavelength, $ka\ll1$. COA §2.3.2, PDF p. 95.
- Geometrical spreading: cylindrical spreading loss is proportional to $r^{-1/2}$, spherical to $r^{-1}$; the line-source field is logarithmically singular at the source. COA §2.3.1, PDF pp. 93-94.
- The radiation condition of no incoming waves at infinity selects the outgoing solution ($B=0$). COA §2.3.2, PDF p. 95.

**Topics**
- Cartesian, cylindrical and spherical Laplacians; plane, cylindrical and spherical waves
- Geometrical spreading loss
- Source strength (volume injection, or volume rate for velocity potentials)
- Free-field and time-domain Green's functions; Green's-function symmetry

**Why it matters**
- These canonical solutions are the baseline against which waveguide and boundary effects are measured, and the Green's function is reused throughout the book.

**Cross-links**
- `chapters/ch03-ray-methods.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch09-ambient-noise.md`

### Bounded media, Green's theorem and the radiation condition
With boundaries the problem becomes a boundary-value problem (§2.3.3). A general Green's function and Green's theorem give an integral representation, and applying it to a large sphere gives the radiation condition.

**Key equations** (COA §2.3.3)
- Inhomogeneous Helmholtz equation in a volume, eq. (2.57), §2.3.3, PDF p. 96: $\left[\nabla^2+k^2\right]\psi(\mathbf r)=f(\mathbf r)$ in volume $V$ bounded by surface $S$.
- General Green's function, eqs. (2.58)–(2.60), §2.3.3, PDF p. 97: $G_\omega(\mathbf r,\mathbf r_0)=g_\omega(\mathbf r,\mathbf r_0)+H_\omega(\mathbf r)$ with $\left[\nabla^2+k^2\right]H_\omega=0$, so $\left[\nabla^2+k^2\right]G_\omega=-\delta(\mathbf r-\mathbf r_0)$.
- Green's theorem, eq. (2.63), §2.3.3, PDF p. 97: $\psi(\mathbf r)=\int_S\left[G_\omega(\mathbf r,\mathbf r_0)\frac{\partial\psi(\mathbf r_0)}{\partial n_0}-\psi(\mathbf r_0)\frac{\partial G_\omega(\mathbf r,\mathbf r_0)}{\partial n_0}\right]dS_0-\int_Vf(\mathbf r_0)G_\omega(\mathbf r,\mathbf r_0)dV_0$, with $n_0$ the outward normal.
- Radiation condition, eq. (2.67), §2.3.3, PDF p. 98: $R\left(\frac{\partial}{\partial R}-ik\right)\psi(\mathbf r_0)\to0$ as $R=|\mathbf r-\mathbf r_0|\to\infty$.

**Validity conditions**
- The derivation assumes a symmetric Green's function, $G_\omega(\mathbf r,\mathbf r_0)=G_\omega(\mathbf r_0,\mathbf r)$, which is not unconditional (Appendix 1). COA §2.3.3, PDF p. 97.
- The homogeneous part $H_\omega$ is free; choosing $G_\omega$ to vanish on, or share the boundary conditions of, part of $S$ removes that part of the surface integral. $S$ need not be the physical boundary. COA §2.3.3, PDF p. 98.
- In an infinite medium the integrand must decay faster than $R^{-2}$, which yields (2.67). COA §2.3.3, PDF p. 98.

**Topics**
- General Green's function and choice of homogeneous solution
- Green's theorem as an integral equation for boundary values
- Sommerfeld radiation condition

**Physical interpretation**
- Ocean acoustics is a boundary-conditioned wave problem; boundary-element methods (Sect. 7.5) are the numerical form of Green's theorem.

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`

### Point source in a fluid halfspace and transmission loss
Green's theorem solved for the simplest bounded medium, a pressure-release halfspace, gives the image (Lloyd-mirror) solution (§2.3.4). §2.3.5 then fixes the transmission-loss normalization used throughout COA.

**Key equations** (COA §2.3.4–2.3.5)
- Pressure from displacement potential, eq. (2.68), §2.3.4, PDF p. 99: $p(\mathbf r)=\rho\omega^2\psi(\mathbf r)$, so the pressure-release surface imposes $\psi(\mathbf r_0)\equiv0$ on $z=0$ (2.69).
- Halfspace Green's function, eqs. (2.73)–(2.75), §2.3.4, PDF p. 100: $G_\omega=\frac{e^{ikR}}{4\pi R}-\frac{e^{ikR'}}{4\pi R'}$, with $R$ the distance from the source at $z_s$ and $R'$ from its image at $-z_s$.
- Image solution, eq. (2.76), §2.3.4, PDF p. 100: $\psi(\mathbf r)=-S_\omega\left[\frac{e^{ikR}}{4\pi R}-\frac{e^{ikR'}}{4\pi R'}\right]$, the Lloyd-mirror field.
- Transmission loss, eq. (2.77), §2.3.5, PDF p. 100: $TL(\mathbf r,\mathbf r_s)=-10\log\frac{I(\mathbf r,\mathbf r_s)}{I_0(\mathbf r_s)}=-10\log\left[\frac{Z_0(\mathbf r_s)}{Z(\mathbf r,\mathbf r_s)}\left|\frac{p(\mathbf r,\mathbf r_s)}{p_0(\mathbf r_s)}\right|^2\right]$, where $p_0$ is the free-field pressure at 1 m from the same source and $Z_0$, $Z$ are the impedances at source and field point.
- Unit-pressure source strength, eq. (2.79), §2.3.5, PDF p. 101: $S_\omega=-\frac{4\pi}{\rho\omega^2}$ (m²/Pa), which yields 1 Pa at 1 m.
- TL-pressure equations, eqs. (2.82)–(2.83), §2.3.5, PDF p. 101: $\left[\nabla^2+k^2\right]P(\mathbf r,\mathbf r_s)=-4\pi\delta(\mathbf r-\mathbf r_s)$ for $P=p/p_0$ (2.80), and $\rho\nabla\cdot\left[\rho^{-1}\nabla P\right]+k^2P=-4\pi\delta(\mathbf r-\mathbf r_s)$ with density variation.

**Validity conditions**
- An analytical Green's-theorem solution needs a Green's function satisfying the field's boundary conditions, which is straightforward only for simple geometry with homogeneous boundary conditions; otherwise Green's theorem gives an integral equation for numerical (BEM) solution. COA §2.3.4, PDF p. 100.
- TL is referenced to the free-field pressure at 1 m in an infinite medium with the source-point impedance, not to the actual near-source pressure in a bounded medium; COA warns this normalization must be kept in mind when developing or comparing algorithms, and takes source and field impedances equal. COA §2.3.5, PDF p. 101.
- A high-frequency source needs much less volume injection than a low-frequency one for the same pressure, since $|S_\omega|\propto\omega^{-2}$. COA §2.3.5, PDF p. 101.

**Topics**
- Image (mirror) method from Green's theorem; Lloyd-mirror interference
- TL definition, impedance ratio and source normalization
- TL-pressure form of the Helmholtz equation for constant and variable density

**Why it matters**
- TL is not a purely empirical output; it is tied to a specific source normalization, the same one used in (3.67), (5.15)–(5.17) and the PE starters.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch03-ray-methods.md`
- `chapters/ch06-parabolic-equations.md`

### Integral transforms and the depth-separated wave equation
For horizontally stratified (range-independent) media, Fourier or Hankel transforms reduce the Helmholtz equation to an ODE in depth (§2.4–2.4.2). The free-field depth-dependent Green's function separates the radiating and evanescent spectra.

**Key equations** (COA §2.4.1–2.4.2)
- Stratified Helmholtz problem, eqs. (2.84)–(2.85), §2.4.1, PDF p. 103: $\left[\nabla^2+k^2(z)\right]\psi(\mathbf r)=f(\mathbf r)$ with boundary conditions $B[\psi(\mathbf r)]_{z=z_n}=0$ at interfaces $z_n$.
- Plane (line-source) depth-separated equation, eq. (2.89), §2.4.1.1, PDF p. 104: $\left[\frac{d^2}{dz^2}+(k^2-k_x^2)\right]\psi(k_x,z)=S_\omega\frac{\delta(z-z_s)}{2\pi}$, after the Fourier pair (2.87)–(2.88).
- Hankel transform pair, eqs. (2.94)–(2.95), §2.4.1.2, PDF p. 105: $f(r,z)=\int_0^\infty f(k_r,z)J_0(k_rr)k_r\,dk_r$ and $f(k_r,z)=\int_0^\infty f(r,z)J_0(k_rr)r\,dr$, giving the identical depth-separated equation (2.96).
- Vertical wavenumber, eqs. (2.99)–(2.100), §2.4.2, PDF p. 106: $k_z=\sqrt{k^2-k_r^2}$ for $k_r\le k$ and $k_z=i\sqrt{k_r^2-k^2}$ for $k_r>k$.
- Free-field depth-dependent Green's function, eq. (2.105), §2.4.2, PDF p. 107: $g_\omega(k_r,z,z_s)=-\frac{e^{ik_z|z-z_s|}}{4\pi ik_z}$.
- Sommerfeld–Weyl integral, eq. (2.106), §2.4.2, PDF p. 107: $g_\omega(r,z,z_s)=\frac{i}{4\pi}\int_0^\infty\frac{e^{ik_z|z-z_s|}}{k_z}J_0(k_rr)k_r\,dk_r$, a superposition of conical waves.
- Halfspace kernel, eq. (2.113), §2.4.2, PDF p. 110: $\psi(k_r,z)=S_\omega\left[\frac{e^{ik_z|z-z_s|}}{4\pi ik_z}-\frac{e^{ik_z(z+z_s)}}{4\pi ik_z}\right]$, with lobe maxima at $\sin\theta_{max}=\frac{(2m-1)\pi}{2kz_s}$ and minima at $\sin\theta_{min}=\frac{(m-1)\pi}{kz_s}$ (2.116)–(2.117), PDF p. 112, and free-surface reflection coefficient $R=-1$ (2.118).

**Validity conditions**
- Separation of variables needs both the Helmholtz coefficients and the boundary conditions to be independent of the horizontal coordinates; the axis normal to the interfaces fixes the coordinate system. COA §2.4.1, PDF p. 103.
- The kernel has a square-root singularity at $k_r=k$; it is computed on a contour offset into the complex plane by (4.115). COA §2.4.2, PDF p. 108.
- The evanescent spectrum ($k_r>k$) is a mathematical abstraction in an infinite medium but cannot be dropped: it carries the wavefront curvature at small depth separations, becomes physical in stratified media, and is required for modes (the field must be evanescent in the subbottom). COA §2.4.2, PDF pp. 108-110.
- The square-root branch (2.100) is a convenience but is "absolutely essential" once attenuation is introduced. COA §2.4.2, PDF p. 107.

**Topics**
- Fourier (plane) and Hankel (axisymmetric) transforms; depth-dependent Green's function
- Radiating versus evanescent spectrum
- Plane-wave and conical-wave decompositions
- Halfspace Lloyd-mirror lobes in the wavenumber domain

**Best-fit scenarios**
- Range-independent environments where the vertical structure carries the physics

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`

### Reflection, transmission and the point-source field at a fluid–fluid interface
Two fluid halfspaces give the plane-wave reflection and transmission coefficients, the hard- and soft-bottom spectral regimes, and, by stationary phase, the ray displacement and the head (lateral) wave (§2.4.3).

**Key equations** (COA §2.4.3)
- Reflection and transmission coefficients, eqs. (2.127)–(2.128), §2.4.3, PDF p. 114: $R=\frac{\rho_2k_{z,1}-\rho_1k_{z,2}}{\rho_2k_{z,1}+\rho_1k_{z,2}}$ and $T=\frac{2\rho_1k_{z,1}}{\rho_2k_{z,1}+\rho_1k_{z,2}}$ for the displacement potential, with $\rho_i$, $k_{z,i}$ the density and vertical wavenumber in water (1) and bottom (2).
- Magnitude and phase, eq. (2.129), §2.4.3.1, PDF p. 115: $R(\theta)=|R(\theta)|e^{-i\varphi(\theta)}$, $\theta=\arccos(k_r/k_1)$.
- Stationary-phase reflected field, eq. (2.132), §2.4.3.3, PDF p. 118: $\psi(r,z)=\frac{S_\omega e^{i\pi/4}}{4\pi\sqrt{2\pi r}}\int_{-\infty}^{\infty}\frac{\sqrt{k_r}}{ik_{z,1}}|R(k_r)|e^{-i[\varphi(k_r)+k_{z,1}(z+z_s)-k_rr]}dk_r$, for $k_rr\gg1$.
- Ray displacement, eqs. (2.134)–(2.135), §2.4.3.3, PDF p. 118: $r=\frac{\partial\varphi(k_r)}{\partial k_r}-(z+z_s)\cot\theta$; the reflected ray travels $\Delta=\partial\varphi/\partial k_r$ along the interface.

**Validity conditions**
- Hard bottom ($c_2>c_1$): $|R|<1$ for $k_r<k_2$, $|R|=1$ for $k_2<k_r<k_1$ (total reflection with an evanescent bottom field), and $|R|<1$ for $k_r>k_1$. For $c_1=1500$ m/s, $\rho_1=1000$ kg/m³, $c_2=1800$ m/s, $\rho_2=1800$ kg/m³ the critical angle is $\theta_c=\arccos(k_2/k_1)=33.5°$. The phase goes from 180° ($R=-1$) at grazing to 0 at $\theta_c$. COA §2.4.3.1, PDF pp. 115-116.
- Soft bottom ($c_2<c_1$): no critical angle, total reflection only at zero grazing; with $c_2=1300$ m/s (same densities) the intromission angle is $\theta_0=22.6°$. The halfspace coefficients are frequency independent. COA §2.4.3.1–2.4.3.2, PDF pp. 115, 117.
- The ray displacement is nonzero only below the critical angle, i.e. beyond the critical range $r_c=(z+z_s)\cot\theta_c$, where a head wave at $\theta_c$ always exists. It is inversely proportional to frequency, so high-frequency ray acoustics usually ignores it; at low and intermediate frequencies it must be included, and likewise at turning points. COA §2.4.3.3, PDF p. 119.
- Hard bottoms reflect like a free surface at small grazing angles, so treating a hard bottom as rigid is a misconception. COA §2.4.3.3, PDF p. 120.
- Pure plane waves cannot be generated, which limits the practical use of plane-wave coefficients; for classical ray methods they are the only way boundaries enter. COA §2.4.3.2, PDF p. 117.

**Topics**
- Continuity of vertical displacement and pressure
- Hard- and soft-bottom spectral regimes; critical and intromission angles
- Stationary-phase evaluation; ray displacement; head (lateral) wave
- Angular spectra for penetrable, pressure-release and rigid bottoms

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch03-ray-methods.md`
- `chapters/ch04-wavenumber-integration.md`

### Ideal fluid waveguide: images, modes and dispersion
The isovelocity waveguide with pressure-release surface and bottom, solved by images and by the integral transform with residues (§2.4.4). It introduces modal cutoff, phase and group velocity, modal interference and the image–mode duality.

**Key equations** (COA §2.4.4)
- Image (ray) expansion, eq. (2.138), §2.4.4.1, PDF p. 122: $\psi(r,z)=\frac{S_\omega}{4\pi}\sum_{m=0}^{\infty}\left[\frac{e^{ikR_{m1}}}{R_{m1}}-\frac{e^{ikR_{m2}}}{R_{m2}}-\frac{e^{ikR_{m3}}}{R_{m3}}+\frac{e^{ikR_{m4}}}{R_{m4}}\right]$, with $R_{mn}=\sqrt{r^2+z_{mn}^2}$ to the image sources listed below (2.138) and $D$ the duct depth.
- Depth-dependent solution, eq. (2.146), §2.4.4.2, PDF p. 125: $\psi(k_r,z)=-\frac{S_\omega}{4\pi}\frac{\sin k_zz\,\sin k_z(D-z_s)}{k_z\sin k_zD}$ for $z<z_s$ (with $z$, $z_s$ interchanged for $z>z_s$).
- Poles, eqs. (2.147)–(2.148), §2.4.4.2, PDF p. 125: $k_zD=m\pi$, i.e. $k_r=\sqrt{k^2-(m\pi/D)^2}$, $m=1,2,\ldots$
- Normal-mode expansion, eq. (2.150), §2.4.4.3, PDF p. 126: $\psi(r,z)=-\frac{iS_\omega}{2D}\sum_{m=1}^{\infty}\sin(k_{zm}z)\sin(k_{zm}z_s)H_0^{(1)}(k_{rm}r)$.
- Mode as a plane-wave resonance, eqs. (2.152)–(2.153), §2.4.4.3, PDF p. 128: $L_{AB}=2D\sin\theta_m=m\lambda$.
- Dispersion and cutoff, eqs. (2.154)–(2.155), §2.4.4.4, PDF p. 129: $\omega=c\sqrt{k_{rm}^2+(m\pi/D)^2}$ and $f_{0m}=\frac{mc}{2D}$.
- Phase and group velocity, eqs. (2.156) and (2.158), §2.4.4.4, PDF pp. 130-131: $v_m=\omega/k_{rm}$ and $u_m=d\omega/dk_{rm}$.
- Two-mode interference, eqs. (2.162)–(2.163), §2.4.4.5, PDF p. 132: $|\psi(r,z)|\simeq r^{-1/2}\sqrt{A_m^2+A_n^2+2A_mA_n\cos[r(k_{rm}-k_{rn})]}$, with interference length $L=\frac{2\pi}{k_{rm}-k_{rn}}$.

**Validity conditions**
- A pressure-release bottom is a reasonable model because a penetrable seafloor reflects like a free surface at low grazing angles, and long-range propagation is dominated by small angles since high-angle energy is rapidly lost to the bottom. COA §2.4.4, PDF p. 121.
- No mode propagates for $kD<\pi$, i.e. $\omega<c\pi/D$; mode $m$ propagates only above $f_{0m}=mc/2D$, which is $m\times7.5$ Hz for $c=1500$ m/s and $D=100$ m. Modes with $k_{rm}$ real ($m<kD/\pi$) propagate; those with imaginary $k_{rm}$ decay in range. COA §2.4.4.3–2.4.4.4, PDF pp. 127, 129.
- The phase velocity always exceeds $c$ and the group velocity is always below it, approaching $c$ at high frequency and zero at cutoff. COA §2.4.4.4, PDF pp. 130-132.
- Worked case: 20 Hz in a 100 m, 1500 m/s pressure-release guide gives $M<2fD/c=2.6667$ (2.164), so two modes, with $k_{r1}=0.076$ m⁻¹, $k_{r2}=0.055$ m⁻¹ and $L\simeq300$ m (source at 36 m). COA §2.4.4.5, PDF p. 133.
- Images are individually identifiable only for short, high-frequency pulses; the image solution is steady state. COA §2.4.4.1, PDF p. 123. Steady-state solutions must be applied with care to time-limited data, since group-velocity differences separate modes in time. COA §2.4.4.5, PDF p. 133.
- Few images describe the nearfield; few modes describe the farfield. Poisson summation shows the two sums are Fourier transforms of each other, (2.165)–(2.175). COA §2.4.4.6, PDF pp. 134-137.

**Topics**
- Image method and the waveguide impulse response (2.139)
- Contour deformation: stationary phase (rays), quadrature (WI), residues (modes)
- Propagating and evanescent modes versus radiating and evanescent spectrum
- Modal cutoff, phase and group velocity, $f$–$k$ diagram
- Modal interference length; image–mode Poisson duality

**Cross-links**
- `chapters/ch03-ray-methods.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`

### Pekeris waveguide
The canonical shallow-water model: a pressure-release surface over an isovelocity water layer on a fluid halfspace (§2.4.5). It adds bottom penetration, a stable formulation of the boundary-condition system, branch cuts, leaky modes, reciprocity across density jumps, and attenuation.

**Key equations** (COA §2.4.5)
- Water-column kernel, eq. (2.176), §2.4.5, PDF p. 138: $\psi_1(k_r,z)=S_\omega\frac{e^{ik_{z,1}|z-z_s|}}{4\pi ik_{z,1}}+A_1^+(k_r)e^{ik_{z,1}z}+A_1^-(k_r)e^{-ik_{z,1}z}$, with $k_{z,1}=(k_1^2-k_r^2)^{1/2}$, $k_1=\omega/c_1$; in the bottom $\psi_2=A_2^+e^{ik_{z,2}(z-D)}$ (2.177) with $k_{z,2}$ defined by (2.178).
- Stable form, eq. (2.183), §2.4.5, PDF p. 140: the upgoing term written as $A_1^+(k_r)e^{-ik_{z,1}(D-z)}$, referencing it to the seabed, which removes the growing exponentials from the system (2.184).
- Determinant and characteristic equation, eqs. (2.185)–(2.186), §2.4.5.1, PDF p. 140: $\det(k_r)=-2i[\rho_1k_{z,2}\sin(k_{z,1}D)+i\rho_2k_{z,1}\cos(k_{z,1}D)]$ and $\tan(k_{z,1}D)=-\frac{i\rho_2k_{z,1}}{\rho_1k_{z,2}}$.
- Approximate modal sum, eq. (2.189), §2.4.5.1, PDF p. 142: $\psi(r,z)\simeq-\frac{iS_\omega}{2D}\sum_{m=1}^{M}a_m(k_{rm})\sin(k_{zm}z)\sin(k_{zm}z_s)H_0^{(1)}(k_{rm}r)$, with frequency-dependent excitation $a_m$.
- Modal cutoff frequency, eqs. (2.190)–(2.191), §2.4.5.2, PDF p. 144: $f_{0m}=\frac{(m-0.5)c_1c_2}{2D\sqrt{c_2^2-c_1^2}}$, $m=1,2,\ldots$; at high frequency $k_{zm}D\to m\pi$ (2.192), the ideal-waveguide modes.
- Reciprocity, eqs. (2.193)–(2.194), §2.4.5.4, PDF p. 148: $\rho\nabla\cdot\left(\frac1\rho\nabla P\right)+k^2P=-4\pi\delta(\mathbf r-\mathbf r_s)$ implies $\rho(\mathbf r_s)P(\mathbf r,\mathbf r_s)=\rho(\mathbf r)P(\mathbf r_s,\mathbf r)$; for potentials $\rho_1S_\omega\psi'(\mathbf r_1)=\rho_2S'_\omega\psi(\mathbf r_2)$ (2.199), PDF p. 149.
- Attenuation, eqs. (2.203)–(2.204), §2.4.5.5, PDF p. 150: complex wavenumber $\tilde k=k(1+i\delta)$ with loss tangent $\delta$, and $\alpha=40\pi\delta\log e\simeq54.58\,\delta$ dB/λ.
- General waveguide image sum, eq. (2.205), §2.4.5.6, PDF p. 152: (2.138) with the image terms weighted by $(R_1R_2)^m$, $R_1$, $R_2$ and $R_1R_2$, the plane-wave reflection coefficients of the upper and lower boundaries ($R_1=-1$ for a pressure-release surface).

**Validity conditions**
- Lossless (trapped) modes have real $k_r$ only in $|k_2|<|k_r|<|k_1|$ (2.187): below $k_2$ the constituent plane waves exceed the critical angle and leak into the bottom. Complex roots are leaky (virtual) modes. COA §2.4.5.1, PDF pp. 140-141.
- With the EJP branch cut the field is the trapped-mode sum plus a branch-line integral; the branch-line contribution diminishes with range, so normal-mode codes that drop it are not valid at short ranges. With the Pekeris cut, leaky modes near the real axis approximate the branch-line contribution better than dropping it. COA §2.4.5.1–2.4.5.2, PDF pp. 142, 144.
- Including leaky modes matters most when few modes propagate, e.g. low-frequency shallow water. In COA's 20 Hz, 100 m example (bottom 1800 m/s, 1800 kg/m³; source 36 m) only one mode is trapped and a leaky mode at $k_r=0.068$ m⁻¹ supplies the interference. COA §2.4.5.3, PDF pp. 146-147.
- Cutoff in the Pekeris guide is gradual: modes keep significant amplitude well into the continuous spectrum. At cutoff phase and group velocity approach the bottom speed (1800 m/s), at high frequency the water speed (1500 m/s); the group-velocity minimum produces the Airy phase. COA §2.4.5.2, PDF p. 144.
- Numerical stability: coding (2.182) directly makes the system ill-conditioned in the evanescent regime once the column magnitudes differ by more than the arithmetic precision (15 digits in double precision); (2.184) is unconditionally stable, the basis of the direct global matrix method (§4.3.1). COA §2.4.5, PDF pp. 139-140.
- Sediment attenuation is typically 0.1–1.0 dB/λ, loss tangents of order 0.002–0.02; seawater attenuation is very low at low and intermediate frequencies. Higher modes, with longer evanescent tails, attenuate more. Perturbative modal attenuation keeps the lossless real wavenumbers, which is insignificant with small attenuation and many modes but can matter at long range with high attenuation and few modes. COA §2.4.5.5, PDF pp. 149-151.

**Topics**
- Pekeris waveguide: three-amplitude boundary system and its stable ordering
- Trapped modes, cutoff frequencies and the EJP versus Pekeris branch cuts
- Discrete, continuous and evanescent spectra; leaky modes
- Reciprocity across density discontinuities; elastodynamic reciprocity
- Viscoelastic attenuation, loss tangent and dB/λ
- Generalized waveguide image solution

**Physical interpretation**
- The Pekeris problem is simple enough to analyze and rich enough to explain much of shallow-water intuition.

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`

### Waveguide invariants
The robust frequency–range shift of interference striations is described by a scalar invariant $\beta$ (§2.4.6), generalized to water-depth and sound-speed changes.

**Key equations** (COA §2.4.6)
- Striation slope, eq. (2.206), §2.4.6.1, PDF p. 152: $\frac{\delta\omega}{\delta r}=-\frac{\partial I/\partial r}{\partial I/\partial\omega}$ for constant intensity $I$.
- Modal intensity, eq. (2.207), §2.4.6.1, PDF p. 152: $I(r,z;\omega)\propto\sum_nB_n^2+2\sum_{m\neq n}B_mB_n\cos[\Delta k_{mn}(\omega)r]$, with $\Delta k_{mn}\equiv k_{rm}-k_{rn}$ and $B=r^{-1/2}A$.
- Slowness expansion, eq. (2.212), §2.4.6.1, PDF p. 154: $S_g^n=S_g+\frac{dS_g}{dS_p}(S_p^n-S_p)$, with phase slowness $S_p=1/v$ and group slowness $S_g=1/u$ of a mode group.
- Invariant definition, eqs. (2.214)–(2.216), §2.4.6.1, PDF p. 154: $\frac1\beta\equiv-\frac{dS_g}{dS_p}=-\left(\frac vu\right)^2\frac{du}{dv}$, so $\frac{\delta\omega}{\delta r}=\beta\frac\omega r$ and $\frac{\omega}{\omega_0}=\left(\frac{r}{r_0}\right)^\beta$.
- Simple waveguide, eq. (2.218), §2.4.6.1, PDF p. 155: $\beta=\cos^2\theta$, from $v=c/\cos\theta$ (2.217) and $u=c\cos\theta$.
- Interference length versus frequency, eq. (2.221), §2.4.6.2, PDF p. 156: $L=L_0\left(\frac{\omega}{\omega_0}\right)^{1/\beta}$.
- Generalized invariants, eqs. (2.228)–(2.229), §2.4.6.2, PDF p. 157: $\frac{\delta\omega}{\delta\eta_q}=\gamma_{\omega:q}\frac{\omega}{\eta_q}$ for $q=r,D,c$, with $\gamma_{\omega:r,D,c}\approx1,-2,1$ for an ideal waveguide (water-depth case (2.225): $\delta\omega/\delta\eta_h=-2\beta\,\omega/\eta_h$).

**Validity conditions**
- Typical shallow-water bottom critical angles are below 20°, so for most bottom-reflecting shallow-water environments $\beta\approx1$. COA §2.4.6.1, PDF p. 155.
- $\beta$ is approximately constant only for a group of modes, about whose mean slownesses (2.212) is expanded, and assuming the group's depth dependence is roughly frequency independent. COA §2.4.6.1, PDF pp. 154-155.
- The generalized invariants were derived for ideal waveguides and for Pekeris waveguides at high mode numbers; for other environments they are computed numerically (§5.14). The water-depth factor 2 was confirmed experimentally by Weston et al. on a tidal cycle. COA §2.4.6.2, PDF pp. 156-158.

**Topics**
- Interference striations in frequency–range plots
- Phase and group slowness of a mode group
- $\beta=\cos^2\theta\approx1$ for reflection-dominated shallow water
- Generalized invariants for water depth and sound speed; separation-of-variables product (2.231)

**Cross-links**
- `chapters/ch03-ray-methods.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch10-signals-in-noise.md`

### Deep-ocean waveguides: $n^2$-linear and WKB solutions
For depth-varying sound speed the depth-separated equation is solved exactly in $n^2$-linear layers with Airy functions, or approximately by WKB (§2.5).

**Key equations** (COA §2.5)
- Depth-separated equation with $k(z)$, eq. (2.236), §2.5, PDF p. 159: $\left[\frac{d^2}{dz^2}+k^2(z)-k_r^2\right]\psi(k_r,z)=S_\omega\frac{\delta(z-z_s)}{2\pi}$, inverted by (2.235).
- Pseudo-linear profile, eq. (2.237), §2.5.1, PDF p. 160: $c(z)=\sqrt{\frac{1}{az+b}}$, i.e. $n^2$-linear, meaningful only where $az+b>0$.
- Airy reduction, eqs. (2.239)–(2.240), §2.5.1, PDF p. 160: $\zeta=(\omega^2a)^{-2/3}[k_r^2-\omega^2(az+b)]$ gives $\left(\frac{d^2}{d\zeta^2}-\zeta\right)\psi(\zeta)=0$, with solutions $\mathrm{Ai}(\zeta)$ and $\mathrm{Bi}(\zeta)$ (2.241)–(2.242).
- Point source in an $n^2$-linear medium, eq. (2.254), §2.5.1, PDF p. 162: the depth Green's function built from $\mathrm{Ai}(\zeta)$ on the turning side and $\mathrm{Ai}(\zeta)-i\mathrm{Bi}(\zeta)$ on the outgoing side of the source.
- WKB amplitude condition, eq. (2.258), §2.5.2, PDF p. 163: $\left|\frac{A''(z)}{k_z^2(z)A(z)}\right|\ll1$, for the ansatz $\psi=A(z)e^{i\varphi(z)}$ (2.256) of (2.255).
- WKB solution, eq. (2.263), §2.5.2, PDF p. 163: $\psi(z)=\frac{B}{\sqrt{k_z(z)}}e^{\pm i\int_{z_0}^{z}k_z(z)dz}$, local plane waves at grazing angle $\theta(z)=\arccos[k_r/k(z)]$.
- WKB validity, eqs. (2.264)–(2.265), §2.5.2, PDF p. 164: for locally linear $k_z$, $\left|\frac{1}{k_z(z)}\frac{d}{dz}\ln k_z(z)\right|\ll1$, i.e. small variation of $k_z$ over a vertical wavelength.
- Turning-point phase shift, eq. (2.268), §2.5.2, PDF p. 165: $B^+=B^-e^{-i\pi/2}$ in the high-frequency limit.

**Validity conditions**
- A range-independent model is realistic for much of the deep ocean because horizontal variability scales are much larger than vertical ones, especially under Arctic ice with a strongly upward-refracting profile. COA §2.5, PDF pp. 158-159.
- Representing a depth-varying ocean by homogeneous layers converges only with layers thinner than a quarter wavelength, practical only at low frequency in moderate depths. COA §2.5, PDF p. 159.
- WKB is a high-frequency approximation and breaks down where $k_z\to0$ (turning points, $k_r=k(z)$), even at high frequency; it contains no internal reflections. Where turning points lie within a few wavelengths of a boundary, the evanescent tail's reflection affects the whole field. COA §2.5.2, PDF pp. 163-165.
- The choice of interpolation function for the profile is not very critical, since profiles are measured at discrete depths with finite uncertainty. COA §2.5.1, PDF p. 160.

**Topics**
- Deep-ocean waveguides; stochastic variability treated by Monte Carlo
- $n^2$-linear (pseudo-linear) layers and Airy-function solutions
- WKB approximation, turning points and the $\pi/2$ phase shift
- WKB mode eigenvalues as ray-multiple phase matching

**Physical interpretation**
- Deep-channel structure connects the theory to long-range sound-channel propagation; the WKB solution is the ray picture of the depth-separated problem (§3.8).

**Cross-links**
- `chapters/ch03-ray-methods.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`

### Principle of reciprocity (Appendix 1)
The appendix derives reciprocity for the pressure Green's function in media with variable density and states the boundary conditions under which it holds.

**Key equations** (COA Appendix 1)
- Pressure Green's functions, eqs. (2.269)–(2.270), App. 1, PDF p. 166: $\rho(\mathbf r)\nabla\cdot\left[\rho^{-1}(\mathbf r)\nabla G_\omega(\mathbf r,\mathbf r_i)\right]+k^2G_\omega(\mathbf r,\mathbf r_i)=-\delta(\mathbf r-\mathbf r_i)$, $i=1,2$.
- Reciprocity relation, eq. (2.274), App. 1, PDF p. 167: $\rho(\mathbf r_2)G_\omega(\mathbf r_1,\mathbf r_2)=\rho(\mathbf r_1)G_\omega(\mathbf r_2,\mathbf r_1)$.
- Natural boundary conditions, eq. (2.275), App. 1, PDF p. 167: $\frac{\partial G_\omega(\mathbf r',\mathbf r)}{\partial n}-\eta(\mathbf r')G_\omega(\mathbf r',\mathbf r)=0$, including Dirichlet ($\eta=\infty$), Neumann ($\eta=0$) and impedance conditions.

**Validity conditions**
- (2.275) on a bounding surface is sufficient but not necessary for reciprocity. The radiation condition in infinite media can be written in this form. COA App. 1, PDF p. 167.
- The Pekeris seabed condition is non-local and cannot be written as (2.275), yet the surface integral still vanishes there, so the Pekeris waveguide is reciprocal. COA App. 1, PDF p. 167.
- A plane-wave homogeneous solution $H_\omega=\exp(i\mathbf k\cdot\mathbf r)$ gives a Green's function that satisfies (2.60) but is not symmetric, which is why symmetry is not automatic. COA App. 1, PDF p. 166.

**Topics**
- Reciprocity of the pressure Green's function with density weighting
- Natural boundary conditions (Dirichlet, Neumann, impedance) and their role in FEM (Chap. 7)
- Implications for replica fields, time reversal and passive reconstruction

**Why it matters**
- Reciprocity underlies source–receiver interchange in matched-field processing, time reversal and passive Green's-function recovery.

**Cross-links**
- `chapters/ch09-ambient-noise.md`
- `chapters/ch10-signals-in-noise.md`

## Key sections from the TOC
- 2.1 The Wave Equation (PDF p. 84)
- 2.2 The Helmholtz Equation (PDF p. 90)
- 2.3 Homogeneous Media (PDF p. 92)
- 2.4 Layered Media and Waveguides (PDF p. 102)
- 2.4.3 Reflection and Transmission (PDF p. 112)
- 2.4.4 Ideal Fluid Waveguide (PDF p. 121)
- 2.4.5 The Pekeris Waveguide (PDF p. 137)
- 2.4.6 Waveguide Invariants (PDF p. 152)
- 2.5 Deep-Ocean Waveguides (PDF p. 158)
- Appendix 1: Principle of Reciprocity (PDF p. 166)

## Numerical and research takeaways
- Ch. 2 is the theory spine of COA: most later methods are particular ways of evaluating the same wavenumber integral, by stationary phase (rays), quadrature (WI) or residues (modes).
- TL normalization (2.77)–(2.83) and reciprocity (2.194), (2.274) are durable organizing ideas; when comparing solvers or building datasets, check that every solver uses the same 1 m free-field reference.
- The Pekeris and ideal waveguides give closed-form checks for data generation: cutoff frequencies (2.155), (2.191), mode counts (2.164), interference lengths (2.163), and $\beta\approx1$ (2.218).

## Comparison to neighboring chapters
- Compared with `chapters/ch01-fundamentals.md`, this chapter is less about environment description and more about mathematical structure.
- Compared with `chapters/ch04-wavenumber-integration.md` and `chapters/ch05-normal-modes.md`, it provides the shared starting point before those methods diverge computationally; §5.5 revisits the Pekeris branch cut and leaky modes.
- Compared with `chapters/ch07-fd-fe-methods.md`, it emphasizes analytical structure and canonical problems rather than direct discretization.

## Good follow-on notes
- `chapters/ch03-ray-methods.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch09-ambient-noise.md`
- `chapters/ch10-signals-in-noise.md`
- `workflows/model-selection.md`
