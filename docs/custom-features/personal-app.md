# Personal app isolation and local signing

- Status: active; the user accepted the installed profile and login checks. Optional CLI doorbell, control pill, program approvals, and icon variants remain unconfirmed. Lifecycle failure paths use disposable-profile tests.
- Source: [fork PR #5](https://github.com/simon-ami/ardia/pull/5), [PR #6](https://github.com/simon-ami/ardia/pull/6).
- Behavior: deliver Release `~/Applications/Ardia Personal.app` (`dev.simon.ardia.personal`) with isolated profile/config and `ardia-personal` runtime/Keychain. Keep official app, its painted/flat icons, and CLI unchanged; disable upstream updater and plugin CLI installer. Skill examples and permissions use `ardia-personal`.
- Reuse the personal signing identity; allow shared `Ardia Safe Storage` only after signature/seal validation. Keep mock storage for ad hoc builds. Register HTTP/HTTPS without changing default; reject stale builds; snapshot profile/preferences before installing paired app and CLI `0.7.0`; restore on failure. Share userscript sources only.
- Keep `apps/cli/` intact (`scripts/personal/paths.test.mjs`) with its 25 `bare-sleep` entries in `conventions-baseline.json`, and keep `TabWebView.tsx` <= 400 lines outside baseline.
- Code/checks: `scripts/personal/{paths,lifecycle,engine}.test.mjs`, `ArdiaPersonalSigning.h`, `ArdiaLaunchConfig.mm`, `ArdiaHost+Launch.mm`, `CliInstaller.swift`, `apps/browser/src/components/settings/panes/{Advanced,AllowedPrograms}.tsx`, `state/app/programControlSetting.ts`, `conventions-baseline.json`, CLI `browse/vault.py`.
- Manual when affected: existing login survives; Bitwarden, scripts, painted/flat icons, `showCliPill`, one-time `ardia-personal` doorbell (`Always`), `AllowedProgramsRows`, and CLI `0.7.0` routing work.
- Details: [setup, snapshots, and recovery](../personal-app.md).
- Replacement: `v0.2.49` uses plugin CLI, `showCliPill`/`compactCliPill`, and doorbell approvals (`AllowedProgramsRows`). Personal build blocks plugin program links, keeps its control toggle with `showCliPill` and `AllowedProgramsRows` in Advanced, prompts once for `ardia-personal`, and patches CLI `0.7.0`.
