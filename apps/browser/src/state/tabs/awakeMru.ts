import type { BrowserState } from "../browser/store";
import { viewTabIds } from "../browser/model";
import { hasPage } from "./pageSession";
import { isSleeping } from "./sleepingTabs";

export function lastAwakeTab(s: BrowserState, windowId: string, profileId: string, excluded: ReadonlySet<string>): string | undefined {
  let best: string | undefined;
  for (const id of viewTabIds(s, windowId, profileId)) {
    const tab = s.tabs[id]!;
    if (excluded.has(id) || !tab.url || tab.url === "about:blank" || !hasPage(tab) || isSleeping(id)) continue;
    if (!best || tab.lastActiveAt > s.tabs[best]!.lastActiveAt) best = id;
  }
  return best;
}
