# MRU tab switcher with page previews

- Status: active and installed; automated checks and signed Release exercise passed. Simon confirmed the switcher works and the border fix is correct.
- Upstream: [mantrakp04/ardia#186](https://github.com/mantrakp04/ardia/pull/186), by Nana Amoako (`nanadotam`).
- Exact upstream head: `6cc0afcd5e0b0c73b4eb7bb45a4f4cab98f16e28`.
- Source commits: `73824935f5eaac83b8dbd458cd7387650dcddf72`,
  `f30a4001395310080ae5b0b0265fe9341ba2fd67`, `6cc0afcd5e0b0c73b4eb7bb45a4f4cab98f16e28`.
- Required behavior:
  - Control-Tab opens a horizontal row of page previews, icons, and titles after the existing 140 ms delay.
  - Control-Shift-Tab cycles backward. Releasing Control selects the focused card; Escape cancels.
  - Show the current window and profile's tabs in MRU order. Prefer tabs opened or visited since launch;
    use the existing recent-tab selection when fewer than two qualify.
  - Scale picture width to `ceil(screen width × 0.85 / 7)`, following installed Zen 1.24.1b's
    `browser-ctrlTab.js` sizing rule. Picture height follows the screen aspect ratio. Clamp to window width
    and height when necessary. Fit the row to the window and keep the selected card in view.
  - Subscribe to React Native screen-dimension updates; use logical dimensions rather than Retina pixels.
  - Update visible cards when screenshots arrive. Retain custom icons and their contrast in light mode.
  - Keep previews only in the existing 40-entry memory cache. Do not capture private tabs.
- Port adaptations: current component/state/platform boundaries, shared UI components and tokens,
  typed `kind: "private"` window API, and existing asynchronous pointer-capture logic.
  Ignore screenshots returned after a tab closes, navigates, changes profile, or replaces its web view.
- Implementation: `components/sidebar/TabSwitcher.tsx`, `components/sidebar/tokens.ts`,
  `state/sidebar/switcher.ts`, `state/sidebar/sessionTabs.ts`, and `state/tabs/tabPictures.ts`
  under `apps/browser/src`.
- Automated checks: browser typecheck; ported PR `sessionTabs.test.mjs` and `tabPictures.test.mjs`;
  adjacent `pinHandoff.test.mjs`; repository conventions check.
- Verification (2026-11-06): browser typecheck passed; all 18 focused test cases passed across the PR,
  adjacent handoff, and conventions checks. Release build succeeded with the existing matching engine.
  Hidden signed Release: three distinct page images rendered in session MRU order; forward/backward movement,
  commit, cancel without changing the active tab, and explicit card selection passed. Private-window cards
  rendered without page screenshots. Native keyboard dispatch and final appearance remain manual checks.
- Candidate: `apps/browser/build-personal-signed/Ardia Personal.app`, version `0.2.44` (104),
  paired CLI `0.2.44-personal.1`, engine tree `38b319abda74f8d85f49035eecaef1a98f1c2ede`.
- Manual check: visit three different pages; hold Control and press Tab repeatedly; check distinct previews
  and MRU order; check reverse cycling, Control-release selection, Escape cancellation, mouse selection,
  a narrow window, light mode, and custom icons. Private windows show icons without page screenshots.
- Installed: `~/Applications/Ardia Personal.app`, 2026-11-06. Signed build record matches current app and CLI sources.
  Installer snapshot: `~/Library/Application Support/Ardia Personal/Updates/20261106-173502-1c0384a5`.
  Candidate test instances were stopped. The installer unregistered build copies and registered the installed app.
- Manual result (2026-11-06): Simon reports the switcher works. His recording shows a thin light border
  around page previews. Follow-up removes the inactive outline and white backing behind captured images,
  and draws the blue selection ring in a separate overlay so selection does not inset the image.
  Baseline hidden Release measurement: an unselected image starts at (0.5, 0.5) and measures 159 × 104 pt
  inside a 160 × 105 pt preview. The recording confirms the resulting light outline.
  Corrected signed Release measurement: image starts at (0, 0) and fills 160 × 105 pt both selected
  and unselected. Typecheck and repository conventions checks pass. No new test was added for this visual fix.
  Corrected candidate installed after Simon closed the personal app; installer snapshot:
  `~/Library/Application Support/Ardia Personal/Updates/20261106-175226-e16c3590`.
  Simon confirmed the corrected appearance on 2026-11-06 ("fixed!").
- Combined with [optional sleeping-tab exclusion](skip-sleeping-tabs-in-switcher.md); both session selection and fallback respect its setting.
- [MRU eligibility follow-up](lazy-startup-and-mru.md) excludes empty command-bar tabs and corrects the first step when the current tab is excluded.
- Upstream replacement evidence and removal approval: none.

- Relative preview sizing follow-up: replaces the fixed 160 × 105 pt picture. On a 1728 × 1117 pt display,
  the expected picture is 210 × 136 pt. Text, padding, and selection styling retain their existing sizes.
  Typecheck and all 12 conventions checks passed. Signed Release built.
  Hidden app: pictures measured 210 × 136 pt; 1360 pt window showed five cards, 520 pt window one card.
  Repeated cycling kept the selected card in view. Scratch instance stopped. Installed at `~/Applications/Ardia Personal.app`.
  Backup: `~/Library/Application Support/Ardia Personal/Updates/20261106-213135-376f5746`.
  Simon approved the final size and appearance on 2026-11-06.

- Zen styling follow-up: installed Zen 1.24.1b `ctrlTab.css`, `browser-ctrlTab.js`, toolkit `xul.css`,
  and `global-shared.css` are the reference. XUL uses border-box sizing; the root uses the macOS
  message-box font and the switcher does not apply bold on macOS. Titles use 13 pt regular system text,
  centered below the picture with an 8 pt gap. Cards reserve 8 pt padding and a constant 2 pt selection border.
  Columns follow Zen's 1.25 × picture-width spacing, constrained to the app window.
  Favicon badge: 42 pt outer size, 5 pt padding, 1 pt border, a 30 pt icon; overlaps the picture's bottom
  and right edges by 6 pt. Preview image dimensions do not change when selection moves.
  Typecheck and conventions passed; signed Release built. Hidden app measured the 42 pt badge extending
  exactly 6 pt beyond both image edges; title frame matches picture width, with centered 13 pt regular text
  and an 8 pt gap. Dimensions remain stable after selection changes and in a 520 pt window.
  Scratch instance stopped. Installed with backup
  `~/Library/Application Support/Ardia Personal/Updates/20261106-223520-6f94451f`.
  Simon approved the final appearance on 2026-11-06.

- Favicon badge background follow-up: use the opaque panel color in both themes. The control role was translucent in dark mode. Typecheck and 12 conventions checks passed. Signed Release built; hidden app confirmed badge fills #2A2A2A in dark mode and #FFFFFF in light mode. Installed with backup `~/Library/Application Support/Ardia Personal/Updates/20261106-224607-38664894`. Simon approved the relative size, Zen styling, and opaque badges on 2026-11-06.
