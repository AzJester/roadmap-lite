# Roadmap Builder Lite

A complete project-roadmap builder in **one HTML file**. Download `RoadmapBuilder.html`, double-click it, and it opens in your browser ready to use — **no installation, no admin rights, no account, no server, and no network access**. It was built for locked-down work laptops where you can't install software: opening a local HTML file in Edge or Chrome is a normal user action that needs no IT approval.

## Getting started

1. Download **`RoadmapBuilder.html`** (from this repository's Releases page, or the file itself above via *Download raw file*).
2. Double-click it. It opens in your default browser — Edge and Chrome give the best experience; Firefox works too.
3. Build your roadmap: start from a template (**More → Start from template**), or add lanes, phases, and milestones by hand in the **Details** view.

If Windows shows a "downloaded from the internet" warning the first time: right-click the file → **Properties** → check **Unblock** → OK. Hosting the file on an internal SharePoint/OneDrive/network share avoids that entirely and keeps everyone on the latest copy.

## Where your data lives — read this once

- The app **autosaves to your browser's local storage** as you type ("Saved locally" in the toolbar). That copy stays on your machine and never leaves it.
- Browser storage on managed machines can be wiped by IT policy, so the durable copy is a **file you own**: click **Save to file** (or press **Ctrl+S**) to write the whole portfolio to a JSON file. In Edge/Chrome it keeps updating the same file; elsewhere it downloads a fresh copy.
- **Open file** loads a saved portfolio or single-roadmap file back in — on the same machine or any other.
- Rule of thumb: **Save to file whenever you'd be sad to lose your work.**

## What it does

- **Three views** — Executive (progress band, stat chips, computed delivery summary, analysis cards), Timeline (zoomable Gantt with today line, decision gates, fit-to-screen), Details (full lane/item editor).
- **A portfolio** of many roadmaps with Active / Archived / Trash, duplicate, and per-roadmap backup.
- **Undo** for destructive actions, with a recovery snapshot kept in the save file.
- **Templates** — software delivery, product development, GTM campaign, data & analytics, hiring.
- **Exports** — PNG image, interactive HTML page, styled Excel workbook, roadmap JSON, print/PDF.
- **Imports** — roadmap/portfolio JSON (including backups from the full cloud-connected Roadmap Builder — same `roadmap.portfolio.v2` format), Jira CSV, and a downloadable JSON starter template.
- **Dark mode** and a presentation mode for meetings.

## What it deliberately leaves out

No sign-in, no cloud sync, no sharing links, no collaborator roles, and no AI features. Nothing calls any API. The page's Content-Security-Policy allows no remote origins, and the test suite asserts the file makes **zero network requests** and references **no external files**.

## For developers

Everything is inline in `RoadmapBuilder.html` — no build step. The dev dependencies exist only to run tests:

```
npm install
npm test              # static guarantees (self-contained, no cloud/AI remnants)
npm run test:browser  # Playwright: file:// boot, persistence, undo, backup round trip
```

## License

[MIT](LICENSE) — use it, share it with your team, modify it freely.
