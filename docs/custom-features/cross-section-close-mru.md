# MRU successor across pinned and regular tabs

- Status: installed and manually validated by Simon; signed Release and hidden close-command checks passed.
- Source: Simon's report that closing regular and pinned tabs chooses from different sections (2026-11-06).
- Confirmed previous rules: pinned unload preferred regular tabs over loaded pins; regular close preferred
  opener/sibling and positional successors. These did not implement the requested global same-space MRU rule.
- Required behavior: closing or unloading the active tab picks the most recent awake page in the same space,
  regardless of regular tabs, pinned rows, pinned-group members, or Top Apps. Exclude all affected tabs,
  unloaded pages, sleeping markers, and empty pages. Do not cross spaces.
- Pinned close retains its unload behavior; regular close still removes the tab. Existing terminal-window
  and no-awake-candidate fallback rules remain. MRU takes precedence over opener/sibling preference when
  a live candidate exists. Closing a background tab does not change selection.
- Implementation: `state/tabs/awakeMru.ts` is shared by native unload and both close paths in `tabs.ts`.
  Selecting a loaded successor after regular close now records its activation time.
- Checks: regression cases reproduced both failures before the fix, for pinned rows and Top Apps.
  Cases cover both directions and skip sleeping candidates. Existing tests reflect the new MRU rule.
  Two timing-sensitive cases now use distinct fake timestamps instead of relying on wall-clock millisecond ties.
  Typecheck passed; full browser run had 1,659/1,661 passing, then the two timing-sensitive cases and nearby
  checks passed in the focused 42-case rerun. No suite failure remains unaddressed.
- CI follow-up: one more activation-order test depended on wall-clock millisecond ties. A fixed clock
  reproduced the failure; distinct timestamps resolved it. All 42 focused cases passed. App code is unchanged.
- Manual check: visit a regular tab, then a pin, then another regular tab; close the current tab with Command-W.
  It should return to the pin. Reverse the sequence and repeat. Repeat with Top Apps and a sleeping candidate.
- Hidden signed Release: regular close returned to the most recently used Top App; closing that Top App
  returned to the most recently used regular tab; closing a pinned row selected the more recent Top App
  over an older regular tab. Pinned tabs stayed asleep; regular tabs were removed. Test instance stopped.
- Installed at `~/Applications/Ardia Personal.app`, 2026-11-06.
  Backup: `~/Library/Application Support/Ardia Personal/Updates/20261106-230649-c09d94ad`.
- Manual result (2026-11-06): Simon approved the installed behavior ("lgtm").
- Upstream replacement evidence and removal approval: none.
