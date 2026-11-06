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
