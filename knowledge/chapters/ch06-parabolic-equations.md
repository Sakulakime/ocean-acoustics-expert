---
title: COA Chapter 6 - Parabolic Equations
type: chapter-note
chapter: 6
book_pages: 457-530
pdf_pages: 473-545
source_pdf: sources/jensen-2011-computational-ocean-acoustics.pdf
status: deepened
---

# COA Chapter 6 - Parabolic Equations

## Summary
Parabolic-equation (PE) methods replace the elliptic Helmholtz equation by a one-way wave equation that is marched outward in range. COA calls the PE the most popular wave-theory technique for range-dependent ocean acoustics. The chapter derives the PE family from approximations of one square-root operator, quantifies the phase errors that set each form's angular aperture, and covers the elastic PE, starting fields, split-step Fourier and implicit finite-difference solutions, energy conservation at sloping interfaces, and 3-D PEs.

## Core problem
How to compute coherent underwater propagation efficiently in range-dependent environments while retaining interference, diffraction, and phase structure beyond geometric acoustics.

## Method-selection snapshot
- Best for forward propagation in range-dependent environments where coherent full-wave structure matters.
- Best for long-range transmission-loss prediction, replica-field generation, and practical shallow-water modeling.
- The angular aperture is set by the square-root approximation: about 10-15° for the standard PE, about 20° for the split-step Thomson–Chapman form, and roughly 25-75° for the Claerbout, Greene and Padé forms depending on the phase-error tolerance, approaching ±90° with more Padé terms.
- Weak when backscatter matters, when propagation angles exceed the chosen approximation, or when a stair-stepped sloping interface with strong impedance contrast needs an energy-conserving interface condition.

## Major subsections

### Derivation of the PE and the one-way approximation
The chapter starts from the Helmholtz equation, factors out an outgoing Hankel function, and derives the standard PE with a paraxial approximation. It then factors the elliptic envelope equation into outgoing and incoming parts and keeps the outgoing one-way equation, the parent of every PE form in the chapter.

**Key equations** (COA §6.2–6.2.2)
- 3-D Helmholtz equation, eq. (6.1), §6.2, PDF p. 474: $\frac{1}{r}\frac{\partial}{\partial r}\left(r\frac{\partial p}{\partial r}\right)+\frac{1}{r^2}\frac{\partial^2 p}{\partial\varphi^2}+\frac{\partial^2 p}{\partial z^2}+\frac{\omega^2}{c^2(r,\varphi,z)}p=0$, where $p$ is the acoustic pressure, $(r,\varphi,z)$ are range, azimuth and depth, $\omega$ is the angular frequency and $c$ is the sound speed of a constant-density medium.
- 2-D Helmholtz equation, eq. (6.2), §6.2, PDF p. 474: $\frac{\partial^2 p}{\partial r^2}+\frac{1}{r}\frac{\partial p}{\partial r}+\frac{\partial^2 p}{\partial z^2}+k_0^2n^2p=0$, where $k_0=\omega/c_0$ is a reference wavenumber and $n(r,z)=c_0/c(r,z)$ is the index of refraction (azimuthal symmetry assumed).
- Envelope substitution, eqs. (6.3) and (6.5), §6.2.1, PDF pp. 474-475: $p(r,z)=\psi(r,z)\,H_0^{(1)}(k_0r)$ with $H_0^{(1)}(k_0r)\simeq\sqrt{\frac{2}{\pi k_0r}}\,e^{i(k_0r-\pi/4)}$ for $k_0r\gg1$, where $\psi$ is an envelope assumed to vary slowly in range.
- Far-field elliptic equation, eq. (6.7), §6.2.1, PDF p. 475: $\frac{\partial^2\psi}{\partial r^2}+2ik_0\frac{\partial\psi}{\partial r}+\frac{\partial^2\psi}{\partial z^2}+k_0^2(n^2-1)\psi=0$, where $\psi$ is the envelope of (6.3).
- Paraxial approximation and standard PE, eqs. (6.8)-(6.9), §6.2.1, PDF p. 475: $\frac{\partial^2\psi}{\partial r^2}\ll2ik_0\frac{\partial\psi}{\partial r}$ reduces (6.7) to $2ik_0\frac{\partial\psi}{\partial r}+\frac{\partial^2\psi}{\partial z^2}+k_0^2(n^2-1)\psi=0$, the Hardin–Tappert standard PE.
- Operator factorization, eqs. (6.10)-(6.12), §6.2.2, PDF p. 476: with $P=\partial/\partial r$ and $Q=\sqrt{n^2+\frac{1}{k_0^2}\frac{\partial^2}{\partial z^2}}$, (6.7) is $[P^2+2ik_0P+k_0^2(Q^2-1)]\psi=0$, which factors as $(P+ik_0-ik_0Q)(P+ik_0+ik_0Q)\psi-ik_0[P,Q]\psi=0$, where $[P,Q]=PQ-QP$ is the commutator, zero when $n=n(z)$.
- One-way wave equation, eq. (6.14), §6.2.2, PDF p. 476: $\frac{\partial\psi}{\partial r}=ik_0\left(\sqrt{n^2+\frac{1}{k_0^2}\frac{\partial^2}{\partial z^2}}-1\right)\psi$, the outgoing factor of (6.12); each PE approximates its pseudo-differential square-root operator $Q$.

**Validity conditions**
- The standard PE (6.9) is considered accurate only for propagation within 10-15° of the horizontal. COA §6.2.2, PDF p. 476.
- The paraxial step assumes the envelope varies slowly over a wavelength, $\partial\psi/\partial r\ll\psi/\lambda\sim ik_0\psi$, because the main range dependence sits in the Hankel factor $e^{ik_0r}$. COA §6.2.1, PDF p. 475.
- The one-way equation (6.14) rests on three assumptions: far field ($k_0r\gg1$), a negligible commutator $[P,Q]$, and negligible backscattering; the last two generally limit it to "weak" range dependence. COA §6.2.2, PDF pp. 476-477.
- For range-independent media the commutator vanishes and (6.14) is exact within the far-field approximation. COA §6.2.2, PDF p. 476.

**Topics**
- Helmholtz equation in cylindrical coordinates and its 2-D, azimuthally symmetric form
- Hankel-function envelope and the far-field approximation
- Paraxial (small-angle) approximation and the standard PE
- Factorization into outgoing and incoming parts; the commutator term
- The one-way equation as the parent of all PE forms; PEs still satisfy reciprocity (COA §6.2.3, PDF p. 481)

**Physical interpretation**
- PE keeps forward wave evolution while discarding backward-traveling content.
- It is a wave method, not a geometric approximation, so it captures interference and diffraction within its angular validity.

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch03-ray-methods.md`

### Square-root operator approximations
Every practical PE replaces the square-root operator $Q$ of (6.14) by a solvable approximation. The approximation fixes both the angular aperture and which numerical method can march the equation.

**Key equations** (COA §6.2.3)
- Abbreviations, eqs. (6.15)-(6.16), §6.2.3, PDF p. 477: $\varepsilon=n^2-1$, $\mu=\frac{1}{k_0^2}\frac{\partial^2}{\partial z^2}$, $q=\varepsilon+\mu$ and $Q=\sqrt{1+q}$, where $n$ is the index of refraction and $k_0$ the reference wavenumber.
- Taylor expansion, eq. (6.17), §6.2.3, PDF p. 477: $\sqrt{1+q}=1+\frac{q}{2}-\frac{q^2}{8}+\frac{q^3}{16}-\cdots$, where $q$ is the operator of (6.15).
- Operator as a propagation angle, eqs. (6.23) and (6.25), §6.2.3, PDF p. 478: with Snell's law $\cos\theta_0/\cos\theta=n$, $q=-\sin^2\theta_0$, where $\theta_0$ is the propagation angle at the source depth when $c_0$ is the source sound speed and $\theta$ the local angle.
- Rational-linear approximation, eqs. (6.28)-(6.31), §6.2.3, PDF pp. 478-479: $\sqrt{1+q}\simeq\frac{a_0+a_1q}{b_0+b_1q}$, where $(a_0,a_1,b_0,b_1)$ is $(1,0.5,1,0)$ for Tappert (6.29), $(1,0.75,1,0.25)$ for Claerbout (6.30) and $(0.99987,0.79624,1,0.30102)$ for Greene (6.31).
- General rational-linear PE, eq. (6.32), §6.2.3, PDF p. 479: $A_1\frac{\partial\psi}{\partial r}+A_2\frac{\partial^3\psi}{\partial z^2\partial r}=A_3\psi+A_4\frac{\partial^2\psi}{\partial z^2}$, where $A_1=b_0+b_1(n^2-1)$, $A_2=b_1/k_0^2$, $A_3=ik_0[(a_0-b_0)+(a_1-b_1)(n^2-1)]$ and $A_4=i(a_1-b_1)/k_0$.
- Padé series, eqs. (6.33)-(6.35), §6.2.3, PDF p. 480: $\sqrt{1+q}=1+\sum_{j=1}^{m}\frac{a_{j,m}q}{1+b_{j,m}q}+O(q^{2m+1})$, where $m$ is the number of terms, $a_{j,m}=\frac{2}{2m+1}\sin^2\frac{j\pi}{2m+1}$ and $b_{j,m}=\cos^2\frac{j\pi}{2m+1}$.
- Padé(1) and Padé(2), eqs. (6.36)-(6.37), §6.2.3, PDF p. 480: $\sqrt{1+q}\simeq1+\frac{0.50q}{1+0.25q}$ (equivalent to Claerbout) and $\sqrt{1+q}\simeq1+\frac{0.13820q}{1+0.65451q}+\frac{0.36180q}{1+0.09549q}$, where $q$ is the operator of (6.15).
- Very-wide-angle Padé PE, eq. (6.38), §6.2.3, PDF p. 480: $\frac{\partial\psi}{\partial r}=ik_0\sum_{j=1}^{m}\frac{a_{j,m}\left(n^2-1+\frac{1}{k_0^2}\frac{\partial^2}{\partial z^2}\right)}{1+b_{j,m}\left(n^2-1+\frac{1}{k_0^2}\frac{\partial^2}{\partial z^2}\right)}\psi$, where $a_{j,m},b_{j,m}$ are the coefficients of (6.34)-(6.35).
- Feit–Fleck / Thomson–Chapman splitting, eqs. (6.40)-(6.41), §6.2.3, PDF p. 481: $Q\simeq\sqrt{1+\mu}+\sqrt{1+\varepsilon}-1$, exact for a uniform medium ($\varepsilon=0$), giving $\frac{\partial\psi}{\partial r}=ik_0\left(n-2+\sqrt{1+\frac{1}{k_0^2}\frac{\partial^2}{\partial z^2}}\right)\psi$.

**Validity conditions**
- The Taylor expansion (6.17) converges only for $|q|<1$; since $q=-\sin^2\theta_0$, small $q$ means near-horizontal propagation and the expansion is a paraxial approximation. COA §6.2.3, PDF pp. 477-478.
- Greene's coefficients minimize phase error over 0-40°; optimizing over another interval changes them. COA §6.2.3, PDF p. 479.
- The Tappert, Claerbout and Greene forms have limited accuracy beyond ±40° from the main propagation direction, which need not be horizontal. COA §6.2.3, PDF p. 479.
- Of the rational-linear forms only the Tappert equation ($A_2=0$ in (6.32)) can be marched by split-step Fourier; the general form needs finite differences or finite elements. COA §6.2.3, PDF p. 479.
- Padé(2) is accurate to nearly 55° from the main direction; more terms approach the full ±90°; Collins found fewer than five terms adequate for most ocean-acoustic problems. COA §6.2.3, PDF p. 480.
- The Padé series is not the optimal approximant for minimizing phase error over a wide angle range (Halpern and Trefethen), but it is most accurate in the main propagation direction. COA §6.2.3, PDF pp. 479-480.
- The Thomson–Chapman PE (6.41) and the LOGPE (6.42) can be split-stepped and are more wide-angled than the standard PE (about ±20°); every true wide-angle PE (>20°) has the form (6.32) or (6.38) and needs FD or FE. COA §6.2.3, PDF p. 481.

**Topics**
- Taylor versus rational-function (Padé) approximation of the square-root operator
- Tappert, Claerbout and Greene coefficient sets
- Bamberger et al. Padé series, first implemented by Collins, and very-wide-angle PEs
- Feit–Fleck / Thomson–Chapman splitting and Berman's LOGPE for split-step codes

**Why it matters**
- A PE's name (standard, Claerbout, Greene, Padé($m$)) is shorthand for its approximation of $\sqrt{1+q}$, which fixes its aperture and its admissible solvers.
- Wide-angle claims should always be tied to the actual approximation a code uses.

**Cross-links**
- `solvers/solver-ram.md`
- `workflows/model-selection.md`

### Phase errors and angular limitations
COA quantifies each approximation's aperture by propagating one normal mode of a stratified medium through the PE and comparing its phase with the exact Helmholtz phase.

**Key equations** (COA §6.2.4)
- Depth-separated PE equation, eq. (6.47), §6.2.4, PDF p. 482: $\frac{d^2\Psi}{dz^2}+[k^2(z)-k_{rm}^2]\Psi=0$, where $\Psi$ is a mode shape, $k(z)$ the medium wavenumber and $k_{rm}$ the separation constant; it is the normal-mode depth equation (5.3), so rational-linear PEs carry each mode with the correct shape and amplitude.
- Claerbout modal phase, eq. (6.50), §6.2.4, PDF p. 483: $p(r,z)=p(r_0,z)\sqrt{\frac{r_0}{r}}\exp\left[ik_0\frac{k_0^2+3k_{rm}^2}{3k_0^2+k_{rm}^2}(r-r_0)\right]$ instead of the exact $\exp[ik_{rm}(r-r_0)]$, where $k_{rm}$ is the modal horizontal wavenumber.
- Phase functions versus angle, eqs. (6.54)-(6.58), §6.2.4, PDF p. 484: exact $Q=\sqrt{1-\sin^2\theta}$; Tappert $Q_1=1-\frac{\sin^2\theta}{2}$; Claerbout/Padé(1) $Q_2=\frac{1-0.75\sin^2\theta}{1-0.25\sin^2\theta}$; Greene $Q_3=\frac{0.99987-0.79624\sin^2\theta}{1-0.30102\sin^2\theta}$; Padé(2) $Q_4=1-\frac{0.13820\sin^2\theta}{1-0.65451\sin^2\theta}-\frac{0.36180\sin^2\theta}{1-0.09549\sin^2\theta}$, where $\theta$ is the angle from the main propagation direction and the phase error is $|Q-Q_i|$.

**Validity conditions**
- With an acceptable phase error $|Q-Q_i|$ of 0.002 the angle limits are about 20° (Tappert), 35° (Claerbout, Padé(1)), 45° (Greene), 55° (Padé(2)) and 75° (Padé(5)). COA §6.2.4, PDF pp. 484-485.
- With an acceptable phase error of 0.0002 they shrink to about 10°, 25°, 40°, 45° and 70°, respectively. COA §6.2.4, PDF pp. 484-485.
- The error grows with angle for the Tappert, Claerbout and Padé equations, while Greene's error is of equal size over 0-40°; Padé(5) keeps small errors within ±60°, extendable toward ±90° with more terms. COA §6.2.4, PDF p. 484.
- The phase error depends on the choice of $k_0$: $k_0=k_{rm}$ removes it for mode $m$ only. COA §6.2.4, PDF p. 483.
- The analysis assumes a stratified medium, $n=n(z)$. COA §6.2.4, PDF p. 482.
- PE Workshop test (Pekeris waveguide 100 m deep, source and receiver at 99.5 m, water 1500 m/s, bottom 1590 m/s with critical angle 19.4°, density ratio 1.2, 0.5 dB/λ, 250 Hz): its 11 modes span 1.7-18.5°, the standard PE matches the FFP reference poorly and the Claerbout PE with a modal starter is accurate. COA §6.2.4, PDF pp. 484-485.

**Topics**
- Single-mode phase-error analysis after McDaniel
- Phase functions of the Tappert, Claerbout, Greene and Padé forms
- Angle limits for two phase-error tolerances (Fig. 6.1)
- Narrow- versus wide-angle PE on the PE Workshop Pekeris test (Fig. 6.2)

**Why it matters**
- PE accuracy is often limited less by coding than by mismatch between propagation angles and the chosen approximation.
- The aperture is not a fixed property of a PE: it depends on the phase-error tolerance an application accepts.

**Cross-links**
- `workflows/model-selection.md`
- `chapters/ch05-normal-modes.md`

### Elastic PE and boundary complexity
COA briefly outlines Collins's elastic PE: Greene's reformulation of the elastic equations in dilatation and vertical displacement makes the operator factorable, and a Padé expansion with stability constraints makes it marchable.

**Key equations** (COA §6.3)
- Dilatation, eq. (6.61), §6.3, PDF p. 486: $\Delta=\frac{\partial u}{\partial r}+\frac{\partial w}{\partial z}$, where $u$ and $w$ are the horizontal and vertical displacements in the far-field elastic equations (6.59)-(6.60) with density $\rho$ and Lamé constants $\lambda,\mu$.
- Factorable elastic system, eq. (6.63), §6.3, PDF p. 487: $\mathbf{L}\frac{\partial^2}{\partial r^2}(\Delta,w)^{T}+\mathbf{M}(\Delta,w)^{T}=0$, where $\mathbf{L}$ and $\mathbf{M}$ are matrices of depth operators that commute with $\partial/\partial r$.
- Outgoing elastic factor, eqs. (6.64)-(6.65), §6.3, PDF p. 487: $\frac{\partial}{\partial r}(\Delta,w)^{T}=ik_0\sqrt{\mathbf{I}+\mathbf{X}}\,(\Delta,w)^{T}$ with $\mathbf{X}=k_0^{-2}(\mathbf{L}^{-1}\mathbf{M}-k_0^2\mathbf{I})$, where $k_0$ is the reference wavenumber and $\mathbf{I}$ the identity matrix.
- Elastic Padé PE, eqs. (6.66)-(6.67), §6.3, PDF pp. 487-488: $\sqrt{1+q}\simeq1+\sum_{j=1}^{m}\frac{a_{2j-1,m}q}{1+a_{2j,m}q}$ gives $\frac{\partial}{\partial r}(\Delta,w)^{T}=ik_0\left\{1+\sum_{j=1}^{m}\frac{a_{2j-1,m}(\mathbf{L}^{-1}\mathbf{M}-k_0^2\mathbf{I})}{k_0^2\mathbf{I}+a_{2j,m}(\mathbf{L}^{-1}\mathbf{M}-k_0^2\mathbf{I})}\right\}(\Delta,w)^{T}$, where the $a_{i,m}$ are Padé coefficients chosen for accuracy and stability.

**Validity conditions**
- Bamberger et al.'s Padé coefficients give accuracy but not stability for the elastic PE, because some evanescent-mode eigenvalues of elastic waveguides have negative real parts; stability requires the rational function to map the squared eigenvalues into the upper half of the complex plane. COA gives no numerical threshold. COA §6.3, PDF p. 487.
- Collins's tabulated coefficients enforce one stability constraint; they are stable for most problems and nearly as accurate as Bamberger et al.'s. COA §6.3, PDF p. 487.
- Collins's solution of (6.69) uses finite differences in depth, valid for piecewise-continuous depth variation, and Crank–Nicolson integration in range. COA §6.3, PDF p. 488.
- On sloping elastic bottoms (water 600 m deep shoaling at 3.6° to 100 m, shear speeds 800 and 1200 m/s, 15 Hz), shear changes TL by 10-15 dB for bottom 1 and by 40-50 dB for bottom 2 at longer ranges; the one-way elastic PE matched a two-way FE reference at about one hundredth of the cost. COA §6.9.4, PDF pp. 533-534.

**Topics**
- Greene's $(\Delta,w)$ formulation of the far-field elastic equations
- Padé coefficients with accuracy and stability constraints (Wetton and Brooke; Collins)
- Splitting solution of the elastic PE, eqs. (6.68)-(6.69)
- Benchmarks: the PE Workshop II elastic wedge and the sloping elastic bottoms of §6.9.4
- Fluid layering and density jumps are handled in §6.5.4 and §6.6.1, not in §6.3

**Best-fit scenarios**
- Range-dependent environments with bottom sensitivity
- Shelf and shallow-water propagation where seabed shear changes the field materially

**Limitations**
- COA only outlines the elastic PE and refers to Collins and co-workers for details
- Validation against other solvers becomes more important as interfaces get richer

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`

### Starting fields and source representation
A range-marching PE needs the complex field over depth at the starting range. COA treats numerical starters (normal modes, the PE self-starter) and analytical starters (Gaussian, Greene, Thomson, generalized Gaussian), and shows that a starter must be matched to the propagator's aperture.

**Key equations** (COA §6.4)
- Pressure from the envelope and TL, eqs. (6.70)-(6.71), §6.4.1.1, PDF p. 489: $p(r,z)=\frac{\psi(r,z)}{\sqrt r}e^{i(k_0r-\pi/4)}$ and $\mathrm{TL}=-20\log\frac{|\psi|}{\sqrt r}$, where the starter is normalized to the point-source level at 1 m.
- Modal starter, eq. (6.73), §6.4.1.1, PDF p. 490: $\psi(0,z)=\frac{\sqrt{2\pi}}{\rho(z_s)}\sum_{m=1}^{M}\frac{\Psi_m(z_s)\Psi_m(z)}{\sqrt{k_{rm}}}$, where $\Psi_m$ and $k_{rm}$ are the mode shapes and horizontal wavenumbers, $z_s$ is the source depth and $\rho(z_s)$ the density there.
- Self-starter source condition, eqs. (6.75)-(6.77), §6.4.1.2, PDF p. 491: for a line source in plane geometry the outgoing PE is $\frac{\partial}{\partial x}(\Delta,w)^{T}=i(\mathbf{L}^{-1}\mathbf{M})^{1/2}(\Delta,w)^{T}$ and the source becomes $\mathbf{L}(\mathbf{L}^{-1}\mathbf{M})^{1/2}(\Delta,w)^{T}=(-\tfrac12 i\,\delta(z-z_0),0)^{T}$, where $z_0$ is the source depth and $\mathbf{L},\mathbf{M}$ are the depth operators of §6.3.
- Gaussian source, eqs. (6.82), (6.100) and (6.101), §6.4.2.1, PDF pp. 492-494: $\psi(0,z)=A\,e^{-(z-z_s)^2/W^2}$ with $A=\sqrt{k_0}$ and $W=\sqrt2/k_0$, i.e. $\psi(0,z)=\sqrt{k_0}\,e^{-\frac{k_0^2}{2}(z-z_s)^2}$, where $W$ is the beamwidth and $z_s$ the source depth.
- Greene's source, eq. (6.102), §6.4.2.2, PDF p. 495: $\psi(0,z)=\sqrt{k_0}\,[1.4467-0.4201k_0^2(z-z_s)^2]\,e^{-k_0^2(z-z_s)^2/3.0512}$, where $z_s$ is the source depth.
- Thomson's halfspace source, eq. (6.103), §6.4.2.3, PDF p. 495: $\psi(0,k_z)=\sqrt{\frac{8\pi}{k_0}}\,\sin(k_zz_s)\left(1-\frac{k_z^2}{k_0^2}\right)^{-1/4}$ for $0\le|k_z|\le k_0\sin\theta_1$ and zero outside, with $\psi(0,z)=\mathcal{F}^{-1}\{\psi(0,k_z)\}$, where $k_z$ is the vertical wavenumber and $\theta_1$ the half-beamwidth.
- Generalized Gaussian source, eq. (6.107), §6.4.2.4, PDF p. 496: $\psi(0,z)=\sqrt{k_0}\tan\theta_1\,e^{-\frac{k_0^2}{2}(z-z_s)^2\tan^2\theta_1}\,e^{ik_0(z-z_s)\sin\theta_2}$, where $\theta_1$ is the 1/e aperture half-width and $\theta_2$ the beam tilt, positive downward; $\theta_1=45°$ gives (6.101).
- Surface image, eq. (6.108), §6.4.2.4, PDF p. 496: $\psi(0,z)=\psi(0,z-z_s)-\psi(0,z+z_s)$, which enforces $\psi=0$ at the sea surface for an analytic starter.

**Validity conditions**
- The modal starter assumes local range independence near the source; keeping only the discrete modes limits the source spectrum to a half-width $\theta_1=\arccos(c_0/c_{\max})$, where $c_0$ is the source sound speed and $c_{\max}$ the maximum bottom speed. COA §6.4.1, PDF pp. 489-490.
- The modal starter has no source-depth restriction, but the discrete version is inappropriate over a down-sloping bottom, where continuous-spectrum energy couples into propagating angles; use the self-starter or a wide-angle analytic source there. COA §6.4.1.1, PDF p. 490.
- The self-starter assumes range independence over less than a wavelength around the source; it satisfies interface and boundary conditions, stays valid at wide angles near interfaces and excites interface waves. For a point source its last step applies $(\mathbf{L}^{-1}\mathbf{M})^{3/4}$ instead of $(\mathbf{L}^{-1}\mathbf{M})^{1/2}$. COA §6.4.1.2, PDF pp. 490-492.
- Analytic starters assume a homogeneous medium and are generally inappropriate within a wavelength of the seafloor; Greene's source decays within about λ/3, so the error matters mainly for sources within λ/3 of the interface. COA §6.4.2.4, PDF pp. 497-498.
- With the source on the bottom of the PE Workshop Pekeris test and density ratio 2.0 (250 Hz), Greene's source was about 2.5 dB off a modal-starter reference, mostly a level error; with density ratio 1.2 and the source 0.5 m above the interface the error was negligible. COA §6.4.2.4, PDF p. 497.
- Do not use the Gaussian source for half-widths above 45°; use Greene's or Thomson's source instead. COA §6.4.2.4, PDF p. 496.
- Starter and propagator must match (homogeneous halfspace, 100 Hz, source at 75 m, ten Lloyd-mirror beams at 2.87-71.8°): the Gaussian with the Tappert PE decays gradually (3-dB half-beamwidth about 52°), while Greene's and Thomson's sources overshoot it by 3-4 dB. COA §6.4.3, PDF pp. 499-501.
- With the Claerbout PE Greene's source is best and Thomson's overshoots by 3 dB between 40° and 60°; with a very-wide-angle propagator the Gaussian reaches about 42°, Greene's about 65°, and Thomson's reproduces the full reference. COA §6.4.3, PDF pp. 499-502.
- Optimal analytic pairs are Gaussian with Tappert, Greene with Claerbout, and Thomson with any very-wide-angle PE; the self-starter matches any PE automatically. COA §6.4.3, PDF p. 502.

**Topics**
- Normal-mode starter and its angular limit
- Collins's PE self-starter (acoustic and elastic, line and point sources)
- Gaussian, Greene, Thomson and generalized (tilted) Gaussian sources
- Surface image and bottom proximity of analytic sources
- Spectral properties of sources and starter–propagator matching (Fig. 6.5)

**Why it matters**
- A bad starter can contaminate the whole march, especially near the source or in coherent processing tasks.
- A source beamwidth means nothing without the propagator: the same starter gives different far-field patterns under different PEs.

**Cross-links**
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`

### Split-step Fourier solutions
The split-step Fourier algorithm marches the standard PE (and the Thomson–Chapman PE) by alternating a diffraction step in vertical-wavenumber space with a refraction step in depth.

**Key equations** (COA §6.5.1–6.5.2)
- Hardin–Tappert split-step march, eq. (6.115), §6.5.1, PDF p. 504: $\psi(r,z)=e^{\frac{ik_0}{2}[n^2(r_0,z)-1]\Delta r}\,\mathcal{F}^{-1}\left\{e^{-\frac{i\Delta r}{2k_0}k_z^2}\,\mathcal{F}\{\psi(r_0,z)\}\right\}$, where $\Delta r=r-r_0$ and $\mathcal{F}$ is the Fourier transform from depth $z$ to vertical wavenumber $k_z$.
- Operator form, eqs. (6.117)-(6.119), §6.5.1, PDF p. 504: $\frac{\partial\psi}{\partial r}=(A+B)\psi=U\psi$ with $A=\frac{ik_0}{2}[n^2(r,z)-1]$ and $B=\frac{i}{2k_0}\frac{\partial^2}{\partial z^2}$, and $\psi(r,z)\simeq e^{\tilde U\Delta r}\psi(r_0,z)$, where $A$ is a multiplication operator, $B$ a differential operator and $\tilde U$ approximates $U$ over the step.
- Symmetric splitting, eqs. (6.122) and (6.131), §6.5.1, PDF pp. 505-506: $e^{(A+B)\Delta r}\simeq e^{\frac{A}{2}\Delta r}e^{B\Delta r}e^{\frac{A}{2}\Delta r}$, i.e. $\psi(r,z)=e^{\frac{ik_0}{4}[n^2(r_0,z)-1]\Delta r}\mathcal{F}^{-1}\left\{e^{-\frac{i\Delta r}{2k_0}k_z^2}\mathcal{F}\left\{e^{\frac{ik_0}{4}[n^2(r_0,z)-1]\Delta r}\psi(r_0,z)\right\}\right\}$, where the symbols are those of (6.115).
- Range-variation error, eqs. (6.137)-(6.138) and (6.140), §6.5.2, PDF p. 507: $E_1=\frac{(\Delta r)^2}{2}U_j'\psi_j+O((\Delta r)^3)$ with $U_j'=\frac{ik_0}{2}\frac{\partial n^2}{\partial r}$, and $\tilde E_1=\frac{(\Delta r)^3}{12}(2U''+UU'-U'U)_j\psi_j$ when $U$ is taken at mid-step, where primes are range derivatives and $j$ indexes range steps.
- Splitting errors, eqs. (6.142)-(6.143) and (6.145), §6.5.2, PDF p. 508: the simple splitting gives $E_2=-\frac{(\Delta r)^2}{2}[A,B]\psi_j$ with $[A,B]\psi=\frac14\left(\frac{\partial^2n^2}{\partial z^2}\psi+2\frac{\partial n^2}{\partial z}\frac{\partial\psi}{\partial z}\right)$; the symmetric splitting gives $E_3=\frac{(\Delta r)^3}{24}\left(2B[A,B]-[A,B]2B+A[A,B]-[A,B]A\right)$.

**Validity conditions**
- All four splittings (6.120)-(6.123) are accurate to $O((\Delta r)^2)$; the double splittings reduce the splitting error to $O((\Delta r)^3)$, and (6.131) is preferred because it needs two transforms per step instead of four. Evaluating $n^2$ at $r_0+\Delta r/2$ lowers some error terms by one order. COA §6.5.1–6.5.2, PDF pp. 505-508.
- $E_1$ scales with the range gradient of $n^2$, but the splitting errors scale with depth gradients, which are generally orders of magnitude larger; a sound-speed jump at the seabed therefore forces small range steps. COA §6.5.2, PDF pp. 507-508.
- All error terms vanish in a homogeneous medium, where arbitrarily large range steps are allowed, and Tappert showed the algorithm to be unconditionally stable. COA §6.5.1–6.5.2, PDF pp. 504 and 508.
- Split-step Fourier is efficient for long-range, narrow-angle propagation with negligible bottom interaction; short-range deep-water and most shallow-water problems are wider-angle and bottom-interacting, where its advantage is lost to fine grids and FD/FE is preferred. COA §6.5, PDF pp. 502-503.
- Collins's split-step Padé approximates the exponential of the square-root operator, permitting larger range steps; it is claimed to be more than an order of magnitude faster than standard FD/FE schemes. COA §6.5, PDF p. 503.

**Topics**
- Heuristic Fourier-transform solution of the standard PE
- Operator formalism: exponentiation and the four operator splittings
- Error analysis after Davis et al.: range-gradient and commutator errors
- Diffraction and refraction as separate substeps
- Split-step Padé as the bridge to wide-angle accuracy

**Best-fit scenarios**
- Long-range forward propagation in range-dependent media
- Operational runs where speed matters without giving up coherent phase

**Limitations**
- Limited to the narrow-angle forms that admit a split-step solution
- Strong depth gradients and interface contrasts force small steps and large transforms

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch08-broadband-modeling.md`

### Computational domain, grid, density and attenuation
The practical details of a PE run, shared by split-step and finite-difference codes: a pressure-release surface, an absorbing layer below the physical domain, depth and range steps, density jumps and volume attenuation.

**Key equations** (COA §6.5.3–6.5.5, Appendix 1)
- Artificial absorption layer, eq. (6.146), §6.5.3, PDF p. 509: $n^2=n_b^2+i\alpha\exp\left[-\left(\frac{z-z_{\max}}{D}\right)^2\right]$, where $n_b=c_0/c_b$ with $c_b$ the bottom speed, typically $\alpha=0.01$ and $D=(z_{\max}-H)/3$, and $H$ is the base of the physical domain.
- Depth sampling, eq. (6.147), §6.5.3, PDF p. 510: $\Delta z\le\lambda/4$, where $\lambda$ is the acoustic wavelength.
- Density-reduced pressure, eqs. (6.149) and (6.152), §6.5.4, PDF pp. 511-512: $\tilde p=p/\sqrt\rho$ satisfies a Helmholtz equation with $\tilde n^2=n^2+\frac{1}{2k_0^2}\left[\frac{1}{\rho}\frac{\partial^2\rho}{\partial z^2}-\frac{3}{2\rho^2}\left(\frac{\partial\rho}{\partial z}\right)^2\right]$, where $\rho(z)$ is the density.
- Density smoothing, eqs. (6.153)-(6.154), §6.5.4, PDF p. 512: $\rho(z)=\frac12(\rho_2+\rho_1)+\frac12(\rho_2-\rho_1)\tanh\frac{z-D_0}{L}$ with $k_0L=2$, where $D_0$ is the interface depth and $L$ the transition length.
- Complex index for attenuation, eq. (6.158), §6.5.5, PDF p. 513: $n^2\simeq\left(\frac{c_0}{c}\right)^2\left[1+i\frac{\alpha^{(\lambda)}}{27.29}\right]$, where $\alpha^{(\lambda)}$ is the attenuation in dB per wavelength.
- Domain depth and FFT size, eqs. (6.214) and (6.217), Appendix 1, PDF pp. 540-541: $z_{\max}=4H/3$ and $M>8z_{\max}/\lambda$ with $M$ a power of two, for a complex FFT over $-z_{\max}\le z\le z_{\max}$.

**Validity conditions**
- An absorption layer $H/3$ thick works in typical deep water; in shallow water include a real bottom several wavelengths thick with real sediment attenuation. COA §6.5.3, PDF pp. 509-510.
- $\Delta z\le\lambda/4$ holds for the Gaussian and Greene sources; Thomson's source needs only $\Delta z\le\lambda/2$. COA §6.5.3, PDF p. 510.
- Start with $\Delta r=2$-$5\,\Delta z$ for bottom-interacting (shallow-water) propagation and $\Delta r=20$-$50\,\Delta z$ for long-range deep-water propagation, then reduce $\Delta r$ and $\Delta z$ until the answer is stable: COA calls this convergence test the only safe check. COA §6.5.3, PDF pp. 510-511; Appendix 1, PDF p. 541.
- Brock's adaptive step scheme works for deep water with negligible bottom interaction; with strong bottom interaction no automatic scheme guarantees accuracy. COA §6.5.3, PDF p. 511.
- The density transition length $L$ must be small compared with the vertically projected wavelength, hence $k_0L=2$. COA §6.5.4, PDF p. 512.
- On a uniform depth grid, discontinuities can only be smoothed and finely sampled, so strong discontinuities make split-step computation inefficient. COA §6.5.3, PDF p. 510.

**Topics**
- Pressure-release surface and absorbing bottom layer
- Fast sine transform for the split-step march
- Choice of $\Delta z$ and $\Delta r$; convergence testing; adaptive stepping
- Variable density through $p/\sqrt\rho$ and smoothed density jumps
- Volume attenuation through a complex index of refraction
- Appendix 1 recipe for a simple split-step PE code

**Cross-links**
- `runbooks/ram-runbook.md`
- `workflows/model-selection.md`

### FD and FE implementations of PE
COA derives an implicit finite-difference (IFD) Crank–Nicolson scheme, after Lee and McDaniel, that builds the horizontal-interface conditions into the depth difference operator and solves any rational-linear PE (6.32).

**Key equations** (COA §6.6)
- Horizontal-interface conditions, eqs. (6.160)-(6.161), §6.6.1, PDF p. 514: $\psi_1=\psi_2$ and $\frac{1}{\rho_1}\frac{\partial\psi_1}{\partial z}=\frac{1}{\rho_2}\frac{\partial\psi_2}{\partial z}$ at the interface depth $z_B$, where subscripts 1 and 2 label the media above and below.
- Interface-valid one-way equation, eqs. (6.172)-(6.174), §6.6.1, PDF p. 516: $\frac{\partial^2\psi}{\partial r^2}+2ik_0\frac{\partial\psi}{\partial r}+G\psi=0$ with $G=k_0^2(Q^2-1)$ gives $\frac{\partial\psi}{\partial r}=ik_0(\sqrt{1+q}-1)\psi$, $q=G/k_0^2$, where $G=k_0^2\eta+\Gamma_{zz}$ combines a density-weighted index $\eta$ and the interface depth-difference operator $\Gamma_{zz}$ of (6.169)-(6.171).
- Crank–Nicolson step, eq. (6.176), §6.6.2, PDF p. 517: $\left[1-\frac{ik_0\Delta r}{2}(\sqrt{1+q}-1)\right]\psi^{m+1}=\left[1+\frac{ik_0\Delta r}{2}(\sqrt{1+q}-1)\right]\psi^{m}$, where $m$ indexes range levels and $\sqrt{1+q}$ is then replaced by the rational form (6.177), identical to (6.28).
- Tridiagonal march, eq. (6.189), §6.6.2, PDF p. 519: each range step solves a tridiagonal system linking $\psi^{m+1}$ to $\psi^{m}$ over the $N$ depth points, with coefficients $u$, $v$, $\hat u$ from (6.186)-(6.188) on PDF p. 518.
- Crank–Nicolson truncation error, eq. (6.198), §6.6.3, PDF p. 520: $E_{CN}=-\frac{(\Delta r)^3}{12}\left(U''+2UU'+U'U+U^3\right)_j\psi_j$, where $U=A+B$ is the standard-PE operator of (6.190)-(6.191) and primes are range derivatives.

**Validity conditions**
- The IFD scheme is unconditionally stable and solves both narrow- and wide-angle PEs of the form (6.32) (Tappert, Claerbout, Greene). COA §6.6.2, PDF p. 519.
- The derivation holds the denominator operator $b_0+b_1(\eta+\Gamma_{zz}/k_0^2)$ constant across a range step. COA §6.6.2, PDF p. 517.
- The range-marching error is $O((\Delta r)^3)$; the depth-differencing error is $O(\Delta r\,\Delta z)$ across interfaces and $O(\Delta r(\Delta z)^2)$ elsewhere (McDaniel and Lee). COA §6.6.3, PDF p. 521.
- Grid choice and convergence testing follow §6.5.3: $\Delta z$ from (6.147) and $\Delta r=2$-$5\,\Delta z$ as a first guess. COA §6.6.4, PDF p. 521.
- Huang argues FE handles a variable vertical mesh more readily and so suits sloping interfaces better; equidistant FD grids are favored for simplicity. COA §6.6, PDF p. 513.

**Topics**
- Field equations on horizontal interfaces with speed and density contrasts
- IFD (Crank–Nicolson) formulation for rational-linear PEs
- Tridiagonal global system and its symmetrization
- Truncation-error analysis of Crank–Nicolson marching
- FE alternatives (Huang) and very-wide-angle FD/FE forms (Collins)

**Best-fit scenarios**
- Wide-angle, bottom-interacting problems where split-step loses its efficiency
- Layered seabeds with sharp speed and density contrasts

**Cross-links**
- `chapters/ch07-fd-fe-methods.md`
- `workflows/model-selection.md`

### Energy conservation at sloping interfaces
COA's caution: a one-way PE run on a stair-step approximation of a sloping bottom does not conserve energy. The cause is the boundary condition at the vertical stair-step faces, not marching drift or neglected backscatter.

**Key equations** (COA §6.5.4, §6.6.1, §6.7)
- Horizontal-interface conditions honored by the IFD scheme, eqs. (6.160)-(6.161), §6.6.1, PDF p. 514: $\psi_1=\psi_2$ and $\rho_1^{-1}\partial\psi_1/\partial z=\rho_2^{-1}\partial\psi_2/\partial z$, where $\rho_1,\rho_2$ are the densities on either side.
- Density-reduced pressure, eq. (6.149), §6.5.4, PDF p. 511: $\tilde p=p/\sqrt\rho$; split-step codes march it and so keep $p/\sqrt\rho$ continuous across vertical stair-step faces, while FD codes marching $p$ keep $p$ continuous.
- Energy-conserving matching quantity (no equation number), §6.7, PDF p. 524: $p/\sqrt{\rho c}$ matched across vertical faces conserves energy in a forward sense for horizontally propagating sound, where $c$ is the sound speed.

**Validity conditions**
- Standard stair-step PE implementations lose energy in upslope propagation and gain it downslope; the error grows with slope and impedance contrast and can reach several decibels. COA §6.7, PDF p. 522.
- A one-way solution can satisfy only one boundary condition at a vertical interface, so the full condition cannot be met. COA §6.7, PDF p. 524.
- ASA wedge benchmark (2.86° slope from 200 m to 0 m over 4 km, source at 100 m, 25 Hz, bottom 1700 m/s, 1500 kg/m³, 0.5 dB/λ): the FD Claerbout PE runs about 2 dB low at longer ranges; the split-step Thomson–Chapman PE is too narrow-angled for the 28° critical angle and shows phase errors but an accurate mean level. COA §6.7, PDF pp. 522-523.
- In that benchmark the backscattered field is 40-50 dB below the outgoing field, so the level error is not caused by neglected backscatter. COA §6.7, PDF p. 522.
- Critical angles of 20-30° are typical of sandy seafloors, so bottom-interacting propagation is steep. COA §6.7, PDF p. 522.
- Porter et al.: matching pressure alone is seriously deficient for moderate density variations and matching particle velocity is also poor; matching $p/\sqrt\rho$ removes the density effect, and $p/\sqrt{\rho c}$ improves further. Collins and Westwood confirmed $p/\sqrt{\rho c}$ for FD PEs at steep slopes and strong contrasts. COA §6.7, PDF p. 524.
- Direct sloping-boundary conditions (Lee and McDaniel, Huang) avoid stair-steps, but COA reports no accuracy evidence for them. COA §6.7, PDF p. 524.

**Topics**
- Upslope energy loss and downslope gain in stair-step PE runs
- The ASA wedge benchmark (Jensen and Ferla)
- Vertical-interface conditions: $p$, $p/\sqrt\rho$ and $p/\sqrt{\rho c}$ matching
- Sloping-boundary alternatives to stair-steps

**Why it matters**
- Wide-angle PEs with negligible phase error can still be several decibels wrong on slopes, so a phase-error check alone does not validate a sloping-bottom run.
- Phase-coherent downstream tasks inherit these level errors.

**Cross-links**
- `chapters/ch10-signals-in-noise.md`
- `workflows/model-selection.md`

### Three-dimensional PE
The 3-D PE keeps the azimuthal derivative in the one-way operator so that horizontal refraction is modeled; practical codes approximate depth and azimuth operators separately.

**Key equations** (COA §6.8)
- 3-D envelope equation, eqs. (6.199)-(6.200), §6.8, PDF p. 525: $p(r,\varphi,z)=\psi(r,\varphi,z)H_0^{(1)}(k_0r)$ gives $\frac{\partial^2\psi}{\partial r^2}+2ik_0\frac{\partial\psi}{\partial r}+\frac{1}{r^2}\frac{\partial^2\psi}{\partial\varphi^2}+\frac{\partial^2\psi}{\partial z^2}+k_0^2(n^2-1)\psi=0$, where $\varphi$ is the azimuth and $n(r,\varphi,z)=c_0/c$.
- 3-D one-way equation, eq. (6.201), §6.8, PDF p. 525: $\frac{\partial\psi}{\partial r}=ik_0\left(\sqrt{n^2+\frac{1}{k_0^2}\frac{\partial^2}{\partial z^2}+\frac{1}{(k_0r)^2}\frac{\partial^2}{\partial\varphi^2}}-1\right)\psi$, where the symbols are those of (6.200).
- Depth and azimuth operators, eqs. (6.202)-(6.203), §6.8.1, PDF p. 525: $Q=\sqrt{1+q_z+q_\varphi}$ with $q_z=(n^2-1)+\frac{1}{k_0^2}\frac{\partial^2}{\partial z^2}$ and $q_\varphi=\frac{1}{(k_0r)^2}\frac{\partial^2}{\partial\varphi^2}$, where $q_\varphi$ carries horizontal refraction.
- Padé expansion without cross terms, eq. (6.206), §6.8.1, PDF p. 526: $\sqrt{1+q_z+q_\varphi}\simeq1+\sum_{j=1}^{m}\frac{a_{j,m}q_z}{1+b_{j,m}q_z}+\sum_{j=1}^{m}\frac{a_{j,m}q_\varphi}{1+b_{j,m}q_\varphi}$, where $a_{j,m},b_{j,m}$ are given by (6.207)-(6.208), the same as (6.34)-(6.35).
- 3-D PE hierarchy, eqs. (6.209)-(6.213), §6.8.1, PDF pp. 526-527: Tappert $\frac{\partial\psi}{\partial r}=ik_0\left(\frac12q_z+\frac12q_\varphi\right)\psi$; Lee et al. $ik_0\left(\frac12q_z-\frac18q_z^2+\frac12q_\varphi\right)$; Chen et al. add $-\frac18q_\varphi^2$; Collins and Chin-Bing $ik_0\left(\frac{0.5q_z}{1+0.25q_z}+0.5q_\varphi\right)$; Sturm uses full Padé sums in both, eq. (6.213).

**Validity conditions**
- The expansions drop cross terms ($q_zq_\varphi$, $q_z^2q_\varphi$, ...), which assumes 3-D effects are gradual; this also allows solution by alternating directions. COA §6.8.1, PDF p. 526.
- Vertical refraction exceeds horizontal refraction, so wide-angle capability matters more in depth than in azimuth: (6.209) is narrow-angle in both, (6.210) and (6.212) are wide-angle only in depth. COA §6.8.1, PDF pp. 526-527.
- Fully 3-D Padé solutions in both depth and azimuth become impractical except at very low frequencies. COA §6.8.1, PDF p. 527.
- An N×2-D run (2-D solutions along N bearings) ignores horizontal refraction; fully 3-D computation is at least two orders of magnitude slower, and horizontal refraction is small for weak azimuthal variability and moderate ranges. COA §6.9.5, PDF p. 535.
- In the 25 Hz 3-D wedge (2.86° slope, 200 m depth and 40 m source depth at the source, bottom 1700 m/s), N×2-D and 3-D results agree out to about 17 km cross-slope; beyond it the 3-D level drops by about 10 dB to 25 km as mode 2 is refracted away from the apex. COA §6.9.5, PDF pp. 534-539.

**Topics**
- 3-D Hankel-envelope and one-way equations
- Depth and azimuth operators; neglect of cross terms
- Taylor and Padé 3-D forms from Tappert to Sturm
- N×2-D versus full 3-D and horizontal refraction in a wedge

**Best-fit scenarios**
- Cases where 2-D vertical-slice assumptions are not enough
- Environments with cross-range structure, such as slopes and canyons, at low frequency

**Limitations**
- Cost rises quickly, especially for wide-angle azimuthal operators
- One-way assumptions and approximation choices remain central even in 3-D

**Cross-links**
- `chapters/ch05-normal-modes.md`
- `chapters/ch10-signals-in-noise.md`

## Key sections from the TOC
- 6.1 Introduction (PDF p. 473)
- 6.2 Derivation of Parabolic Equations (PDF p. 474): 6.2.1 Standard PE Derivation (p. 474), 6.2.2 Generalized PE Derivation (p. 476), 6.2.3 Expansion of the Square-Root Operator (p. 477), 6.2.4 Phase Errors and Angular Limitations (p. 482)
- 6.3 The Elastic PE (PDF p. 486)
- 6.4 Starting Fields (PDF p. 488): 6.4.1 Numerical Starters (p. 489), 6.4.2 Analytical Starters (p. 492), 6.4.3 Spectral Properties of Sources (p. 498)
- 6.5 Solutions by FFTs (PDF p. 502): 6.5.1 Split-Step Fourier Algorithm (p. 503), 6.5.2 Error Analysis (p. 506), 6.5.3 Numerical Implementation (p. 509), 6.5.4 Variable Density (p. 511), 6.5.5 Attenuation (p. 512)
- 6.6 Solutions by FDs and FEs (PDF p. 513): 6.6.1 Field Equations on Horizontal Interfaces (p. 514), 6.6.2 IFD Formulation (p. 516), 6.6.3 Error Analysis (p. 519), 6.6.4 Numerical Implementation (p. 521)
- 6.7 The Problem of Energy Conservation in PEs (PDF p. 522)
- 6.8 Three-Dimensional PEs (PDF p. 525)
- 6.9 Numerical Examples (PDF p. 528)
- Appendix 1: Recipe for Simple PE Code (PDF p. 539)

## Research takeaways
- PE is often the default engineering solver for range-dependent ocean acoustics because it keeps coherent wave physics at workable cost.
- The real decision is not just "use PE" but which square-root approximation, starter field, grid, interface treatment and dimensionality fit the scenario; COA gives numbers for each (angle limits, starter pairings, $\Delta z\le\lambda/4$, $\Delta r$ multiples).
- Replica-field applications inherit PE phase assumptions directly, so solver choice and numerical settings matter downstream.
- §6.9's examples show the range of problems PE handles: beam splitting, reflection and focusing; mode cutoff on a 1.55° wedge at 25 Hz, where three trapped modes are radiated into the bottom as beams; propagation across a 14° seamount at 230 Hz; sloping elastic bottoms; and horizontal refraction in a 3-D wedge (COA §6.9, PDF pp. 528-539).
- Most of §6.9's 2-D examples are line sources in plane geometry; adding a spreading loss of $10\log r$ gives the cylindrical-geometry result (COA §6.9, PDF p. 528).

## Comparison to neighboring chapters
- Compared with `chapters/ch03-ray-methods.md`, PE is slower and less intuitive but far better for diffraction and coherent interference.
- Compared with `chapters/ch05-normal-modes.md`, PE is the usual tool for range-dependent problems, while modes remain more interpretable in stratified waveguides; COA's one-way derivation formally assumes weak range dependence and no backscatter, and its ASA wedge reference is a two-way coupled-mode solution.
- Compared with `chapters/ch08-broadband-modeling.md`, this chapter provides one of the main narrowband engines used before Fourier synthesis.

## Good follow-on notes
- `chapters/ch05-normal-modes.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`
- `solvers/solver-ram.md`
- `workflows/model-selection.md`
