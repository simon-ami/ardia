# Exclude sleeping tabs from the MRU switcher

- Status: active; `v0.2.49` merge passed automated unit checks, manual checks pending for `v0.2.49`. Chrome automatic discard is not separately verified.
- Source: [upstream PR #612](https://github.com/mantrakp04/ardia/pull/612), `posthog-eu[bot]`, head `5c28393aceff9f08c9a1ca3713bdbe0d720b0b88`.
- Setting: Tabs → Show sleeping tabs in the tab switcher (`sleepingTabsInSwitcher`), synced, in `CONFIG_SETTING_KEYS`, default on (`true`).
- Behavior: share one eligibility check (`isSwitchableTab(s, id, activeId)` / `switcherTabEligible`) across `recentTabIds`, `sessionTabIds`, `inOrderTabIds`, `steppedTabId`, `syncSwitcherTabs`, and `commitSwitcher`.
- Always retain the active tab (if non-empty) and always exclude closed pinned tabs (`isAsleep(tab)`) unless active.
- When `sleepingTabsInSwitcher` is off (`false`), exclude sleeping (`isSleeping`) and unloaded (`isPageUnloaded`) tabs before sorting and the two-tab recency allowance so older awake tabs remain reachable. Apply to both `recent` and `inOrder` modes and to release commit.
- Code: `apps/browser/src/state/tabs/switchOrder.ts`, `state/pins/tabCleanup.ts`, `state/sidebar/switcher.ts`, `state/settings/{settings.ts,configAllowlist.ts}`, `components/settings/{panes/Tabs.tsx,rows/tabRows.ts}`.
- Checks: `state/pins/recentTabs.test.mjs`, `state/sidebar/{sessionTabs,switcherModes}.test.mjs`, `state/session/sessionSettings.test.mjs`, and `components/settings/settingsSearch.test.mjs` under `apps/browser/src`.
- Manual: unload a tab, toggle the setting, and check its entry disappears and returns across both `thumbnails` and `compactList` views; check selection and persistence after restart.
- Replacement: `v0.2.49` (`2763e843ef099bfe511a3278ace3142fe7924e13`) unconditionally hides sleeping and unloaded tabs in `isSwitchableTab` and omits active-tab retention in `syncSwitcherTabs`/`commitSwitcher`. Keep `sleepingTabsInSwitcher` (default on) with shared eligibility.
