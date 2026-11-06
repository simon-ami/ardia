# Personal app isolation and local signing

- Status: implemented and manually validated. Simon reports the migrated profile works.
- Source commits: `440226d3`, `6322baac`, `a8bbbdff`, `eb58db67`, `ce30cfbe`.
  Lifecycle additions are versioned alongside the scripts and this record.
- Setup and migration record: [personal app setup](../personal-app.md).
- Required behavior:
  - Build a standalone Release with Simon's existing local signing identity. Keep its backup usable.
  - Use bundle ID `dev.simon.ardia.personal` and a separate profile and configuration folder.
  - Use the existing `Ardia Safe Storage` item only after verifying the personal signature and sealed files.
    Scratch and ordinary ad hoc builds keep the mock keychain. Retain real-profile debugging restrictions.
  - Disable the upstream updater and official CLI installer in the personal app.
    Keep `ardia-personal` separate from `ardia`, including its runtime and credential service.
  - Install at `~/Applications/Ardia Personal.app`. Register HTTP/HTTPS without changing the default browser.
    Verify signatures before replacement and keep the previous installed app. Both personal app copies share
    the personal profile; installation does not migrate data again.
  - Record source, engine, and CLI identities in the signed candidate. Refuse stale recorded builds.
    Reuse unchanged app binaries and CLI archives. Prepare the CLI without activating it during development.
  - Before deployment, copy the stopped personal profile and export its preferences into a private update
    snapshot. Preserve the installed app and previous CLI reference. A failed backup stops deployment;
    activation failure restores the previous app and CLI. Keep the original migration backup separate.
  - Preserve shared script source files and separate installed copies. After migration, replace the copied
    official Scripts extension reference only in the personal profile. Preserve a disabled installation.
  - Preserve backups and the original official profile during migration. Never share a live Chromium folder.
- Implementation: `scripts/personal/`, `ArdiaPersonalSigning.h`, `ArdiaHost+Launch.mm`, `ArdiaLaunchConfig.mm`,
  `CliInstaller.swift`, CLI `browse/vault.py`, and browser `state/extensions/userScripts.ts`.
- Automated checks: `scripts/personal/paths.test.mjs`, `scripts/personal/tests/signing-test.py`,
  `scripts/personal/lifecycle.test.mjs`, `apps/browser/src/state/extensions/userScripts.test.mjs`,
  affected typechecks, and a hidden Release launch. Lifecycle tests use disposable profiles and simulate
  external signing and registration boundaries; no actual user profile is used for these tests.
- Manual check when affected: existing website login survives restart; tabs and settings remain present;
  Bitwarden works; scripts run once from the personal installation. Confirm `ardia` still selects the official app.
- Manual result: Simon reports tabs, settings, spaces/profiles, existing logins, Bitwarden, and scripts work
  in spot checks. Script execution counts were not measured separately.
- Upstream replacement evidence and removal approval: none. This is fork-specific maintenance.
