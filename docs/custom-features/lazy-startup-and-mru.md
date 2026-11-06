# Lazy startup and MRU page eligibility

- Status: installed; automated checks passed. Simon reports improvement in limited manual testing.
- Source: Simon's reported empty MRU entry, delayed background loads after restart, and intermittent missing
  Chrome extensions-shortcuts page (2026-11-06).
- Confirmed causes:
  - `recentTabIds` treated the empty replacement tab as eligible because an empty URL did not need a page.
  - `startTabLifecycle` scheduled `reloadRecentTabs` after three seconds; it woke up to four recent background
    tabs depending on memory, power, and pressure. This was deliberate warmup, not evidence of a sleep-state race.
- Required behavior: empty command-bar tabs and `about:blank` never enter MRU. With one eligible page,
  Control-Tab does nothing. From an empty tab with two eligible pages, the first step picks the most recent page.
- Startup does not schedule background page warmup. Restoring the selected page and waking tabs on selection
  remain unchanged. The explicit warmup helper is retained for diagnostics but is not called by startup.
- Implementation: `state/pins/tabCleanup.ts`, `state/sidebar/switcher.ts`, and `state/tabs/tabLifecycle.ts`.
- Tests: empty replacement excluded with the sleeping-tab setting both on and off; Chrome shortcut-page
  eligibility; startup on a plugged-in 32 GB system keeps an unvisited restored background tab idle.
  Typecheck and 31 affected cases passed; strengthened timer regression and nearby filter cases passed (15).
- Chrome-page investigation: hidden scratch app showed the page in MRU on fresh open, after restoring it as
  the selected page and then visiting two sites, and after native unload/wake followed by two sites.
  Simon also reports the omission is intermittent. No Chrome-specific fix is claimed.
- Verification: browser typecheck passed; full browser suite passed (1,657 cases). Signed Release built.
  Hidden app: native unload of three pages confirmed; waking one left the switcher inactive. Empty replacement
  excluded; first step from empty tab selected the most recent page. Chrome shortcuts remained eligible after
  native unload/wake and after restart. After 57.9 seconds following restart, only the selected Chrome page was
  loaded; two background pages remained idle. Test instance stopped.
- Installed at `~/Applications/Ardia Personal.app`, 2026-11-06.
  Backup: `~/Library/Application Support/Ardia Personal/Updates/20261106-211711-f33512f7`.
- Manual result (2026-11-06): Simon reports the behavior seems better in limited testing.
  This is provisional validation, not confirmation of every reproduction sequence.
  The intermittent Chrome-page omission remains unresolved.
- Manual check: unload every page, then wake one. Control-Tab must not switch to the empty replacement.
  Restart with several previously visited tabs; wait at least 15 seconds. Only the selected page should load.
  Recheck the Chrome shortcut page after visiting other pages; report if it is omitted again.
- Upstream replacement evidence and removal approval: none.
