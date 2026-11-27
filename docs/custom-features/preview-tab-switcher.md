# MRU tab switcher with page previews

- Status: active; automated unit checks passed and the user accepted Control-Tab previews. Compact list, none, overflow, themes, and pre-mount/decode checks remain unconfirmed.
- Source: [upstream PR #186](https://github.com/mantrakp04/ardia/pull/186), Nana Amoako (`nanadotam`), head `6cc0afcd5e0b0c73b4eb7bb45a4f4cab98f16e28`; merged with `v0.2.49` (`2763e843ef099bfe511a3278ace3142fe7924e13`).
- Setting: Appearance → Switching tabs (`tabSwitcherOrder`: `"recent" | "inOrder"`, default `"recent"`; `tabSwitcherView`: `"thumbnails" | "compactList" | "none"`, default `"thumbnails"`, synced, in `CONFIG_SETTING_KEYS`).
- Behavior: `Control-Tab` (`tabSwitcher:forward`) and `Control-Shift-Tab` (`tabSwitcher:backward`) are default shortcuts; `ctrlTabUpgrade` migrates legacy overrides.
- Pre-mount at 70 ms (`MOUNT_AFTER_MS`), show at 140 ms (`SHOW_AFTER_MS`); release commits, Escape cancels, mouse selects; `hoverSwitcherRow` and `Control-W` (`closeSwitcherRow`) require `s.visible`. Quick taps switch without UI.
- `compactList` uses `v0.2.49`'s vertical list (`TAB_SWITCHER.list`: max 380 pt width, 40 pt rows, max 8 rows).
- `thumbnails` keeps Zen 1.24.1b layout: width `ceil(logical screen width × 0.85 / 7)`, screen aspect height, clamped to window; `columnScale` 1.25; scroll reveals keyboard selection while hover keeps rows still. Keep always-dark panel (`fill`), 8 pt card padding, constant 2 pt border, no rest ring, `previewBackdrop` (`themeColor` or non-white `blankFill`) + `onLoad` decode, 42 pt overlapping bottom-right favicon badge (5 pt padding, 1 pt border, 30 pt icon, 6 pt overlap), and 13 pt regular centered title with 8 pt gap.
- Cache 40 previews, exclude private tabs, reject stale captures on close, URL change, profile change, or WebView change.
- Code: `components/sidebar/{TabSwitcher.tsx,tokens.ts,switcherPreview.ts,switcherScroll.ts}`, `state/sidebar/switcher.ts`, `state/commands/ctrlTabKeys.ts`, `state/tabs/{tabPictures.ts,switchOrder.ts}` (under `apps/browser/src`).
- Checks: `sessionTabs.test.mjs`, `switcherModes.test.mjs`, `tabPictures.test.mjs`, `switcherPreview.test.mjs`, `switcherScroll.test.mjs`, `ctrlTabKeys.test.mjs`, `conventions.test.mjs`.
- Manual: cycle, quick-tap, commit, cancel, mouse, narrow windows, all views/orders, both themes, private tabs, custom icons.
- Replacement: `v0.2.49` adopts `Control-Tab` MRU default, 70 ms pre-mount, `onLoad` decode, `themeColor` backdrop, `compactList`/`none`, and `ctrlTabUpgrade`, but keeps 168 pt cards, 1 pt rest ring, inline 13 pt label favicon, and tab-existence-only capture guards. Keep upstream interaction/modes/decode with Zen thumbnail styling and `tabPictures.ts` stale guards.
