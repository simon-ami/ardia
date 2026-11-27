# Lazy startup and MRU page eligibility

- Status: active; automated unit checks passed and the user accepted restored tabs and Control-Tab behavior. Delayed startup eligibility checks remain unconfirmed. Chrome-page omission remains unresolved.
- Source: [fork PR #6](https://github.com/simon-ami/ardia/pull/6).
- Behavior: empty command-bar tabs (`!url`) and `about:blank` never enter MRU or switcher lists (`isSwitchableTab` / `switcherTabEligible`).
- `Control-Tab` does nothing when fewer than two eligible pages exist (limiting `v0.2.49`'s single-destination shortcut to `inOrder` when `from` itself is switchable). From an excluded empty tab with two eligible pages, the first step picks the newest page (`ids[0] === from ? 1 : 0`).
- Startup must not schedule background `reloadRecentTabs` warmup; restore only the selected page and wake tabs on selection. Keep `reloadRecentTabs` available for diagnostics.
- Code: `apps/browser/src/state/tabs/{switchOrder.ts,tabLifecycle.ts}`, `state/pins/tabCleanup.ts`, and `state/sidebar/switcher.ts`, relative to `apps/browser/src`.
- Checks: `state/pins/recentTabs.test.mjs`, `state/sidebar/{sessionTabs,switcherModes}.test.mjs`, and `state/tabs/tabLifecycle.test.mjs`.
- Manual: unload all pages, wake one, and check that MRU excludes the empty replacement. Restart with several visited tabs and wait at least 15 seconds; unvisited background pages must stay idle.
- Open: intermittent omission of the Chrome extensions-shortcuts page; existing checks find it eligible and no Chrome-specific fix is established.
- Replacement: `v0.2.49` (`2763e843ef099bfe511a3278ace3142fe7924e13`) still schedules `reloadRecentTabs` three seconds after system-state load and permits empty/`about:blank` pages in MRU and `switcherStep`. Keep both adaptations.
