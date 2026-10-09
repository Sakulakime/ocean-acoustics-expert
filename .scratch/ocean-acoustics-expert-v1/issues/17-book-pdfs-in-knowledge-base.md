# 17: Book PDFs in the knowledge base; Zotero no longer needed at answer time

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0005)

**What to build:** The five books the expert reads become part of the knowledge base.

- Their PDFs are copied from Zotero into `knowledge/sources/` under stable names. Zotero itself stays untouched.
- The PDFs are committed to git and shipped in the package.
- Notes point at a book's PDF by its path inside the knowledge base. They keep the Zotero item key only as a bibliographic identifier, so the expert no longer depends on Zotero storage at answer time.
- `check` verifies that every PDF a note points at exists.

**Blocked by:** 02

**Status:** done

- [x] Five PDFs copied read-only from Zotero storage into `knowledge/sources/`, byte-identical to the originals, with stable lower-case ASCII names (author-year-short-title):
  - COA: Jensen et al. 2011 (item `NWQ228R5`, attachment `B4W6S79R`)
  - Collins & Siegmann 2019, *Parabolic Wave Equations with Applications* (`SSSAYTZ4` / `AUZ6UZ8D`)
  - Colosi 2016, *Sound Propagation through the Stochastic Ocean* (`KPCLPWMR` / `HXJGK3LT`)
  - Etter 2018, *Underwater Acoustic Modeling and Simulation*, 5th ed. (`79KZ6RYC` / `YRB8HB36`)
  - Brekhovskikh & Lysanov 2003, *Fundamentals of Ocean Acoustics* (`ICAQF4XZ` / `TZIJC9DS`)
- [x] Zotero storage and database unchanged (copy only)
- [x] Hub, COA source note, routing map and chapter notes point at the COA PDF by its `sources/…` path instead of `zotero_storage_key`
  - [x] The source note keeps `zotero_key` (the item key)
  - [x] References to Zotero artifacts (Jasminum outline, `.zotero-ft-cache`) are removed
- [x] `zotero_storage` removed from the local path map schema and the hub, so `check` rejects `{{zotero_storage}}`
- [x] `check` fails with a specific message on a fixture note pointing at a source PDF that does not exist
- [x] PDFs are tracked by git, included by the package `files` whitelist (verified with `npm pack --dry-run`), and each under 50 MB
- [x] `check` passes on the authoring copy and all route-selection cases still pass

## Comments

**Implemented on `develop`.** The five books are in `knowledge/sources/` and notes point at them by path. `check` verifies every PDF a note points at. 48 subprocess tests pass, and the 11 route-selection cases still pass. Decisions and deviations:

- **File names.** All names are lower-case ASCII author-year-short-title. Two-author books carry both names. Each file was checked with `cmp` against its Zotero original.

  | File | Zotero item / attachment | Size |
  |---|---|---|
  | `jensen-2011-computational-ocean-acoustics.pdf` | `NWQ228R5` / `B4W6S79R` | 22.8 MB |
  | `collins-siegmann-2019-parabolic-wave-equations.pdf` | `SSSAYTZ4` / `AUZ6UZ8D` | 19.8 MB |
  | `colosi-2016-sound-propagation-stochastic-ocean.pdf` | `KPCLPWMR` / `HXJGK3LT` | 33.7 MB |
  | `etter-2018-underwater-acoustic-modeling-simulation.pdf` | `79KZ6RYC` / `YRB8HB36` | 14.5 MB |
  | `brekhovskikh-lysanov-2003-fundamentals-ocean-acoustics.pdf` | `ICAQF4XZ` / `TZIJC9DS` | 4.2 MB |

- **Item/attachment pairs were confirmed** from the Zotero database, opened read-only (`?immutable=1`).
- **Zotero is unchanged.** Hashes, sizes, mtimes and folder listings of the five attachment folders, and the database's mtime, match a baseline taken before the copy.
- **Fields.**
  - Chapter notes and the COA source note carry `source_pdf: sources/<file>.pdf`.
  - The hub and the routing map carry it as `primary_source_pdf`.
  - Source PDF paths are relative to the knowledge-base root; note-to-note links stay relative to the note.
  - The source note keeps `zotero_key: NWQ228R5`, and its body says the key is a citation identifier only.
- **What `check` treats as pointing at a PDF.** It looks at two things:
  - the value of a `source_pdf` or `primary_source_pdf` field, optionally quoted, in any form;
  - any `sources/….pdf` mention in text, alone or behind `{{knowledge_base}}/`, case-insensitive, subfolders allowed.

  A mention under another prefix (a URL, another logical name, a longer path) is not a book PDF. Each missing path is reported once per line, as `<file>:<line>: source PDF <path> does not exist`.
  - Known gap: a prose mention whose file name contains spaces is not recognised. Only field values can contain spaces, and the naming convention forbids them anyway.
- **Package.** `files` re-includes `knowledge/sources/*.pdf` after `!**/*.pdf`. With stray PDFs planted elsewhere in `knowledge/` and `tools/`, `npm pack --dry-run` includes exactly the five books: 83.3 MB packed, 95.4 MB unpacked. `!**/.zotero-*` stays as a cheap guard against copying a whole Zotero folder into `sources/`.
- **Code.** `textLines` was extracted into `src/data-file.js` and is shared by the machine-path rule and the source-PDF rule. The machine-path message now says "point at book PDFs by their sources/… path and name tools by logical name".
- **Glossary.** Only **Source** was amended, because the change made it false ("referenced, never contained"). The paper-related terms ADR 0005 drops (paper card, topic synthesis, uncurated evidence, the `paper` evidence tag) are left for `/domain-modeling`.
- **Out of scope.** `agent/ocean-acoustics-expert.md` and `skills/ocean-acoustics-router/SKILL.md` still name the Zotero PDF and `.zotero-ft-cache` by absolute path. Ticket 07 owns that ("no Zotero cache is used"). Until it lands, the shipped router contradicts the hub's "answering never needs Zotero". The four monographs are not yet referenced by any note; ticket 12 adds their source notes.
