import argparse
from pathlib import Path
import plistlib
import subprocess
import tempfile


def run(*args, **kwargs):
    return subprocess.run([str(arg) for arg in args], check=True, capture_output=True, text=True, timeout=30, **kwargs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--password-file", type=Path, required=True)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[3]
    signing = Path.home() / "Library/Application Support/Ardia Personal/Signing"
    identity = run("/usr/bin/openssl", "x509", "-in", signing / "certificate.pem", "-noout", "-fingerprint", "-sha1").stdout.strip().split("=", 1)[1].replace(":", "")
    run(repo / "apps/browser/build-personal-signed/unlock-signing-keychain", signing / "signing.keychain-db", args.password_file)
    try:
        with tempfile.TemporaryDirectory(prefix="ardia-personal-signing-") as temporary:
            scratch = Path(temporary)
            keychain = scratch / "fixture.keychain-db"
            run("security", "create-keychain", "-p", "disposable-fixture", keychain)
            try:
                run("security", "unlock-keychain", "-p", "disposable-fixture", keychain)
                app = scratch / "Probe.app"
                binary = app / "Contents/MacOS/probe"
                binary.parent.mkdir(parents=True)
                resources = app / "Contents/Resources"
                resources.mkdir()
                resource = resources / "fixture.txt"
                resource.write_text("original")
                info = dict(CFBundleIdentifier="dev.simon.ardia.personal", CFBundleExecutable="probe", CFBundlePackageType="APPL", ACPersonalBuild=True, ACPersonalSafeStorage="shared-ardia", ACPersonalSigningCertificateSHA1=identity)

                def prepare(number, certificate=identity, identifier="dev.simon.ardia.personal", signer=identity):
                    run("clang++", "-std=c++20", "-fobjc-arc", "-Wno-deprecated-declarations", f"-DARDIA_SIGNING_TEST_BUILD={number}", "-framework", "Foundation", "-framework", "Security", "-I", repo / "packages/ardiacore/ios", repo / "scripts/personal/tests/signing-probe.mm", "-o", binary)
                    info.update(ACPersonalSigningCertificateSHA1=certificate, CFBundleIdentifier=identifier)
                    with (app / "Contents/Info.plist").open("wb") as stream:
                        plistlib.dump(info, stream)
                    run("codesign", "--force", "--sign", signer, "--keychain", signing / "signing.keychain-db", "--timestamp=none", app)

                prepare(1)
                assert run(binary, keychain).stdout.endswith("created\n")
                prepare(2)
                assert run(binary, keychain).stdout.endswith("read\n")
                print("PASS: a rebuilt app with the same identity reads its existing test item")
                resource.write_text("modified")
                result = subprocess.run([str(binary), str(keychain)], capture_output=True, text=True, timeout=10)
                assert result.returncode != 0 and "signing rejected" in result.stderr, result.stderr
                print("PASS: rejects modified sealed resources")
                for name, options in [
                    ("wrong certificate", dict(certificate="0" * 40)),
                    ("malformed certificate", dict(certificate='invalid"')),
                    ("wrong app identifier", dict(identifier="dev.simon.ardia.other")),
                    ("ad hoc signature", dict(signer="-")),
                ]:
                    prepare(3, **options)
                    result = subprocess.run([str(binary), str(keychain)], capture_output=True, text=True, timeout=10)
                    assert result.returncode != 0, name
                    assert "signing rejected" in result.stderr, (name, result.stderr)
                    print(f"PASS: rejects {name}")
            finally:
                run("security", "delete-keychain", keychain)
    finally:
        run("security", "lock-keychain", signing / "signing.keychain-db")


if __name__ == "__main__":
    main()
