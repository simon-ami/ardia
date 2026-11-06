import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("personal lifecycle preserves data and refuses unsafe deployments", () => {
  const root = fileURLToPath(new URL("../..", import.meta.url));
  const result = spawnSync("python3", ["-m", "unittest", "discover", "-s", "scripts/personal/tests", "-p", "test_*.py"], { cwd: root, encoding: "utf8", timeout: 30000 });
  assert.equal(result.status, 0, result.stderr + result.stdout);
});
