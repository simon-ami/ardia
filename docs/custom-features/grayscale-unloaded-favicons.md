# Optional grayscale favicons for unloaded tabs

- Status: active; validated in `v0.2.48`; `v0.2.49` `Favicon` updates (`usePrivateViewer`, `initialGlyph`) are unverified until manual checks.
- Source: user request ([upstream #616](https://github.com/mantrakp04/ardia/pull/616));
  [fork PR #6](https://github.com/simon-ami/ardia/pull/6).
- Setting: Tabs → Unloaded tab appearance → Grayscale favicons (`grayscaleUnloadedFavicons`), synced (`configAllowlist.ts`), default off.
- Behavior: remove favicon color for sleeping and unloaded tabs; restore it on wake. Keep custom icons, `usePrivateViewer` / `initialGlyph` fallbacks, and page previews. Keep title fading and icon fading independent. Group the three toggles under one section header with short labels, one shared description, and matching settings-search metadata.
- Code: `apps/browser/src/components/{sidebar/TabIcon.tsx,favicon/Favicon.tsx}`, `state/settings/configAllowlist.ts`, settings rows, native shell `Surface` (Core Image saturation; legacy React Native macOS ignores CSS `filter`), and web-demo `Surface`.
- Checks: `state/tabs/staleness.test.mjs`, `state/session/sessionSettings.test.mjs`, `components/settings/settingsSearch.test.mjs`, `conventions.test.mjs`, and platform typechecks (`apps/browser/src`).
- Manual: toggle a colorful favicon across sidebar, top strip, folder, split, and switcher; wake the tab; check fading independence and settings search.
- Replacement: no equivalent in `v0.2.49`. Keep the native filter and adapters; Linux and Windows WebUI accept CSS `filter`.
