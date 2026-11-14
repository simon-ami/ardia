# MRU tab switcher with page previews

- Status: active; adapted upstream behavior passed automated and manual checks.
- Source: [upstream PR #186](https://github.com/mantrakp04/ardia/pull/186), Nana Amoako (`nanadotam`),
  head `6cc0afcd5e0b0c73b4eb7bb45a4f4cab98f16e28`; adapted in [fork PR #6](https://github.com/simon-ami/ardia/pull/6).
  Base: `v0.2.47-nightly.1`, `eea5edb931644dc903bb9118bc8aff52ea6a97a7`.
- Behavior: Control-Tab opens MRU cards after 140 ms; Control-Shift-Tab reverses; Control release selects;
  Escape cancels. Mouse selects. Limit to current window/profile. Prefer tabs opened/visited since
  launch; fall back to recent tabs when fewer than two qualify.
- Zen 1.24.1b layout: picture width `ceil(logical screen width × 0.85 / 7)`; height follows screen aspect.
  Clamp to the window; keep selection visible. Column spacing is 1.25 × picture width.
  Use 13 pt regular centered titles with an 8 pt gap; 8 pt card padding and a constant 2 pt selection border.
- Previews have no white backing or inactive outline. Selection must not inset images.
  Favicon badge: 42 pt outer size, 5 pt padding, 1 pt border, 30 pt icon, 6 pt bottom/right overlap.
  Use an opaque badge background in both themes. Preserve custom-icon contrast in light mode.
- Cache 40 previews. Never capture private tabs. Refresh cards when pictures arrive;
  reject captures after closing, navigation, profile, or WebView changes. Track screen changes.
- Upstream handles interaction, picture subscriptions, and live eligibility. Retain the layout above,
  stale-capture guards, and sleeping-tab option.
- Code: `components/sidebar/{TabSwitcher.tsx,tokens.ts}`, `state/sidebar/switcher.ts`, `state/pins/tabCleanup.ts`,
  and `state/tabs/tabPictures.ts`, relative to `apps/browser/src`.
- Checks: `sessionTabs.test.mjs`, `tabPictures.test.mjs`, adjacent `pinHandoff.test.mjs`, and conventions.
- Manual: forward/backward, commit/cancel/mouse; narrow window, both themes, private tabs, custom icons.
- Related: [sleeping-tab filter](skip-sleeping-tabs-in-switcher.md), [empty-page eligibility](lazy-startup-and-mru.md).
