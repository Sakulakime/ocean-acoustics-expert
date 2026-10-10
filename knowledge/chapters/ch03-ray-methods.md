---
title: COA Chapter 3 - Ray Methods
type: chapter-note
chapter: 3
book_pages: 155-232
pdf_pages: 173-250
source_pdf: sources/jensen-2011-computational-ocean-acoustics.pdf
status: deepened
---

# COA Chapter 3 - Ray Methods

## Summary
Ray methods treat propagation through geometric acoustics: rays, travel times, amplitudes, caustics, Gaussian beams, eigenrays and asymptotic structure. The chapter derives the ray series from the Helmholtz equation, solves the eikonal and transport equations, and builds coherent, incoherent and semicoherent transmission loss on dynamic ray tracing and geometric beams. It then treats the ray anomalies (shadow zones, caustics, the KMAH phase shift), Gaussian beams, attenuation, boundary and interface reflection, Fermat's principle, Snell's law and reciprocity, numerical solution by direct integration and cell methods, eigenray finding, and extensions: WKB, ray theory as WKB plus stationary phase, the ray and waveguide invariants, the Hamiltonian form and 3-D ray tracing. COA says ray methods are still used extensively in operations, where speed is critical and environmental uncertainty limits attainable accuracy (§3.1).

## Core problem
How to approximate underwater sound propagation by tracking ray paths and associated amplitudes rather than solving the full wavefield directly.

## Method-selection snapshot
- Best when the wavelength is substantially smaller than every physical scale in the problem: water depth, bathymetric features and internal features such as surface ducts (§3.4.2). COA gives no frequency number for this.
- Best for travel-time structure, multipath intuition, eigenray analysis and fast scenario screening; incoherent TL suits sonar performance evaluation, which may need only a smoothed result (§3.3.5.3).
- Weak when diffraction, shadow-zone penetration, caustic fields or low-frequency coherent interference are central; classical rays give zero field in shadow zones and infinite intensity on caustics (§3.4.1).

## Major subsections

### Ray bending and Snell's law in stratified layers
The chapter opens with an intuitive layered derivation (§3.2): a ray is a normal to a wavefront, and following the transmitted wave through a stack of thin layers gives Snell's law and a ray-tracing recipe for a stratified medium.

**Key equations** (COA §3.2)
- Snell's law at a fluid–fluid interface, eq. (3.1), §3.2, PDF p. 175: $k_1\cos\theta_1=k_2\cos\theta_2$, where $k_i$ is the medium wavenumber and $\theta_i$ the grazing angle in layer $i$.
- Continuous form, eq. (3.3), §3.2, PDF p. 175: $k(z_1)\cos\theta(z_1)=k(z_2)\cos\theta(z_2)$, for a continuously varying wavenumber $k(z)$.
- Ray angle at a receiver depth, eq. (3.4), §3.2, PDF p. 175: $\theta(z_r)=\arccos\left[\frac{k(z_0)}{k(z_r)}\cos\theta(z_0)\right]$, with $z_0$ the ray origin and $\theta(z_0)$ its declination angle.
- Range along the ray, eqs. (3.6)–(3.7), §3.2, PDF p. 176: $\frac{dr}{dz}=\cot\theta(z)$ and $r(z)=\int_{z_0}^{z_r}\cot\theta(z)\,dz$.
- Turning-point condition, eq. (3.8), §3.2, PDF p. 176: $k(z_1)\cos\theta(z_1)=k(z_2)$, setting $\theta(z_2)=0$; it gives the take-off angle of a ray that turns at a given depth.

**Validity conditions**
- The layered picture ignores reflected waves, justified because the reflected wave becomes progressively weaker as the sound-speed discontinuity becomes weaker. COA §3.2, PDF p. 175.
- Rays steer away from higher-speed parts of the medium. Where a ray turns horizontal, the depth integration must reverse ($dz<0$). COA §3.2, PDF p. 176.
- COA gives no quantitative limit in this section.

**Topics**
- Rays as wavefront normals; straight rays in free space for $p=e^{i\omega r/c}/r$
- Snell's law through a stack of layers and its continuous limit
- Ray tracing in a stratified medium by fine depth increments
- Turning-ray take-off angle, e.g. to limit a trace to waterborne paths

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch02-wave-propagation-theory.md`

### Ray series, eikonal and transport equations
This is the mathematical core (§3.3–3.3.2). The field is expanded as a rapidly varying phase times a series of slowly varying amplitudes. The eikonal equation gives the phase, which is the travel time. The transport equation gives the amplitude, which varies with the ray-tube cross section.

**Key equations** (COA §3.3–3.3.2)
- Point-source Helmholtz equation, eq. (3.9), §3.3, PDF p. 176: $\nabla^2p+\frac{\omega^2}{c^2(\mathbf x)}p=-\delta(\mathbf x-\mathbf x_0)$, where $c(\mathbf x)$ is the sound speed, $\omega$ the angular frequency and $\mathbf x_0$ the source position.
- Ray series, eq. (3.10), §3.3, PDF p. 177: $p(\mathbf x)=e^{i\omega\tau(\mathbf x)}\sum_{j=0}^{\infty}\frac{A_j(\mathbf x)}{(i\omega)^j}$, with phase (travel time) $\tau$ and amplitudes $A_j$.
- Eikonal and transport hierarchy, eq. (3.14), §3.3, PDF p. 177: $O(\omega^2):\ |\nabla\tau|^2=c^{-2}(\mathbf x)$; $O(\omega):\ 2\nabla\tau\cdot\nabla A_0+(\nabla^2\tau)A_0=0$; $O(\omega^{1-j}):\ 2\nabla\tau\cdot\nabla A_j+(\nabla^2\tau)A_j=-\nabla^2A_{j-1}$.
- Ray trajectory, eq. (3.16), §3.3.1, PDF p. 178: $\frac{d\mathbf x}{ds}=c\,\nabla\tau$, where $s$ is arc length; the vector ray equation is $\frac{d}{ds}\left(\frac1c\frac{d\mathbf x}{ds}\right)=-\frac{1}{c^2}\nabla c$ (3.22), PDF p. 179.
- First-order ray equations in $(r,z)$, eqs. (3.23)–(3.24), §3.3.1, PDF p. 179: $\frac{dr}{ds}=c\,\xi(s)$, $\frac{d\xi}{ds}=-\frac{1}{c^2}\frac{\partial c}{\partial r}$, $\frac{dz}{ds}=c\,\zeta(s)$, $\frac{d\zeta}{ds}=-\frac{1}{c^2}\frac{\partial c}{\partial z}$, with initial conditions $\xi=\cos\theta_0/c(0)$, $\zeta=\sin\theta_0/c(0)$ at the source $(r_0,z_0)$ (3.27)–(3.28).
- Travel time along the ray, eqs. (3.31)–(3.32), §3.3.1, PDF p. 181: $\frac{d\tau}{ds}=\frac1c$ and $\tau(s)=\tau(0)+\int_0^s\frac{1}{c(s')}ds'$.
- Ray-tube energy conservation, eq. (3.37), §3.3.2, PDF p. 182: $\int_{\partial V_0}\frac{A_0^2}{c}dS=\int_{\partial V_1}\frac{A_0^2}{c}dS=\text{const}$ over the end caps of a ray tube.
- Amplitude along a ray, eq. (3.50), §3.3.3, PDF p. 185: $A_0(s)=A_0(0)\left|\frac{c(s)J(0)}{c(0)J(s)}\right|^{1/2}$, where $J$ is the Jacobian (ray-tube cross section) (3.45)–(3.47); in cylindrical symmetry $J=r\left[\left(\frac{\partial z}{\partial\theta_0}\right)^2+\left(\frac{\partial r}{\partial\theta_0}\right)^2\right]^{1/2}$ (3.39), PDF p. 183.

**Validity conditions**
- The ray series is generally divergent; only in certain cases is it an asymptotic approximation to the exact solution. Keeping only its first term is a high-frequency approximation. COA §3.3, PDF p. 177.
- Because the eikonal equation is nonlinear it has multiple solutions; it is usually solved by the method of characteristics (rays) rather than by finite-difference eikonal solvers. COA §3.3.1, PDF p. 178.
- Ray paths are frequency independent when the index of refraction is; the phase is not. A frequency-dependent loss adds an imaginary index and a further frequency dependence. COA §3.3.1, PDF p. 180.

**Topics**
- Ray series and its high-frequency truncation
- Method of characteristics; rays as a curvilinear coordinate system
- Arc-length, travel-time and other monotonic ray parameterizations
- Ray tubes, the divergence theorem and finite-difference ("caliper") Jacobians (3.41)
- Jacobian form of the transport equation, with the property proved in Appendix 2 (3.278)

**Physical interpretation**
- Rays show where energy goes; the ray trace is the "skeleton" of the field, not the pressure or TL.
- Travel time is the most robust ray output; amplitude depends on the ray-tube geometry and fails first.

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch08-broadband-modeling.md`

### Point-source initial conditions, dynamic rays and transmission loss
Initial conditions come from a canonical problem: a point source in a homogeneous medium (§3.3.4). Dynamic ray tracing then gives the ray-tube spreading without bracketing rays (§3.3.5.1). The section defines coherent, incoherent and semicoherent TL and the geometric beams used to put the field on a receiver grid (§3.3.5.2–3.3.5.5).

**Key equations** (COA §3.3.4–3.3.5)
- Canonical point source, eqs. (3.51)–(3.52), §3.3.4, PDF p. 185: $p^0(s)=\frac{e^{i\omega s/c_0}}{4\pi s}$, so $A_0(s)=1/(4\pi s)$ and $\tau_0(s)=s/c_0$, with $c_0$ the sound speed at the source.
- Homogeneous-medium Jacobian, eq. (3.54), §3.3.4, PDF p. 186: $J(s)=-s^2\cos\theta_0$, giving $A_0(s)=\frac{1}{4\pi}\left|\frac{c(s)\cos\theta_0}{c(0)J(s)}\right|^{1/2}$ (3.56).
- Ray pressure, eq. (3.57), §3.3.4, PDF p. 186: $p(s)=\frac{1}{4\pi}\left|\frac{c(s)\cos\theta_0}{c(0)J(s)}\right|^{1/2}e^{i\omega\int_0^s\frac{1}{c(s')}ds'}$.
- Dynamic ray equations, eq. (3.58), §3.3.5.1, PDF p. 186: $\frac{dq}{ds}=c\,p(s)$, $\frac{dp}{ds}=-\frac{c_{nn}}{c^2(s)}q(s)$, where $c_{nn}$ is the curvature of the sound speed normal to the ray, (3.61)–(3.62).
- Angle perturbation and amplitude, eqs. (3.63)–(3.65), §3.3.5.1, PDF p. 187: with $q(0)=0$, $p(0)=1/c(0)$, $rq(s)=J(s)$ and $A_0(s)=\frac{1}{4\pi}\left|\frac{c(s)\cos\theta_0}{rc(0)q(s)}\right|^{1/2}$.
- Coherent sum and TL, eqs. (3.66)–(3.68), §3.3.5.2, PDF p. 188: $p^{(C)}(r,z)=\sum_{j=1}^{N(r,z)}p_j(r,z)$ over the $N(r,z)$ eigenrays, and $TL(s)=-20\log\left|\frac{p(s)}{p^0(s=1)}\right|$ with $p^0(s=1)=1/(4\pi)$, as in (2.77).
- Incoherent TL, eq. (3.69), §3.3.5.3, PDF p. 190: $p^{(I)}(r,z)=\left[\sum_{j=1}^{N(r,z)}|p_j(r,z)|^2\right]^{1/2}$, which drops the eigenray phases.
- Semicoherent TL with Lloyd-mirror shading, eqs. (3.70)–(3.71), §3.3.5.4, PDF p. 190: $p^{(S)}(r,z)=\left[\sum_{j=1}^{N(r,z)}S(\theta_0)|p_j(r,z)|^2\right]^{1/2}$, $S(\theta_0)=2\sin^2\left(\frac{\omega z_0\sin\theta_0}{c_0}\right)$, for a source at depth $z_0$ below a pressure-release surface.
- Geometric (hat-shaped) beams, eqs. (3.72)–(3.74), §3.3.5.5, PDF pp. 191-192: $P^{beam}(s,n)=A^{beam}(s)\phi(s,n)e^{i\omega\tau(s)}$ with $\phi=(W-n)/W$ for $n\le W$, and half-width $W(s)=|q(s)\,\delta\theta_0|$, where $n$ is the normal distance from the central ray and $\delta\theta_0$ the ray spacing.
- Gaussian-shaped geometric beams, eqs. (3.75)–(3.76), §3.3.5.5, PDF p. 192: $\phi(s,n)=e^{-(n/W(s))^2}$ with $A^{beam}(s)=\frac{1}{(2\pi)^{1/4}}\sqrt{\frac{\delta\theta_0}{r}\frac{c(s)}{c(0)}\frac{2\cos\theta_0}{W(s)}}$.

**Validity conditions**
- In the nearfield there may be just three important eigenrays (direct, bottom-bounce, surface-bounce); the rest strike the bottom steeper than the critical angle and are strongly attenuated. COA §3.3.5.2, PDF p. 188.
- Coherent TL is the result most directly comparable to full-wave solutions. At high frequency the interference detail needs environmental knowledge that is generally lacking, so incoherent TL may be acceptable; it also relaxes the sampling in ray number and step size. COA §3.3.5.2–3.3.5.3, PDF pp. 189-190.
- Semicoherent techniques are "somewhat informal and partially empirically based"; the shading (3.71) restores the nearfield Lloyd-mirror pattern that incoherent TL smooths out. COA §3.3.5.4, PDF p. 190.
- Geometric hat beams reproduce ray theory exactly when properly implemented, but small implementation errors cause large problems because each beam must exactly fill the space to its neighbour. The Gaussian version is more forgiving but its width still vanishes at caustics. Weinberg and Keenan's empirical minimum beam width of $\pi\lambda$ removes the caustic singularities and generally improves accuracy. COA §3.3.5.5, PDF p. 192.

**Topics**
- Canonical problems and bounded $A_0(0)|J(0)|^{1/2}$ initial conditions
- Dynamic ray tracing ($p$, $q$) and the normal sound-speed curvature $c_{nn}$
- Coherent, incoherent and semicoherent TL; source-directivity shading
- Geometric beam tracing (hat and Gaussian beams) for receiver-grid interpolation
- Balearic Sea example (source 75 m; eigenrays to 75 km, 500 m)

**Best-fit scenarios**
- Arrival prediction and multipath interpretation
- Fast TL screening, coherent where the environment is well known, incoherent otherwise

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch08-broadband-modeling.md`
- `solvers/solver-bellhop.md`

### Ray anomalies: caustics, shadow zones and the region of validity
Classical rays fail exactly where many interesting wave effects appear (§3.4). COA uses an $n^2$-linear profile to show a shadow zone, a caustic and the caustic phase shift, then discusses how high a frequency rays need.

**Key equations** (COA §3.4)
- $n^2$-linear test profile, eq. (3.77), §3.4.1, PDF p. 193: $c(z)=\frac{c_0}{\sqrt{1+2.4z/c_0}}$ with $c_0=1550$ m/s, i.e. $n^2=(c_0/c)^2=a+bz$.
- Caustic starting depth, eq. (3.78), §3.4.1, PDF p. 196: $c^2(z)=c^2(0)-c^2(z_0)$, for source depth $z_0$; about 400 m in the deep-source example.
- Amplitude through caustics (KMAH index), eq. (3.79), §3.4.1, PDF p. 196: $A_0(s)=A_0(0)(-i)^{m(s)}\sqrt{\left|\frac{c(s)J(0)}{c(0)J(s)}\right|}$, where $m(s)$ counts the zeros of $J$ on $[0,s]$ (caustics crossed); each caustic adds a $\pi/2$ phase shift, a Hilbert transform in the time domain.

**Validity conditions**
- Shadow zones contain no real rays and predict zero field; caustics, where the ray-tube cross section vanishes ($J=0$), predict infinite intensity, and the intensity is high in a zone around the caustic too. Complex rays can complete the field in a shadow zone but are almost never used in practical codes. COA §3.4.1, PDF pp. 193-195.
- Neglecting the caustic phase shift corrupts the field at all later ranges, arbitrarily far from the caustic. COA §3.4.1, PDF pp. 193, 196-197.
- In the $n^2$-linear example at 2000 Hz (source and receiver at 75 m), two-ray interference runs to about 0.88 km, beyond which the shadow zone begins; with the source at 1000 m the zones change at about 3.04 and 3.08 km. COA §3.4.1, PDF pp. 193, 195-196.
- Region of validity: COA gives no frequency threshold. Even with a defined accuracy requirement it is hard to predict a priori whether rays will meet it. The often-quoted rule is that the wavelength should be substantially smaller than any physical scale (water depth, bathymetric features, surface ducts). Smoothing such features, or pruning the sound-speed profile, can improve both accuracy and run time. COA §3.4.2, PDF pp. 196-197.
- Production codes differ from ray theory: they may neglect caustic phase shifts, miss eigenrays, introduce false caustics, or smooth TL. Different ray codes can therefore give substantially different results. COA §3.4.2, PDF p. 197.

**Topics**
- Shadow zones and limiting rays; complex rays
- Caustics as ray envelopes; KMAH index
- Uniform asymptotic expansions (Kravtsov, Ludwig) and catastrophe-theory caustic taxonomy
- Region of validity of ray theory

**Main limitations**
- Weak near caustics and in shadow zones
- Poor for low-frequency coherent waveguide problems
- Does not naturally handle diffraction

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`

### Gaussian beams
Gaussian beams are the chapter's main cure for classical ray singularities (§3.5). A complex source point gives an exact free-space beam with explicit width and curvature (§3.5.1). Gaussian beam tracing (Porter and Bucker, after Červený) then propagates beams along rays using complex dynamic-ray quantities (§3.5.2).

**Key equations** (COA §3.5)
- Complex source point, eqs. (3.80)–(3.81), §3.5.1, PDF p. 198: $p(\mathbf x)=\frac{e^{ik|\mathbf x-\mathbf x_0|}}{|\mathbf x-\mathbf x_0|}$ with $\mathbf x_0=(ia,0)$, so $|\mathbf x-\mathbf x_0|=\sqrt{(x-ia)^2+z^2}$; $a$ is the complex offset.
- Phase-front curvature, eq. (3.85), §3.5.1, PDF p. 198: $K(x)=\frac{x}{x^2+a^2}$.
- Beam (half-)width, eq. (3.86), §3.5.1, PDF p. 198: $W(x)=\sqrt{\frac2k\left(a+\frac{x^2}{a}\right)}$, a hyperbola in $x$; COA notes it is properly a half-beamwidth.
- Gaussian beam along a ray, eq. (3.88), §3.5.2, PDF p. 201: $p^{beam}(s,n)=A\sqrt{\frac{c(s)}{rq(s)}}\exp\left\{-i\omega\left[\tau(s)+\frac{p(s)}{2q(s)}n^2\right]\right\}$, with complex $p$, $q$ from the dynamic ray equations (3.58).
- Width and curvature from $p/q$, eqs. (3.89)–(3.90), §3.5.2, PDF p. 201: $W(s)=\sqrt{\frac{-2}{\omega\,\mathrm{Im}[p(s)/q(s)]}}$ and $K(s)=-c(s)\,\mathrm{Re}[p(s)/q(s)]$.
- Initial conditions, eq. (3.91), §3.5.2, PDF p. 201: $p(0)=1$, $q(0)=i\omega W^2(0)/2$, i.e. zero initial curvature and initial width $W(0)$.
- Point-source beam weighting, eq. (3.92), §3.5.2, PDF p. 202: $A(\theta_0)=\delta\theta_0\frac{1}{c_0}\sqrt{\frac{q(0)\,\omega\cos\theta_0}{2\pi}}e^{i\pi/4}$, with $\delta\theta_0$ the angular beam spacing.

**Validity conditions**
- The complex-source beam (3.83)–(3.86) is paraxial ($z\ll x$) and farfield; COA recommends the exact form (3.80), which is an exact beam solution of the Helmholtz equation. COA §3.5.1, PDF pp. 198-199.
- Optimal offset: $W$ is minimized at range $x$ by $a=x$; the waist width is $W(0;a)=\sqrt{2a/k}$, about 70 m for $a=1000$ at 100 Hz and 1500 m/s (maximum range 1000 m). COA compares $a=200$, 1000 and 7000. This assumes the waist at the origin. COA §3.5.1, PDF p. 199.
- Initial beam parameters for tracing: the optimal choice is "a matter of current research". Typically $K(0)=0$ and an initial beamwidth of 10–50 wavelengths, so that beams are neither large compared to the water depth at the source nor so narrow that they diverge and become large in the farfield. COA §3.5.2, PDF p. 201.
- In the $n^2$-linear deep-source case, Gaussian beams remove the caustic spike, soften the fall-off into the shadow zone and agree very closely with the exact solution. At lower frequencies the beams may be large compared to the channel, and geometric beams (§3.3.5.5) "have generally proven to be more satisfactory". COA §3.5.2, PDF p. 202.

**Topics**
- Complex source point method (Deschamps); hyperbolic beam width; parabolic phase fronts
- Gaussian beam tracing with complex $p$, $q$
- Beam summation and point-source weighting
- Bucker's earlier informal beams and "fuzzy" rays

**Best-fit scenarios**
- High-frequency propagation with caustics, shadow zones or multipath
- Operational ray-based modelling where raw rays are too singular

**Limitations**
- Still asymptotic; beam parameters are a user choice
- Wide beams relative to the channel at low frequency

**Cross-links**
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch08-broadband-modeling.md`
- `solvers/solver-bellhop.md`

### Alternate ray forms, attenuation, boundaries and weak interfaces
Practical additions for real oceans (§3.6.1–3.6.4): ray equations in scaled arc length or with range or depth as the independent variable, volume attenuation, reflection from faceted and curvilinear boundaries, and the beam-curvature jump at weak sound-speed interfaces.

**Key equations** (COA §3.6.1–3.6.4)
- $\sigma$-form, eqs. (3.93) and (3.96), §3.6.1.1, PDF pp. 203-204: $\frac{ds}{d\sigma}=n$ and $\frac{d^2\mathbf x}{d\sigma^2}=\frac12\nabla(n^2)$, where $n=c_0/c$ is the index of refraction; the phase is $\tau(\sigma)=\tau(\sigma_0)+\frac{1}{c_0}\int_{\sigma_0}^{\sigma}n^2(\sigma')d\sigma'$ (3.97).
- $z(r)$ form, eq. (3.104), §3.6.1.2, PDF p. 204: $\frac{d^2z}{dr^2}=\left[1+\left(\frac{dz}{dr}\right)^2\right]\left(-\frac{c_z}{c}+\frac{dz}{dr}\frac{c_r}{c}\right)$, with the $r(z)$ analogue (3.105).
- Attenuation by perturbation, eqs. (3.113)–(3.116), §3.6.2, PDF p. 206: $\tau_1(s)=-\int_0^s\frac{c_1(s')}{c_0^2(s')}ds'$; for a loss $\alpha$ in nepers/m, $ic_i\simeq-i\alpha|c_r^2|/\omega$ (3.114), and the ray pressure (3.57) gains the factor $e^{-\int_0^s\alpha(s')ds'}$.
- Specular reflection, eq. (3.121), §3.6.3, PDF p. 208: $\mathbf t^R_{ray}=\mathbf t^I_{ray}-2\alpha\,\mathbf n_{bdry}$, with $\alpha=\mathbf t^I_{ray}\cdot\mathbf n_{bdry}$ (3.118).
- Dynamic-ray reflection, eqs. (3.122)–(3.123), §3.6.3, PDF p. 209: $p^R=p^I+q^IN$, $q^R=q^I$, with $N=\pm\frac{2\kappa}{\alpha c^2}+M(4c_n-2Mc_s)/c^2$, $M=\beta/\alpha$ (3.123), where $\kappa$ is the boundary curvature, $\beta=\mathbf t^I_{ray}\cdot\mathbf t_{bdry}$ (3.119), and $c_n$, $c_s$ the normal and tangential sound-speed derivatives (3.124).
- Reflection-loss bookkeeping, eqs. (3.125)–(3.126), §3.6.3, PDF p. 209: $A^R=|R(\theta_0)|A^I$, $\phi^R=\phi^I+\arg[R(\theta_0)]$, with $R(\theta_0)$ the complex reflection coefficient at incidence angle $\theta_0$.
- Parabolic bottom test profile, eq. (3.127), §3.6.3, PDF p. 210: $z=0.002\,b\sqrt{1+r/c}$ with $b=250000$ and $c=250$ (metres), which puts a source at the origin at the focal point.
- Weak interface, eqs. (3.129)–(3.130), §3.6.4, PDF pp. 212-213: $p^T=p^I+q^IN$, $q^T=q^I$ with $N=-M(2[c_n]-M[c_s])/c^2$, where $[c_n]$, $[c_s]$ are the jumps in the normal and tangential sound-speed derivatives.

**Validity conditions**
- Complex sound speed makes rays complex; in practice one neglects the imaginary part, traces real rays and adds the path-length loss. For purely refracted, near-horizontal paths the loss integral is about the same for every path, so many models simply add $\alpha r$ ($\alpha$ in dB/km) to TL; for boundary-interacting rays volume attenuation is usually small compared with reflection loss. COA §3.6.2, PDF pp. 205-206.
- Most ray codes treat the bottom as a reflector, ignoring the transmitted ray, and use a tabulated reflection coefficient; COA calls this informal but consistent with mud/sand/rock bottom descriptions. Plane-wave coefficients are themselves an approximation for curved wavefronts. Displacing the reflected ray improves accuracy (Tindle and Bold), also near turning points (§2.4.3). COA §3.6.3, PDF p. 207.
- Reflection leaves $q$ (energy) unchanged and changes only the wavefront curvature. Ray tracing may be terminated after a number of boundary interactions or below an amplitude threshold. COA §3.6.3, PDF p. 209.
- Faceted (piecewise-linear) bathymetry gives irregular rays in the parabolic-bottom test with 25 m depth sampling. Splines can wiggle to extremes; splines under tension work better. Interpolating boundary normals keeps the piecewise-linear intercept and needs the curvature $\kappa=d\phi/ds$ (3.128) in (3.123). COA §3.6.3, PDF pp. 211-212.
- A 1985 evaluation (McGirr et al.) found none of the Navy's then-standard ray models produced both satisfactory ray traces and intensities on the parabolic bottom. COA §3.6.3, PDF p. 210.

**Topics**
- $\sigma$-form, $z(r)$ and $r(z)$ ray equations
- Volume attenuation as a path-length loss
- Faceted, spline and curvilinear boundary interpolation; ray displacement on reflection
- Dickins seamount example (source 18 m, 230 Hz; compares well with PE, §6.9.3)
- Weak interfaces from piecewise-linear sound-speed profiles

**Best-fit scenarios**
- Shallow-water, bottom-interacting, high-frequency analysis
- Fast boundary-loss sensitivity checks

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch06-parabolic-equations.md`

### Fermat's principle, stratified media, Snell's law and reciprocity
Variational and stratified-media properties of rays (§3.6.5–3.6.8): rays make the travel time stationary, horizontal slowness is conserved in range-independent media, and the ray amplitude is reciprocal.

**Key equations** (COA §3.6.5–3.6.8)
- Travel time along a path, eq. (3.131), §3.6.5, PDF p. 214: $\tau=\int_{\mathbf x_0}^{\mathbf x_1}\frac{1}{c(s)}ds$; making it stationary through the Euler–Lagrange equations (3.134) recovers the ray equations (3.135)–(3.137).
- Stratified $z(r)$ form, eq. (3.138), §3.6.6, PDF p. 214: $\frac{d^2z}{dr^2}=-\left[1+\left(\frac{dz}{dr}\right)^2\right]\frac{c_z}{c}$.
- Ray invariant and range integral, eqs. (3.143) and (3.145), §3.6.6, PDF p. 215: $\frac{m}{\sqrt{1+m^2}}=ac$ with $m=dr/dz$ and constant $a$, and $r(z)=r(z_0)+\int_{z_0}^{z}\frac{ac}{\sqrt{1-a^2c^2}}dz'$.
- Phase in a stratified medium, eq. (3.149), §3.6.6, PDF p. 216: $\tau(z)=\tau(z_0)+\int_{z_0}^{z}\frac{1}{c(z')\sqrt{1-a^2c^2(z')}}dz'$.
- Snell's law, eqs. (3.150)–(3.151), §3.6.7, PDF p. 216: $c(z_0)\cos\theta(z)=c(z)\cos\theta(z_0)$, i.e. $n(z)\cos\theta(z)$ is constant along the ray; the constant is $a$: $\cos\theta_0=a\,c(z)$ (3.154).
- Bottom-grazing take-off angle, eq. (3.152), §3.6.7, PDF p. 216: $\theta(z_0)=\arccos\left[\frac{c(z_0)}{c(D)}\right]$, the steepest ray that turns just above a bottom at depth $D$.
- Spreading reciprocity, eqs. (3.155)–(3.160), §3.6.8, PDF pp. 217-218: $\left(\frac{q'}{c}\right)'+\frac{c_{nn}}{c^2}q=0$ with $q(s_1)=0$, $q'(s_1)=1/c(s_1)$; since the Wronskian ratio $W(s)/c(s)$ is constant, $q(s_2;s_1)=q(s_1;s_2)$.

**Validity conditions**
- Rays steeper than (3.152) hit the bottom and lose energy at every bounce, so a long-range calculation may discard them at the start. If the bottom sound speed is lower than at the source, all real rays strike the bottom. COA §3.6.7, PDF pp. 216-217.
- Snell's law holds in range-independent media even with sound-speed discontinuities. COA §3.6.7, PDF p. 217.
- Ray theory preserves reciprocity of the eigenray, travel time and amplitude, although it is only an approximate solution. COA §3.6.8, PDF pp. 217-218.
- COA gives no further numbers here.

**Topics**
- Fermat's principle (stationary, not necessarily least, travel time)
- Stratified-media reductions; horizontal slowness as the ray constant
- Grazing-ray take-off angle and waterborne-path pruning
- Reciprocity of the spreading function

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch05-normal-modes.md`

### Numerical ray tracing: direct integration and cell methods
The implementation core (§3.7–3.7.4). Direct integration solves the ray ODEs with Euler or Runge–Kutta steps, landing exactly on boundaries. Cell methods fit $n^2$-linear or $c$-linear sound speed in triangles, where rays are parabolas or circles. Profile interpolation decides whether false caustics appear.

**Key equations** (COA §3.7.1–3.7.4)
- Ray ODE system, eqs. (3.161)–(3.165), §3.7.1.1, PDF p. 219: $\mathbf y'=\mathbf f(x,\mathbf y)$ with $\mathbf y=(r,z,\xi,\zeta)$ and $x=s$, the equations (3.23)–(3.24).
- Euler step, eq. (3.167), §3.7.1.1, PDF p. 219: $\mathbf y_{i+1}=\mathbf y_i+h\,\mathbf f(x,\mathbf y_i)$, local truncation error $O(h)$; second-order Runge–Kutta, eqs. (3.168)–(3.169), PDF p. 220: $\mathbf y_{i+1/2}=\mathbf y_i+\frac h2\mathbf f(x_i,\mathbf y_i)$, $\mathbf y_{i+1}=\mathbf y_i+h\,\mathbf f(x_{i+1/2},\mathbf y_{i+1/2})$.
- Step that lands on a boundary, eqs. (3.171) and (3.178)–(3.180), §3.7.1.2, PDF pp. 220-222: $\tilde h=(D-z_i)/(c_i\zeta_i)$ for a flat bottom at depth $D$; in general $\tilde h=\frac{-\delta_0}{-\delta_0+\delta}h=\frac{\delta_0}{\mathbf t_{ray}\cdot\mathbf n_{bdry}}$, with $\delta_0$, $\delta$ the signed distances of the two step ends from the boundary.
- $n^2$-linear cell, eqs. (3.187) and (3.195), §3.7.2, PDF pp. 224-225: $n^2(r,z)=n_0^2+g_r(r-r_0)+g_z(z-z_0)$; with $g_r=0$ the ray is the parabola $z(r)=\frac{g_z}{4}\left(\frac{r-r_0}{n_0\cos\theta_0}\right)^2+(\tan\theta_0)(r-r_0)+z_0$.
- $c$-linear cell, eqs. (3.196) and (3.201)–(3.202), §3.7.3, PDF pp. 226-227: for $c(z)=c_0+gz$ the ray is a circle $\{r-[r(z_1)-b]\}^2+\left(z+\frac{c_0}{g}\right)^2=R^2$ with radius $R=\frac{1}{ag}$, centred on the depth where $c$ vanishes.
- Reference solution for a linear profile, eqs. (3.207)–(3.212), §3.7.3, PDF pp. 228-229: $R=\frac{c(z_0)}{g\cos\theta_0}$, $a=\frac{\cos\theta_0}{c(z_0)}$, $r(s)=R[\sin\theta_0+\sin(s/R-\theta_0)]$, $z(s)=R\cos(s/R-\theta_0)-c(0)/g$.

**Validity conditions**
- Euler's method converges as $h\to0$ in theory but is grossly inefficient and in finite precision "may never yield a sufficiently accurate answer"; higher-order schemes usually win. A larger step is typically allowable below 500 m, where the profile varies more smoothly. COA §3.7.1.1, PDF pp. 219-220.
- Profile interpolation errors can matter more than integrator errors, and the integration must stop and restart at every boundary. COA §3.7.1.1, PDF p. 220.
- The $c$-linear travel-time formula (3.204) cannot be applied across a turning point; apply it to each side, (3.205). COA §3.7.3, PDF p. 228.
- It is seldom necessary to use more than 20 depth points to define the sound-speed profile. COA §3.7.4, PDF p. 229.
- Piecewise-linear profiles (cell methods, $c$-linear or $n^2$-linear interpolation) create false caustics; in COA's Munk-profile example (500 Hz, source 1000 m) they also distort the normal-mode result, so they are a property of the interpolation, not only of rays. Finer profile sampling mitigates them; cubic splines give more regular rays but can wiggle between points. A source at a gradient discontinuity can emit an artificial horizontal "acoustic jet". COA §3.7.4, PDF pp. 229-231.
- Map receivers to ray-centred coordinates segment by segment; badly implemented, this step can consume most of the computer time. Sign changes in $q$ must be counted for the KMAH index. COA §3.7.1.3, PDF pp. 222-223.

**Topics**
- Euler and Runge–Kutta integration; variable step size
- Boundary landing and reflection restart
- Receiver mapping to ray-centred coordinates $(s,n)$ (3.181)–(3.184)
- $n^2$-linear (parabolic rays) and $c$-linear (circular rays) cell methods; triangulation
- False caustics and profile interpolation; ray thinning

**Limitations**
- Sensitive to launch-angle sampling and environmental interpolation
- Arrival geometry may be right while coherent amplitude remains poor

**Cross-links**
- `chapters/ch05-normal-modes.md`
- `solvers/solver-bellhop.md`
- `runbooks/bellhop-runbook.md`

### Finding eigenrays
Eigenrays connect the source to a given receiver (§3.7.5). Finding them is a root-finding problem in the take-off angle, solved by interpolation in a ray fan, iteration, bending or continuation.

**Key equations** (COA §3.7.5)
- Eigenray condition, eq. (3.213), §3.7.5, PDF p. 232: $f(\theta_0)=z(r_r;\theta_0)-z_r$, whose roots are the eigenray take-off angles for a receiver at $(r_r,z_r)$.
- Jacobian from bracketing rays, eq. (3.214), §3.7.5.1, PDF p. 232: $J=r\left[\left(\frac{\partial z}{\partial\theta_0}\right)^2+\left(\frac{\partial r}{\partial\theta_0}\right)^2\right]^{1/2}$, evaluated from two rays that bracket the receiver.

**Validity conditions**
- Interpolation (the most common approach) must not interpolate between bracketing rays with different ray histories, e.g. one surface-reflected and one turned below the surface, or the phase and amplitude are severely wrong. Codes count surface and bottom reflections and turning points per ray. COA §3.7.5.1, PDF p. 232.
- Iteration (Newton, secant) refines a bracketing pair with identical histories until the ray passes within a set distance of the receiver; interpolation is a single secant step. COA §3.7.5.2, PDF p. 233.
- The bending method (popular in seismics) relaxes a parameterized path to a Fermat path; continuation morphs the solution of a simpler profile. COA gives no accuracy numbers. COA §3.7.5.3–3.7.5.4, PDF pp. 233-234.

**Topics**
- Ray fans, bracketing and ray histories
- Newton and secant refinement
- Bending and continuation methods

**Best-fit scenarios**
- Arrival-time prediction and source–receiver geometry inversion
- First-look sonar interpretation

**Cross-links**
- `chapters/ch08-broadband-modeling.md`
- `solvers/solver-bellhop.md`

### WKB method and ray theory via stationary phase
Ray theory applied to the depth-separated Helmholtz equation (§3.8.1–3.8.2). WKB solves the one-dimensional problem for each horizontal wavenumber; stationary phase then recovers the ray trajectories, so ray theory is WKB plus stationary phase.

**Key equations** (COA §3.8.1–3.8.2)
- Depth-separated equation, eqs. (3.216)–(3.217), §3.8.1, PDF p. 235: $\left(\frac{\partial^2}{\partial z^2}+k_z^2\right)p(k_r,z)=0$ with $k_z^2(z)=\frac{\omega^2}{c^2(z)}-k_r^2$, after the Hankel transform (3.215).
- One-dimensional ray series, eq. (3.219), §3.8.1, PDF p. 235: $p(z)=e^{i\omega\tau(z)}\sum_{j=0}^{\infty}\frac{A_j(z)}{(i\omega)^j}$, giving $\tau(z)=\pm\frac1\omega\int k_z(z)\,dz$ (3.223) and $A_0(z)=B/\sqrt{k_z(z)}$ (3.225).
- WKB solution, eqs. (3.226)–(3.227), §3.8.1, PDF p. 236: $p(k_r,z)\simeq\frac{B\,e^{\pm i\int_{z_0}^{z}k_z(z')dz'}}{\sqrt{k_z(z)}}$, identical to (2.263).
- Field as a wavenumber integral, eqs. (3.228)–(3.229), §3.8.2, PDF p. 237: $p(r,z)=B\int_0^\infty\frac{e^{\pm i\int_{z_0}^{z}k_z(z')dz'}}{\sqrt{k_z(z)}}J_0(k_rr)k_r\,dk_r$, in which (3.229) replaces $J_0$ by its large-argument asymptote so that the kernel carries $e^{ik_rr}$.
- Stationary-phase formula, eq. (3.231), §3.8.2, PDF p. 237: $p(z;\omega)\simeq\sqrt{\frac{2\pi}{\omega|\tau''(\xi_0)|}}A(\xi_0)e^{i\omega\tau(\xi_0)\pm i\pi/4}$, at a stationary point $\tau'(\xi_0)=0$.
- Stationary condition gives the ray, eqs. (3.233)–(3.234), §3.8.2, PDF p. 238: $\pm\int_{z_0}^{z}\frac{dk_z}{dk_r}dz'+r=0$, which becomes $r(z)=r(z_1)+\int_{z_1}^{z}\frac{ac}{\sqrt{1-a^2c^2}}dz'$ with $a=k_r/\omega$, the stratified ray (3.145).

**Validity conditions**
- WKB breaks down at turning points, where $\omega^2/c^2-k_r^2=0$ and $A_0$ is infinite; 2-D ray theory breaks down at caustics instead. WKB is a single spectral component summed over infinitely many contributions, which makes it closer to Gaussian beam tracing, of which it is a special case. COA §3.8.1, PDF p. 236.
- The large-argument Bessel asymptote is usually sufficient beyond a few wavelengths from the source. COA §3.8.2, PDF p. 237.
- Stationary phase assumes $\tau''(\xi_0)\neq0$ and isolated stationary points (each contributes a term). COA §3.8.2, PDF p. 237.

**Topics**
- WKB (WKBJ, LGJWKB) as one-dimensional ray theory
- Hybrid ray–FFP and ray–mode views; ray–PE hybrids; elastic and Monte-Carlo ray extensions (§3.8)
- Maslov / WKBJ seismograms for range dependence
- Ray theory = WKB + stationary phase; eigenrays as dominant $k_r$ points

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`

### Ray invariant, waveguide invariant, Hamiltonian form and 3-D rays
The ray interpretation of the waveguide invariant (§3.8.3), the Hamiltonian particle–ray analogy (§3.8.4), and 3-D ray tracing (§3.8.5).

**Key equations** (COA §3.8.3–3.8.5)
- Skip distance and cycle time, eqs. (3.236), (3.239)–(3.240), §3.8.3, PDF pp. 238-239: $\Lambda=2\int_{z_l}^{z_u}\frac{dz}{|\tan\theta|}=2\int_{z_l}^{z_u}\frac{s_h}{s_v(z)}dz$ and $T=2\int_{z_l}^{z_u}\frac{s^2(z)}{s_v(z)}dz$, between the turning depths $z_l$, $z_u$, with medium slowness $s=1/c$.
- Horizontal and vertical slowness, eqs. (3.237)–(3.238), §3.8.3, PDF p. 239: $s_h=s(z)\cos\theta(z)=s(z_0)\cos\theta_0$ (constant by Snell's law) and $s_v=s(z)|\sin\theta(z)|=\sqrt{s^2(z)-s_h^2}$.
- Ray waveguide invariant, eqs. (3.241)–(3.242), §3.8.3, PDF p. 239: group slowness $s_g=T/\Lambda$ and $\beta^{-1}=-\frac{ds_g}{ds_h}=-\left(\frac{dT}{\Lambda\,ds_h}-\frac{T\,d\Lambda}{\Lambda^2ds_h}\right)$, from (2.214).
- Ray invariant, eqs. (3.245) and (3.247), §3.8.3, PDF p. 240: $I_r=T-s_h\Lambda=2\int_{z_l}^{z_u}s_v(z)\,dz$ and $\frac{dI_r}{ds_h}=-\Lambda$, giving $\beta^{-1}=-\frac{I_r}{\Lambda}\frac{d\Lambda}{d\theta_0}\frac{d\theta_0}{dI_r}$ (3.248).
- Ideal waveguide, eq. (3.251), §3.8.3.1, PDF p. 240: $\beta^{-1}=\frac{1}{\cos^2\theta_0}$.
- $n^2$-linear refracting waveguide, eq. (3.257), §3.8.3.2, PDF p. 241: $\beta^{-1}=-\frac13(1-\tan^2\theta_0)\approx-\frac13$ for small launch angles.
- Hamilton's equations, eq. (3.258), §3.8.4, PDF p. 242: $\frac{dz}{dr}=\frac{\partial H}{\partial p}$, $\frac{dp}{dr}=-\frac{\partial H}{\partial z}$, with range playing time, ray momentum $p=c_0s_v$ and Hamiltonian $H=-c_0s_h$ (Table 3.1); the action variable obeys $\frac{dI}{dH}=\frac{2\pi}{\Lambda}$ (3.261).
- 3-D ray equations, eqs. (3.262)–(3.266), §3.8.5, PDF p. 243: $\frac{dx}{ds}=c\,\xi$, $\frac{d\xi}{ds}=-\frac{1}{c^2}\frac{\partial c}{\partial x}$ (likewise $y$, $z$), launched with $\frac{d\mathbf x}{ds}=(\cos\theta_0\cos\varphi_0,\cos\theta_0\sin\varphi_0,\sin\theta_0)$ at declination $\theta_0$ and azimuth $\varphi_0$; phase and amplitude keep the forms (3.267)–(3.268) with the 3-D Jacobian (3.269).

**Validity conditions**
- For a Pekeris (shallow-water) waveguide the grazing angles are typically small, so the ideal-waveguide invariant is approximately unity (§2.4.6). COA §3.8.3.1, PDF p. 240.
- The refracting result (3.257), $\beta^{-1}\approx-1/3$ at small launch angles, also holds for an $n^2$-linear profile symmetric about any depth without a reflecting surface, since cycle time and cycle distance both double. COA §3.8.3.2, PDF p. 241.
- 3-D ray tracing is used much less than 2-D, because the environmental data are harder to get and the cost is much greater; the eigenray search becomes two-dimensional (declination and azimuth). At long (global) ranges 3-D effects can be very important and the ray equations must account for the non-spherical Earth (§5.13). COA §3.8.5, PDF pp. 243-244.

**Topics**
- Skip distance, cycle time, horizontal/vertical/group slowness
- Ray invariant and the ray form of the waveguide invariant
- Particle–ray (Hamiltonian, action–angle) analogy
- 3-D ray and beam tracing; Appendix 1 recipe for a simple ray code (PDF pp. 244-245)

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch10-signals-in-noise.md`

## Key sections from the TOC
- 3.1 Introduction (PDF p. 173)
- 3.2 Ray Bending (PDF p. 174)
- 3.3 Mathematical Derivation (PDF p. 176)
- 3.4 Ray Anomalies (PDF p. 193)
- 3.5 Gaussian Beams (PDF p. 198)
- 3.6 Additional Mathematical Properties (PDF p. 203)
- 3.7 Numerical Solution (PDF p. 218)
- 3.8 Extensions and Related Techniques (PDF p. 234)
- Appendix 1: Recipe for Simple Ray Code (PDF p. 244)
- Appendix 2: A Useful Property of the Jacobian (PDF p. 245)

## Research takeaways
- Use rays for geometric understanding first, then verify with wave methods when interference, shadow zones or caustics matter. COA gives no frequency threshold for ray validity, only the rule that the wavelength must be substantially smaller than every environmental scale.
- Gaussian or geometric beams remove classical ray singularities but stay asymptotic; the beam width is a user choice (COA: typically 10–50 wavelengths initially, or a $\pi\lambda$ minimum width for geometric beams).
- For generating training data with a ray code, the settings that control accuracy are the TL mode (coherent, incoherent or semicoherent), the beam type and width, the ray-fan density, and the sound-speed and bathymetry interpolation; piecewise-linear interpolation creates false caustics.

## Comparison to neighboring chapters
- Compared with `chapters/ch02-wave-propagation-theory.md`, this chapter is the high-frequency asymptotic of the same Helmholtz problem; §3.8.2 shows that the stationary-phase evaluation of the wavenumber integral is ray tracing.
- Compared with `chapters/ch05-normal-modes.md`, rays give clearer path intuition but weaker low-frequency full-wave fidelity; the WKB method links rays and modes.
- Compared with `chapters/ch06-parabolic-equations.md`, rays are lighter and more intuitive but weaker for diffraction and coherent interference.

## Good follow-on notes
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch08-broadband-modeling.md`
- `solvers/solver-bellhop.md`
- `workflows/model-selection.md`
