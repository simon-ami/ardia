# Native manual tab unloading and discard recovery

- Status: active; the user accepted menu placement, unloading, and reload on selection. Multi-tab, shortcut, and history checks remain unconfirmed. Auto Tab Discard remains unresolved.
- Source: [fork PR #6](https://github.com/simon-ami/ardia/pull/6),
  [upstream #634](https://github.com/mantrakp04/ardia/issues/634).
- Behavior: provide `Unload Tab` (in `sleepItems` beside `Sleep Tab`), `Unload N Tabs` (multi-tab menu), and configurable `Unload Tab(s)` shortcuts with no default binding. Use native WebView discard; keep tab identity, rows, and history. Report native refusals.
- Before unloading, select an awake same-window, same-space MRU page, excluding all targets; open a new tab if none exists. Never remove targets or close the window ([successor selection](cross-section-close-mru.md)).
- Recover extension discards only when their native event reaches the app. Background discards keep selection unchanged; ignore replacements in another shared-data space.
- Code: `apps/browser/src/state/tabs/discardActions.ts`, `components/window/TabWebView.tsx` (`leaveDiscardedTabs` within 400-line cap), `state/commands/commands.ts`, `state/sidebar/{tabMenu,multiTabMenu}.ts`, native command tables.
- Checks: `state/tabs/discardActions.test.mjs`, `state/sidebar/menus.test.mjs`, `conventions.test.mjs` (`apps/browser/src`).
- Manual: unload one/multiple tabs via menu and shortcut; check replacement, retained rows, wake, Back history, and bound shortcut.
- Open: #634 is unproved on the real extension path; debugging is deferred.
- Replacement: `v0.2.49` groups Sleep Tab/Tabs in `sleepItems` with proactive protections. Keep both actions; Unload switches first and has a configurable shortcut.
