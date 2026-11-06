# Optional grayscale favicons for unloaded tabs

- Status: active and installed; Simon validated grayscale behavior and the grouped settings layout.
- Source: [suggestion on PR #616](https://github.com/mantrakp04/ardia/pull/616), requested by Simon.
- Setting: Settings → Tabs → Advanced → Unloaded tab appearance → Grayscale favicons
  (`grayscaleUnloadedFavicons`, synced, off by default).
- Required behavior: remove color from sleeping/unloaded tab favicons; restore color on wake. Keep independent
  title and icon fading preferences. Preserve custom icons and page previews.
- Implementation: shared `TabIcon` state passes grayscale to `Favicon`. Native Surface uses a Core Image
  saturation filter because React Native's legacy macOS renderer ignores the standard filter style.
  Native API version is 48; no engine changes or new dependencies.
- Checks: regression case verifies sleeping, wake, unloaded state and independent opacity preferences.
  Existing config allowlist now includes this setting and `sleepingTabsInSwitcher`.
- Manual check: compare a colorful site's icon with grayscale on/off; check titles and fading remain independent.
  Wake the tab and check color returns. Check sidebar, top strip, folder, split, and switcher icons.
- Verification: native Release build succeeded; hidden app icon props enable grayscale for discarded tabs
  and leave the loaded tab colored. Unit checks cover independence from title/icon opacity settings.
  WindowServer capture failed (`could not create image from window`); Simon subsequently confirmed the grayscale appearance.
- Installed at `~/Applications/Ardia Personal.app`, 2026-11-06.
  Backup: `~/Library/Application Support/Ardia Personal/Updates/20261106-183009-66771873`.
- Manual result (2026-11-06): Simon confirms grayscale on/off and color restoration on wake work.
  Simon approved a regular titled section using the existing SectionHeader and Group components.
  The three independent toggles now have short labels and one shared description. No new container or preview.
  Search metadata uses the same section name so advanced-section visibility and search reveal remain consistent.
- Layout checks: typecheck and all 27 settings search/conventions checks passed. Signed Release build passed. Hidden app check confirmed one standard header and all three toggles
  when advanced settings are shown, and no header or rows when hidden. Installed after Simon quit the personal app.
  Layout-update backup: `~/Library/Application Support/Ardia Personal/Updates/20261106-185106-16a59d0a`.
  Simon approved the final grouped layout on 2026-11-06.
- CI follow-up: the web-demo Surface adapter accepts grayscale and applies the CSS grayscale filter.
  Workspace typecheck passed. Native app sources and the installed build are unchanged.
- Upstream replacement evidence and removal approval: none.
