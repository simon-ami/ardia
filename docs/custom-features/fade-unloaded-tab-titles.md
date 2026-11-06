# Title fading for unloaded and sleeping tabs

- Status: active in the fork. Upstream equivalence has not yet been reviewed.
- Source: [fork PR #2](https://github.com/simon-ami/ardia/pull/2), commit `e44b9e8b8ca084cdc6f722d99d2082d4c5281dce`.
- Setting: Settings → Tabs → Advanced → **Fade titles of unloaded tabs** (`fadeUnloadedTabTitles`).
- Required behavior:
  - Off by default. When off, titles retain their normal opacity.
  - When on, fade titles for sleeping tabs and unloaded pages, including closed pinned tabs and restored tabs awaiting load.
  - Apply the setting to sidebar rows, folder-panel rows, top-strip tabs, and split tabs.
  - Restore normal opacity when the page loads or wakes. A loaded background tab stays opaque.
  - Keep title fading independent of icon fading.
  - Persist the setting. Preserve its existing configuration and sync support.
- Implementation: `apps/browser/src/state/sidebar/rowState.ts` (`useFadeTabTitle`), sidebar and tabstrip components,
  and `apps/browser/src/state/settings/`.
- Automated checks: `apps/browser/src/state/tabs/staleness.test.mjs` covers state transitions and icon independence.
  `apps/browser/src/state/session/sessionSettings.test.mjs` checks the default for older sessions.
- Manual check when affected: toggle the setting; inspect loaded, unloaded, and sleeping tabs in the affected layouts.
  Wake a tab. Confirm its title returns to normal. Change icon fading separately.
- Replacement approval: none.
