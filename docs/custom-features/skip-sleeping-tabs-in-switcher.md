# Exclude sleeping tabs from the MRU switcher

- Status: active and installed; source checks and hidden signed Release exercise passed; Simon reports the filter works with native unloading.
- Upstream: [mantrakp04/ardia#612](https://github.com/mantrakp04/ardia/pull/612), draft PR by `posthog-eu[bot]`.
- Exact source commit and PR head: `5c28393aceff9f08c9a1ca3713bdbe0d720b0b88`.
- Required behavior:
  - Settings → Tabs → Show sleeping tabs in the tab switcher (`sleepingTabsInSwitcher`, synced).
  - On by default, matching the upstream PR. Turn off to exclude sleeping and unloaded tabs.
  - Keep the active tab even if it is marked sleeping or unloaded.
  - Filter before sorting and the two-tab recency allowance, so older awake tabs remain reachable.
  - Apply the filter to both session selection and the fallback used by the preview switcher.
- Implementation: `apps/browser/src/state/pins/tabCleanup.ts`, `state/settings/settings.ts`,
  `components/settings/panes/Tabs.tsx`, and `components/settings/rows/generalRows.ts`.
- Integration: keeps [preview cards](preview-tab-switcher.md) and their selection border fix.
  No native or engine changes. Settings defaults, persistence, search, and sync use the existing setting registry.
- Port adaptations: applied the focused changes to the current files, preserving other custom settings.
  Existing session migration checks exclude the added key from their historical key count and assert its default.
- Checks: browser typecheck; upstream `recentTabs.test.mjs` with combined session/fallback assertions;
  existing `sessionTabs`, settings search, settings, session settings, and conventions tests (68 cases passed).
- Hidden signed Release (2026-11-06): closing a pinned tab leaves its page asleep; the setting hides/restores
  its preview card, awake cards remain, and selection works. The new Settings row mounts. Off persists after restart.
  No lifecycle state was mocked in this app exercise; Chrome-triggered automatic discard remains a manual check.
- Candidate: version `0.2.44` (104), CLI `0.2.44-personal.1`, engine tree `38b319abda74f8d85f49035eecaef1a98f1c2ede`.
- Installed at `~/Applications/Ardia Personal.app`, 2026-11-06.
  Profile/app snapshot: `~/Library/Application Support/Ardia Personal/Updates/20261106-180409-f8fc6d25`.
- Manual check: disable the setting; compare Control-Tab with an asleep/unloaded tab present. It should be absent.
  Re-enable the setting and confirm it returns. Verify the preview cards and Control-release selection still work.
- Manual result (2026-11-06): Simon reports the filter broadly works. Subsequent checks confirm
  native unloading works with the preview switcher; the separate Auto Tab Discard issue remains unresolved.
- Upstream replacement evidence and removal approval: none.
