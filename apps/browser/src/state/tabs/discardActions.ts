import { useBrowser } from "../browser/store";
import { activeTabId, viewTabIds } from "../browser/model";
import { webviews } from "../../platform/webviews";
import { isSleeping } from "./sleepingTabs";
import { isPageUnloaded } from "../pins/pinShare";
import { hasPage } from "./pageSession";
import { showToast } from "../app/toasts";

export function leaveDiscardedTabs(ids: readonly string[]) {
  const s = useBrowser.getState();
  const excluded = new Set(ids);
  for (const w of Object.values(s.windows)) {
    const active = activeTabId(s, w.id);
    if (!active || !excluded.has(active)) continue;
    const candidates = viewTabIds(s, w.id).filter((id) => !excluded.has(id) && hasPage(s.tabs[id]!) && !isSleeping(id) && !isPageUnloaded(s, id));
    candidates.sort((a, b) => s.tabs[b]!.lastActiveAt - s.tabs[a]!.lastActiveAt);
    if (candidates[0]) useBrowser.getState().activate(candidates[0]);
    else useBrowser.getState().newTab(w.id);
  }
}

export async function discardTabs(ids: readonly string[]) {
  const targets = [...new Set(ids)].filter((id) => webviews.has(id) && !isSleeping(id));
  if (!targets.length) return;
  leaveDiscardedTabs(targets);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const refused: string[] = [];
  for (const id of targets) {
    const s = useBrowser.getState();
    const tab = s.tabs[id];
    if (!tab) continue;
    if (activeTabId(s, tab.windowId) === id) {
      refused.push(id);
      continue;
    }
    const view = webviews.get(id);
    if (!view) continue;
    const result = await view.discard();
    if (result !== "discarded" && result !== "already") refused.push(id);
  }
  if (refused.length) {
    const tab = refused.map((id) => useBrowser.getState().tabs[id]).find(Boolean);
    if (tab) showToast(tab.windowId, `Could not unload ${refused.length === 1 ? "tab" : `${refused.length} tabs`}`);
  }
}
