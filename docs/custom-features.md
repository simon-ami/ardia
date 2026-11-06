# Custom features

Use this index to find feature records. Read only the records relevant to the task.
For an upstream update, review all active features.

## Records

- [Lazy startup and MRU page eligibility](custom-features/lazy-startup-and-mru.md)
- [Native manual tab unloading and discard recovery](custom-features/manual-tab-unloading.md)
- [Optional grayscale favicons for unloaded tabs](custom-features/grayscale-unloaded-favicons.md)
- [Exclude sleeping tabs from the MRU switcher](custom-features/skip-sleeping-tabs-in-switcher.md)
- [MRU tab switcher with page previews](custom-features/preview-tab-switcher.md)
- [Title fading for unloaded and sleeping tabs](custom-features/fade-unloaded-tab-titles.md)
- [Personal app isolation and local signing](custom-features/personal-app.md)

## Maintain the records

Create one file per feature in `docs/custom-features/`. Add its link here.
Record the status, source commits or PRs, required behavior, implementation paths, automated checks,
manual test steps, and upstream replacement evidence and approval in that file.
Update the record with each feature change or affected upstream update. Track behavior, not just patches.
Use commit authorship to find possible omissions. Confirm intent before treating unrelated changes as features.
Ask before removing custom feature code. Keep retired records and their index links for history.
Keep fork-wide maintenance and update records in `docs/personal-workflow.md`.
