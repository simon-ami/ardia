import json
from pathlib import Path

from lifecycle import app_inputs, cli_inputs, read_json


def main():
    repo = Path(__file__).resolve().parents[2]
    inputs = app_inputs(repo)
    cli = cli_inputs(repo)
    result = {}
    for name, app in [
        ("installed", Path.home() / "Applications/Ardia Personal.app"),
        ("candidate", repo / "apps/browser/build-personal-signed/Ardia Personal.app"),
    ]:
        record = app / "Contents/Resources/personal-build.json"
        if not record.exists():
            result[name] = {"recorded": False, "exists": app.exists()}
            continue
        build = read_json(record)
        result[name] = {"recorded": True, "sources_match": build["inputs"] == inputs and build["cli"]["source"] == cli, "commit": build["commit"], "dirty_at_build": build["dirty"], "engine_tree": build["engine"]["tree"], "cli_version": build["cli"]["version"]}
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
