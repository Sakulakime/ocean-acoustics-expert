---
title: COA Chapter 5 - Normal Modes
type: chapter-note
chapter: 5
book_pages: 337-456
pdf_pages: 354-472
source_pdf: sources/jensen-2011-computational-ocean-acoustics.pdf
status: deepened
---

# COA Chapter 5 - Normal Modes

## Summary
Normal-mode methods represent the underwater field as a superposition of discrete and sometimes continuous waveguide modes. They are one of the most interpretable full-wave frameworks for low- to moderate-frequency propagation, dispersion, and range-dependent waveguide physics. The chapter derives the modal sum, works the isovelocity, Pekeris and Munk cases, covers numerical mode finding (finite differences, shooting, Sturm sequences, Prüfer mode counting), perturbation theory for attenuation and group velocity, elastic bottoms, coupled and adiabatic modes for range dependence, target scattering, 3-D horizontal refraction, and the waveguide invariant in realistic environments.

## Core problem
How to express ocean acoustic propagation in a waveguide through modal structure, then use that structure for propagation prediction, physical interpretation, and signal analysis.

## Method-selection snapshot
- Best when the environment is waveguide-like and modal structure is physically informative.
- Best for low- to moderate-frequency propagation, dispersion, group speed, and mode-coupling analysis; the mode count grows linearly with frequency, so cost rises with frequency (COA §5.7.5).
- Weak when high-frequency path geometry is the main interest or when strong range dependence breaks simple adiabatic assumptions; two-way coupled modes then serve mainly as reference solutions.

## Major subsections

### Modal expansion and Green's-function representation
The chapter rewrites the waveguide field as a sum over modes, making propagation a problem of modal eigenvalues, eigenfunctions, and excitation weights, and then shows (§5.5) how the modal sum arises from the spectral integral by contour deformation, with a branch-line integral when the bottom is a halfspace.

**Key equations** (COA §5.2–5.3, §5.5)
- Point-source Helmholtz equation, eq. (5.1), §5.2.1, PDF p. 355: $\frac{1}{r}\frac{\partial}{\partial r}\left(r\frac{\partial p}{\partial r}\right)+\rho(z)\frac{\partial}{\partial z}\left(\frac{1}{\rho(z)}\frac{\partial p}{\partial z}\right)+\frac{\omega^2}{c^2(z)}p=-\frac{\delta(r)\,\delta(z-z_s)}{2\pi r}$, where $p(r,z)$ is the pressure, $\rho(z)$ the density, $c(z)$ the sound speed, $\omega$ the angular frequency and $z_s$ the source depth.
- Modal (depth-separated) equation, eq. (5.3), §5.2.1, PDF p. 355: $\rho(z)\frac{d}{dz}\left[\frac{1}{\rho(z)}\frac{d\Psi_m(z)}{dz}\right]+\left[\frac{\omega^2}{c^2(z)}-k_{rm}^2\right]\Psi_m(z)=0$, where $\Psi_m(z)$ is the $m$-th mode shape and $k_{rm}$ its horizontal wavenumber (the eigenvalue).
- Ideal boundary conditions, eq. (5.4), §5.2.1, PDF p. 355: $\Psi(0)=0,\ \left.\frac{d\Psi}{dz}\right|_{z=D}=0$, a pressure-release surface and a perfectly rigid bottom at depth $D$.
- Orthogonality and normalization, eqs. (5.5)–(5.6), §5.2.1, PDF p. 356: $\int_0^D\frac{\Psi_m(z)\Psi_n(z)}{\rho(z)}dz=0$ for $m\neq n$ and $\int_0^D\frac{\Psi_m^2(z)}{\rho(z)}dz=1$.
- Modal sum for a point source, eq. (5.13), §5.2.1, PDF p. 357: $p(r,z)=\frac{i}{4\rho(z_s)}\sum_{m=1}^{\infty}\Psi_m(z_s)\Psi_m(z)H_0^{(1)}(k_{rm}r)$, where $H_0^{(1)}$ is the Hankel function of the first kind for the suppressed time dependence $e^{-i\omega t}$.
- Far-field modal sum, eq. (5.14), §5.2.1, PDF p. 357: $p(r,z)\simeq\frac{i}{\rho(z_s)\sqrt{8\pi r}}e^{-i\pi/4}\sum_{m=1}^{\infty}\Psi_m(z_s)\Psi_m(z)\frac{e^{ik_{rm}r}}{\sqrt{k_{rm}}}$, obtained from the large-argument form of $H_0^{(1)}$.
- Coherent transmission loss, eqs. (5.15)–(5.17), §5.2.1, PDF p. 357: $TL(r,z)\simeq-20\log\left|\frac{1}{\rho(z_s)}\sqrt{\frac{2\pi}{r}}\sum_{m=1}^{\infty}\Psi_m(z_s)\Psi_m(z)\frac{e^{ik_{rm}r}}{\sqrt{k_{rm}}}\right|$, where TL is referenced to the free-field pressure $p_0(r)=e^{ik_0r}/(4\pi r)$ at $r=1$ m (5.16).
- Incoherent transmission loss, eq. (5.18), §5.2.1, PDF p. 357: $TL_{inc}(r,z)\simeq-20\log\left[\frac{1}{\rho(z_s)}\sqrt{\frac{2\pi}{r}}\left(\sum_{m=1}^{\infty}\left|\Psi_m(z_s)\Psi_m(z)\frac{e^{ik_{rm}r}}{\sqrt{k_{rm}}}\right|^2\right)^{1/2}\right]$, which drops the cross-mode interference terms.
- Line source in plane geometry, eq. (5.26), §5.2.2, PDF p. 359: $p(x,z)=\frac{i}{2\rho(z_s)}\sum_{m=1}^{\infty}\Psi_m(z_s)\Psi_m(z)\frac{e^{ik_{xm}|x|}}{k_{xm}}$, where $k_{xm}$ is the modal wavenumber; the $1/k_{xm}$ weighting replaces the point source's $1/\sqrt{k_{rm}}$.
- Modal form of the depth Green's function, eq. (5.41), §5.3, PDF p. 361: $g(z)=\frac{1}{2\pi\rho(z_s)}\sum_m\frac{\Psi_m(z_s)\Psi_m(z)}{k_r^2-k_{rm}^2}$, whose poles at $k_r=k_{rm}$ tie the modes to the wavenumber-integration kernel of Chap. 4.
- Spectral integral that the residue sum is taken from, eq. (5.63), §5.5, PDF p. 368: $p(r,z)=\int_0^\infty G(z,z_s;k_r)J_0(k_rr)k_r\,dk_r=\frac12\int_{-\infty}^{\infty}G(z,z_s;k_r)H_0^{(1)}(k_rr)k_r\,dk_r$, where $G$ is the depth-dependent Green's function.
- Modes plus branch-line integral, eqs. (5.77)–(5.78), §5.5, PDF p. 371: $p(r,z)=\frac{i}{4\rho(z_s)}\sum_{m=1}^{M}\Psi_m(z_s)\Psi_m(z)H_0^{(1)}(k_{rm}r)-\int_{C_{EJP}}$, with modes normalized by $\int_0^D\frac{\Psi_m^2}{\rho}dz-\frac{1}{2k_{rm}}\left.\frac{d(f/g)^T}{dk_r}\right|_{k_{rm}}\Psi_m^2(0)+\frac{1}{2k_{rm}}\left.\frac{d(f/g)^B}{dk_r}\right|_{k_{rm}}\Psi_m^2(D)=1$, where $M$ is the number of poles enclosed, $C_{EJP}$ the EJP branch cut, and $f^{T,B}$, $g^{T,B}$ the top and bottom impedance functions of (5.65)–(5.66).

**Validity conditions**
- With real $\rho(z)$ and $c(z)$ the modal equation is a regular Sturm–Liouville problem: the eigenvalues $k_{rm}^2$ are real, distinct and ordered $k_{r1}^2>k_{r2}^2>\cdots$, mode $m$ has $m$ zeros in $[0,D]$, and every eigenvalue is below $\omega/c_{min}$. COA §5.2.1, PDF pp. 355-356.
- The pure mode sums (5.13) and (5.36)–(5.41) assume a complete discrete mode set (no continuous spectrum). A halfspace bottom makes the problem singular, and the field becomes a residue sum plus a branch-line integral, (5.77). COA §5.2.1, §5.3, §5.5, PDF pp. 357, 360-361, 366, 371.
- The branch-line integral can generally be neglected sufficiently far from the source; COA gives no range threshold. Using the Pekeris cut exposes leaky modes, which improve nearfield accuracy but are hard to locate reliably and can make the series diverge at some ranges and depths. COA §5.5, PDF p. 371.
- The far-field form (5.14) rests on the large-argument Hankel asymptote ($k_{rm}r\gg1$); COA gives no number. COA §5.2.1, PDF p. 357.
- Incoherent TL (5.18) suits comparisons with frequency-averaged data and bottom-interacting shallow-water modes, where poorly known bottom properties make the coherent interference pattern physically unreliable. COA §5.2.1, PDF pp. 357-358.
- Line-source TL has no established normalization convention, and its scale factor is frequency dependent: it must be removed before broadband synthesis or the pulse is distorted. COA §5.2.2, PDF p. 360.
- Multiple (degenerate) eigenvalues cannot occur in proper Sturm–Liouville problems; elasticity or complex sound speeds can produce them, but COA judges this very unlikely in practice. COA §5.5, PDF p. 370.

**Topics**
- Separation of variables in stratified waveguides
- Modal expansion of the Green's function and the completeness relation (5.36)
- Horizontal wavenumbers as modal propagation constants
- Orthogonality and normalization of mode shapes, including impedance boundaries
- Source excitation coefficients
- Residue sum plus branch-line integral; EJP versus Pekeris branch cuts; trapped and leaky modes

**Physical interpretation**
- Each mode is a stable vertical standing-wave structure that propagates horizontally with its own phase speed.
- The received field is a coherent superposition of these modal contributions.

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch08-broadband-modeling.md`

### Canonical waveguides and physical modal intuition
Simple waveguides expose how boundary conditions, sound-speed structure, and bottom properties shape the modal spectrum: the isovelocity waveguide (§5.4), the Pekeris waveguide (§5.5) and the deep-water Munk profile (§5.6).

**Key equations** (COA §5.4–5.6)
- Isovelocity eigenvalues (dispersion relation), eq. (5.46), §5.4, PDF p. 362: $k_{rm}=\sqrt{\left(\frac{\omega}{c}\right)^2-\left[\left(m-\frac12\right)\frac{\pi}{D}\right]^2},\ m=1,2,\ldots$, for constant sound speed $c$ and density, a pressure-release surface and a rigid bottom at depth $D$; the vertical wavenumbers are $k_{zm}=(m-\frac12)\pi/D$ (5.45).
- Isovelocity mode shapes, eq. (5.47), §5.4, PDF p. 362: $\Psi_m(z)=\sqrt{\frac{2\rho}{D}}\sin(k_{zm}z)$, normalized as in (5.6).
- Waveguide cutoff frequency, eq. (5.48), §5.4, PDF p. 363: $f_0=\frac{c}{4D}$, below which the ideal waveguide has no propagating mode.
- Modal interference, eqs. (5.51)–(5.53), §5.4, PDF pp. 364, 366: $I(r,z)=\frac{8\pi}{rD^2}\left[\sum_mA_m^2+2\sum_m\sum_{n>m}A_mA_n\cos(\Delta k_{mn}r)\right]$, with $\Delta k_{mn}=k_{rm}-k_{rn}$ and $A_m=\sin(k_{zm}z_s)\sin(k_{zm}z)/\sqrt{k_{rm}}$.
- Pekeris bottom decay constant, eq. (5.55), §5.5, PDF p. 367: $\gamma_b\equiv-ik_{z,b}=\sqrt{k_r^2-\left(\frac{\omega}{c_b}\right)^2}$, where $c_b$ is the bottom sound speed and $k_{z,b}$ the bottom vertical wavenumber.
- Pekeris characteristic equation, eq. (5.81), §5.5, PDF p. 372: $\tan(k_zD)=-\frac{i\rho_bk_z}{\rho\,k_{z,b}}$, where $\rho$ and $\rho_b$ are the water and bottom densities and $k_z=\sqrt{(\omega/c)^2-k_r^2}$ (5.80); it follows from the impedance condition $\frac{\rho\,\Psi(D)}{d\Psi(D)/dz}=-\frac{\rho_b}{\gamma_b}$ (5.58).
- Mode as up- and downgoing plane waves, eq. (5.82), §5.5, PDF p. 372: $p\propto\left(e^{ik_{zm}z}+e^{-ik_{zm}z}\right)e^{ik_{rm}r}$, with modal angle $\tan\theta_m=k_{zm}/k_{rm}$.
- Munk profile, eq. (5.83), §5.6, PDF p. 373: $c(z)=1500\left[1+\epsilon\left(\tilde z-1+e^{-\tilde z}\right)\right]$ m/s, with $\epsilon=0.00737$ and scaled depth $\tilde z=2(z-1300)/1300$ ($z$ in m).
- WKB mode shapes, eqs. (5.84)–(5.85), §5.6, PDF p. 374: $\Psi(z)\simeq A\frac{e^{i\int_0^zk_z\,dz}}{\sqrt{k_z(z)}}+B\frac{e^{-i\int_0^zk_z\,dz}}{\sqrt{k_z(z)}}$ with $k_z^2(z)=\frac{\omega^2}{c^2(z)}-k_r^2$; the turning points are the depths where $k_z^2(z)=0$.
- Mode loop length, eqs. (5.86)–(5.87), §5.6, PDF p. 376: $L_m=-\frac{2\pi}{dk_{rm}/dm}\simeq\frac{2\pi}{k_{rm}-k_{r(m+1)}}$, the range of one up-and-down cycle of the ray equivalent of mode $m$.

**Validity conditions**
- In the isovelocity waveguide mode $m$ propagates only while the root in (5.46) is real; otherwise it is evanescent and $k_{rm}$ is taken on the positive imaginary axis. With $c=1500$ m/s, $D=100$ m and $f=100$ Hz there are 13 propagating modes. COA §5.4, PDF pp. 363-364.
- The first mode cuts off at $f_0=c/4D$ (5.48). With attenuation all eigenvalues move into the first quadrant, so the propagating/evanescent split and the cutoff frequency become poorly defined. COA §5.4, PDF pp. 363, 366.
- Pekeris: the branch point $k_r=\omega/c_b$ corresponds to the critical angle. Modes below the critical angle are trapped and radiate nothing into the bottom; leaky modes lie above it and lose energy. A mode search for long-range problems therefore spans $\omega/c_b<k_{rm}<\omega/c_{min}$. COA §5.5, PDF p. 372; App. 1, PDF p. 463.
- Munk profile at 50 Hz over a 1600 m/s halfspace: modes 1–63 are waterborne (refracted), 64–102 bottom-bounce, 103–400 leaky. Waterborne modes alone act as an angle-limited source; adding leaky modes widens it to ±90° and recovers the Lloyd-mirror pattern. Mode 30 has $L_{30}=57.4$ km. COA §5.6, PDF pp. 373, 376.
- The WKB mode shape is singular at turning points, where the true mode is smooth. COA §5.6, PDF p. 375.

**Topics**
- Pressure-release and rigid-boundary isovelocity waveguide
- Propagating versus evanescent modes, cutoff, and mode count versus frequency
- Pekeris waveguide: trapped and leaky modes, critical angle
- Deep-water Munk modes, turning points, WKB view and the ray–mode analogy
- Relation between grazing angle and modal order

**Why it matters**
- This is the main physical bridge between abstract eigenfunctions and observable multipath or interference structure.
- It explains why shallow-water fields can often be understood in terms of a small number of dominant trapped modes.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch03-ray-methods.md`

### Numerical mode computation and mode counting
This is the implementation core of the chapter: how to compute modes reliably in realistic environments (§5.7), and how Prüfer phase arguments count modes so that none are skipped (§5.8).

**Key equations** (COA §5.7–5.8)
- Discrete modal eigenproblem, eq. (5.88), §5.7, PDF p. 378: $(\mathbf A-k_r^2\mathbf I)\mathbf x=0$, the finite-difference modal problem; the same matrix with a delta-function forcing $\mathbf b$ gives the spectral-integral system (5.89).
- Interior finite-difference equation, eq. (5.104), §5.7.1, PDF p. 380: $\Psi_{j-1}+\left[-2+h^2\left(\frac{\omega^2}{c^2(z_j)}-k_r^2\right)\right]\Psi_j+\Psi_{j+1}=0$, where $h=D/N$ is the mesh width and $\Psi_j=\Psi(z_j)$ (constant density); with the boundary rows it forms the tridiagonal problem $\mathbf C(k_r^2)\boldsymbol\Psi=0$ (5.106).
- Sturm sequence, eq. (5.115), §5.7.1.1, PDF p. 383: $p_{-1}=0,\ p_0=1,\ p_k(\lambda)=[\lambda-a_{k-1}(\lambda)]p_{k-1}(\lambda)-e_{k-1}^2p_{k-2}(\lambda)$ for $k=1,\ldots,N+1$, with $\lambda=k_r^2$; the number of sign changes in $p_0,\ldots,p_{N+1}$ equals the number of eigenvalues larger than $\lambda$.
- Richardson extrapolation, eq. (5.123), §5.7.1.3, PDF p. 385: $k_r^2(h)=k_0^2+b_2h^2+b_4h^4+\cdots$, where $k_0^2$ is the exact eigenvalue; a polynomial in $h^2$ fitted over several meshes and evaluated at $h=0$ estimates it.
- Numerov scheme, eq. (5.125), §5.7.1.3, PDF p. 386: $\left(\frac{1}{h^2}+\frac{k_{z,j-1}^2}{12}\right)\Psi_{j-1}+\left(-\frac{2}{h^2}+\frac{10k_{z,j}^2}{12}\right)\Psi_j+\left(\frac{1}{h^2}+\frac{k_{z,j+1}^2}{12}\right)\Psi_{j+1}=0$, with $k_{z,j}^2=\omega^2/c^2(z_j)-k_r^2$ (5.126).
- Density interface condition, eq. (5.129), §5.7.1.4, PDF p. 387: $\frac{1}{\rho_w}\frac{d\Psi(D)}{dz}\Big|_{water}=\frac{1}{\rho_b}\frac{d\Psi(D)}{dz}\Big|_{bottom}$, continuity of normal velocity, with pressure continuity imposed by a shared value $\Psi_N$.
- Prüfer equations, eqs. (5.148) and (5.151), §5.8, PDF pp. 397-398: $p=A\sin\phi$, $p'/a=A\cos\phi$, giving $\phi'=a\cos^2\phi+b\sin^2\phi$ and $A'=(a-b)A\sin\phi\cos\phi$, where for the standard problem $a=1$ and $b=\omega^2/c^2(z)-k^2$ (5.146); mode $m$ ends with phase $\phi(D)=m\pi$.

**Validity conditions**
- Finite-difference mesh: about 10 points per wavelength usually suffice; the Appendix 1 recipe asks for 5–10 points per wavelength of the highest mode and mesh refinements by a factor 1.5–2 for Richardson extrapolation. Only the lower-order modes are accurate; the highest modes of the matrix problem are undersampled. COA §5.7.1, PDF pp. 379, 381-382; App. 1, PDF p. 463.
- To evaluate modes at arbitrary depths by interpolation, store them at roughly half-wavelength spacing in depth. COA §5.7, PDF p. 378.
- The standard three-point scheme is $O(h^2)$; Numerov is $O(h^4)$, costs about twice the CPU time per mesh, and is typically much faster for a given accuracy. COA §5.7.1.3, PDF p. 386.
- Sturm-sequence bisection is guaranteed only for purely acoustic, lossless problems (it generalizes to trapped modes with homogeneous acoustic or elastic halfspaces). Elasticity, complex wave speeds and branch cuts break it, and no complex-plane root finder is as reliable. COA §5.7.4.1, §5.7.4.6, PDF pp. 393-395.
- One-sided shooting is unstable where the true mode decays exponentially, because the growing solution takes over, though the eigenvalue stays accurate. Shoot in the direction of growth, or use parallel or multiple shooting. COA §5.7.3, PDF pp. 391-392.
- Cost: the number of modes grows linearly with frequency; layer-matrix cost grows linearly and finite-difference cost quadratically, so layer methods win for few-layer problems at high frequency, finite differences when fine depth sampling is needed. No method is universally most efficient. COA §5.7.5, PDF pp. 396-397.
- Mode counting: if $a$ and $b$ are monotonic in $k$, so is the Prüfer phase, so the zero crossings of a trial eigenfunction count the modes above $k_{trial}$; with $k_{trial}=\min[\omega/c(z)]$ they give the number of propagating modes. This holds for trapped modes with acoustic or elastic halfspaces but has no generalization to arbitrary elastic media. COA §5.8, §5.8.1, §5.8.2, PDF pp. 398-400, 402.

**Topics**
- Finite-difference discretization, boundary rows and density interfaces
- Sturm sequences, bisection, inverse iteration and mode normalization
- Richardson extrapolation and Numerov's method
- Layer (Thomson–Haskell, Airy-function) and shooting methods
- Root finders: bisection, deflation, brute-force search, continuation, complex-plane methods
- Prüfer transformation and mode counting with top and bottom halfspaces

**Best-fit scenarios**
- Stratified environments with realistic SSP and bottom structure
- Studies that need modal amplitudes, phases, and group properties

**Limitations**
- Mode identification can be subtle near cutoff or in lossy media
- Numerical details can distort weak or closely spaced modes; nearly degenerate modes make many codes return accurate but incomplete mode sets

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`
- `workflows/model-selection.md`

### Perturbation theory, modal attenuation, and group velocity
Once the lossless modes are known, first-order perturbation theory gives the modal attenuation from volume absorption and the modal group velocity without a complex root search (§5.9).

**Key equations** (COA §5.9)
- First-order eigenvalue shift, eq. (5.173), §5.9.1, PDF p. 403: $k_{r1}^2=\int_0^D\frac{k_1^2(z)\Psi_0^2(z)}{\rho(z)}dz$, for a perturbation $k^2(z)=k_0^2(z)+\epsilon k_1^2(z)$ of the squared medium wavenumber (5.165), with $\Psi_0$ the unperturbed mode.
- Modal attenuation from volume absorption, eq. (5.176), §5.9.1, PDF p. 404: $\alpha_m=\frac{1}{k_{rm}}\int_0^D\alpha(z)\frac{\omega}{c(z)}\frac{\Psi_m^2(z)}{\rho(z)}dz$, where $k(z)=\omega/c(z)+i\alpha(z)$ is the complex medium wavenumber and $\alpha_m$ the imaginary part of $k_{rm}$.
- Bottom-tail contribution, eq. (5.180), §5.9.1, PDF p. 405: $\delta\alpha_m=\frac{\Psi_m^2(D)\,\alpha_b\,\omega}{2k_{rm}\gamma_mc_b\rho_b}$, with $\gamma_m=\sqrt{k_{rm}^2-(\omega/c_b)^2}$ (5.179) the decay constant of the mode in a homogeneous bottom of speed $c_b$, density $\rho_b$ and attenuation $\alpha_b$.
- Surface-roughness scattering loss (Kuperman–Ingenito), eq. (5.181), §5.9.1, PDF p. 405: $\gamma_m^{(scat)}=\frac{\sigma^2k_{zm}}{2\rho k_{rm}}\left[\frac{d\Psi_m(z)}{dz}\right]^2_{z=0}$, the eigenvalue perturbation from surface scattering loss, where $\sigma$ is the rms roughness of the sea surface and $k_{zm}=\sqrt{(\omega/c(0))^2-k_{rm}^2}$ (5.182) the vertical wavenumber of mode $m$ at the surface.
- Group velocity, eq. (5.183), §5.9.2, PDF p. 407: $u_n(\omega)=\frac{d\omega}{dk_{rn}}$, next to the phase velocity $v_m=\omega/k_{rm}$ (§5.4, PDF p. 362).
- Group velocity from perturbation theory, eq. (5.189), §5.9.2, PDF p. 407: $\frac{dk_r}{d\omega}=\frac{\omega}{k_r}\int_0^D\frac{\Psi_0^2(z)}{\rho(z)c^2(z)}dz$, whose reciprocal is the group velocity.

**Validity conditions**
- The method assumes small attenuation, $k^2\simeq(\omega/c)^2+2i\alpha\omega/c$ (5.174), and solves the unperturbed problem with the real wavenumber. First order is usually adequate; it is inaccurate only for modes with a very large imaginary part, which matter little because less attenuated modes dominate the field. COA §5.9.1, PDF p. 404.
- At intermediate and low frequencies water-column absorption can usually be ignored and bottom absorption dominates; (5.176) then stays valid if the integral includes the evanescent tail in the bottom, (5.177)–(5.180). COA §5.9.1, PDF pp. 404-405.
- Optimum frequency: sediment attenuation scales as $f^\beta$ with $\beta$ between 1 and 2. In COA's 100 m summer-profile example over sand ($c_b=1700$ m/s, source 10 m, receiver 50 m) the optimum is about 160 Hz at 0.1 dB/λ and about 500 Hz at 0.5 dB/λ. COA §5.9.1, PDF pp. 405-406.
- The finite-difference group velocity (5.184) needs a frequency step neither too large (truncation error) nor too small (round-off); COA gives no number. COA §5.9.2, PDF p. 407.

**Topics**
- Modal perturbation theory and the Fredholm alternative
- Modal attenuation from volume absorption and from the bottom tail
- Surface-roughness scattering loss (Kuperman–Ingenito)
- Optimum frequency in shallow water
- Group velocity, modal dispersion and travel-time spreading across modes

**Why it matters**
- This subsection is central for broadband pulse distortion and arrival-time interpretation.
- It explains why modal propagation often maps naturally into waveform spreading and interference structure.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`

### Elastic media and realistic bottoms
The chapter extends modal ideas beyond fluid waveguides to isotropic elastic bottoms (§5.10), with compressional and shear waves, a first-order stress–displacement formulation, and compound-matrix shooting.

**Key equations** (COA §5.10)
- Equations of motion and Hooke's law, eqs. (5.190)–(5.191), §5.10.1, PDF p. 408: $\rho\ddot u_i=f_i+\tau_{ji,j}$ and $\tau_{ij}=\lambda\delta_{ij}e_{kk}+2\mu e_{ij}$, where $u_i$ are displacements, $f_i$ external forces, $\tau_{ij}$ stresses, $e_{ij}$ strains (5.193), and $\lambda$, $\mu$ the Lamé constants.
- Wave speeds, eq. (5.192), §5.10.1, PDF p. 409: $c_s=\sqrt{\mu/\rho}$ and $c_p=\sqrt{(\lambda+2\mu)/\rho}$, the shear and compressional speeds.
- First-order stress–displacement system, eq. (5.198), §5.10.1, PDF p. 410: $\mathbf r'=\mathbf E(z,k)\,\mathbf r$, where $\mathbf r=(u/ik,\,w,\,\tau_{zx}/ik,\,\tau_{zz})$ (5.195) and $\mathbf E$ is the 4×4 matrix (5.199); $k$ enters only as $k^2$, so eigenvalues come in $\pm k$ pairs.
- Elastic bottom as an impedance condition, eqs. (5.210)–(5.212), §5.10.3, PDF p. 413: $f^B(k^2)\Psi(D)+g^B(k^2)\frac{d\Psi(D)}{dz}=0$ with $f^B=\omega^2y_4$, $g^B=y_2$, $y_2=r_3s_4-r_4s_3$ and $y_4=r_2s_3-r_3s_2$, where $\mathbf r$, $\mathbf s$ are two independent solutions shot up from the bottom.

**Validity conditions**
- Sediments with shear speeds below a few hundred m/s couple weakly to shear, and elastic effects are typically negligible. Where shear speeds are high, e.g. basalt under thin (<200 m) Pacific sediments with shear speeds above the water sound speed, elasticity is critical at low frequency. COA §5.10, PDF p. 408.
- Finite-difference sampling: about 10 points per wavelength, where the shorter shear wavelength sets the requirement; low-velocity materials give very short shear wavelengths. COA §5.10.2, PDF p. 411.
- Shooting with two elastic solutions fails numerically when growing exponentials make them proportional; the compound-matrix (delta-matrix) formulation (5.213)–(5.215) avoids this. COA §5.10.3, PDF pp. 413-414.
- Scholte interface modes travel at about 0.85 times the minimum shear speed; adding sediment shear creates whole families of sediment-trapped modes. COA §5.10.5, PDF pp. 417, 419.
- Love waves decouple and cannot be excited by ocean pressure waves in range-independent media. COA §5.10.1, PDF p. 409.

**Topics**
- Elastic-media modes: Rayleigh-type (u, w) and decoupled Love (v) waves
- Stress–displacement vector and acousto-elastic interface conditions (5.201)
- Finite-difference (trapezoidal, box) discretization of the elastic system
- Shooting and compound matrices; free, rigid, acoustic-halfspace and elastic-halfspace boundary conditions
- Scholte waves and sediment-trapped modes; complex modal wavenumbers with loss

**Best-fit scenarios**
- Shelf and shallow-water propagation with bottom interaction
- Problems where bottom physics changes attenuation or replica structure

**Limitations**
- Elastic detail increases modeling and interpretation burden
- Mode labeling and physical attribution become less transparent

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`

### Range dependence, adiabatic modes, and mode coupling
This is the main warning label for applying modes in realistic oceans (§5.11). As the environment changes with range, modal amplitudes and identities can evolve; the chapter builds two-way coupled modes, then simplifies to one-way coupled modes and to the adiabatic approximation.

**Key equations** (COA §5.11)
- Coupled-mode field in range segment $j$, eqs. (5.239)–(5.241), §5.11.1, PDF pp. 420-421: $p^j(r,z)=\sum_{m=1}^{M}\left[a_m^j\hat H_{1m}^j(r)+b_m^j\hat H_{2m}^j(r)\right]\Psi_m^j(z)$, with $\hat H_{1m}^j=H_0^{(1)}(k_{rm}^jr)/H_0^{(1)}(k_{rm}^jr_{j-1})$ and $\hat H_{2m}^j=H_0^{(2)}(k_{rm}^jr)/H_0^{(2)}(k_{rm}^jr_j)$ normalized outgoing and incoming Hankel functions.
- Coupling matrices, eqs. (5.248) and (5.253), §5.11.1, PDF p. 422: $\tilde c_{\ell m}=\int\frac{\Psi_\ell^{j+1}(z)\Psi_m^j(z)}{\rho^{j+1}(z)}dz$ from pressure matching and $\hat c_{\ell m}=\frac{k_{rm}^j}{k_{r\ell}^{j+1}}\int\frac{\Psi_\ell^{j+1}(z)\Psi_m^j(z)}{\rho^j(z)}dz$ from radial-velocity matching.
- Interface propagator, eq. (5.255), §5.11.1, PDF p. 422: $\begin{pmatrix}\mathbf a^{j+1}\\\mathbf b^{j+1}\end{pmatrix}=\begin{pmatrix}\mathbf R_1^j&\mathbf R_2^j\\\mathbf R_3^j&\mathbf R_4^j\end{pmatrix}\begin{pmatrix}\mathbf a^j\\\mathbf b^j\end{pmatrix}$, where $\mathbf a$, $\mathbf b$ hold the outgoing and incoming mode amplitudes and $\mathbf R_i^j$ are built from the coupling matrices (5.256).
- One-way (single-scatter) marching, eqs. (5.263)–(5.264), §5.11.2, PDF pp. 424-425: $\mathbf a^{j+1}=(\mathbf R_1-\mathbf R_2\mathbf R_4^{-1}\mathbf R_3)\mathbf a^j\approx\mathbf R_1\mathbf a^j$, assuming no incoming wave in the next segment ($\mathbf b^{j+1}=0$).
- Continuous coupled-mode equations, eqs. (5.271)–(5.273), §5.11.3, PDF p. 426: $\frac{1}{r}\frac{d}{dr}\left(r\frac{d\Phi_n}{dr}\right)+\sum_m\left(2B_{mn}\frac{d\Phi_m}{dr}+A_{mn}\Phi_m\right)+k_{rn}^2(r)\Phi_n=-\frac{\delta(r)\Psi_n(0,z_s)}{2\pi r}$, with $A_{mn}=\int\frac{1}{r}\frac{\partial}{\partial r}\left(r\frac{\partial\Psi_m}{\partial r}\right)\frac{\Psi_n}{\rho}dz$, $B_{mn}=\int\frac{\partial\Psi_m}{\partial r}\frac{\Psi_n}{\rho}dz=-B_{nm}$, and $\Phi_n(r)$ the range amplitude of local mode $\Psi_n(r,z)$ (5.266)–(5.267); derived for a density independent of range.
- Adiabatic mode field, eq. (5.279), §5.11.3, PDF p. 427: $p(r,z)\simeq\frac{i}{\rho(z_s)\sqrt{8\pi r}}e^{-i\pi/4}\sum_{m=1}^{\infty}\Psi_m(0,z_s)\Psi_m(r,z)\frac{e^{i\int_0^rk_{rm}(r')dr'}}{\sqrt{k_{rm}(r)}}$, obtained by neglecting $A_{mn}$ and $B_{mn}$, so each local mode keeps its energy and accumulates the range-integrated phase.

**Validity conditions**
- Two-way coupled modes are computationally intensive: for continuously varying properties (sloping bottoms, fronts) the range segments often must be shorter than a wavelength. They mainly serve as reference solutions for checking PE and other approximate models. COA §5.11, §5.11.1, PDF pp. 420, 423-424.
- Staircase spacing larger than λ/2 creates artificial diffraction lobes, especially in backscatter; λ/4 is considered appropriate for facet slopes up to 60°. COA §5.13.3, PDF p. 454.
- One-way marching neglects multiple interactions between segments, usually with minor loss of accuracy. Backscatter can be ignored in most 2-D problems; when it matters, one backward marching pass is enough. The approximate single-scatter recursion $\mathbf a^{j+1}=\mathbf R_1\mathbf a^j$ works nearly as well as (5.263). COA §5.11.2, PDF pp. 424-425.
- The adiabatic approximation is accurate when range dependence is "sufficiently weak"; COA states that no general quantitative criterion exists. It can fail badly: beyond a seamount it depends only on the range integral of $k_{rm}$ and cannot tell where the seamount was. In COA's 50 Hz warm-core-eddy example it reproduces the transfer of energy from the near-surface duct to the SOFAR duct but not the pattern detail. COA §5.11.3–5.11.4, PDF pp. 428-430.
- (5.279) is not reciprocal because it assumes azimuthal symmetry about the source; the translationally invariant form (5.280) is reciprocal, and in practice the two differ little. Modes must keep a consistent sign (polarity) in range, and values between computed ranges are linearly interpolated. COA §5.11.3, PDF p. 427.
- The adiabatic approximation is especially useful in shallow water, where uncertain bottom properties limit attainable accuracy anyway. COA §5.11.4, PDF p. 430.

**Topics**
- Range segmentation with stable, DGM-style Hankel normalization
- Two-way coupled-mode block system with source and radiation conditions
- One-way and single-scatter coupled modes
- Adiabatic approximation (Pierce) and its reciprocal variant
- Mode conversion in range-dependent waveguides; warm-core eddy example

**Why it matters**
- Many shallow-water and shelf-break problems live or fail here.
- Adiabatic modes are attractive computationally, but they must be justified rather than assumed.

**Cross-links**
- `chapters/ch06-parabolic-equations.md`
- `workflows/model-selection.md`

### Scattering from objects in a waveguide
The chapter treats target scattering as a mode-coupling problem (§5.12): the modal field near the object is decomposed into plane waves, each plane wave is scattered with the object's free-field plane-wave scattering function, and the result is re-expanded into waveguide modes (Ingenito's single-scatter formulation, written with the velocity potential $\psi$).

**Key equations** (COA §5.12)
- Plane-wave scattering function, eqs. (5.282)–(5.283), §5.12.2, PDF p. 431: $\psi_s(R)=\frac{e^{ikR}}{kR}S(\theta,\varphi;\theta_0,\varphi_0)$, with $\cos\beta=\sin\theta\sin\theta_0+\cos\theta\cos\theta_0\cos(\varphi-\varphi_0)$ the cosine of the angle between the incident and scattered directions.
- Waveguide scattered field for near-horizontal modes, eq. (5.307), §5.12.3, PDF p. 436: $\psi_s(\mathbf r)=\frac{i}{2k}S(0,\varphi;0,\varphi_0)\sum_m\frac{\psi_m(z)\psi_m(0)}{\sqrt{k_{rm}r}}e^{ik_{rm}r}\sum_{m'}\frac{\psi_{m'}(z_0)\psi_{m'}(0)}{\sqrt{k_{rm'}r_0}}e^{ik_{rm'}r_0}$, where the object sits at the origin, $z_0$ and $r_0$ locate the source, and the scattered field is a point source weighted by the incident modal field and the farfield scattering function.
- Soft-sphere scattering function, eq. (5.308), §5.12.3, PDF p. 437: $S_s=i\sum_n(-1)^n(2n+1)\frac{j_n(ka)}{h_n^{(1)}(ka)}P_n(\cos\beta_{mm'})$, where $a$ is the sphere radius, $j_n$ and $h_n^{(1)}$ are spherical Bessel and Hankel functions (5.310)–(5.311) and $P_n$ Legendre polynomials; the rigid sphere (5.309) uses $j_n'$ and $h_n^{(1)\prime}$.

**Validity conditions**
- The formulation is single-scatter (outgoing spherical waves only). It appears accurate enough for objects buried in sediment, but can miss weaker late multiples that carry classification information in the time domain. COA §5.12.3, PDF pp. 435, 437.
- Treating a sphere as a point scatterer is valid at ranges beyond about one sphere diameter from its centroid. COA §5.12.3, PDF p. 437.
- (5.307) assumes near-horizontal propagating modes ($k_{rm}\simeq k$, grazing angle near 0). Inside the imaginary cylinder around the object the sound speed is taken constant so the modes are plane waves; for depth-dependent profiles this remains a good approximation near the object. COA §5.12.3, PDF pp. 435-436.
- Complex or internally structured targets need FD/FE methods for the scattering function; solving propagation and scattering together with FD/FE is rarely practical because of the disparate scales. COA §5.12.2, PDF pp. 433-434.

**Topics**
- Scattering geometry and the farfield plane-wave scattering function
- Green's-theorem formulation for soft, rigid and fluid objects
- Spheres in a waveguide; non-spherical objects (5.312)–(5.313)
- Hybrid propagation–scattering modeling (Sect. 7.4.5)

**Best-fit scenarios**
- Target or object echoes in shallow-water waveguides, at ranges well beyond the object size
- Bistatic scattering studies where the modal redistribution of energy is the quantity of interest

**Limitations**
- Single-scatter and point-scatterer assumptions weaken for objects close to interfaces and for time-domain detail

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`

### Three-dimensional environments and horizontal refraction
The later parts generalize modal thinking to 3-D environments (§5.13): N×2-D adiabatic runs on a triangulated mode grid, horizontal refraction equations for each mode, global-scale propagation, and spectral coupled modes around seamounts.

**Key equations** (COA §5.13)
- 3-D Helmholtz equation, eq. (5.314), §5.13.1, PDF p. 440: $\rho\nabla\cdot\left(\frac{1}{\rho}\nabla p\right)+\frac{\omega^2}{c^2(x,y,z)}p=-\delta(x)\delta(y)\delta(z-z_s)$.
- Local-mode expansion, eq. (5.316), §5.13.1, PDF p. 442: $p(x,y,z)=\sum_m\Phi_m(x,y)\Psi_m(x,y,z)$, where $\Psi_m(x,y,z)$ are the local modes at horizontal position $(x,y)$.
- Horizontal refraction equation, eq. (5.320), §5.13.1, PDF p. 443: $\frac{\partial^2\Phi_n}{\partial x^2}+\frac{\partial^2\Phi_n}{\partial y^2}+k_{rn}^2(x,y)\Phi_n=-\Psi_n(z_s)\delta(x)\delta(y)$, obtained by neglecting the coupling matrices $A$, $B$, $C$ of (5.318)–(5.319); $k_{rn}(x,y)$ acts as a horizontal index of refraction for mode $n$.
- Modal travel time along a horizontal ray, eq. (5.321), §5.13.2, PDF p. 445: $t_m=\int_0^S\frac{\omega}{k_{rm}}\int_0^D\frac{1}{\rho(z)}\left(\frac{\Psi_m(z)}{c(z)}\right)^2dz\,ds$, where $s$ is arc length along the horizontal ray.
- Spectral coupled-mode field outside a seamount, eq. (5.326), §5.13.3.2, PDF p. 449: $p(r,\varphi,z)=p_i(r',z)+\sum_{m=0}^{\infty}\sum_{n=1}^{\infty}a_{mn}^J\hat H_m^{(1)}(k_{rn}^Jr)\Psi_n^J(z)\Phi_m(\varphi)$, the incident field plus a scattered field expanded in azimuthal orders $m$ and vertical modes $n$.
- Scattered mode amplitude, eq. (5.337), §5.13.3.3, PDF p. 452: $A_n(\varphi)=\sum_{m=0}^{\infty}a_{mn}^J\Phi_m(\varphi)$, the azimuthal source strength of mode $n$ scattered by the seamount.

**Validity conditions**
- N×2-D (independent radial runs) ignores horizontal refraction and is generally adequate. The largest horizontal refraction comes from bottom topography rather than from oceanographic features. COA §5.13, §5.13.1, PDF pp. 440, 443.
- At global ranges (about 20000 km, Perth to Bermuda) the ellipsoidal Earth displaces the geodesic up to 800 km from the great circle and adds about 30 s of travel time, against a required accuracy of 5–10 s; geodesic paths and horizontal refraction must be modeled. COA §5.13.2, PDF pp. 443-444.
- Seamounts (COA's 10 Hz, 5000 m Munk example): N×2-D coupled modes capture a 1000 m seamount but underestimate the shadow behind a 3800 m one. Ring sectors must be spaced below λ/2 to avoid artificial diffraction lobes (λ/4 for facet slopes up to 60°); 128 sectors (spacing about 4λ/3) produce backscatter lobes, which randomized spacing reduces. COA §5.13.3, PDF pp. 450-455.
- Mode sets can be computed on a coarse horizontal grid or triangulation and interpolated (bilinear within triangles). COA §5.13, PDF p. 440.

**Topics**
- N×2-D adiabatic fields on triangulated mode grids (Gulf Stream example)
- Horizontal refraction equations and their solution by ray, mode, spectral or PE methods
- Global propagation, geodesics and modal group delay
- 3-D spectral coupled modes around seamounts; discretization and randomized sectors

**Best-fit scenarios**
- Cases where 2-D vertical-slice assumptions break down because of strong lateral bathymetry or long ranges
- Analysis of out-of-plane scattering and shadowing behind seamounts

**Limitations**
- Full 3-D coupling is expensive and sensitive to azimuthal and radial discretization

**Cross-links**
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch10-signals-in-noise.md`

### Waveguide invariant and dispersion in realistic environments
The chapter closes with the waveguide invariant and modal dispersion in realistic, range-dependent environments (§5.14), building on the ideal and Pekeris treatments of §2.4.6 and the ray results of §3.8.3.

**Key equations** (COA §5.14)
- Waveguide invariant, eq. (5.342), §5.14, PDF p. 457: $\frac{1}{\beta}\equiv-\frac{dS_g}{dS_p}=-\frac{v^2}{u^2}\frac{du}{dv}$, where $S_g=1/u$ and $S_p=1/v$ are group and phase slowness and $u$, $v$ the horizontal group and phase speeds.
- Range-averaged group slowness, eqs. (5.343)–(5.344), §5.14.2, PDF p. 459: $\bar S_{gn}(r,\omega)=\frac{\partial}{\partial\omega}\left[\frac{1}{r}\int_0^rk_{rn}(r',\omega)dr'\right]$ and $\langle u_n(r,\omega)\rangle=1/\bar S_{gn}(r,\omega)$, the effective group speed of mode $n$ in the adiabatic approximation.
- Effective group speed over segments, eq. (5.345), §5.14.2, PDF p. 459: $\frac{1}{\langle u_n(r,\omega)\rangle}=\frac{1}{r}\sum\frac{\Delta r'_n}{u_n(r',\omega)}$, summed over range-independent subintervals $\Delta r'_n$.
- Local modal group slowness, eq. (5.346), §5.14.2, PDF p. 459: $\frac{\partial k_{rn}}{\partial\omega}=\frac{1}{u_n(\omega)}=\frac{\omega}{k_{rn}(\omega)}\int_0^\infty\frac{\Psi_n^2(\omega;z)}{\rho(z)c^2(z)}dz$.
- Range-dependent invariant, eq. (5.350), §5.14.3, PDF p. 461: $\frac{1}{\beta(r)}=-\frac{\partial\bar S_g}{\partial S_p}=\frac{\partial\overline{\Delta k}_{mn}/\partial\omega}{\Delta k_{mn}(r_e)/\omega}$, where $\overline{\Delta k}_{mn}$ is the range-averaged wavenumber difference of a mode pair and $\Delta k_{mn}(r_e)$ its value where the range change occurs.

**Validity conditions**
- β > 0 for reflection-dominated propagation (shallow water and deep-water bottom-bounce paths, where lower modes arrive first) and β < 0 for refraction-dominated propagation (deep refracted paths, where higher modes arrive first). An environment supporting both has a variable β, as in a 1000 Hz shallow-water summer profile whose thermocline refracts some paths. COA §5.14, §5.14.1, §5.14.2, PDF pp. 455-459.
- β is invariant only within the mode group and frequency interval about which (2.212) is linearized; changing either changes β. COA §5.14.2, PDF p. 459.
- In range-dependent environments β stays meaningful only while modes keep their identity, i.e. under the adiabatic approximation. COA §5.14.3, PDF p. 460.
- Chapter 5 gives no typical numerical value for β. COA §5.14, PDF pp. 455-462.

**Topics**
- Group versus phase speed in reflection- and refraction-dominated environments
- Variable waveguide invariant in thermocline and deep-water environments
- Range-dependent group speed with adiabatic modes
- Waveguide invariant for range- and azimuth-dependent environments (5.351)

**Best-fit scenarios**
- Structured analysis of interference striations and broadband dispersion
- Broadband or array-processing problems tied to modal dispersion, including moving sources

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch03-ray-methods.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`

## Key sections from the TOC
- 5.1 Introduction (PDF p. 354)
- 5.2 Mathematical Derivation (PDF p. 355)
- 5.3 Modal Expansion of the Green's Function (PDF p. 360)
- 5.4 The Isovelocity Problem (PDF p. 361)
- 5.5 A Generalized Derivation (PDF p. 366)
- 5.6 A Deep Water Problem: The Munk Profile (PDF p. 373)
- 5.7 Numerical Approaches (PDF p. 377)
- 5.8 Prüfer Transformations and Mode Counting (PDF p. 397)
- 5.9 Modal Perturbation Theory (PDF p. 402)
- 5.10 Elastic Media (PDF p. 408)
- 5.11 Normal Modes for Range-Dependent Environments (PDF p. 419)
- 5.12 Scattering from Objects in a Waveguide (PDF p. 430)
- 5.13 Normal Modes for 3-D Varying Environments (PDF p. 440)
- 5.14 Waveguide Invariant and Dispersion for Realistic Environments (PDF p. 455)
- Appendix 1: Recipe for Simple Mode Code (PDF p. 462)
- Appendix 2: Evaluation of the Normalization Term (PDF p. 464)

## Research takeaways
- Normal modes are often the clearest full-wave language for waveguide physics, especially in shallow water and deep sound channels.
- Broadband interpretation depends heavily on modal group velocity and dispersion, not just transmission loss.
- In range-dependent environments, the main methodological question is often not "modes or not" but "adiabatic or coupled modes"; COA offers no general quantitative criterion for the adiabatic approximation, so it has to be checked against coupled modes or PE for the environment at hand.
- For generating training data, the numerical settings that control accuracy are the depth mesh (about 10 points per wavelength, Richardson extrapolation), the mode set retained (waterborne, bottom-bounce, leaky), and the range discretization of coupled modes (below λ/2).

## Comparison to neighboring chapters
- Compared with `chapters/ch03-ray-methods.md`, modes give weaker path intuition but much better low-frequency coherent waveguide fidelity.
- Compared with `chapters/ch04-wavenumber-integration.md`, modes solve the unforced version of the same depth equation; the residue sum plus branch-line integral is the bridge between the two (§5.5).
- Compared with `chapters/ch06-parabolic-equations.md`, modes are often more interpretable in stratified waveguides but less natural for strongly range-dependent forward marching.
- Compared with `chapters/ch08-broadband-modeling.md`, this chapter supplies one of the main narrowband foundations that broadband synthesis builds on.

## Good follow-on notes
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`
- `solvers/solver-kraken.md`
- `workflows/model-selection.md`
