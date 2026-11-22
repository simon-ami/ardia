import assert from "node:assert/strict";
import { test } from "node:test";
const { resolveShortcuts, formatShortcut, parseShortcut } = await import("./shortcuts.ts");
const { staticShortcutSources } = await import("./commandCatalog.ts");
const { ctrlTabChoiceOf, ctrlTabCombos, ctrlTabCustomTarget, ctrlTabOverrides } = await import("./ctrlTabKeys.ts");
const { ctrlTabCustomQuery } = await import("./commandShortcuts.ts");
const { parseWindowsShortcut, windowsDefaultKeys, windowsModifiers, formatWindowsShortcut } = await import("./windowsKeys.ts");

const macSources = staticShortcutSources();
const mac = (overrides) => resolveShortcuts(macSources, overrides);
const hints = (resolved, id) => (resolved.bindings.get(id) ?? []).map(formatShortcut);
const STEP = { nextTab: ["\t", "control"], previousTab: ["\t", "control", "shift"] };
const SWITCHER = { "tabSwitcher:forward": ["\t", "control"], "tabSwitcher:backward": ["\t", "control", "shift"] };

const pick = (overrides, preset, resolve = mac) => ctrlTabOverrides(overrides, ctrlTabCombos(resolve(overrides)), preset, resolve(overrides).defaultsOf);

test("the defaults open the recent tabs switcher: ⌃⇥ is Tab Switcher and Next Tab keeps its other keys", () => {
  assert.equal(ctrlTabChoiceOf(mac({})), "switcher");
  assert.ok(hints(mac({}), "tabSwitcher:forward").includes("⌃⇥"));
  assert.ok(!hints(mac({}), "nextTab").includes("⌃⇥"));
  assert.ok(hints(mac({}), "nextTab").includes("⇧⌘]"));
});

test("⌃⇥ and ⌃⇧⇥ on Next/Previous Tab read as stepping through tabs", () => {
  const resolved = mac(STEP);
  assert.equal(ctrlTabChoiceOf(resolved), "step");
  assert.ok(hints(resolved, "nextTab").includes("⌃⇥"));
  assert.deepEqual(hints(resolved, "tabSwitcher:forward"), []);
});

test("anything else is custom: one direction only, a key of your own on Tab Switcher, or ⌃⇥ set for another command", () => {
  assert.equal(ctrlTabChoiceOf(mac({ nextTab: ["\t", "control"] })), "custom");
  assert.equal(ctrlTabChoiceOf(mac({ "tabSwitcher:forward": ["j", "command"] })), "custom");
  assert.equal(ctrlTabChoiceOf(mac({ newTab: ["\t", "control"] })), "custom");
  assert.equal(ctrlTabChoiceOf(mac({ ...STEP, duplicateTab: ["\t", "control"] })), "custom");
  assert.equal(ctrlTabChoiceOf(mac({ "tabSwitcher:forward": [""] })), "custom");
});

test("picking step through tabs binds both directions and keeps your unrelated shortcuts", () => {
  const next = pick({ closeTab: ["t", "command"] }, "step");
  assert.deepEqual(next, { closeTab: ["t", "command"], ...STEP });
  assert.equal(ctrlTabChoiceOf(mac(next)), "step");
});

test("picking the switcher undoes step through tabs and keeps Next Tab's own other keys", () => {
  assert.deepEqual(pick(STEP, "switcher"), {});
  const own = { nextTab: ["\t", "option"] };
  assert.deepEqual(pick({ ...own, previousTab: ["\t", "control", "shift"] }, "switcher"), own);
  assert.equal(ctrlTabChoiceOf(mac(pick(STEP, "switcher"))), "switcher");
});

test("only the press takes ⌃⇥ from another command or a custom Next Tab, so the picked card is what you get", () => {
  const custom = { newTab: ["\t", "control"], nextTab: ["j", "command"], closeTab: ["w", "command"] };
  assert.equal(ctrlTabChoiceOf(mac(custom)), "custom");
  const stepped = pick(custom, "step");
  assert.deepEqual(stepped, { closeTab: ["w", "command"], ...STEP });
  assert.equal(ctrlTabChoiceOf(mac(stepped)), "step");
  const switched = pick(custom, "switcher");
  assert.deepEqual(switched, { nextTab: ["j", "command"], closeTab: ["w", "command"] });
  assert.equal(ctrlTabChoiceOf(mac(switched)), "switcher");
});

test("picking is idempotent", () => {
  assert.deepEqual(pick(pick({}, "step"), "step"), STEP);
  assert.deepEqual(pick(pick({}, "switcher"), "switcher"), {});
});

const windowsSources = macSources.map((source) => ({ ...source, keys: windowsDefaultKeys(source.id).map(parseWindowsShortcut) }));
const windows = (overrides) => resolveShortcuts(windowsSources, overrides, windowsModifiers);

test("on Windows the same presets use Ctrl+Tab and Ctrl+Shift+Tab", () => {
  const combos = ctrlTabCombos(windows({}));
  assert.equal(formatWindowsShortcut(combos.forward), "Ctrl+Tab");
  assert.equal(formatWindowsShortcut(combos.backward), "Ctrl+Shift+Tab");
  assert.equal(ctrlTabChoiceOf(windows({})), "switcher");
  const stepped = pick({}, "step", windows);
  assert.equal(ctrlTabChoiceOf(windows(stepped)), "step");
  assert.equal(ctrlTabChoiceOf(windows(pick(stepped, "switcher", windows))), "switcher");
});

const LINUX_KEYS = { nextTab: ["⇧⌘]", "⌘⇟", "⌥⌘↓"], previousTab: ["⇧⌘[", "⌘⇞", "⌥⌘↑"], "tabSwitcher:forward": ["⌘⇥"], "tabSwitcher:backward": ["⇧⌘⇥"] };
const linuxSources = macSources.map((source) => (LINUX_KEYS[source.id] ? { ...source, keys: LINUX_KEYS[source.id].map(parseShortcut) } : source));
const linux = (overrides) => resolveShortcuts(linuxSources, overrides);

test("on Linux, where Ctrl+Tab opens the switcher by default and Ctrl is stored as command, both cards work", () => {
  assert.equal(ctrlTabChoiceOf(linux({})), "switcher");
  const stepped = pick({}, "step", linux);
  assert.deepEqual(stepped, { nextTab: ["\t", "command"], previousTab: ["\t", "shift", "command"] });
  assert.equal(ctrlTabChoiceOf(linux(stepped)), "step");
  assert.deepEqual(pick(stepped, "switcher", linux), {});
  assert.equal(ctrlTabChoiceOf(linux(pick(stepped, "switcher", linux))), "switcher");
});

test("Show in Shortcuts searches for the chord that differs from both cards", () => {
  assert.equal(formatShortcut(ctrlTabCustomTarget(mac({ previousTab: ["\t", "control", "shift"] })).combo), "⌃⇧⇥");
  assert.equal(formatShortcut(ctrlTabCustomTarget(mac({ newTab: ["\t", "control"] })).combo), "⌃⇥");
});

test("with Tab Switcher cleared, no command holds ⌃⇥, so Show in Shortcuts searches for Tab Switcher by name", () => {
  assert.deepEqual(ctrlTabCustomTarget(mac({ "tabSwitcher:forward": [""] })), { command: "tabSwitcher:forward" });
  assert.deepEqual(ctrlTabCustomTarget(linux({ "tabSwitcher:forward": [""] })), { command: "tabSwitcher:forward" });
  assert.equal(ctrlTabCustomQuery({ settings: { shortcuts: { "tabSwitcher:forward": [""] } }, profileOrder: [] }), "Tab Switcher (forward)");
});
