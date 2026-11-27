# MRU successor across pinned and regular tabs

- Status: active; automated unit checks and the user’s cross-section close MRU check passed. Extended close-mode checks remain unconfirmed.
- Source: [fork PR #6](https://github.com/simon-ami/ardia/pull/6).
- Behavior: in `previouslyActive` mode (default), closing or unloading the active tab selects the most recent awake, non-empty page in the same window and space, across regular tabs, pins, pinned groups, and Top Apps. Exclude every affected tab.
- Use `sleepsNow` so shared pins whose holder tab is sleeping are skipped. Break timestamp ties by `openerId` first, then nearest tab to the closed tab.
- MRU takes precedence over opener/sibling preference when an awake candidate exists. On pinned-tab unload, fall back to a sleeping loaded tab (`includeSleeping`) before creating a New Tab; never wake `asleep` or `idle` closed pins.
- Keep `v0.2.49`'s `afterClosingTab` options (`tabAbove` / `tabBelow` via `closeActivation.ts`), surviving split-pane preference (`!leaving.has(activeId)`), pinned unloading vs regular removal, and `keepTopAppsRunning` exclusions.
- Code: `apps/browser/src/state/tabs/{awakeMru.ts,tabs.ts,discardActions.ts,closeActivation.ts}`.
- Checks: `tabs.test.mjs`, `closing.test.mjs`, `discardActions.test.mjs`, `closeActivation.test.mjs`, and `components/sidebar/revealScroll.test.mjs`; recency tests need distinct activation timestamps.
- Manual: alternate visits between a regular tab and a pin/Top App, then close the newest tab in both directions. Verify `afterClosingTab` (`previouslyActive` vs `tabAbove`/`tabBelow`) in Settings.
- Related: [native unloading](manual-tab-unloading.md).
- Replacement: `v0.2.49` (`2763e843ef099bfe511a3278ace3142fe7924e13`) adds `afterClosingTab` and `sleepsNow`, but in `previouslyActive` mode still prioritizes open pinned rows on pinned-row close and regular tabs on Top App close, and permits empty/`idle` close successors. Keep cross-section MRU and awake non-empty eligibility.
