# Native manual tab unloading and discard recovery

- Status: native unloading implemented and manually validated. Auto Tab Discard extension behavior remains unresolved.
- Source: Simon's request and [upstream issue #634](https://github.com/mantrakp04/ardia/issues/634).
- Required behavior: Unload Tab in the tab menu; Unload N Tabs for a selection; configurable Unload Tab(s)
  command in Settings → Keyboard Shortcuts and the app menu (no default binding).
- Uses the existing native WebView discard API, retaining Chrome tab identity and navigation history.
  Native refusals are reported. No new engine build is required.
- Before unloading selected tabs, activate the most recent awake tab in the same window and current space,
  excluding every unload target. Open a new tab if no such tab exists. Never close the window or remove targets.
- Extension-triggered active discards use the same recovery when their native discard event reaches the app.
  Background discards leave the visible tab alone. A replacement in a different shared-data space is ignored.
- Implementation: `state/tabs/discardActions.ts`, `components/window/TabWebView.tsx`, command catalog,
  single/multiple tab menus, generated command tables, and native main menu under the browser and shell packages.
- Checks: two focused regression cases cover same-space MRU selection, sleeping candidates, all selected tabs,
  new-tab fallback, and background discards. Existing menu expectations updated for the new actions.
- Manual check: unload the current tab and a multiple selection; check same-space MRU replacement,
  retained tab rows, wake on selection, and Back history. Bind the command and check the shortcut.
  Repeat the extension case from #634 with shared-data spaces.
- Verification: native Release build succeeded; real Chrome discard returned `already` for the unloaded tabs.
  The discarded page woke with `document.wasDiscarded`, selection moved to the awake MRU tab, and unloading
  both selected tabs created a new tab while keeping both original rows. Extension cross-space recovery is
  covered only at the state-helper level; this does not establish that the real extension path is fixed.
- Full browser suite: 1,655 cases; 1,651 passed initially. The four failures were the new config keys missing
  from the allowlist and expected menu changes. Those were fixed; all 50 related checks passed on rerun.
- Installed at `~/Applications/Ardia Personal.app`, 2026-11-06.
  Backup: `~/Library/Application Support/Ardia Personal/Updates/20261106-183009-66771873`.
- Manual result (2026-11-06): Simon confirms single/multiple native unloading and waking work,
  including across shared-data spaces. Auto Tab Discard still behaves oddly as before (#634);
  Simon accepts the native command as the preferred path and does not require more extension debugging now.
- Upstream replacement evidence and removal approval: none.

- [Shared close/unload successor selection](cross-section-close-mru.md) applies the same MRU rule across tab sections.
