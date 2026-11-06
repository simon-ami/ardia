# Personal fork: agent workflow

`origin` is `simon-ami/ardia`. `upstream` is `mantrakp04/ardia`.
Use task branches in this checkout. Preserve unrelated work. Do not use worktrees or subagents.
Run tools, dependency installs, builds, checks, installation, and cleanup yourself. T3 buttons are optional.
Use the existing build locks. Keep test instances hidden and use scratch data.

Local commits are authorized. Wait for Simon's required manual tests before committing.
Ask before pushing, opening PRs, or removing custom feature code. Reuse approval already given for this task.
Do not publish releases or deploy sites. Keep the official app and its profile unchanged.
Write brief reports and collaboration text in roughly 80% ASD-STE100. State both what changed and how.
For copies, name what stays shared and what becomes independent.

## Start any task

1. Check Git status. Run `python3 scripts/personal/status.py` to compare candidate and installed build records
   with current sources. An older unrecorded build needs one full recorded build, not another profile migration.
2. Read [the ledger](custom-features.md). Load feature records relevant to the task; review all active records
   for an upstream update. Use source diffs and relevant PR metadata to narrow investigation.
3. Select the change and check engine availability before spending time on implementation or building.
   Do not replace a missing engine with an older one or start a full Chromium build without discussing its cost.
4. Decide the smallest useful checks and whether Simon needs a manual test. Do not repeat setup checks
   whose inputs and behavior are unchanged.

## Upstream update

1. Fetch release metadata and refs. Select the newest published stable or nightly release by version order.
   Stable wins over nightlies of the same version. Do not use `main` unless Simon explicitly requests it.
   Resolve the tag to a full commit; record both. Ask if release order is ambiguous.
2. Compare the target with the fork and active feature requirements. Check relevant upstream code and PRs
   for merged or alternative implementations. Search by behavior, not only titles.
   Untouched code and unrelated PRs do not require exhaustive rereading.
3. Merge on an update branch. Keep newer fork commits. Resolve mechanical conflicts yourself.
   Ask when a conflict changes intended behavior. Ask before removing custom code, even if upstream replaces it.
4. Follow the checks and delivery rules below. No new release means report that no update is needed.

## A specific upstream PR or branch

1. Read the PR, changes, checks, and dependencies. Fetch its exact head and record the PR URL and full commit.
   For a branch, identify the requested change and its base. Do not merge an entire contributor branch blindly.
2. Check whether the fork already has equivalent changes. Identify dependencies outside the requested change,
   including engine changes. Explain material differences or extra scope before proceeding.
3. Select the focused commits, or port the change when their context does not fit. Keep provenance and explain
   significant adaptations. Preserve author attribution. Resolve routine compatibility changes yourself.
4. Add an individual ledger record. Follow normal checks, manual tests, and delivery.
   Do not open a duplicate upstream PR for someone else's existing contribution.

## A new feature or adjustment

1. Check current behavior and upstream's open, merged, and relevant closed PRs for the requested outcome.
2. If an existing solution fits, link it and explain differences before using it. Ask only if the choice changes
   required behavior or scope. Otherwise implement the feature or adjustment on a task branch.
3. Check the changed behavior, request a focused manual test if needed, and update its individual ledger record.

## Check and build in proportion

| Change | Local checks |
| --- | --- |
| Documentation only | Review links and instructions; no app build or signing. |
| JS or UI | Affected tests and typecheck. Use Metro with compatible Debug during iteration if useful. |
| Native app code or dependencies | Native compilation, affected tests, and hidden app exercise. |
| Broad upstream or engine update | Review affected customizations, matching engine, broader regression checks. |
| Signing, storage, profile formats, or lifecycle scripts | Relevant failure, persistence, backup, and rollback checks. |
| CLI only | CLI checks; reuse the unchanged app binary when possible. |

Run the required full CI on the PR. Do not duplicate it locally for small changes.
Use a local full suite when broad or risky changes justify catching regressions before manual testing.
Run performance checks only for relevant changes or a measured regression. After a fix, rerun the failed area;
passing checks stay valid until their relevant inputs change.

Install dependencies only when manifests, lockfiles, native integration, or missing dependencies require it.
Use `scripts/agent/locked pod` for dependency installation. Prefer the pinned package manager.
Debug is an iteration tool, not a mandatory step before every Release. Native changes need recompilation,
which can be the Release build when that is the shortest useful route.

## Deliver the complete personal app

1. Run available source-level checks before building. Run `python3 scripts/personal/build-app.py`.
   It prepares the matching engine, reuses a recorded unchanged
   Release or builds one, prepares the matching CLI without activating it, and signs the candidate with
   Simon's existing certificate. It bundles JavaScript; the delivered app never depends on Metro.
   If needed, request the signing password through the private secret tool. Never put it in logs, arguments,
   Git, or a persistent script. Use one private password file within the task; remove that temporary file when done.
2. Run the relevant automated checks and a hidden scratch launch. Check the new signed build record and
   any affected personal-build invariants. Read [personal-app.md](personal-app.md) for storage details.
   `--sign-only` is only for a recorded build whose inputs and program files still match.
   After candidate tests, unregister that build with `lsregister -u` and register the installed personal app
   with `lsregister -f`, unless installing immediately. Do not leave build copies as browser-handler candidates.
3. Give Simon only the required manual steps and expected results. Use a scratch profile for candidate tests.
   If real-profile behavior needs validation, install with a backup first and test it there. Never run the build
   and installed app against the personal profile at the same time. Do not launch a candidate on real data
   before taking a backup. The official profile is never the routine test source.
4. Let Simon keep using the installed app during preparation. Ask him to quit it only for installation.
   Run `python3 scripts/personal/install-app.py` once checks allow installation. It validates the recorded
   candidate, snapshots the personal profile and preferences, preserves the current app and CLI reference,
   and installs the paired app and CLI. Do not rebuild a tested candidate just to install it.
5. Confirm the required user checks. Record results, upstream source, affected features, and delivered build.
   Then commit locally. Ask for publication approval if it has not already been given.

Do not repeat certificate creation, Bitwarden backup setup, official-profile migration, userscript installation,
CLI command setup, or default-browser selection for normal updates. Preserve the existing personal profile.
Script source files stay shared; update an installed userscript only when its source actually changes.

## GitHub and rollback

Prepare a fork integration PR for protected `main`. For a useful new product change, also prepare a focused
upstream contribution. Exclude personal tooling, branding, workflow files, and sync merges from upstream PRs.
Before publication, show the destination, scope, checks, and draft title and description. Ask once.
For the fork, include push, PR creation, and merge in one approval request.
If an upstream issue is required, include its draft in that approval. Fork issues are currently disabled.
Monitor checks through T3 when merging is pending. Do not call an update integrated until the PR is merged.
After merge, fast-forward local `main`; no rebuild is needed if program inputs are unchanged.

If a deployed update fails, stop and inspect. Do not silently downgrade a potentially migrated profile.
On Simon's request, stop the personal app, preserve the failed current state, and restore the app, profile,
preferences, and CLI reference from the same update snapshot. Restoring only an old executable is insufficient.
Snapshots and the original migration backup stay private and out of Git. Do not delete them automatically.

## Maintenance and update record

Preserve README fork notice `2286d63b`, PR CI workflow `84beb05f`, and the personal-build feature record.
Starting point after setup: fork `main` at `9d18a24e`. No upstream release-integration baseline is recorded yet.
For the next update, record the target tag or PR and full commit, candidate, checks, manual result, replacement
choices, installed build, and final merge. Keep per-feature details in their separate ledger files.
