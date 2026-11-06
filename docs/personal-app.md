# Personal app setup

## Current state

Release builds and starts without Metro. The personal build wrapper creates a separate signed app with
bundle ID `dev.simon.ardia.personal`. Its updater feed is removed. It registers HTTP and HTTPS support;
it does not register file or document handlers. The app is installed at `~/Applications/Ardia Personal.app`.
The personal build supports the shared `Ardia Safe Storage` keychain item.
Its signing and storage checks are described below. Simon reported the fresh-profile login test passed:
the website remained signed in after quitting and reopening the personal app. Data has since been copied;
Simon reports tabs, settings, spaces/profiles, existing logins, Bitwarden, and scripts work in spot checks.

The personal app uses `~/Library/Application Support/dev.simon.ardia.personal` for its own data.
Its Chromium profiles are in `Chromium`; its editable configuration is in `config`.
The official app keeps its own data and `~/.config/ardia` configuration. At migration, the official configuration
folder did not exist. Its profile and selected window and appearance preferences were copied.

## Build and sign

Run `python3 scripts/personal/build-app.py`. It calls the existing locked build wrapper, then copies the app
and signs the copy. `--sign-only` reuses an existing Release build. The output is
`apps/browser/build-personal-signed/Ardia Personal.app`.

For an approved daily-use update, add `--install`. It verifies the signed app, copies it to
`~/Applications/Ardia Personal.app`, and registers HTTP and HTTPS support. It does not select a default browser.
Quit the personal app first. The installer refuses to replace a running app or an unrelated bundle.
It keeps the previous installed app at
`~/Library/Application Support/Ardia Personal/Installed Builds/Ardia Personal.previous.app`.
It removes this checkout's build copies from the browser-handler registry and registers the installed app.
`python3 scripts/personal/install-app.py` installs an already signed build without rebuilding or unlocking the key.
No profile data is copied during app installation. Build and installed copies use the same personal profile;
they must not run at the same time.

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
| Built apps | Release, signed build, and installed app are separate program files. Signing and installation do not copy browser data. The two personal app copies use the same personal profile. |
| Signing identity | Reuse one identity for personal builds. The official app keeps its upstream signature. |
| Cookie encryption key | Both apps use `Ardia Safe Storage` in the macOS keychain. This shares a key, not cookies or profiles. |
| Browser profiles | The official profile was copied into the personal folder. They are independent. Never run both apps against one live profile folder. |
| Userscript source | All four original source files already reside in `~/Documents/Work/Personal Projects/userscripts`. Both CLIs can use those same files. No source was moved or duplicated. |
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
Simon's global `~/.codex/AGENTS.md` directs browser automation to use `ardia-personal` wherever the Ardia skill
says `ardia`. The skill text stays unchanged. Use the official command only on an explicit request.

`ardia-personal` always selects the personal data folder. It clears inherited remote-browser endpoints and
refuses endpoint overrides. CLI credential items use the separate service
`dev.simon.ardia.personal.browse.auth`. This does not copy credentials or change Bitwarden.
The personal app cannot run or update the official CLI installer. Personal background hooks are not configured;
`hooks install` and `hooks uninstall` refuse this explicit data folder.

For future userscript changes, keep one source file outside both profiles. Install that source separately with
each CLI when both browsers need it. Source edits alone do not update either installed copy.
The four installed scripts were copied with the profile. The personal build replaces the copied extension
reference to the official Scripts folder with its own installation. A disabled installation stays disabled.
Unrelated extensions and the official profile remain unchanged. Migration omits `Scripts/status.json` so the
personal build checks and loads the copied scripts at first start.

## Migration record

On 2026-11-06, both browsers were stopped. The official and personal app versions were 0.2.44; both session
schemas were 9. Cloud sync was disabled. No linked shared folders were found.

- Source: `~/Library/Application Support/com.ardia.browser`.
- Destination: `~/Library/Application Support/dev.simon.ardia.personal`.
- Backup: `~/Library/Application Support/Ardia Personal/Backups/20261106-134043`.
  `official-profile` holds the original snapshot; `personal-before` holds the personal test profile.
  The directory also holds both preference exports and a migration record. Keep it private and out of Git.
- Verified 7,076 copied files by SHA-256. The original profile remained byte-identical during the copy.
- Omitted old lock files, legacy migration markers, script load status, and the pending telemetry queue.
  Copied appearance and window preferences; retained the personal updater preferences.
- The four script source files remain shared at their existing location. Installed scripts, extension settings,
  cookies, history, and tabs are separate copies from this point forward. Later edits do not propagate.
- Manual validation: Simon reports tabs, settings, spaces/profiles, existing logins, Bitwarden, and scripts
  work in spot checks. Script execution counts were not measured separately. The extension path cleanup
  also passed 25 nearby automated checks, typecheck, a Release build, and a hidden launch.

For rollback, stop both apps first. Preserve the current personal folder separately, restore `personal-before`
to the destination, and import `personal-defaults.plist` into `dev.simon.ardia.personal`. Never overwrite the
official profile as part of rollback.

## Verification completed

- Release build, signature verification including nested code, and hidden launch with no Metro.
- Personal bundle ID, disabled updater, HTTP/HTTPS registration, and absent file/document registrations.
- Installed app starts hidden with scratch data. Installation refuses a running app and an unrelated bundle.
  Reinstallation preserves the previous app. Launch Services lists the installed app for HTTPS; the default
  HTTP/HTTPS browser remains the official installation.
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

Manual tests confirm fresh-profile login persistence and basic migrated-profile behavior, including existing
logins and Bitwarden. Extended daily use remains unverified. The disposable keychain is removed after the test.
