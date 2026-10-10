---
title: Source Note - Parabolic Wave Equations with Applications
type: source-note
zotero_key: SSSAYTZ4
source_pdf: sources/collins-siegmann-2019-parabolic-wave-equations.pdf
doi: 10.1007/978-1-4939-9934-7
isbn: 978-1-4939-9932-3
year: 2019
edition: first
pdf_pages: 141
pdf_page_offset: 8 in chapters 1-2, 7 in chapter 3, 6 in chapter 4
status: active
---

# Source Note - Parabolic Wave Equations with Applications

## Bibliographic record

- Title: *Parabolic Wave Equations with Applications*
- Authors: Michael D. Collins, William L. Siegmann
- Publisher: Springer, New York
- Year: 2019
- DOI: `10.1007/978-1-4939-9934-7`
- ISBN: 978-1-4939-9932-3 (print), 978-1-4939-9934-7 (eBook)
- Zotero item key: `SSSAYTZ4` (a citation identifier; the expert does not read Zotero)

## What it adds to COA

COA Ch. 6 covers the parabolic equation at textbook depth. This monograph, by the author of RAM, goes further into the techniques behind modern PE codes and into media COA barely treats:

- rational (Padé) approximations of the square-root operator, including rotated ones (§2.2)
- the split-step finite-difference and split-step Padé solutions and the self-starter (§2.3-2.5); RAM implements the split-step Padé solution
- range dependence handled accurately: single scattering, energy conservation, rotated coordinates, variable topography and mapping (§2.6)
- three-dimensional PEs and the adiabatic mode solution (§2.7)
- the elastic PE for seismo-acoustics: factoring the operator, coupling with fluid layers, depth discretization, self-starters for compressional and shear sources, sloping interfaces, anisotropic media (Ch. 3)
- PEs for horizontally advected waves, buoyancy effects and poro-elastic media (Ch. 4)

## Page offset

The PDF leaves out the blank pages between chapters, so the offset changes by chapter. PDF page = book page + offset:

| Part | Book pages | PDF pages | Offset |
|---|---|---|---|
| Cover and front matter | i-ix | 1-8 | none (roman numerals) |
| Chapters 1-2 | 1-71 | 9-79 | +8 |
| Chapter 3 | 73-105 | 80-112 | +7 |
| Chapter 4 and index | 107-135 | 113-141 | +6 |

Blank book pages 72 and 106 are not in the PDF. The offsets come from the PDF's page labels and were checked against the page numbers printed on its pages.

## Section map

Built from the PDF's own outline, since this book has no Zotero text cache. Ranges are inclusive. A section ends on the page where the next one starts, unless the next one starts at the top of a page.

| Section | Title | Book pages | PDF pages |
|---|---|---|---|
| **1** | **Basic Concepts** | 1-24 | 9-32 |
| 1.1 | Introduction | 1-4 | 9-12 |
| 1.2 | The Elliptic Wave Equation | 5-13 | 13-21 |
| 1.2.1 | The Frequency Domain | 5-6 | 13-14 |
| 1.2.2 | The Uncoupled Azimuth Approximation | 6 | 14 |
| 1.2.3 | The Far-Field Equation | 7 | 15 |
| 1.2.4 | Source Conditions and Transmission Loss | 7-8 | 15-16 |
| 1.2.5 | Lossy Media and Absorbing Layers | 8-10 | 16-18 |
| 1.2.6 | The Normal Mode Solution | 10-12 | 18-20 |
| 1.2.7 | The Spectral Solution | 12-13 | 20-21 |
| 1.3 | The Parabolic Wave Equation | 13-18 | 21-26 |
| 1.3.1 | Derivation by Factoring the Operator | 15-16 | 23-24 |
| 1.3.2 | Derivation with Normal Modes | 16-18 | 24-26 |
| 1.4 | Depth Numerics | 18-24 | 26-32 |
| 1.4.1 | Finite-Difference Formulas | 18-19 | 26-27 |
| 1.4.2 | Source Conditions | 19-21 | 27-29 |
| 1.4.3 | Interface Conditions | 21-23 | 29-31 |
| 1.4.4 | Nonuniform Grid Spacing | 23-24 | 31-32 |
|  | References of chapter 1 | 24 | 32 |
| **2** | **Parabolic Equation Techniques** | 25-71 | 33-79 |
| 2.1 | Introduction | 25 | 33 |
| 2.2 | Rational Approximations | 26-33 | 34-41 |
| 2.2.1 | Numerically Generated Rational Approximations | 26-27 | 34-35 |
| 2.2.2 | Rotated Rational Approximations | 27-33 | 35-41 |
| 2.3 | The Split-Step Finite-Difference Solution | 34-36 | 42-44 |
| 2.4 | The Split-Step Padé Solution | 36-38 | 44-46 |
| 2.5 | The Self-Starter | 38-41 | 46-49 |
| 2.6 | Accurately Handling Range Dependence | 41-58 | 49-66 |
| 2.6.1 | Single Scattering | 42-43 | 50-51 |
| 2.6.2 | Energy Conservation | 43-47 | 51-55 |
| 2.6.3 | Rotated Coordinates, Variable Topography, and Mapping | 47-58 | 55-66 |
| 2.7 | Three-Dimensional Problems | 59-69 | 67-77 |
| 2.7.1 | Three-Dimensional Parabolic Equations | 59-60 | 67-68 |
| 2.7.2 | Adiabatic Mode Solution | 60-69 | 68-77 |
| 2 App. | Recursion Formula for Derivatives | 69-70 | 77-78 |
|  | References of chapter 2 | 70-71 | 78-79 |
| **3** | **Seismology and Seismo-Acoustics** | 73-105 | 80-112 |
| 3.1 | Introduction | 73 | 80 |
| 3.2 | The Elastic Wave Equation | 74-75 | 81-82 |
| 3.3 | The Elastic Parabolic Equation | 75-81 | 82-88 |
| 3.3.1 | Factoring the Operator | 77-78 | 84-85 |
| 3.3.2 | Boundaries and Coupling with Fluid Layers | 78-79 | 85-86 |
| 3.3.3 | Depth Discretization | 79-81 | 86-88 |
| 3.4 | The Self-Starter | 81-88 | 88-95 |
| 3.4.1 | Compressional and Shear Potentials | 81-84 | 88-91 |
| 3.4.2 | Compressional Source in a Solid Layer | 84-86 | 91-93 |
| 3.4.3 | Shear Source in a Solid Layer | 86-88 | 93-95 |
| 3.5 | Sloping Interfaces and Boundaries | 88-95 | 95-102 |
| 3.6 | Anisotropic Elastic Waves | 95-104 | 102-111 |
|  | References of chapter 3 | 104-105 | 111-112 |
| **4** | **Additional Applications** | 107-132 | 113-138 |
| 4.1 | Introduction | 107-108 | 113-114 |
| 4.2 | Horizontally Advected Acoustic Waves | 108-110 | 114-116 |
| 4.3 | Buoyancy Effects on Waves in Fluids | 110-116 | 116-122 |
| 4.4 | Poro-Elastic Media | 116-131 | 122-137 |
| 4.4.1 | The Poro-Elastic Wave Equation | 117-122 | 123-128 |
| 4.4.2 | The Poro-Elastic Parabolic Equation | 122-125 | 128-131 |
| 4.4.3 | Wave Speeds and Mappings Between Variables | 125-127 | 131-133 |
| 4.4.4 | Source Conditions | 128-131 | 134-137 |
|  | References of chapter 4 | 132 | 138 |
|  | Index | 133-135 | 139-141 |

## Retrieval guidance

- Read COA's notes first (`chapters/ch06-parabolic-equations.md`, `solvers/solver-ram.md`). Come here when they do not settle a PE question, or when it concerns a topic above that COA does not cover.
- The `parabolic_equations` route in `routing-map.yaml` lists this book's fallback windows. For other topics, take the smallest section range from the map above.
- Read page ranges only, never the whole book. Cite the section and the PDF pages read, for example `[textbook: Collins & Siegmann 2019 §2.4, PDF pp. 44-46]`.

## File anchors

- Full book PDF: `sources/collins-siegmann-2019-parabolic-wave-equations.pdf`, relative to the knowledge-base root. Page ranges in this note, and in the routing map's windows into this book, are PDF pages of this file.
