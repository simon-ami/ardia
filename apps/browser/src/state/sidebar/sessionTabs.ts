import type { BrowserState } from "../browser/store";
import { recentTabIds } from "../pins/tabCleanup";

export function sessionTabIds(s: BrowserState, windowId: string, sessionStart: number): string[] {
  const recent = recentTabIds(s, windowId, Date.now(), Infinity);
  const active = s.windows[windowId] ? s.windows[windowId]!.activeTabIds[s.windows[windowId]!.profileId] : undefined;
  const fromSession = recent.filter((id) => id === active || s.tabs[id]!.lastActiveAt >= sessionStart || s.tabs[id]!.createdAt >= sessionStart);
  return fromSession.length >= 2 ? fromSession : recentTabIds(s, windowId);
}
