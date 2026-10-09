# Ocean Acoustics Expert

A curated, agent-facing knowledge base on underwater acoustics, together with the expert agent that answers from it and the tooling that installs both into coding-agent harnesses.

## Knowledge base structure

**Knowledge base** (知识库):
The curated set of notes the expert agent answers from; the single source of truth for what the agent knows.
_Avoid_: library, vault, corpus

**Source** (来源):
An original document (book, paper, or manual) that the knowledge base draws on. The PDFs of the books the expert reads ship inside the knowledge base (ADR 0005); other sources are referenced, never contained.
_Avoid_: reference, document, PDF

**Source note**:
A note describing one book-level source: its bibliographic record and a map from its structure to page ranges.
_Avoid_: book note, book card

**Chapter note**:
A structured summary of one chapter of a source, anchored to that chapter's page span.

**Paper card** (论文卡片):
A fixed-field, project-neutral record of what one paper claims, how it supports the claim, and under which conditions.
_Avoid_: paper note, literature note, 文献笔记

**Topic synthesis** (主题综述):
A note that compares the paper cards on one research topic and states where they agree, differ, and leave gaps.
_Avoid_: survey, review note

**Project literature note** (项目文献笔记):
A note that judges what a paper means for one specific research route of the user. It belongs to that project, never to the knowledge base.
_Avoid_: paper card

**Benchmark case** (基准算例):
A canonical, fully parameterised ocean environment used to validate propagation solvers or data-driven models, such as the Pekeris waveguide.
_Avoid_: test case, example, scenario

**Runbook**:
Operational instructions for building inputs to, running, and reading outputs from one solver.
_Avoid_: tutorial, guide

## Retrieval

**Route**:
The mapping from a topic bucket to the notes and fallback windows the agent reads for it.

**Fallback window**:
A targeted page range of a source, read only when the notes do not settle the question.
_Avoid_: page reference, citation

**Uncurated evidence** (未整理证据):
Text found in a source's full text that no paper card or chapter note covers.
_Avoid_: raw hit, search result

**Evidence tag** (证据标签):
A label on each claim in an answer marking it as textbook consensus, a paper's finding, or the agent's own inference.
_Avoid_: confidence level, citation

**Ingestion** (入库):
Adding one source to the knowledge base by producing its notes or card to the fixed specification and updating routes.
_Avoid_: import, sync

## Distribution

**Harness** (智能体宿主):
A coding-agent runtime the package installs into, such as Claude Code, Codex, or OpenCode.
_Avoid_: platform, client, IDE, 智能体

**Authoring copy** (编写副本):
The knowledge base inside the project repo; the only copy that ingestion may change.
_Avoid_: source, master

**Installed copy** (安装副本):
The knowledge base that harnesses read at answer time, either a copy of or a link to the authoring copy.
_Avoid_: deployment, cache
