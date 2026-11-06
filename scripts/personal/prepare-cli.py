import argparse
import fcntl
import hashlib
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile


def main():
    parser = argparse.ArgumentParser(description="Prepare a separate personal CLI runtime.")
    parser.add_argument("--install", action="store_true", help="Add ~/.local/bin/ardia-personal without changing ardia")
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    output = repo / "apps/browser/build-personal-cli"
    output.mkdir(exist_ok=True)
    lock = (output / ".prepare.lock").open("a")
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    version = "0.2.44-personal.1"
    archive = output / f"ardia-cli-{version}-macos-arm64.tar.gz"
    inputs = [repo / "apps/cli/scripts/build.sh", repo / "apps/cli/requirements.lock", repo / "apps/cli/pyproject.toml"]
    inputs.extend(path for path in (repo / "apps/cli/ardia_cli").rglob("*") if path.is_file() and "__pycache__" not in path.parts)
    source = hashlib.sha256()
    for path in sorted(inputs):
        source.update(str(path.relative_to(repo)).encode() + b"\0" + path.read_bytes())
    stamp = output / "build-input.sha256"
    if not (archive.is_file() and stamp.is_file() and stamp.read_text() == source.hexdigest()):
        subprocess.run([str(repo / "apps/cli/scripts/build.sh"), version, str(output)], check=True)
        stamp.write_text(source.hexdigest())
    with archive.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    expected = archive.with_suffix(archive.suffix + ".sha256").read_text().split()[0]
    if digest != expected:
        raise ValueError("Personal CLI archive checksum mismatch")
    runtime = output / digest
    if not runtime.exists():
        with tempfile.TemporaryDirectory(prefix=".extract-", dir=output) as scratch:
            with tarfile.open(archive) as bundle:
                bundle.extractall(scratch, filter="data")
            source = Path(scratch) / f"ardia-cli-{version}"
            subprocess.run([str(source / "bin/ardia"), "--version"], check=True)
            source.rename(runtime)
    current = output / "current"
    if current.exists() and not current.is_symlink():
        raise RuntimeError("The personal CLI current path is not a symlink")
    staged = output / ".current-next"
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
