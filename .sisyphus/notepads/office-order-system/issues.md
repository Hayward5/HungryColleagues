- 2026-01-28: Re-running init only fills blank headers and missing Config keys; if existing headers are wrong, they must be corrected manually.
- 2026-01-28: `npm install` timed out (dependencies not installed yet), so build/preview verification for frontend is still pending.
- 2026-01-28: `npm install --no-fund --no-audit --progress=false` also timed out; need network or cache to proceed with build/preview.
- 2026-01-28: GAS manual verification (curl) blocked until Apps Script Web App is deployed and SpreadsheetId is set.
- 2026-01-28: getMyOrders/getOrderSessions/getStatistics/exportOrders not verified yet (requires real Orders data and deployed GAS endpoint).
- 2026-01-28: Admin token flows require Script Properties (AdminPassword, TokenSecret) and will fail until configured.
- 2026-01-28: `npm install --prefer-offline` succeeded; build/dev/preview now verified locally.
- 2026-01-28: No issues encountered while updating GAS scaffold helpers.

- 2026-01-28: `lsp_diagnostics` reports missing executables (`typescript-language-server`, `vue-language-server`, `biome`) even after local install; environment PATH used by the LSP tool appears not to include user/node paths. Verification may require system-level installation or tool PATH/config adjustment.
