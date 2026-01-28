- 2026-01-28: GAS project skeleton not present yet; placed init function in `gas/sheetsInit.gs` as a placeholder to be moved into the actual Apps Script structure later.
- 2026-01-28: Created GAS scaffold at `backend/apps-script/` with `Code.gs` and `appsscript.json` (timeZone set to Asia/Taipei).
- 2026-01-28: GAS data access reads `SpreadsheetId` from Script Properties; falls back to active spreadsheet if bound.
- 2026-01-28: Added Script Properties helper functions in `backend/apps-script/Code.gs` for `AdminPassword` and `TokenSecret` retrieval.

- 2026-01-28: Frontend placed at repo root (Vite app in `/`), with source in `src/` and static assets in `public/`.
- 2026-01-28: Use plain JS (`src/main.js`, `src/router/index.js`) to keep scaffolding minimal; Vue Router uses Hash history for GitHub Pages.
- 2026-01-28: `package.json` set to `type: module`; Tailwind/PostCSS configs use `.cjs` (`tailwind.config.cjs`, `postcss.config.cjs`) for compatibility.
