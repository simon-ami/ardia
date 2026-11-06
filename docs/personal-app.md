# Personal app setup

## Current state

Release builds and starts without Metro. The personal build wrapper creates a separate signed app with
bundle ID `dev.simon.ardia.personal`. Its updater feed and URL/document registrations are removed.
It is not installed. The personal build now supports the shared `Ardia Safe Storage` keychain item.
Its signing and storage checks are described below. Simon reported the fresh-profile login test passed:
the website remained signed in after quitting and reopening the personal app. Migration is still pending.

The personal app uses `~/Library/Application Support/dev.simon.ardia.personal` for its own data.
Its Chromium profiles are in `Chromium`; its editable configuration is in `config`.
The official app keeps its own data and `~/.config/ardia` configuration. No real data has been copied.

## Build and sign

Run `python3 scripts/personal/build-app.py`. It calls the existing locked build wrapper, then copies the app
and signs the copy. `--sign-only` reuses an existing Release build. The output is
`apps/browser/build-personal-signed/Ardia Personal.app`.

The dedicated signing keychain is `~/Library/Application Support/Ardia Personal/Signing/signing.keychain-db`.
If locked, obtain its password through the private secret tool and pass the returned file with `--password-file`.
Never put the password in arguments, logs, Git, or a persistent script. The wrapper locks the keychain after signing.
This unlocks only the signing identity; it does not unlock website passwords or cookies.

The encrypted `.p12` backup and its Base64 text are in the same Signing folder. Simon saved the Base64 text
in a Bitwarden Secure Note and the export password in a separate linked login item. Backup restoration and
signing a changed test binary with the same identity were verified. Do not regenerate the identity for normal builds.

## Shared sources and separate copies

| Item | Handling |
| --- | --- |
| App source | One Git checkout feeds the builds. |
| Built apps | The Release app and signed personal copy are separate program files. No browser data is copied during signing. |
| Signing identity | Reuse one identity for personal builds. The official app keeps its upstream signature. |
| Cookie encryption key | Both apps use `Ardia Safe Storage` in the macOS keychain. This shares a key, not cookies or profiles. |
| Browser profiles | Keep separate. Never run both apps against one live profile folder. No real profile has been migrated. |
| Userscript source | Plan one shared source folder, including imported files. No source folder has been moved or linked yet. |
| Installed userscripts | Each profile needs its own installation. Apply source changes to both profiles when desired. |
| Script and extension data | Treat stored values and extension settings as profile-specific. Do not assume they sync with script source. |
| CLI | `ardia` keeps the official runtime. `ardia-personal` uses a separate runtime and the personal data folder. |

Before changing a location, explain the source, destination, and whether later changes propagate.
Retain the official installation and original profile until migration and rollback have been tested.

## Shared Safe Storage

Simon chose the existing `Ardia Safe Storage` item on 2026-11-06. No Chromium rebuild is needed.
The signed personal bundle records the certificate fingerprint and this storage choice. Before using a real
profile, the app checks its running code against that certificate and the personal signing identifier.
It also checks the app's sealed files on disk.
Missing or invalid personal signing configuration stops startup. Scratch profiles keep the mock keychain.
Ordinary ad hoc builds also keep the mock keychain. The real-profile debugging restrictions remain active.

The first real start can show a macOS request to use `Ardia Safe Storage`. Simon must approve it himself;
the setup does not change the existing item's access list. The macOS dialog can request the Mac login password,
not the signing-backup password. Choose Always Allow only for this personal app when offered.
Cancel and report any different request.

The official app does not need to stay installed for this key to work. Keep the keychain item when removing it.
Deleting the shared key can make saved cookies and browser passwords unreadable in both profiles.
Bitwarden remains independent. The Bitwarden signing backup restores the app-signing identity; it does not
back up this separate cookie-encryption key.

Before copying real data, manually start the personal Release app with a fresh personal profile. Confirm any
expected Safe Storage prompt. Test a disposable website login, quit, reopen, and confirm that it remains signed in.
Do not copy the official profile for this test. Simon confirmed this test passed on 2026-11-06.

## Personal CLI

Run `python3 scripts/personal/prepare-cli.py --install` after CLI source changes. It builds a separate runtime
from this checkout in `apps/browser/build-personal-cli`, verifies its archive, and switches its `current` symlink.
Unchanged sources reuse the archive. Old runtimes stay available for running commands.
The installer adds only `~/.local/bin/ardia-personal`; it does not change `ardia` or the shell configuration.
Keep this checkout at its current location while using that symlink.

`ardia-personal` always selects the personal data folder. It clears inherited remote-browser endpoints and
refuses endpoint overrides. CLI credential items use the separate service
`dev.simon.ardia.personal.browse.auth`. This does not copy credentials or change Bitwarden.
The personal app cannot run or update the official CLI installer. Personal background hooks are not configured;
`hooks install` and `hooks uninstall` refuse this explicit data folder.

For future userscript changes, keep one source file outside both profiles. Install that source separately with
each CLI when both browsers need it. Source edits alone do not update either installed copy.
The shared source folder and initial installations are still pending.

## Verification completed

- Release build, signature verification including nested code, and hidden launch with no Metro.
- Personal bundle ID, disabled updater, and absent URL/document registrations.
- Locked-keychain and wrong-password failures without interactive prompts.
- Refusal to replace a running personal app.
- Scratch instance loads one window; updater is unconfigured and installed CLI version is absent.
- Native path tests verify separate default configuration paths and scratch overrides.
- With a temporary home and no scratch override, the personal app loads its own session; `ardia-personal`
  reaches that window. No actual user profile is read.
- The running personal app refuses the official CLI installer. The original `ardia` symlink stays unchanged.
- Personal CLI endpoint tests, 142 existing CLI tests, and affected TypeScript checks pass.
- Shared-storage change: 1,643 browser tests, 13 project-script tests, and affected TypeScript checks pass.
- The final Release app starts hidden with scratch data and reports `--use-mock-keychain` on its version page.
  An ad hoc copy refuses real-mode startup before creating its Chromium profile folder.
- A signed fixture creates an item in a disposable keychain. A rebuilt fixture with the same certificate
  reads it without a prompt. Invalid certificate pins, another identifier, ad hoc signatures, and changed
  sealed resources are rejected before keychain access. Run with
  `python3 scripts/personal/tests/signing-test.py --password-file <private-file>` after building the personal app.

The manual test confirms fresh-profile login persistence with the shared-storage build. Existing login
migration, Bitwarden integration, and daily use remain unverified. The disposable keychain is removed after the test.
