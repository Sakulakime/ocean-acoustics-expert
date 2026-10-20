---
title: Colosi - Stochastic Regimes and Acoustic Coherence
type: topic-note
source: 01-source-colosi.md
source_pdf: sources/colosi-2016-sound-propagation-stochastic-ocean.pdf
pdf_pages:
  - "61-63"
  - "174-178"
  - "193-208"
  - "302-307"
  - "327-336"
status: verified
---

# Colosi - Stochastic Regimes and Acoustic Coherence

## When to use this note

Use Colosi as the primary source for internal-wave-induced acoustic variability, propagation regimes, coherence, and the relation between random propagation and pulse statistics. Select the theory by the requested observable and regime. A deterministic propagation method alone does not specify the statistics of a fluctuating ocean. Table 1.5 is a map for **single-path statistics**, with separate advice for normal-mode fluctuations; it is not a universal accuracy guarantee for every multipath field. [textbook: Colosi 2016 §1.5, PDF pp. 61-63]

For a complex question, pair this note with the relevant deterministic propagation note even when either note gives a plausible answer alone. In particular, read `chapters/ch08-broadband-modeling.md` for frequency-domain synthesis and received waveforms, and `chapters/ch05-normal-modes.md` for modal dispersion and deterministic mode coupling. This pairing helps separate a deterministic arrival structure from stochastic changes to that structure. [inference]

## Statistical quantities and physical setting

- Let `p` be complex acoustic pressure and `I = |p|^2` its intensity in the book's field normalization. Angle brackets denote an ensemble average over the random medium. The scintillation index is the normalized intensity variance, `SI = (<I^2> - <I>^2)/<I>^2`, not the variance of transmission loss in dB. [textbook: Colosi 2016 §4.1.4, Eq. (4.12), PDF pp. 177-178]
- The fractional sound-speed perturbation is `mu = delta c / c0`, where `c0` is reference sound speed. Internal-wave scattering produces multiple nearby stationary travel-time paths, called microrays. Their bundles and interference depend on the background waveguide and on the strength and spectrum of the fluctuations. The ensemble mean field need not be the unperturbed field: scattering into shadow zones and changes in bottom interaction can introduce biases. [textbook: Colosi 2016 §4.1.3, PDF pp. 174-176]
- `Phi` is the strength parameter: the rms phase fluctuation in the geometrical-acoustics limit. `Lambda` is a diffraction parameter that compares a Fresnel-zone scale to an effective vertical correlation scale of the medium, with spectral and path weighting. Neither is determined by acoustic frequency alone. [textbook: Colosi 2016 §4.3.1, PDF pp. 194-198]

The book writes the strength as

\[
\Phi^2=q_0^2\int_\Gamma
\langle\mu^2(z)\rangle L_p(\theta,z)\,ds,
\qquad q_0=\omega/c_0.
\]

Here `Gamma` is the unperturbed ray, `omega` is angular acoustic frequency, and `Lp` is the correlation length along the ray direction. The background ray path, depth-dependent variance, and directional correlation length all matter. The locally straight-ray estimate of `Lp` requires curvature corrections for large grazing angles. The often quoted scaling `Phi proportional to frequency times sqrt(range)` is a scaling under this model, not a replacement for the path integral in a changing environment. [textbook: Colosi 2016 §4.3.1, Eqs. (4.34)-(4.37), PDF pp. 195-197]

For environmental uncertainty quantification (UQ), explicitly record the medium ensemble, its correlations or spectrum, the background profile, source and receiver geometry, frequency, and observable before estimating these statistics. A set of deterministic fields at different frequencies in one environment is not by itself an environmental ensemble. This is an application of the ensemble definitions, rather than a new stochastic propagation result. [inference]

## Regime selection: what becomes random, and how

The range axis in Colosi's schematic of `SI` is deliberately unlabelled: transition ranges depend on the background profile, ray path, source and receiver positions, and frequency. Do not assign an unsaturated or saturated label from distance or frequency alone. [textbook: Colosi 2016 §4.3, PDF pp. 193-194]

| Regime | Physical picture and useful statistics | Qualification |
|---|---|---|
| Unsaturated / weak fluctuations | One dominant perturbed path and ray tube. Phase changes reflect travel-time advances and delays; intensity changes reflect convergence and divergence of the ray tube. Born or Rytov theory describes phase and log-amplitude statistics. | In the geometrical regime, phase variations can be large while amplitude variations remain small. “Weak” does not mean that every complex-field phase difference is small. |
| Partially saturated / strong focusing | Several correlated microrays can add constructively, producing strong focuses and fades. `SI` can approach the saturated value from above. | A log-normal intensity law is not a general description here; fitted generalized Gamma or convolution models are discussed. Diffraction suppresses strong focusing. |
| Fully saturated | Many independent microray contributions yield, asymptotically, independent zero-mean Gaussian real and imaginary pressure components, exponential intensity, and Rayleigh amplitude. In that limit, `SI = 1`. | These distributional results use the independent-contribution / central-limit picture. `SI` near one alone does not establish all of its assumptions. |

The first row follows §4.3.2, PDF pp. 199-201; the second follows PDF pp. 201-203; the third follows PDF pp. 203-205. The caution about diagnosing the full distribution from `SI` alone is an inference from the assumptions used in the derivation. [textbook: Colosi 2016 §4.3.2, PDF pp. 199-205] [inference]

`Lambda-Phi` boundaries in the book include asymptotic estimates and a fit from numerical experimentation. The microray-generation condition is described as reasonable but not unique. They are regime guidance, not exact universal transition surfaces or a proof that an approximation is valid for a new waveguide. [textbook: Colosi 2016 §4.3.1, PDF pp. 196-199]

## Select a theory by observable

| Requested quantity | Starting theory in Colosi | Limit that must remain visible |
|---|---|---|
| Phase / travel-time variance; arrival-angle variance | Ray theory, Chapters 4-5 | Ray-like observables and their waveguide/path assumptions; ray chaos changes which ray description is appropriate. |
| Phase / travel-time spectrum | Born theory, Chapter 6 | Table 1.5 lists this across regimes; this does not extend the same validity to log-amplitude statistics. |
| Log-amplitude variance or spectrum; phase–log-amplitude correlation | Born / weak fluctuation theory, Chapters 4 and 6 | The table restricts these quantities to the unsaturated regime. |
| Mean pressure; space, time, or frequency coherence; pulse wander, spread, bias; intensity moments | Path integral theory, Chapters 4 and 7 | Entries span unsaturated, partially saturated, and saturated regimes, but expansion about a deterministic ray and ray chaos limit applicability. |
| Single-frequency normal-mode energy and coherence | Coupled-mode / hybrid transport theory, Chapter 8 | This is a separate mode-statistics treatment. Do not infer a cross-frequency or higher-moment validation from a single-frequency second-moment comparison. |

This selection follows Table 1.5 and its caveat. The book's 2016 assessment reports limited observational validation for mode transport and outstanding higher-moment and cross-frequency pulse comparisons; that assessment is historical evidence, not a survey of subsequent literature. [textbook: Colosi 2016 §§1.4-1.5, PDF pp. 61-63]

## Spatial and temporal coherence

For same-frequency pressure observed at two space–time endpoints, the mutual coherence function is `<p(1) p*(2)>`. A normalized coherence divides it by the field intensity normalization; when the two mean intensities are equal, Colosi uses `<|p|^2>` in the denominator. It controls the signal gain available to coherent spatial or temporal combination. Under the book's uncorrelated signal/noise and noise/noise assumptions, perfectly coherent samples give gain proportional to the number of samples. [textbook: Colosi 2016 §4.3.3, Eqs. (4.58)-(4.61), PDF pp. 205-206]

The central random quantity is the phase structure function `D(1,2)`, the ensemble mean square of the phase difference accumulated along the two paths. Under the normalized path-integral model,

\[
C(1,2)=\exp[-D(1,2)/2].
\]

The medium correlation function enters `D` through correlations of `mu` along the paths. Receiver separation is not the separation everywhere on the paths: horizontal separation grows from the shared source towards the receivers, and vertical separation is affected by the waveguide's ray-tube geometry. [textbook: Colosi 2016 §4.3.3, Eqs. (4.60)-(4.63), PDF p. 206; §§7.4-7.4.2, Eqs. (7.23)-(7.45), PDF pp. 302-307]

This exponential form has specific assumptions. The path-integral derivation treats `mu` as a zero-mean Gaussian random variable, expands around the deterministic ray, and assumes the phase structure function does not depend on the paths' mean transverse and vertical coordinates. Vertical inhomogeneity makes the last assumption particularly uncertain. Ray chaos can invalidate the expansion about a deterministic ray at long range. The book also discusses a broadband microray model and long-range observations where an amplitude-correlation factor remains in the normalized coherence. Do not apply `exp(-D/2)` as an assumption-free identity. [textbook: Colosi 2016 §§7.4-7.4.2, PDF pp. 302-307; §4.3.3, PDF p. 206]

For a local quadratic structure-function approximation, `D(Delta) approximately (nu_Delta Delta)^2`. The characteristic separation is defined here by `D = 1`, corresponding to `C = exp(-1/2)`, rather than by a universal convention for “coherence length.” Conceptually,

\[
t_0\simeq\widehat T_{IW}/\Phi,\qquad
z_0\simeq\widehat L_z/\Phi,\qquad
y_0\simeq\widehat L_H/\Phi.
\]

`t0`, `z0`, and `y0` are acoustic time, vertical, and horizontal coherence scales. The hatted scales are effective internal-wave time and length scales with the perpendicular-wavenumber constraint, not simply the unconstrained medium correlation scales. They depend on depth and ray angle. The resulting inverse-frequency and inverse-square-root-range scaling is an order-of-magnitude result within this framework. [textbook: Colosi 2016 §4.3.3, Eqs. (4.64)-(4.66), PDF pp. 206-207]

## Frequency coherence and pulse statistics

The cross-frequency mutual coherence is

\[
K(\omega_1,\omega_2)=\langle p(\omega_1)p^*(\omega_2)\rangle.
\]

In Colosi's frequency-separation formulation, the ensemble-average pulse intensity is the Fourier transform of the cross-frequency coherence multiplied by the transmitted-signal spectral correlation `TX(Delta omega)`. Thus pulse statistics need complex cross-frequency information as well as the transmitted spectrum. [textbook: Colosi 2016 §7.5, Eqs. (7.70)-(7.72), PDF pp. 327-328]

Three changes to a received pulse must be distinguished:

1. **Time wander:** different medium realizations shift a pulse in time; averaging those unaligned pulses broadens the ensemble-average pulse.
2. **Travel-time bias:** the ensemble mean arrival time differs from the unperturbed arrival time; the bias can be positive or negative.
3. **Microray spread:** scattered paths within a realization have different arrival times; loss of coherence across the signal bandwidth is related to this spread.

These are the three effects identified in §7.5. They describe stochastic changes around the unperturbed propagation problem; they do not eliminate any deterministic multipath arrival structure already present in that problem. [textbook: Colosi 2016 §7.5, PDF pp. 327-330] [inference]

After the path expansion and Markov / ray-tangent approximation, Colosi separates the frequency coherence into a time-wander factor and a microray bandwidth function `Q`. With the unperturbed single-path field normalized as in the derivation, write this normalized coherence as `Kn`:

\[
K_n(\Delta\omega)
=\exp[-\tfrac12(\Delta\omega)^2\langle\tau^2\rangle]\,Q(\Delta\omega),
\]

Here `Delta omega = omega1 - omega2`. The `Kn` statistic uses the derivation's unperturbed-field normalization; it is not the raw `K`, and should not automatically be identified with the conventional two-intensity-normalized coherence. The quantity `tau` is the zero-mean travel-time fluctuation and `Q` accounts for bias and scattering-induced spread. For small frequency separation,

\[
Q(\Delta\omega)\simeq
\exp[i\Delta\omega\tau_1-\tfrac12(\Delta\omega\tau_0)^2].
\]

`tau1` is the travel-time bias and `tau0` describes the microray pulse spread. The reciprocal scale `1/tau0` is the coherent angular-frequency bandwidth in this approximation; converting to cyclic frequency requires the factor `2*pi`. A measured total coherence width can also contain time wander, so it cannot automatically be identified with `1/tau0`. [textbook: Colosi 2016 §§7.5-7.5.1, Eqs. (7.82)-(7.90), PDF pp. 330-332] [inference]

For the Gaussian transmitted pulse in the book's example, the ensemble pulse width parameter combines the unperturbed width, time-wander variance, and microray-spread variance in quadrature. This is a result for that pulse and approximation; it is not a general decomposition of every observed broadband waveform. [textbook: Colosi 2016 §7.5.1, Eqs. (7.87)-(7.90), PDF pp. 331-332]

Important limits are explicit in the derivation and observations:

- The frequency-coherence path integral expands about an unperturbed ray and assumes horizontal and vertical homogeneity in the relevant structure function. Its simplified evaluation additionally neglects transverse scattering and makes a quadratic expansion in vertical separation. [textbook: Colosi 2016 §7.5, PDF pp. 328-330]
- The simple small-separation prediction of spread has disagreed with observations, especially at basin scale. The eigenvalue evaluation improves the calculation and represents asymmetric early/late pulse tails, but it still failed to explain the long-range AET pulse fully. The book identifies ray chaos as a likely influence. [textbook: Colosi 2016 §§7.5.1-7.5.2, PDF pp. 332-336]
- Aligning pulse peaks before averaging removes some wander, but the book warns that this procedure's effect on the theoretical spread estimate is unclear. State the alignment procedure when comparing pulse widths. [textbook: Colosi 2016 §7.5.2 and opening of §7.6, PDF pp. 334-336]

## Use in environmental UQ and cross-frequency studies

The following are research-design implications, rather than additional book results:

- Define whether the target is mean complex pressure, mean intensity, intensity variance, phase/travel-time variance, or a mutual coherence function. Similar mean TL does not establish similar phase or coherence statistics. [inference]
- Preserve a shared medium realization across frequencies when estimating cross-frequency coherence. Independently resampling the environment at each frequency changes the joint ensemble and therefore changes the quantity being estimated. [inference]
- Report source spectrum, frequency separation, phase reference, receiver coordinates, ensemble definition, and coherence normalization. Distinguish deterministic arrival dispersion from random wander, bias, and within-realization scattering spread. [inference]
- Check physical regime assumptions and numerical accuracy separately. A successful Monte Carlo run or solver regression test does not establish that the environmental spectrum, Gaussian assumptions, path expansion, or selected theory applies to the intended ocean. [inference]

## Targeted follow-up windows

The following windows have been read for this note unless labelled as source-map follow-up. Never load an entire chapter to answer one of these questions.

| Need | Section and PDF pages | Retrieval purpose |
|---|---|---|
| Choose theory for a named statistic | §1.5, PDF pp. 61-63 | Table 1.5; retain the single-path and ray-chaos caveats. |
| Define microrays and intensity statistics | §4.1.3-4.1.4, PDF pp. 174-178 | Medium perturbations, independent contributions, fractional bandwidth, SI. |
| Interpret a regime label | §4.3.1-4.3.2, PDF pp. 194-205 | Strength/diffraction parameters, focusing, saturation, pulse behavior. |
| Estimate a space–time coherence scale | §4.3.3, PDF pp. 205-207 | Structure function and scale convention. |
| Check the normalized coherence derivation | §7.4-7.4.2, PDF pp. 302-307 | Assumptions, ray-tube separations, medium correlations, broadband qualification. |
| Separate cross-frequency wander, bias, and spread | §7.5-7.5.1, PDF pp. 327-332 | Frequency MCF, EAP, `Q`, small-separation and eigenvalue methods. |
| Assess empirical limits of pulse predictions | §7.5.2 and opening §7.6, PDF pp. 334-336 | AFAR/AET comparisons; peak-alignment qualification. |
| Build an internal-wave ensemble | Source-map follow-up: §3.3, PDF pp. 142-151; Ch. 3 Appendix B, PDF pp. 165-167 | Read the model and Monte Carlo construction before implementing them; these pages were not read for this note. |
| Predict mode statistics | Source-map follow-up: §§8.5-8.7, PDF pp. 370-411 | Choose a smaller subsection from `01-source-colosi.md` for energy, space/time coherence, or frequency coherence; this span was not read for this note. |

## Related notes

- `01-source-colosi.md`: complete section map and further fallback windows.
- `chapters/ch05-normal-modes.md`: deterministic modal dispersion and coupled/adiabatic propagation.
- `chapters/ch08-broadband-modeling.md`: narrowband-to-pulse synthesis and received-signal interpretation.

The COA comparisons above use those local chapter notes; no COA PDF pages were read for this topic note. All technical Colosi summaries are anchored to the explicitly listed windows, not inferred from the source note's table of contents.
