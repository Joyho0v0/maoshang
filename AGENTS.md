# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains a single source deliverable: `需求交接与效果图.doc` (requirements handoff and visual reference). There are no application modules, test directories, generated assets, or package manifests yet. Keep primary documents in the repository root until a clearer structure is needed. If supporting material is added, use descriptive folders such as `assets/` for images and `docs/` for supplementary notes; do not place generated exports beside source files unless they are intentionally versioned.

## Build, Test, and Development Commands

No build, test, lint, or local-run commands are configured. Review Word-document changes manually before committing:

```powershell
git status
git diff --stat
```

Open the `.doc` file in a compatible word processor and confirm that text, embedded visuals, page breaks, and formatting render correctly. Do not add tooling or dependency files unless the change requires them.

## Coding Style & Naming Conventions

Use clear, descriptive Chinese or English filenames consistent with the existing material. Preserve the `.doc` format unless the task explicitly requests a migration. For new Markdown documentation, use ATX headings (`## Heading`), concise sentences, fenced blocks for commands, and UTF-8 text. Name asset files by purpose, for example `assets/login-flow.png`, rather than ambiguous names such as `image1.png`.

## Testing Guidelines

There is no automated test framework or coverage target. Treat visual review as the acceptance check for document edits: verify headings, tables, images, links, and pagination in the target viewer. Record any manual validation that matters in the pull request description.

## Commit & Pull Request Guidelines

The repository has no commit history, so no established commit convention exists. Use short, imperative subjects such as `docs: update handoff requirements` or `assets: add login mockup`. Keep each commit focused. Pull requests should state the purpose, list changed files, link the relevant issue or request when available, and include screenshots or exported-page images whenever document layout or visuals change.

## Repository Hygiene

Avoid committing temporary Office files (for example `~$*.doc`), local exports, or unrelated binaries. Confirm `git status` before each commit so the intended source document and supporting files are the only staged changes.
