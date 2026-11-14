import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("staged engine lookup uses the merge tree and refuses unmatched working files", () => {
  const root = mkdtempSync(join(tmpdir(), "ardia-engine-"));
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
  try {
    const scripts = join(root, "packages/ardiacore/scripts");
    mkdirSync(scripts, { recursive: true });
    mkdirSync(join(root, "engine"));
    copyFileSync(new URL("../../packages/ardiacore/scripts/fetch-engine.sh", import.meta.url), join(scripts, "fetch-engine.sh"));
    copyFileSync(new URL("../../engine/engine-key.sh", import.meta.url), join(root, "engine/engine-key.sh"));
    for (const name of ["offline-game", "offline-game-pipeline"]) {
      mkdirSync(join(root, "apps/browser/assets", name), { recursive: true });
      writeFileSync(join(root, "apps/browser/assets", name, "source"), "fixture");
    }
    git("init", "-q");
    git("config", "user.name", "Fixture");
    git("config", "user.email", "fixture@example.invalid");
    writeFileSync(join(root, "engine/source"), "old");
    git("add", ".");
    git("commit", "-qm", "Fixture");
    writeFileSync(join(root, "engine/source"), "new");
    git("add", "engine");
    const tree = execFileSync("bash", [join(root, "engine/engine-key.sh"), git("write-tree")], { encoding: "utf8" }).trim();
    const cached = join(root, "apps/browser/build-ardiacore/prebuilt", tree.slice(0, 12));
    mkdirSync(cached, { recursive: true });
    writeFileSync(join(cached, ".complete"), "");
    writeFileSync(join(root, "packages/ardiacore/prebuilt-engines.tsv"), `${tree}\tengine-fixture\tunused\n`);
    const fetch = (...args) => spawnSync("bash", [join(scripts, "fetch-engine.sh"), ...args], { encoding: "utf8", timeout: 5000 });
    assert.notEqual(fetch().status, 0);
    const staged = fetch("--staged");
    assert.equal(staged.status, 0, staged.stderr);
    assert.equal(staged.stdout.trim(), join(cached, "Chromium Framework.framework"));
    writeFileSync(join(root, "engine/source"), "unstaged");
    assert.match(fetch("--staged").stderr, /unstaged changes/);
    writeFileSync(join(root, "engine/source"), "new");
    writeFileSync(join(root, "engine/untracked"), "untracked");
    assert.match(fetch("--staged").stderr, /untracked files/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
