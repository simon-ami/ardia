import assert from "node:assert/strict";
import { test } from "node:test";
const { recentTabIds, sessionTabIds } = await import("./tabCleanup.ts");
const { useLifecycle } = await import("../tabs/sleepingTabs.ts");

const HOUR = 60 * 60 * 1000;
const NOW = 100 * HOUR;
const tab = (id, page, ago, pin = null, extra = {}) => ({ id, windowId: "w", profileId: "p", page: { kind: page }, url: `https://${id}.example/`, pin, lastActiveAt: NOW - ago, ...extra });
const state = (...tabs) => {
  const active = tabs.find((t) => t.page.kind === "loaded")?.id;
  return {
    windows: { w: { id: "w", profileId: "p", tabIds: tabs.map((t) => t.id), activeTabIds: active ? { p: active } : {} } },
    settings: { sleepingTabsInSwitcher: false },
    tabs: Object.fromEntries(tabs.map((t) => [t.id, t])),
  };
};

test("the ⌃Tab switcher lists open tabs by last use and leaves out closed pinned tabs, which only look recent", () => {
  const s = state(
    tab("closedTile", "asleep", 1000, { as: "tile" }),
    tab("closedRow", "asleep", 2000, { as: "row" }),
    tab("current", "loaded", 0),
    tab("restored", "idle", 3 * HOUR),
    tab("openPin", "loaded", HOUR, { as: "tile" }),
  );
  assert.deepEqual(recentTabIds(s, "w", NOW), ["current", "openPin"]);
});

test("open tabs unused for longer than clean-up's window still drop out, past the two most recent", () => {
  const s = state(tab("a", "loaded", 0), tab("b", "loaded", 20 * HOUR), tab("c", "loaded", 30 * HOUR));
  assert.deepEqual(recentTabIds(s, "w", NOW), ["a", "b"]);
});

test("Memory Saver discarded tabs stay out of the session list", () => {
  const s = state(tab("a", "loaded", 0), tab("sleeping", "loaded", HOUR), tab("b", "loaded", 2 * HOUR));
  s.windows.w.activeTabIds = { p: "a" };
  useLifecycle.setState({ discarded: { sleeping: true } });
  try {
    assert.deepEqual(sessionTabIds(s, "w", NOW - 4 * HOUR), ["a", "b"]);
  } finally {
    useLifecycle.setState({ discarded: {} });
  }
});

test("newest unseen siblings follow their opener first", () => {
  const s = state(
    tab("a", "loaded", 0),
    tab("older", "loaded", HOUR, null, { openerId: "a", unseen: true, createdAt: NOW - 2 }),
    tab("newer", "loaded", HOUR, null, { openerId: "a", unseen: true, createdAt: NOW - 1 }),
    tab("b", "loaded", 2 * HOUR),
  );
  s.windows.w.activeTabIds = { p: "a" };
  assert.deepEqual(recentTabIds(s, "w", NOW), ["a", "newer", "older", "b"]);
});

test("unseen nested links stay beside their own opener", () => {
  const s = state(
    tab("a", "loaded", 0),
    tab("link", "loaded", HOUR, null, { openerId: "a", unseen: true, createdAt: NOW - 2 }),
    tab("nested", "loaded", HOUR, null, { openerId: "link", unseen: true, createdAt: NOW - 1 }),
    tab("b", "loaded", 2 * HOUR),
  );
  s.windows.w.activeTabIds = { p: "a" };
  assert.deepEqual(recentTabIds(s, "w", NOW), ["a", "link", "nested", "b"]);
});

const { useBrowser } = await import("../browser/store.ts");
const model = await import("../browser/model.ts");

const S = () => useBrowser.getState();

function windowWith(...urls) {
  S().hydrate({});
  useLifecycle.setState({ discarded: {} });
  S().updateSettings({ newTabPosition: "bottom" });
  const w = S().createWindow({ url: `https://${urls[0]}.com/` });
  const ids = [model.viewTabIds(S(), w)[0], ...urls.slice(1).map((u) => S().newTab(w, { url: `https://${u}.com/`, background: true }))];
  S().activate(ids[0]);
  const now = Date.now();
  ids.forEach((id, i) => S().updateTab(id, { lastActiveAt: now - i * HOUR, unseen: false }));
  return [w, now, ...ids];
}

const sleep = (...ids) => useLifecycle.setState({ discarded: Object.fromEntries(ids.map((id) => [id, true])) });

test("the tab switcher lists sleeping tabs by default, as Dia does", () => {
  const [w, now, a, b, c, d] = windowWith("a", "b", "c", "d");
  sleep(c);
  assert.deepEqual(recentTabIds(S(), w, now), [a, b, c, d]);
});

test("with sleeping tabs hidden, the tab switcher skips them and keeps the tab you're on", () => {
  const [w, now, a, b, c, d] = windowWith("a", "b", "c", "d");
  S().updateSettings({ sleepingTabsInSwitcher: false });
  sleep(a, c);
  assert.deepEqual(recentTabIds(S(), w, now), [a, b, d]);
  assert.deepEqual(sessionTabIds(S(), w, now - 24 * HOUR), [a, b, d]);
});

test("with sleeping tabs hidden, the two most recent awake tabs show even when older than the switcher's window", () => {
  const [w, now, a, b, c] = windowWith("a", "b", "c");
  S().updateSettings({ sleepingTabsInSwitcher: false });
  S().updateTab(c, { lastActiveAt: now - 20 * HOUR });
  sleep(b);
  S().updateTab(c, { createdAt: now - 24 * HOUR });
  assert.deepEqual(recentTabIds(S(), w, now), [a, c]);
  assert.deepEqual(sessionTabIds(S(), w, now - HOUR), [a, c]);
});

test("with sleeping tabs hidden, the tab switcher skips a tab whose page isn't loaded", () => {
  const [w, now, a, b, c] = windowWith("a", "b", "c");
  S().updateSettings({ sleepingTabsInSwitcher: false });
  S().updateTab(b, { page: { kind: "idle" } });
  assert.deepEqual(recentTabIds(S(), w, now), [a, c]);
});


test("empty replacement tabs never enter MRU, including when sleeping tabs are shown", () => {
  const [w, now, a] = windowWith("a");
  const blank = S().newTab(w);
  assert.deepEqual(recentTabIds(S(), w, now), [a]);
  S().activate(a);
  S().updateSettings({ sleepingTabsInSwitcher: false });
  assert.deepEqual(recentTabIds(S(), w), [a]);
  assert.deepEqual(sessionTabIds(S(), w, now - HOUR), [a]);
  assert.ok(S().tabs[blank], "the command-bar shell is retained outside MRU");
});

test("visited Chrome settings pages stay eligible for MRU with sleeping tabs hidden", () => {
  const [w, now, a] = windowWith("a");
  const chrome = S().newTab(w, { url: "chrome://extensions/shortcuts" });
  S().updateSettings({ sleepingTabsInSwitcher: false });
  S().activate(a);
  assert.ok(recentTabIds(S(), w).includes(chrome));
  assert.ok(sessionTabIds(S(), w, now - HOUR).includes(chrome));
});
