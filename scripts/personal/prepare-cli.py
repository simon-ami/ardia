import argparse
import fcntl
import os
import re
from pathlib import Path
import subprocess
import tarfile
import tempfile

from lifecycle import cli_inputs, file_digest, read_json, runtime_digest, write_json


def main():
    parser = argparse.ArgumentParser(description="Prepare a separate personal CLI runtime.")
    parser.add_argument("--install", action="store_true", help="Add ~/.local/bin/ardia-personal without changing ardia")
    parser.add_argument("--prepare-only", action="store_true", help="Build and verify without switching the active CLI")
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    output = repo / "apps/browser/build-personal-cli"
    output.mkdir(exist_ok=True)
    with (output / ".prepare.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        source = cli_inputs(repo)
        project = (repo / "apps/browser/macos/Ardia.xcodeproj/project.pbxproj").read_text()
        versions = set(re.findall(r'MARKETING_VERSION = "?([^";]+)"?;', project))
        if len(versions) != 1:
            raise ValueError("App configurations have inconsistent versions")
        base = re.fullmatch(r"(\d+\.\d+\.\d+)(?:-.*)?", versions.pop())
        if not base:
            raise ValueError("Unsupported app version for the personal CLI")
        version = base[1] + "-personal.1"
        archive = output / f"ardia-cli-{version}-macos-arm64.tar.gz"
        stamp = output / "build-input.json"
        expected_inputs = {"source": source, "version": version}
        if not (archive.is_file() and stamp.is_file() and read_json(stamp) == expected_inputs):
            subprocess.run([str(repo / "apps/cli/scripts/build.sh"), version, str(output)], check=True)
            if cli_inputs(repo) != source:
                raise RuntimeError("CLI sources changed during the build")
            write_json(stamp, expected_inputs)
        digest = file_digest(archive)
        expected = archive.with_suffix(archive.suffix + ".sha256").read_text().split()[0]
        if digest != expected:
            raise ValueError("Personal CLI archive checksum mismatch")
        runtime = output / digest
        if not runtime.exists():
            with tempfile.TemporaryDirectory(prefix=".extract-", dir=output) as scratch:
                with tarfile.open(archive) as bundle:
                    bundle.extractall(scratch, filter="data")
                extracted = Path(scratch) / f"ardia-cli-{version}"
                subprocess.run([str(extracted / "bin/ardia"), "--version"], check=True)
                extracted.rename(runtime)
            write_json(output / f"{digest}.json", {"runtime_digest": runtime_digest(runtime)})
        verified = read_json(output / f"{digest}.json")
        if runtime_digest(runtime) != verified["runtime_digest"]:
            raise RuntimeError("Personal CLI runtime changed; do not activate it")
        selection = {"source": source, "version": version, "archive": digest, **verified}
        write_json(output / "prepared.json", selection)
        if not args.prepare_only:
            current = output / "current"
            if current.exists() and not current.is_symlink():
                raise RuntimeError("The personal CLI current path is not a symlink")
            with tempfile.TemporaryDirectory(prefix=".activate-", dir=output) as activation:
                staged = Path(activation) / "current"
                staged.symlink_to(runtime.name)
                staged.replace(current)
        if args.install:
            command = Path.home() / ".local/bin/ardia-personal"
            target = repo / "scripts/personal/ardia-personal"
            if os.path.lexists(command):
                if not command.is_symlink() or command.resolve() != target:
                    raise RuntimeError(f"Refusing to replace {command}")
            else:
                command.parent.mkdir(parents=True, exist_ok=True)
                command.symlink_to(target)
            print(f"command: {command}")
        print(f"runtime: {runtime}")


if __name__ == "__main__":
    main()
