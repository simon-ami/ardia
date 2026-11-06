# Personal app isolation and local signing

- Status: local on `build/personal-signing`; not merged into `main`. Simon reports the migrated profile works.
- Source commits: `440226d3`, `6322baac`, `a8bbbdff`. Script-path cleanup ships with this record.
- Setup and migration record: [personal app setup](../personal-app.md).
- Required behavior:
  - Build a standalone Release with Simon's existing local signing identity. Keep its backup usable.
  - Use bundle ID `dev.simon.ardia.personal` and a separate profile and configuration folder.
  - Use the existing `Ardia Safe Storage` item only after verifying the personal signature and sealed files.
    Scratch and ordinary ad hoc builds keep the mock keychain. Retain real-profile debugging restrictions.
  - Disable the upstream updater and official CLI installer in the personal app.
    Keep `ardia-personal` separate from `ardia`, including its runtime and credential service.
  - Preserve shared script source files and separate installed copies. After migration, replace the copied
    official Scripts extension reference only in the personal profile. Preserve a disabled installation.
  - Preserve backups and the original official profile during migration. Never share a live Chromium folder.
- Implementation: `scripts/personal/`, `ArdiaPersonalSigning.h`, `ArdiaHost+Launch.mm`, `ArdiaLaunchConfig.mm`,
  `CliInstaller.swift`, CLI `browse/vault.py`, and browser `state/extensions/userScripts.ts`.
- Automated checks: `scripts/personal/paths.test.mjs`, `scripts/personal/tests/signing-test.py`,
  `apps/browser/src/state/extensions/userScripts.test.mjs`, affected typechecks, and a hidden Release launch.
- Manual check when affected: existing website login survives restart; tabs and settings remain present;
  Bitwarden works; scripts run once from the personal installation. Confirm `ardia` still selects the official app.
- Manual result: Simon reports tabs, settings, spaces/profiles, existing logins, Bitwarden, and scripts work
  in spot checks. Script execution counts were not measured separately.
- Upstream replacement evidence and removal approval: none. This is fork-specific maintenance.
