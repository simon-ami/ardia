import assert from "node:assert/strict";
import { test } from "node:test";
import { useBrowser } from "../browser/store.ts";
import { leaveDiscardedTabs } from "./discardActions.ts";
import { useLifecycle } from "./sleepingTabs.ts";

const S = () => useBrowser.getState();
const active = (w) => S().windows[w].activeTabIds[S().windows[w].profileId];

test("discarding the active tab picks the most recent awake tab in the same space", () => {
  S().hydrate({});
  useLifecycle.setState({ discarded: {} });
  const w = S().createWindow({ url: "https://first.example" });
  const first = active(w);
  const recent = S().newTab(w, { url: "https://recent.example" });
  const asleep = S().newTab(w, { url: "https://asleep.example" });
  const target = S().newTab(w, { url: "https://target.example" });
  S().updateTab(first, { lastActiveAt: 10 });
  S().updateTab(recent, { lastActiveAt: 20 });
  S().updateTab(asleep, { lastActiveAt: 30 });
  useLifecycle.setState({ discarded: { [asleep]: true, [target]: true } });
  const otherProfile = S().createProfile({ name: "Other", shareWith: "default" });
  const other = S().newTab(w, { url: "https://other.example", profileId: otherProfile, background: true });
  S().updateTab(other, { lastActiveAt: 100 });
  leaveDiscardedTabs([target]);
  assert.equal(active(w), recent);
  assert.equal(S().windows[w].profileId, "default");
  assert.ok(S().tabs[target], "discarding keeps the tab");
});

test("unloading every selected tab opens a new tab and never selects a target again", () => {
  S().hydrate({});
  useLifecycle.setState({ discarded: {} });
  const w = S().createWindow({ url: "https://a.example" });
  const a = active(w);
  const b = S().newTab(w, { url: "https://b.example" });
  leaveDiscardedTabs([a, b]);
  assert.ok(![a, b].includes(active(w)));
  assert.equal(S().tabs[active(w)].url, "");
  assert.ok(S().tabs[a] && S().tabs[b]);
  const selected = active(w);
  leaveDiscardedTabs([a]);
  assert.equal(active(w), selected, "background discards leave selection alone");
});

for (const row of [false, true]) {
  test(`closing a ${row ? "pinned row" : "Top App"} follows awake MRU across pinned and regular tabs`, () => {
    S().hydrate({});
    useLifecycle.setState({ discarded: {} });
    const w = S().createWindow({ url: "https://regular.example" });
    const regular = active(w);
    const pin = S().newTab(w, { url: "https://other-pin.example" });
    S().pinTabs([pin], true, row);
    const target = S().newTab(w, { url: "https://target-pin.example" });
    S().pinTabs([target], true, row);
    S().updateTab(regular, { lastActiveAt: 10 });
    S().updateTab(pin, { lastActiveAt: 20 });
    S().closeTab(target);
    assert.equal(active(w), pin, "a more recent pin beats the regular section");
    assert.equal(S().tabs[target].page.kind, "asleep");
    S().activate(target);
    S().updateTab(regular, { lastActiveAt: 30 });
    S().updateTab(pin, { lastActiveAt: 20 });
    S().closeTab(target);
    assert.equal(active(w), regular, "a more recent regular tab beats the pinned section");
    S().activate(target);
    useLifecycle.setState({ discarded: { [regular]: true } });
    S().closeTab(target);
    assert.equal(active(w), pin, "a sleeping regular tab is skipped");
  });
}

for (const row of [false, true]) {
  test(`closing a regular tab can return to a more recent ${row ? "pinned row" : "Top App"}`, () => {
    S().hydrate({});
    useLifecycle.setState({ discarded: {} });
    const w = S().createWindow({ url: "https://pin.example" });
    const pin = active(w);
    S().pinTabs([pin], true, row);
    const target = S().newTab(w, { url: "https://target.example" });
    const neighbour = S().newTab(w, { url: "https://neighbour.example", background: true });
    S().activate(target);
    S().updateTab(pin, { lastActiveAt: 20 });
    S().updateTab(neighbour, { lastActiveAt: 10 });
    S().closeTab(target);
    assert.equal(active(w), pin);
    assert.ok(!S().tabs[target]);
    assert.ok(S().tabs[pin].lastActiveAt > 20, "the close-selected tab becomes most recent");
  });
}
