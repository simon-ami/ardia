import datetime
import fcntl
import os
import re
from pathlib import Path
import plistlib
import shutil
import subprocess
import tempfile
import uuid

from lifecycle import app_inputs, cli_inputs, read_json, runtime_digest, snapshot_profile, tree_layout, validate_candidate, write_json


def run(*args, **kwargs):
    return subprocess.run([str(arg) for arg in args], check=True, timeout=kwargs.pop("timeout", 30), **kwargs)


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


def unregister(registry, app):
    try:
        run(registry, "-u", app, capture_output=True, text=True)
    except subprocess.CalledProcessError as error:
        if not re.search(r": -10814\b", (error.stdout or "") + (error.stderr or "")):
            raise


def main():
    repo = Path(__file__).resolve().parents[2]
    source = repo / "apps/browser/build-personal-signed/Ardia Personal.app"
    destination = Path.home() / "Applications/Ardia Personal.app"
    backups = Path.home() / "Library/Application Support/Ardia Personal/Installed Builds"
    backups.mkdir(parents=True, exist_ok=True, mode=0o700)
    previous = backups / "Ardia Personal.previous.app"
    cli_output = repo / "apps/browser/build-personal-cli"
    with (backups / ".install.lock").open("a") as lock, (source.parent / ".build.lock").open("a") as build_lock, (cli_output / ".prepare.lock").open("a") as cli_lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        fcntl.flock(build_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        fcntl.flock(cli_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        source_info = owned(source)
        for app in [source, source.parent / "Ardia Personal.previous.app", destination, previous]:
            stopped(app)
            if app.exists() or app.is_symlink():
                owned(app)
        certificate = backups.parent / "Signing/certificate.pem"
        fingerprint = run("/usr/bin/openssl", "x509", "-in", certificate, "-noout", "-fingerprint", "-sha1", capture_output=True, text=True).stdout.strip().split("=", 1)[1].replace(":", "")
        validate_candidate(source_info, fingerprint)
        requirement = f'identifier "dev.simon.ardia.personal" and certificate leaf = H"{fingerprint}"'
        run("codesign", "--verify", "--deep", "--strict", "-R=" + requirement, source)
        build = read_json(source / "Contents/Resources/personal-build.json")
        if build.get("schema") != 1 or build["inputs"] != app_inputs(repo) or build["cli"]["source"] != cli_inputs(repo):
            raise RuntimeError("The candidate does not match current app and CLI sources; rebuild it")
        cli = build["cli"]
        if not re.fullmatch(r"[0-9a-f]{64}", cli["archive"]):
            raise ValueError("Invalid CLI runtime identifier")
        runtime = cli_output / cli["archive"]
        if not runtime.is_dir() or runtime.is_symlink() or not os.access(runtime / "bin/ardia", os.X_OK) or runtime_digest(runtime) != cli["runtime_digest"]:
            raise RuntimeError("The candidate CLI runtime is missing or changed")
        current = cli_output / "current"
        if os.path.lexists(current) and not current.is_symlink():
            raise RuntimeError("The active CLI path is not a symlink")
        old_cli = os.readlink(current) if current.is_symlink() else None
        profile = Path.home() / "Library/Application Support" / "dev.simon.ardia.personal"
        preference_path = Path.home() / "Library/Preferences/dev.simon.ardia.personal.plist"
        preferences = run("defaults", "export", "dev.simon.ardia.personal", "-", capture_output=True).stdout if preference_path.exists() else plistlib.dumps({})
        snapshots = backups.parent / "Updates"
        snapshots.mkdir(parents=True, exist_ok=True, mode=0o700)
        snapshot = snapshots / (datetime.datetime.now().strftime("%Y%m%d-%H%M%S-") + uuid.uuid4().hex[:8])
        snapshot_profile(profile, snapshot, preferences)
        if destination.exists():
            run("cp", "-cR", destination, snapshot / "app", timeout=180)
            run("codesign", "--verify", "--deep", "--strict", snapshot / "app")
        transaction = {"schema": 1, "build": build, "previous_cli": old_cli, "state": "prepared"}
        write_json(snapshot / "update.json", transaction)
        destination.parent.mkdir(parents=True, exist_ok=True)
        registry = "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"

        def switch_cli(target):
            if target is None:
                current.unlink(missing_ok=True)
            else:
                with tempfile.TemporaryDirectory(prefix=".activate-", dir=cli_output) as temporary:
                    link = Path(temporary) / "current"
                    link.symlink_to(target)
                    link.replace(current)

        with tempfile.TemporaryDirectory(prefix=".ardia-personal-", dir=destination.parent) as temporary:
            candidate = Path(temporary) / destination.name
            run("cp", "-cR", source, candidate, timeout=180)
            run("codesign", "--verify", "--deep", "--strict", "-R=" + requirement, candidate)
            stopped(source)
            stopped(destination)
            snapshot_state = read_json(snapshot / "snapshot.json")
            if snapshot_state["profile_present"] != profile.exists() or (profile.exists() and snapshot_state["source_layout"] != tree_layout(profile, timestamps=True)):
                raise RuntimeError("The profile changed after its backup; stop the browser and retry")
            if build["inputs"] != app_inputs(repo) or cli["source"] != cli_inputs(repo):
                raise RuntimeError("Sources changed during installation")
            if previous.exists():
                shutil.rmtree(previous)
            had_previous = destination.exists()
            if had_previous:
                destination.rename(previous)
            try:
                candidate.rename(destination)
                switch_cli(runtime.name)
                for old_build in [source, source.parent / "Ardia Personal.previous.app", previous, repo / "apps/browser/build-personal/Build/Products/Release/Ardia.app"]:
                    if old_build.exists():
                        unregister(registry, old_build)
                run(registry, "-f", destination)
                transaction["state"] = "installed"
                write_json(snapshot / "update.json", transaction)
                write_json(backups / "current.json", {"schema": 1, "snapshot": str(snapshot), "build": build})
            except BaseException:
                if destination.exists():
                    destination.rename(snapshot / "failed-app")
                if had_previous:
                    previous.rename(destination)
                switch_cli(old_cli)
                if had_previous:
                    run(registry, "-f", destination)
                transaction["state"] = "failed"
                write_json(snapshot / "update.json", transaction)
                raise
    print(f"installed: {destination}")
    print(f"profile backup: {snapshot}")
    print("Registered HTTP and HTTPS support. The default browser was not changed.")


if __name__ == "__main__":
    main()
