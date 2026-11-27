import type { BrowserState } from "../browser/store";
import { viewTabIds } from "../browser/model";
import { hasPage } from "./pageSession";
import { sleepsNow } from "./openers";

export function lastAwakeTab(
  s: BrowserState,
  windowId: string,
  profileId: string,
  excluded: ReadonlySet<string>,
  openerId?: string | null,
  closedId?: string,
  includeSleeping = false,
): string | undefined {
  let best: string | undefined;
  let unseen: string | undefined;
  const view = viewTabIds(s, windowId, profileId);
  const at = closedId ? view.indexOf(closedId) : -1;
  const order = at >= 0 ? [...view.slice(at + 1), ...view.slice(0, at).reverse()] : view;
  for (const id of order) {
    const tab = s.tabs[id]!;
    if (excluded.has(id) || !tab.url || tab.url === "about:blank" || !hasPage(tab) || (!includeSleeping && sleepsNow(s, id))) continue;
    if (tab.unseen) {
      if (!unseen || tab.createdAt > s.tabs[unseen]!.createdAt) unseen = id;
    } else if (
      !best ||
      tab.lastActiveAt > s.tabs[best]!.lastActiveAt ||
      (tab.lastActiveAt === s.tabs[best]!.lastActiveAt && id === openerId && best !== openerId)
    ) best = id;
  }
  return best ?? unseen;
}
