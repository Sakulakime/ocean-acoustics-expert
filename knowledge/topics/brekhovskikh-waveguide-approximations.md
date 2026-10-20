---
title: Waveguide and Rough-Surface Approximations - Physical Validity Conditions
type: topic-note
source: 01-source-brekhovskikh-lysanov.md
source_pdf: sources/brekhovskikh-lysanov-2003-fundamentals-ocean-acoustics.pdf
pdf_pages:
  - 163-173
  - 195-198
  - 213-215
  - 233-238
status: verified
---

# Waveguide and Rough-Surface Approximations - Physical Validity Conditions

## Scope and source use

Use Brekhovskikh & Lysanov as the primary source when the question asks why an approximation is physically valid: slow range variation, the ray invariant, modal coupling, or the distinct height, slope, curvature, and angular restrictions of rough-surface scattering. The waveguide and scattering approximations below address different problems; a valid adiabatic model does not establish a valid rough-boundary treatment.

This note was checked against §7.2, PDF pp. 163-173; §§9.1-9.2, PDF pp. 195-198; §9.7, PDF pp. 213-215; and §9.14, PDF pp. 233-238. The first and last pages of these windows also contain parts of neighboring sections. Claims below identify the relevant subsection and actual pages. See [book-selection.md](../book-selection.md) for how to select and cross-check sources.

## Adiabatic means negligible mode coupling

The reference-waveguide expansion uses local depth eigenfunctions $\psi_m(z,r)$ and horizontal wave numbers $\xi_m(r)$. Their horizontal derivatives produce coupling terms. Setting those terms to zero lets each local mode propagate independently while adjusting its shape and wave number to the changing waveguide. Boundary conditions can also cause coupling, including a sloping bottom. Thus smooth local mode shapes do not by themselves demonstrate that the coupling is negligible. [textbook: Brekhovskikh & Lysanov 2003 §§7.1-7.2, PDF p. 163]

For cylindrical symmetry, the far-field, range-WKB construction gives modal contributions proportional to

$$
p_m(z,r)\propto\psi_m(z_s,0)\psi_m(z,r)
[\xi_m(r)r]^{-1/2}
\exp\!\left(i\int_0^r\xi_m(r')\,dr'\right),
$$

where $z_s$ is source depth. The source excitation uses the eigenfunction near the source; propagation accumulates the range-integrated local wave number. The derivation neglects the $1/(4r^2)$ term after the substitution $F_m=r^{1/2}\Psi_m$, requiring $\xi_m r\gg1$, and then uses WKB in range. This expression omits the book's common source-normalization factor and should not be copied as an absolute pressure normalization. [textbook: Brekhovskikh & Lysanov 2003 §7.2, eqs. (7.2.1)-(7.2.8), PDF pp. 163-164]

## Ray invariant: change little over one ray cycle

For an internal waveguide with enough modes for the depth-WKB description, the phase integral associates each mode with a ray family. The ray's grazing angle $\chi(z,r)$ changes as the local waveguide changes. In the adiabatic approximation the complete-cycle action is

$$
I=\oint\frac{\sin\chi(z,r)}{c(z,r)}\,dz
=T-qD=\mathrm{constant},\qquad q=\frac{\cos\chi_0}{c_0},
$$

where $D$ and $T$ are cycle range and travel time, and $c_0,\chi_0$ refer to the waveguide axis. The qualitative requirement is that successive ray cycles experience only small changes of waveguide characteristics. The derivation starts with cylindrical symmetry; extending this ray-plane argument requires negligible horizontal refraction so that the ray remains in the chosen vertical plane. It is not a general invariant for arbitrary three-dimensional propagation. [textbook: Brekhovskikh & Lysanov 2003 §§7.2.1-7.2.2, eqs. (7.2.9)-(7.2.14), PDF pp. 164-166]

The coastal-wedge example illustrates an application rather than a universal geometric rule. With monotonically increasing depth $h(r)$, $c=c_s(1-az)$, constant $a,c_s$, and the small-angle/small-$az$ expansion used in the derivation, the turning-depth boundary is $z'(r)=h(r)-h_0$. Here $h_0$ is the depth where the ray's turning point first meets the surface. Changes of sound-speed gradient or surface sound speed require the more general expression (7.2.21); arbitrary bathymetry alone does not justify the simplified shadow-boundary result. [textbook: Brekhovskikh & Lysanov 2003 §7.2.2, eqs. (7.2.15)-(7.2.22), PDF pp. 166-168]

## Conditional quantitative estimates, not a universal cutoff

For an order-of-magnitude estimate, the book retains the dominant adjacent-mode interaction, $l=m+1$, and defines

$$
S_{ml}=\int\psi_m\frac{\partial\psi_l}{\partial x}\,dz,
$$

where $x$ is distance in the propagation direction. Requiring the induced modal correction to be small gives

$$
\left|\frac{2S_{ml}\sqrt{\xi_l\xi_m}}
{\xi_m^2-\xi_l^2}\right|\ll1.
$$

With $\xi_l\sim\xi_m\sim k_0$ and the adjacent-mode spacing related to ray-cycle range, the estimate becomes $|S_{ml}|D\ll1$. Estimating the eigenfunction derivative by its horizontal variation scale $M$ yields $D/M\ll1$, particularly for low modal orders. These estimates have stated modal and WKB assumptions; they are not a general error bound or a numerical pass/fail tolerance. [textbook: Brekhovskikh & Lysanov 2003 §7.2.3, eqs. (7.2.23)-(7.2.28), PDF pp. 169-170]

The three examples on PDF p. 170 show why frequency alone cannot decide adiabatic validity:

| Source example | Result under that example's assumptions |
|---|---|
| Homogeneous ocean of varying depth with an absolutely rigid bottom, low modal order | $D=O(k_0h^2)$, giving $k_0h^2/M\ll1$; lower frequency improves this estimate. |
| Surface linear waveguide | The reduced criterion improves with increasing frequency for the specified waveguide parameters. This trend is opposite to the preceding example. |
| Internal waveguide with $k^2(x,z)=k_0^2[1-z^2/(4h^2(x))]$ | $D=O(h)$, giving $h/M\ll1$; frequency is absent from this estimate. Here $h$ is the profile's depth scale. |

[textbook: Brekhovskikh & Lysanov 2003 §7.2.3, eqs. (7.2.29)-(7.2.33), PDF p. 170]

If coupling matters, §7.2.4 retains it and separates forward and backscattered modal components. Neglecting the backscattered components is a further approximation; retaining forward modal coupling is not the same as an adiabatic field. The worked smooth-depth, weak-coupling example also makes simplifying assumptions about nearly constant coupling coefficients and modal wave numbers. It does not solve arbitrary sharp range changes. [textbook: Brekhovskikh & Lysanov 2003 §7.2.4, PDF pp. 171-173]

## Rough surfaces: separate height, slope, curvature, and grazing angle

For roughness height $\zeta$ with RMS value $\sigma$, the Rayleigh parameter is

$$
P=2k\sigma\cos\theta_0=2k\sigma\sin\chi_0,
$$

where $\theta_0$ is incidence angle from the normal and $\chi_0$ the grazing angle from the mean surface. It measures the RMS phase difference caused by roughness. Small $P$ describes weak roughness-induced phase modulation with predominantly coherent specular reflection; it is not a complete validity criterion for every scattering approximation. [textbook: Brekhovskikh & Lysanov 2003 §9.1, eq. (9.1.1), PDF pp. 195-196]

| Approximation | What is expanded or assumed | Restrictions verified in this source |
|---|---|---|
| Method of small perturbation (MSP) | Expand the rough-boundary condition and field in powers of height about the mean plane. | Small departure from the mean surface and sufficiently small slopes; the later contrast with the tangent-plane method specifies a small Rayleigh parameter. The pressure-release and rigid boundary conditions produce different first-order terms. |
| Tangent plane / Kirchhoff | Replace the boundary field locally by reflection at a plane tangent to the rough surface. | Sufficiently smooth roughness, possibly large in height; scattering directions near local specular reflection; $2k\mathcal R\sin\chi\gg1$, with $\mathcal R$ the smaller principal radius of curvature and $\chi$ the local grazing angle. The usual form fails at tangent incidence and in geometric shadow. |
| Small-slope method (SSM; also called the small-slope approximation) | Use the Rayleigh representation and expand the scattering amplitude in surface slope $|\nabla\zeta|$. | For incident and scattered grazing angles of order unity, $|\nabla\zeta|\ll1$. At shallow grazing angles the stronger restriction is $|\nabla\zeta|\ll\min(\chi_0,\chi)$ to avoid geometrical shadowing. Angles in these asymptotic inequalities are in radians. |

[textbook: Brekhovskikh & Lysanov 2003 §9.2, PDF pp. 196-198; §9.7, PDF pp. 213-215; §9.14, PDF pp. 233-237]

Small slope is not the same as small roughness height relative to wavelength: the slope expansion parameter is geometric, while $P$ contains $k\sigma$ and incidence angle. Nor does a small Rayleigh parameter at grazing incidence automatically authorize tangent-plane or small-slope calculations: their curvature and shadowing restrictions still require assessment. These comparisons follow from the distinct source conditions above. The Rayleigh-hypothesis discussion in §9.14 contains bounds for particular surface models; they must not be promoted to universal rough-sea thresholds. [textbook: Brekhovskikh & Lysanov 2003 §§9.1, 9.7, 9.14, PDF pp. 195-196, 213-214, 233-234, 237]

## How this complements COA

- For physical criteria involving ray-cycle length, modal spacing, and horizontal variation scale, use this note and §7.2 as the primary analytical treatment. For the discrete interface-matching construction, normalization, numerical considerations, and examples of failure, compare the range-dependent-mode section of [COA Chapter 5](../chapters/ch05-normal-modes.md).
- The COA Chapter 5 note reports that COA gives no general quantitative adiabatic criterion. The estimates above do not contradict that caution: they are conditional order-of-magnitude results for specified mode and waveguide assumptions, not a universally calibrated criterion.
- For complex range-dependent propagation questions, check both treatments even if one already supplies a formula. Identify whether the proposed simplification removes mode coupling, backscatter, horizontal refraction, or more than one of these. Their removal requires separate justification.

No propagation solver or scattering calculation was executed for this note. Verification here means that the claims and equations were checked against the cited source pages; it does not establish numerical convergence or accuracy for a user's environment.
