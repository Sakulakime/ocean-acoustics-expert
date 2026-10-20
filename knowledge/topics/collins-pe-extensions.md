---
title: PE Extensions - Rational Approximations, Self-Starter, and Range Dependence
type: topic-note
source: 01-source-collins-siegmann.md
source_pdf: sources/collins-siegmann-2019-parabolic-wave-equations.pdf
pdf_pages:
  - 21-26
  - 34-55
status: verified
---

# PE Extensions - Rational Approximations, Self-Starter, and Range Dependence

## Scope and source use

Use Collins & Siegmann as the primary source for questions about how a PE's rational approximation, range integration, starting field, and interface correction interact. This note was checked against the actual PDF text of §1.3, PDF pp. 21-26, and §§2.2-2.6.2, PDF pp. 34-55. PDF p. 55 also contains the opening of §2.6.3; its coordinate and mapping methods are outside the verified coverage here.

The source develops fluid-acoustic PE techniques here. A wide-angle approximation, a stable rational function, a suitable starter, and an interface correction address different errors; none alone establishes the accuracy of a complete propagation calculation. This distinction is the practical synthesis of §§2.2-2.6.2, not a claim that a particular installed solver implements every technique.

## Operator and notation

In the book's plane-geometry notation, $x$ is range, $z$ is depth, $p$ is the propagated acoustic field, $\rho$ is density, $k$ is the local wave number, and $k_0$ is the reference wave number. The dimensionless depth operator is

$$
X=k_0^{-2}\left(\rho\frac{\partial}{\partial z}
\frac{1}{\rho}\frac{\partial}{\partial z}+k^2-k_0^2\right).
$$

The outgoing factor is

$$
\frac{\partial p}{\partial x}=ik_0(1+X)^{1/2}p.
$$

The small-$X$ condition is an operator condition on the field, $|Xp|\lesssim|p|$, rather than a universal angle cutoff. Nearly horizontal propagation in a homogeneous medium is one case; more generally, the relevant propagating modal wave numbers must be near $k_0$. Higher-order approximations relax this restriction. The physically meaningful branch of the square root makes evanescent waves decay with range. [textbook: Collins & Siegmann 2019 §1.3, eqs. (1.47)-(1.59), PDF pp. 23-25]

The $p$ in this outgoing equation retains a carrier factor: it is not COA's Hankel-reduced envelope $\psi$. When transferring equations between the books or to a code, check the field convention, geometry, source normalization, and reference wave number before using the coefficients or comparing complex fields. Compare `chapters/ch06-parabolic-equations.md`, especially its derivation and starting-field sections.

## Rational approximation: accuracy and evanescent decay are separate requirements

A Padé approximation of a function matches its first $2n$ derivatives at $X=0$ for the $n$-term construction discussed here. For the square root, this gives high accuracy near the reference direction, so a few terms can accurately represent many propagating modes. The same real coefficients can treat evanescent modes as propagating, however, and cause stability problems in some applications. Increasing the number of terms is therefore not the same operation as enforcing evanescent decay. [textbook: Collins & Siegmann 2019 §2.2, PDF p. 34]

Numerically generated rational approximations combine accuracy constraints near $X=0$ with stability constraints for the evanescent region to the left of the branch point $X=-1$. In the square-root construction, mapping evanescent eigenvalues into the upper half plane produces decay under the outgoing evolution. The book's examples show a tradeoff: one stability constraint reduces the accuracy of the one-term approximation substantially, with a smaller penalty at higher orders. These examples concern specific rational functions and spectra, not a universal prescription for the number of Padé terms. [textbook: Collins & Siegmann 2019 §2.2.1, PDF pp. 34-37, Figs. 2.1-2.2]

Rotating the branch cut is another way to damp evanescent modes. A larger rotation can improve their attenuation while reducing accuracy because it shifts the location of the accuracy constraints. Rotation is not an unconditional stability guarantee: for the book's homogeneous 500 m waveguide with $c=1500$ m/s, $n=10$ and a rotation of $110^\circ$, the 250 Hz spectrum includes two eigenvalues mapped into the lower half plane, whereas the 50 Hz spectrum does not. This example shows why a coefficient set that behaves well at one frequency need not do so at another. [textbook: Collins & Siegmann 2019 §2.2.2, PDF pp. 35-41, especially pp. 39-41 and Fig. 2.5]

## Split-step finite difference versus split-step Padé

These methods can have the same product structure while approximating different functions:

| Method | Approximation and range treatment | Practical consequence in the source |
|---|---|---|
| Split-step finite difference | Rationally approximate $(1+X)^{1/2}$, split its terms, then apply Crank-Nicolson range integration | Range integration introduces an additional numerical approximation; the depth-discrete march repeatedly solves tridiagonal systems. |
| Split-step Padé | Rationally approximate the full propagator $\exp[ik_0\Delta x(1+X)^{1/2}]$ | The coefficients incorporate both $X$ and the range parameter $k_0\Delta x$; larger range steps can be possible. |

The split-step Padé derivation assumes acoustic parameters are range independent over the interval $(x,x+\Delta x)$. Its update is

$$
p(x+\Delta x)=R_n(X)p(x),\qquad
R_n(X)=e^{ik_0\Delta x}\prod_{j=1}^{n}
\frac{1+\gamma_{j,n}X}{1+\beta_{j,n}X}
\simeq e^{ik_0\Delta x(1+X)^{1/2}}.
$$

The coefficients in this expression differ from those of the split-step finite-difference update, even though the algebraic form is the same. For the exponential, an effective stability constraint makes $R_n$ vanish at a point in $X<-1$, where the exact propagator is exponentially small. The book prefers the product form for numerical stability on a single processor and discusses partial fractions for parallel execution. [textbook: Collins & Siegmann 2019 §§2.3-2.4, eqs. (2.18)-(2.29), PDF pp. 42-46]

The source's example uses a 25 Hz source at 285 m in a 300 m water column, water sound speed 1500 m/s, and a sediment with sound speed 1700 m/s, density 1.5 g/cm³, and its attenuation parameter $\sigma=0.5$. It compares a two-term finite-difference solution with a 20 m step against a six-term split-step Padé solution with a 500 m step. The reference is another split-step Padé calculation with a small range step. Thus the reported comparison illustrates the benefit of approximating the full propagator for that problem; it is not an independent validation of all PE errors, a general step-size rule, or a speed measurement for this repository. [textbook: Collins & Siegmann 2019 §2.4, PDF pp. 46-47, Fig. 2.8]

## Self-starter: source physics and regularization

A marching method needs an initial complex field over depth. The self-starter derives it from the same PE operator with a delta-function source. Because the solution at the origin is singular, the book evaluates the field at a nonzero starting range. The plane-source construction contains $(1+X)^{-1/2}$ multiplying the propagator; the point-source construction contains $(1+X)^{-1/4}$ and a different geometric normalization. These source geometries must not be interchanged. [textbook: Collins & Siegmann 2019 §2.5, eqs. (2.30)-(2.35), PDF pp. 46-48]

For numerical stability, the book introduces a smoothed intermediate field

$$
\xi(z)=(1-\varepsilon X)^{-2}\delta(z-z_0),
$$

then incorporates the compensating factor into the rational approximation for the starter. Here $z_0$ is source depth and $\varepsilon$ is a regularization parameter, not the refractive-index perturbation denoted by $\varepsilon$ in parts of COA. The historical choice $\varepsilon=-1$ can make the inverse nearly singular; in a lossless homogeneous waveguide this occurs at certain frequencies, including when the depth is a multiple of the wavelength. The source reports $\varepsilon=i$ as effective for many cases, without asserting that it solves every starting-field problem. [textbook: Collins & Siegmann 2019 §2.5, eqs. (2.36)-(2.40), PDF pp. 48-49]

The self-starter also has a spectral interpretation: the spectral integral is evaluated analytically, followed by fitting a rational function to the resulting operator. This explains its connection to the spectral solution without implying that arbitrary numerical implementations have identical samples, weights, or errors. [textbook: Collins & Siegmann 2019 §2.5, eqs. (2.41)-(2.43), PDF p. 49]

## Range dependence: the interface condition matters

The book approximates a range-dependent environment by range-independent regions, with a sloping interface represented by stair steps. The factorization is exact inside each region but not for an arbitrary range-dependent medium; gradual range dependence supports the approximation. Updating the propagation matrices and simply conserving $p$ across each vertical interface can still leave significant amplitude errors. A range-dependent PE calculation must specify the interface treatment as well as its marching scheme. [textbook: Collins & Siegmann 2019 §2.6, PDF pp. 49-50]

The single-scattering correction starts from stress and normal-displacement continuity at a vertical interface. It decomposes the field into incident, transmitted, and reflected components, then neglects a second-order term under the assumption of gradual range dependence. The approximate correction conserves the two interface quantities in an average sense; it does not constitute a full solution of repeated backscatter. [textbook: Collins & Siegmann 2019 §2.6.1, eqs. (2.44)-(2.49), PDF pp. 50-51]

The energy-conservation derivation assumes vanishing attenuation. With $*$ denoting complex conjugation and $H$ the depth integration limit, the relevant flux is proportional to

$$
E=\operatorname{Im}\int_0^H\rho^{-1}p^*\frac{\partial p}{\partial x}\,dz.
$$

The modal derivation gives a linear interface condition between incident field $p_i$ in region A and transmitted field $p_t$ in region B:

$$
\rho_B^{-1/2}(1+X_B)^{1/4}p_t
=\rho_A^{-1/2}(1+X_A)^{1/4}p_i.
$$

This is conservation of an operator-weighted field, rather than continuity of pressure alone. It can produce Gibbs oscillations because the resulting pressure need not be continuous across vertical interfaces. The book uses stabilized rational approximations to suppress those oscillations. The lossless derivation must be distinguished from the later illustrative bottom cases, which include attenuation. [textbook: Collins & Siegmann 2019 §2.6.2, eqs. (2.50)-(2.56), PDF pp. 51-52]

The low- and high-contrast upslope examples in §2.6.2 distinguish the corrections: simple pressure continuity has amplitude errors in both; the single-scattering solution is accurate for the low-contrast case but has an amplitude error in the high-contrast case. The energy-conserving solution agrees with the references shown for these examples. The low-contrast reference is itself an energy-conserving PE calculation known to work for that case, while the high-contrast reference uses a finite-element model. Their evidential roles are different. [textbook: Collins & Siegmann 2019 §2.6.2, PDF pp. 52-55, Figs. 2.9-2.11; the accompanying text on PDF p. 54 describes Fig. 2.12]

## How this complements COA

- Use `chapters/ch06-parabolic-equations.md` for the wider PE family, angular phase-error comparisons, source-pattern comparisons, discretization discussion, and the relation to other propagation methods.
- Use this note and Collins & Siegmann as the primary treatment when the question concerns coefficient generation, evanescent-mode stabilization, the full split-step Padé propagator, self-starter regularization, or interface corrections.
- For complex questions about coherent PE accuracy, compare both sources even when either alone supplies an answer. Check which error is at issue: one-way modeling, rational approximation, range/depth discretization, source initialization, or the interface condition. The equations and examples above show why these cannot be reduced to a single Padé order or angle label.

No solver was built or executed to create this note. These source checks establish the provenance and scope of the textbook statements; they do not establish the current RAM implementation, numerical convergence, physical correctness of a user environment, or an application-specific speedup.

## Narrow further-reading windows

These are navigation pointers, not verified coverage of this note:

- Rotated coordinates and variable topography: §2.6.3, PDF pp. 55-66. Read the smallest subsection needed for the interface geometry rather than all of Chapter 2.
- Elastic PE operator and fluid coupling: §§3.3.1-3.3.2, PDF pp. 84-86.
- Poro-elastic PE: §4.4.2, PDF pp. 128-131, with the wave-equation definitions in §4.4.1, PDF pp. 123-128, when needed.

For edition and page-offset details, see `01-source-collins-siegmann.md`.
