# Personal fork: agent workflow

`origin` is `simon-ami/ardia`. `upstream` is `mantrakp04/ardia`.
Use one checkout and task branches. Preserve unrelated edits and commits.
Run installs, checks, builds, and test-instance cleanup yourself. T3 buttons are optional.
Follow the existing build locks and hidden-instance rules.

Local commits are authorized for requested features and updates. If manual testing is needed, wait for
Simon's confirmation before committing. Simon handles user-facing tests; run automated checks yourself.
Use delegation when useful and available. No fixed provider or model is required.
Do not publish releases, deploy sites, or submit changes upstream without explicit approval.

## Update request

1. Fetch the fork and upstream release metadata. Select the newest published stable or nightly release,
   not the tip of `main`. Use version order; stable takes precedence over nightlies of the same version.
   Resolve its tag to a commit. Record both in the task report. If the order is unclear, ask.
2. Read `custom-features.md` and each active feature record it links. Compare the target with the current fork
   and the last recorded update.
   Do not reset the fork to the release or remove newer fork commits to match it.
3. Check upstream code, PRs, and tests for each custom feature. Search by behavior as well as names.
   A matching title or a conflict-free merge does not prove equivalent behavior.
4. Merge on an update branch. Resolve mechanical conflicts and simple compatibility fixes yourself.
   Ask when a resolution changes required behavior or needs a product choice. Continue independent work.
5. If upstream merged or replaced a customization, report the evidence and any behavior differences.
   Ask before removing custom feature code, even when the replacement appears equivalent.
6. Run the relevant automated checks. Build the candidate. Check the ledger's requirements.
   Ask Simon to test changed user-facing behavior where needed. Give the build path, steps, and expected result.
7. After required manual tests pass, update the ledger and commit only this task's changes locally.
   Prepare fork integration and any applicable upstream contribution as described below.

Do not mark an update integrated into `main` until it is actually merged there.
Record local candidates separately. No new release means report that no update is needed.

## Feature request

1. Check current behavior. Search upstream's open, merged, and closed PRs for the requested outcome.
2. If an existing solution meets the goal, link it and explain any differences before proceeding.
   Ask for direction when choosing it changes scope or behavior. Do not silently substitute a different feature.
3. Otherwise, implement the request on a feature branch. Keep changes focused.
4. Run the relevant checks and prepare a test build. Simon handles manual user-facing testing.
   Give short instructions when the test is not obvious. State any limits of automated verification.
5. Wait for required manual-test confirmation. Then update the ledger and commit the task locally.
6. Prepare an upstream contribution as described below. A local commit does not authorize publication or a remote merge.

## PR preparation and approval

Completed features and fixes should generally become PRs to `mantrakp04/ardia`, so upstream can include them
in a future stable release. Check upstream's contribution rules and select the appropriate target branch.
Prepare a focused branch and PR draft. Exclude personal workflow files, fork branding, unrelated customizations,
and upstream sync merges. Do not create another PR for work already submitted or implemented upstream.

An update that only brings upstream into the fork needs a fork integration PR, not an upstream PR.
If the update also produces a useful upstream fix, prepare that fix separately.
Keep any PR needed for the fork's protected `main` separate from the upstream contribution.

Before any push or PR creation, show Simon the destination, scope, checks, and draft title and description.
Ask for confirmation. If upstream requires an issue, prepare its draft and include issue creation in that request.
Do not post anything until the relevant actions are approved. Opening an upstream PR does not guarantee a stable release.

## Writing and reports

Write PR titles and descriptions, issues, commit messages, and review comments in roughly 80% ASD-STE100 style.
Use active voice, short sentences, concrete words, and consistent terms. State one main point per sentence.
Preserve technical detail and natural phrasing. Full controlled-vocabulary compliance is not required.
Keep reports brief: result, checks, manual test needed, and decisions for Simon.

## Local tools

### Choose the build

- For JavaScript-only development, use Metro with an existing compatible Debug build. Do not rebuild the app.
- After native code, native dependencies, or engine changes, rebuild Debug before testing.
- After automated checks and Simon's required manual tests pass, build standalone Release for daily use.
  Release bundles JavaScript and does not need Metro. Verify that the Release app starts before calling it ready.
- Building Release does not authorize installation, profile migration, or replacement of the official app.
  Resolve the personal app's identity and secure storage before using real browsing data.

### Commands

Read `docs/agent-brief.md` for build and test commands. Use `scripts/agent/locked pod` for dependency installs.
Here, `corepack pnpm install --frozen-lockfile` completed cleanly; the Homebrew pnpm executable stalled after installation.
Use `XCODE_XCCONFIG_FILE="$PWD/apps/browser/macos/AdHoc.xcconfig"` with `scripts/agent/build-app --as personal`
for local ad hoc builds. Debug needs Metro. A standalone Release build is not yet verified.

## Fork maintenance

Preserve these separately from product features:

- README fork notice: `2286d63b`.
- PR CI workflow: `84beb05f`.
- Protected `main`: changes go through fork PRs. Check current rules before publishing.

## Update record

- Current starting point: fork `main` at `84beb05f`. No release integration baseline has been recorded.
- For each update, record the upstream tag and full commit, candidate branch or commit, checks, manual-test result,
  affected features, replacement decisions, and final integration commit or PR when available.
