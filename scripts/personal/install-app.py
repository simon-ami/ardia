import fcntl
from pathlib import Path
import plistlib
import shutil
import subprocess
import tempfile


def run(*args, **kwargs):
    return subprocess.run([str(arg) for arg in args], check=True, timeout=30, **kwargs)


def stopped(app):
    processes = run("ps", "-ww", "-ax", "-o", "command=", capture_output=True, text=True).stdout.splitlines()
    binary = str(app / "Contents/MacOS/Ardia")
    if any(line == binary or line.startswith(binary + " ") for line in processes):
        raise RuntimeError(f"Quit {app} before installing")


def owned(app):
    if app.is_symlink():
        raise RuntimeError(f"Refusing an app symlink: {app}")
    with (app / "Contents/Info.plist").open("rb") as stream:
        info = plistlib.load(stream)
    if info.get("CFBundleIdentifier") != "dev.simon.ardia.personal":
        raise RuntimeError(f"Refusing an unrelated app: {app}")
    return info


def main():
    repo = Path(__file__).resolve().parents[2]
    source = repo / "apps/browser/build-personal-signed/Ardia Personal.app"
    destination = Path.home() / "Applications/Ardia Personal.app"
    backups = Path.home() / "Library/Application Support/Ardia Personal/Installed Builds"
    backups.mkdir(parents=True, exist_ok=True, mode=0o700)
    previous = backups / "Ardia Personal.previous.app"
    with (backups / ".install.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        owned(source)
        for app in [source, destination, previous]:
            stopped(app)
            if app.exists() or app.is_symlink():
                owned(app)
        certificate = backups.parent / "Signing/certificate.pem"
        fingerprint = run("/usr/bin/openssl", "x509", "-in", certificate, "-noout", "-fingerprint", "-sha1", capture_output=True, text=True).stdout.strip().split("=", 1)[1].replace(":", "")
        requirement = f'identifier "dev.simon.ardia.personal" and certificate leaf = H"{fingerprint}"'
        run("codesign", "--verify", "--deep", "--strict", "-R=" + requirement, source)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix=".ardia-personal-", dir=destination.parent) as temporary:
            candidate = Path(temporary) / destination.name
            run("cp", "-cR", source, candidate)
            run("codesign", "--verify", "--deep", "--strict", "-R=" + requirement, candidate)
            stopped(source)
            stopped(destination)
            if previous.exists():
                shutil.rmtree(previous)
            if destination.exists():
                destination.rename(previous)
            try:
                candidate.rename(destination)
            except BaseException:
                if previous.exists():
                    previous.rename(destination)
                raise
        registry = "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
        for build in [source, source.parent / "Ardia Personal.previous.app", previous, repo / "apps/browser/build-personal/Build/Products/Release/Ardia.app"]:
            if build.exists():
                run(registry, "-u", build)
        run(registry, "-f", destination)
    print(f"installed: {destination}")
    print("Registered HTTP and HTTPS support. The default browser was not changed.")


if __name__ == "__main__":
    main()
