# Custom features

Use this index to find feature records. Read only the records relevant to the task.
For an upstream update, review all active features.

## Records

- [MRU successor across pinned and regular tabs](custom-features/cross-section-close-mru.md)
- [Lazy startup and MRU page eligibility](custom-features/lazy-startup-and-mru.md)
- [Native manual tab unloading and discard recovery](custom-features/manual-tab-unloading.md)
- [Optional grayscale favicons for unloaded tabs](custom-features/grayscale-unloaded-favicons.md)
- [Exclude sleeping tabs from the MRU switcher](custom-features/skip-sleeping-tabs-in-switcher.md)
- [MRU tab switcher with page previews](custom-features/preview-tab-switcher.md)
- [Title fading for unloaded and sleeping tabs](custom-features/fade-unloaded-tab-titles.md)
- [Personal app isolation and local signing](custom-features/personal-app.md)

## Maintain the records

Keep one file per feature in `docs/custom-features/` and link it above. Describe current requirements,
not a task log. Aim for 100–180 words; complex features may
need up to 250. Preserve essential requirements even if they need more space. Do not create extra files merely
to move excess text elsewhere.

Use these fields; omit optional fields when empty:

- Status: active/retired and meaningful validation limits. Do not equate a build passing with behavior validated.
- Source: the useful origin/port PR references, not a commit inventory. For imports, keep the exact head and attribution.
- Setting, if present: key, default, and persistence/sync behavior.
- Behavior: the fork's required differences, important edge cases, and decisions that affect future changes.
- Code/checks: a few entry points, named regression tests, and a short manual check when affected.
- Open/Replacement, only when applicable: unresolved behavior or a concrete upstream comparison, its target
  tag/commit, differences, and Simon's removal decision. No field means not assessed, not proof of no replacement.

Rewrite affected statements instead of appending follow-ups. Remove superseded values and resolved issues.
Keep accepted design values when they define behavior; omit incidental screenshot measurements.
Do not add test counts, build transcripts, failed-then-fixed test history, installation dates, candidate versions,
backup paths, or repeated approvals. Git/PR history and local build/update records hold that evidence.
Link existing setup/recovery guidance instead of duplicating it. Summarize validation once and state its scope;
helper tests do not prove real app/extension integration. Mark changed behavior unverified until checked.

Before finishing, read the record as an agent with no chat history: can it preserve the intended behavior and
find the relevant code/checks? Remove anything that does not help that task.
Use authorship only to find possible omissions; confirm intent before treating unrelated changes as features.
Ask before removing custom feature code. Keep a short retired record and its index link.
Keep fork-wide workflow and update records in `docs/personal-workflow.md`.
