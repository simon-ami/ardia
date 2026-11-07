# MRU tab switcher with page previews

- Status: active; behavior and final appearance manually validated.
- Source: [upstream PR #186](https://github.com/mantrakp04/ardia/pull/186), Nana Amoako (`nanadotam`),
  head `6cc0afcd5e0b0c73b4eb7bb45a4f4cab98f16e28`; ported/adapted in
  [fork PR #6](https://github.com/simon-ami/ardia/pull/6).
- Behavior: Control-Tab opens MRU cards after 140 ms; Control-Shift-Tab reverses; Control release selects;
  Escape cancels. Support mouse selection. Limit to current window/profile. Prefer tabs opened/visited since
  launch, using the existing recent-tab fallback when fewer than two qualify.
- Follow Zen 1.24.1b styling: picture width `ceil(logical screen width × 0.85 / 7)`; height follows screen aspect.
  Clamp to the window; keep the selected card visible. Column spacing is 1.25 × picture width, window-constrained.
  Use 13 pt regular centered titles with an 8 pt gap; 8 pt card padding and a constant 2 pt selection border.
- Images fill the preview without white backing or an inactive outline; selection must not inset the image.
  Favicon badge: 42 pt outer size, 5 pt padding, 1 pt border, 30 pt icon, 6 pt bottom/right overlap.
  Use an opaque badge background in both themes. Preserve custom-icon contrast in light mode.
- Keep only 40 previews in memory; never capture private tabs. Refresh visible cards when pictures arrive;
  ignore captures invalidated by closing, navigation, profile, or WebView changes. React to screen changes.
- Code: `components/sidebar/{TabSwitcher.tsx,tokens.ts}`, `state/sidebar/{switcher.ts,sessionTabs.ts}`,
  and `state/tabs/tabPictures.ts`, relative to `apps/browser/src`.
- Checks: `sessionTabs.test.mjs`, `tabPictures.test.mjs`, adjacent `pinHandoff.test.mjs`, and conventions.
- Manual: forward/backward, commit/cancel/mouse; narrow window, both themes, private tabs, custom icons.
- Related: [sleeping-tab filter](skip-sleeping-tabs-in-switcher.md), [empty-page eligibility](lazy-startup-and-mru.md).
