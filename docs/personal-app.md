# Personal app setup

## Current state

Release builds and starts without Metro. The personal build wrapper creates a separate signed app with
bundle ID `dev.simon.ardia.personal`. Its updater feed and URL/document registrations are removed.
It is not installed and is not ready for real browsing data. The current native code still selects the mock
keychain for this self-signed build. Secure storage and personal CLI routing remain unfinished.

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
| Browser profiles | Keep separate. Never run both apps against one live profile folder. No real profile has been migrated. |
| Userscript source | Plan one shared source folder, including imported files. No source folder has been moved or linked yet. |
| Installed userscripts | Each profile needs its own installation. Apply source changes to both profiles when desired. |
| Script and extension data | Treat stored values and extension settings as profile-specific. Do not assume they sync with script source. |
| CLI | The existing `ardia` command still belongs to the official setup. Personal routing is not configured. |

Before changing a location, explain the source, destination, and whether later changes propagate.
Retain the official installation and original profile until migration and rollback have been tested.

## Verification completed

- Release build, signature verification including nested code, and hidden launch with no Metro.
- Personal bundle ID, disabled updater, and absent URL/document registrations.
- Locked-keychain and wrong-password failures without interactive prompts.
- Refusal to replace a running personal app.
- Scratch instance loads one window; updater is unconfigured and installed CLI version is absent.

These checks do not verify real Keychain storage, existing login migration, Bitwarden integration, or daily use.
