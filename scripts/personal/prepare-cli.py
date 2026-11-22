import argparse
import fcntl
import os
import re
import runpy
from hashlib import sha256
from pathlib import Path
import subprocess
import tarfile
import tempfile

from lifecycle import cli_inputs, read_json, runtime_digest, write_json


def replace_once(path, old, new):
    text = path.read_text()
    if text.count(old) != 1:
        raise RuntimeError(f"Upstream layout changed in {path.name}")
    path.write_text(text.replace(old, new))


def rewrite_skill_text(text):
    text = re.sub(r"(?<![\w./-])ardia(?=:\*|[ \n]+(?:apply|browse|call|commands?|computer|config|events|feedback|groups|history|hooks|methods|notes|on|pinned|plugins|run|scripts|skills|star|tabs|theme|windows|--version)\b)", "ardia-personal", text)
    return text.replace("name: ardia-personal", "name: ardia")


def unpack_cli(archive, destination, top="cli"):
    destination.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive, "r:gz") as source:
        for member in source.getmembers():
            if member.name.startswith("/") or ".." in member.name.split("/"):
                raise RuntimeError(f"Unsafe archive entry: {member.name}")
            if not (member.isfile() or member.isdir() or member.issym()):
                raise RuntimeError(f"Unsupported archive entry: {member.name}")
            if member.name == top:
                continue
            if not member.name.startswith(top + "/"):
                raise RuntimeError(f"Archive entry outside {top}/: {member.name}")
            rel = member.name[len(top) + 1:]
            target = destination / rel
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            elif member.issym():
                resolved = os.path.normpath(os.path.join(os.path.dirname(member.name), member.linkname))
                if member.linkname.startswith("/") or resolved.split("/")[0] != top:
                    raise RuntimeError(f"Unsafe symlink in archive: {member.name}")
                target.parent.mkdir(parents=True, exist_ok=True)
                target.symlink_to(member.linkname)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with source.extractfile(member) as reader, target.open("wb") as writer:
                    writer.write(reader.read())
                os.chmod(target, member.mode & 0o777)


def personalize(runtime, version):
    python_libs = list((runtime / "python/lib").glob("python*/site-packages/ardia_cli")) if (runtime / "python/lib").exists() else []
    if python_libs:
        (package,) = python_libs
        replace_once(package / "browse/vault.py", 'SERVICE = "dev.ardia.browse.auth"', 'SERVICE = "dev.simon.ardia.personal.browse.auth"')
        replace_once(package / "endpoint.py", '/ "com.ardia.browser"', '/ "dev.simon.ardia.personal"')
        replace_once(package / "config_files.py", 'endpoint.INSTALLED_DATA_DIR / "config" if endpoint.LINUX else Path.home() / ".config" / "ardia"', 'endpoint.INSTALLED_DATA_DIR / "config"')
        replace_once(package / "usage.py", '/ "Ardia" / "CLI"', '/ "Ardia Personal" / "CLI"')
        replace_once(package / "computer.py", '/ ".local" / "bin"', '/ "Library" / "Application Support" / "Ardia Personal" / "bin"')
        replace_once(package / "computer.py", 'APPLICATIONS = Path("/Applications")', 'APPLICATIONS = Path.home() / "Applications" / "Ardia Personal Tools"')
        replace_once(package / "computer.py", '    if not os.access(APPLICATIONS, os.W_OK):', '    APPLICATIONS.mkdir(parents=True, exist_ok=True)\n    if not os.access(APPLICATIONS, os.W_OK):')
        for path in (package / "skill").rglob("*.md"):
            path.write_text(rewrite_skill_text(path.read_text()))
        return
    binary = runtime / "bin/ardia"
    manifest = runtime / "plugin.json"
    if not binary.is_file() or not manifest.is_file():
        raise RuntimeError("Upstream CLI artifact layout changed; expected bin/ardia and plugin.json")
    if read_json(manifest).get("version") != version:
        raise RuntimeError(f"CLI plugin.json version does not match pinned {version}")
    skill_text = subprocess.check_output([binary, "--skill"], text=True)
    skill_path = runtime / "skill/SKILL.md"
    skill_path.parent.mkdir(parents=True, exist_ok=True)
    skill_path.write_text(rewrite_skill_text(skill_text))


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
        release_tools = runpy.run_path(str(repo / "scripts/release/official-plugins.py"))
        plugin = release_tools["plugin_of"](release_tools["load"](), "cli")
        version = plugin["version"]
        pinned_digest = plugin["artifacts"]["macos-arm64"]["sha256"]
        digest = sha256(f"{pinned_digest}:{source}".encode()).hexdigest()
        runtime = output / digest
        metadata = output / f"{digest}.json"
        if not runtime.exists():
            with tempfile.TemporaryDirectory(prefix=".extract-", dir=output) as scratch:
                scratch = Path(scratch)
                archive = release_tools["fetch"](plugin, "macos-arm64", scratch / "cli.tar.gz")
                extracted = scratch / "runtime"
                unpack_cli(archive, extracted, "cli")
                personalize(extracted, version)
                actual = subprocess.check_output([extracted / "bin/ardia", "--version"], text=True).strip()
                if actual != f"ardia {version}":
                    raise RuntimeError(f"Expected ardia {version}, got {actual}")
                if cli_inputs(repo) != source:
                    raise RuntimeError("CLI inputs changed during preparation")
                write_json(metadata, {"runtime_digest": runtime_digest(extracted)})
                extracted.rename(runtime)
        verified = read_json(metadata)
        if runtime_digest(runtime) != verified["runtime_digest"]:
            raise RuntimeError("Personal CLI runtime changed; do not activate it")
        selection = {"source": source, "version": version, "archive": digest, "upstream_sha256": pinned_digest, **verified}
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
