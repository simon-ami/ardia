import argparse
import fcntl
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import tempfile


def run(args, **kwargs):
    return subprocess.run([str(arg) for arg in args], check=True, **kwargs)


def ensure_stopped(app):
    binary = str(app / "Contents/MacOS/Ardia")
    processes = run(["ps", "-ww", "-ax", "-o", "command="], capture_output=True, text=True).stdout
    if any(line == binary or line.startswith(binary + " ") for line in processes.splitlines()):
        raise RuntimeError("Quit the personal test app before replacing its build")


def main():
    parser = argparse.ArgumentParser(description="Build and locally sign Ardia Personal for isolated testing.")
    parser.add_argument("--password-file", type=Path, help="Private file holding the signing keychain password")
    parser.add_argument("--sign-only", action="store_true", help="Sign the existing Release build without rebuilding")
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    signing = Path.home() / "Library/Application Support/Ardia Personal/Signing"
    keychain = signing / "signing.keychain-db"
    certificate = signing / "certificate.pem"
    for path in [keychain, certificate]:
        if not path.is_file():
            raise FileNotFoundError(path)
    fingerprint = run(["/usr/bin/openssl", "x509", "-in", certificate, "-noout", "-fingerprint", "-sha1"], capture_output=True, text=True).stdout.strip()
    identity = fingerprint.split("=", 1)[1].replace(":", "")
    if not re.fullmatch(r"[0-9A-Fa-f]{40}", identity):
        raise ValueError("Certificate fingerprint is not a SHA-1 signing identity")
    output = repo / "apps/browser/build-personal-signed"
    output.mkdir(exist_ok=True)
    app = output / "Ardia Personal.app"
    with (output / ".build.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        ensure_stopped(app)
        config = output / "Release.xcconfig"
        config.write_text(f'#include "{repo}/apps/browser/macos/AdHoc.xcconfig"\nARCHS = arm64\nONLY_ACTIVE_ARCH = YES\n')
        if not args.sign_only:
            run([repo / "scripts/agent/build-app", "--as", "personal", "--config", "Release", "--wait", "120"], cwd=repo, env={**os.environ, "XCODE_XCCONFIG_FILE": str(config)})
        source = repo / "apps/browser/build-personal/Build/Products/Release/Ardia.app"
        if not (source / "Contents/Resources/main.jsbundle").is_file():
            raise RuntimeError("No standalone Release bundle; run without --sign-only")
        helper = output / "unlock-signing-keychain"
        run(["swiftc", "-suppress-warnings", repo / "scripts/personal/unlock-signing-keychain.swift", "-framework", "Security", "-o", helper])
        unlock = [helper, keychain]
        if args.password_file:
            unlock.append(args.password_file.resolve(strict=True))
        run(unlock, timeout=20)
        try:
            with tempfile.TemporaryDirectory(prefix=".sign-", dir=output) as temporary:
                candidate = Path(temporary) / app.name
                run(["cp", "-cR", source, candidate])
                info_path = candidate / "Contents/Info.plist"
                with info_path.open("rb") as stream:
                    info = plistlib.load(stream)
                info.update(CFBundleIdentifier="dev.simon.ardia.personal", CFBundleDisplayName="Ardia Personal", CFBundleName="Ardia Personal", ACPersonalBuild=True, SUEnableAutomaticChecks=False, SUAutomaticallyUpdate=False)
                for key in ["SUFeedURL", "SUPublicEDKey", "CFBundleURLTypes", "CFBundleDocumentTypes"]:
                    info.pop(key, None)
                with info_path.open("wb") as stream:
                    plistlib.dump(info, stream)
                run(["codesign", "--force", "--sign", identity, "--keychain", keychain, "--timestamp=none", candidate], timeout=30)
                run(["codesign", "--verify", "--deep", "--strict", candidate], timeout=30)
                ensure_stopped(app)
                previous = output / "Ardia Personal.previous.app"
                ensure_stopped(previous)
                if previous.exists():
                    shutil.rmtree(previous)
                if app.exists():
                    app.rename(previous)
                candidate.rename(app)
        finally:
            run(["security", "lock-keychain", keychain], timeout=10)
    print(f"app: {app}")
    print("Test data only: real Keychain storage is not configured yet. Use ardia-personal for this build.")


if __name__ == "__main__":
    main()
