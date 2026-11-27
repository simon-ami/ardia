# Title fading for unloaded and sleeping tabs

- Status: active; validated in `v0.2.48`; `v0.2.49` top-strip and split-chip behavior (`TabChip.tsx`, `SplitChip.tsx`) is unverified until manual checks.
- Source: [fork PR #2](https://github.com/simon-ami/ardia/pull/2), `e44b9e8b`.
- Setting: Tabs → Unloaded tab appearance → Fade titles (`fadeUnloadedTabTitles`), synced (`configAllowlist.ts`), default off.
- Behavior: fade titles (`FADED_TAB_OPACITY`, `0.45`) for sleeping and unloaded pages, closed pins, and restored tabs awaiting load across sidebar, folder panel, top strip, and split tabs (including pinned tabs showing their current page). Restore opacity on load/wake; loaded background tabs stay opaque. Keep icon fading and grayscale independent.
- Code: `apps/browser/src/state/sidebar/rowState.ts` (`useFadeTabTitle`), `components/tabstrip/{TabChip,SplitChip}.tsx`, and `state/settings/` (`configAllowlist.ts`).
- Checks: `apps/browser/src/state/tabs/staleness.test.mjs`, `state/session/sessionSettings.test.mjs`, `components/tabstrip/*.test.mjs`, `components/settings/settingsSearch.test.mjs`.
- Manual: toggle fading for loaded, sleeping, and unloaded tabs across sidebar, top strip, and split chips; wake a tab; vary icon fading separately.
- Related: [favicon grayscale](grayscale-unloaded-favicons.md).
- Replacement: `v0.2.49` groups icon fading and strikethrough (strikethrough plus 60% opacity), and fades unloaded titles only when icons fade. The fork keeps 45% fade-only independently; if both apply, use 45% once.
