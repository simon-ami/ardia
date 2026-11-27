import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { displayHost, displayUrl, hostOf } from "@ardia/core";
import { tabTitle } from "../../state/browser/model";
import { useTab, useTabLive } from "../../state/browser/hooks";
import { useSidebarUi } from "../../state/sidebar/sidebarUi";
import { lastPicture, onPicturesChanged } from "../../state/tabs/tabPictures";
import { commitSwitcher, hoverSwitcherRow, leaveSwitcherRow, subscribeSwitcherTabChanges } from "../../state/sidebar/switcher";
import { noteTabSwitcherOverflowClick, noteTabSwitcherOverflowOpened, noteTabSwitcherPictureLate, noteTabSwitcherWheelScrolled } from "../../state/telemetry/tabSwitcherOpens";
import { continuousCorners, Symbol, Text, Panel } from "../ui";
import { useTheme } from "../ui/theme";
import { TabIcon } from "./TabIcon";
import { previewBackdrop } from "./switcherPreview";
import { revealedOffset } from "./switcherScroll";
import { SIDEBAR_SHADOW, TAB_SWITCHER as T, TAB_SWITCHER_LIST_ID, TAB_SWITCHER_SCROLL_ID, tabSwitcherColors } from "./tokens";

const OWN_SCROLL_MS = 120;
const OWN_ANIMATED_SCROLL_MS = 450;

const { cardPadding, cardBorder, panelSide, panelTop, panelBottom, cardTopOffset, labelGap, labelHeight } = T;
const cardInset = cardPadding + cardBorder;
const subscribeScreen = (listener: () => void) => {
  const subscription = Dimensions.addEventListener("change", listener);
  return () => subscription.remove();
};
const screenSnapshot = () => Dimensions.get("screen");

export function TabSwitcher({ windowId, windowWidth, windowHeight }: { windowId: string; windowWidth: number; windowHeight: number }) {
  const theme = useTheme();
  const screen = useSyncExternalStore(subscribeScreen, screenSnapshot);
  const pendingSwitcher = useSidebarUi((u) => (u.switcher?.windowId === windowId ? u.switcher : null));
  const switcher = pendingSwitcher?.mounted ? pendingSwitcher : null;

  useEffect(() => {
    if (!pendingSwitcher) return;
    return subscribeSwitcherTabChanges(windowId);
  }, [pendingSwitcher?.windowId, windowId]);

  if (!switcher || switcher.view === "none") return null;
  if (switcher.view === "compactList") {
    const fits = Math.max(1, Math.floor((windowHeight - T.list.windowMargin - 2 * T.list.pad) / T.list.row));
    const count = Math.min(fits, T.list.maxRows, switcher.ids.length);
    const viewport = count * T.list.row;
    const width = Math.min(T.list.width, windowWidth - T.list.windowMargin);
    const height = 2 * T.list.pad + viewport;
    return (
      <View
        pointerEvents={switcher.visible ? "auto" : "none"}
        style={{
          position: "absolute",
          left: (windowWidth - width) / 2,
          top: (windowHeight - height) / 2,
          width,
          height,
          opacity: switcher.visible ? 1 : 0,
        }}
      >
        <Panel
          fill={tabSwitcherColors(theme.dark).fill}
          radius={T.panelRadius}
          border={theme.panelBorder}
          shadow={SIDEBAR_SHADOW.tabSwitcher}
          style={StyleSheet.absoluteFill}
        />
        <SwitcherList ids={switcher.ids} index={switcher.index} viewport={viewport} width={width - 2 * T.list.pad} overflows={count < switcher.ids.length} visible={switcher.visible} />
      </View>
    );
  }

  const aspect = screen.height / screen.width;
  const roomWidth = Math.max(1, windowWidth - 2 * T.windowMargin - 2 * panelSide);
  const availableWidth = Math.min(roomWidth - 2 * cardInset, roomWidth / T.columnScale);
  const availableHeight = Math.max(1, windowHeight - 2 * T.windowMargin - panelTop - cardTopOffset - panelBottom - labelGap - labelHeight - 2 * cardInset);
  const pictureWidth = Math.max(1, Math.min(Math.ceil((screen.width * T.screenFraction) / T.referenceColumns), availableWidth, Math.floor(availableHeight / aspect)));
  const pictureHeight = Math.max(1, Math.round(pictureWidth * aspect));
  const targetColumnWidth = Math.max(pictureWidth + 2 * cardInset, pictureWidth * T.columnScale);
  const fits = Math.max(1, Math.floor(roomWidth / targetColumnWidth));
  const count = Math.min(fits, switcher.ids.length);
  const width = Math.max(2 * panelSide + count * (pictureWidth + 2 * cardInset), count * targetColumnWidth);
  const columnWidth = (width - 2 * panelSide) / count;
  const rowHeight = pictureHeight + labelGap + labelHeight + 2 * cardInset;
  const height = panelTop + cardTopOffset + rowHeight + panelBottom;

  return (
    <View
      pointerEvents={switcher.visible ? "auto" : "none"}
      style={{
        position: "absolute",
        left: (windowWidth - width) / 2,
        top: (windowHeight - height) / 2,
        width,
        height,
        opacity: switcher.visible ? 1 : 0,
      }}
    >
      <Panel
        fill={theme.dark ? T.fill.dark : T.fill.light}
        radius={T.panelRadius}
        border={theme.panelBorder}
        shadow={SIDEBAR_SHADOW.tabSwitcher}
        style={StyleSheet.absoluteFill}
      />
      <SwitcherRow ids={switcher.ids} index={switcher.index} viewport={count * columnWidth} overflows={count < switcher.ids.length} accent={theme.accent} pictureWidth={pictureWidth} pictureHeight={pictureHeight} columnWidth={columnWidth} rowHeight={rowHeight} visible={switcher.visible} />
    </View>
  );
}

function useRevealedScroll(index: number, viewport: number, size: number, stride: number, horizontal: boolean, visible: boolean) {
  const scroll = useRef<ScrollView>(null);
  const [opening] = useState(() => {
    const at = revealedOffset(index, 0, viewport, size, stride);
    return horizontal ? { x: at, y: 0 } : { x: 0, y: at };
  });
  const offset = useRef(horizontal ? opening.x : opening.y);
  const placed = useRef(false);
  const shownIndex = useRef(index);
  const ownScrollUntil = useRef(0);
  const wheeled = useRef(false);

  const scrollTo = (at: number, animated: boolean) => {
    offset.current = at;
    ownScrollUntil.current = performance.now() + (animated ? OWN_ANIMATED_SCROLL_MS : OWN_SCROLL_MS);
    scroll.current?.scrollTo(horizontal ? { x: at, animated } : { y: at, animated });
  };

  useEffect(() => {
    const moved = shownIndex.current !== index;
    shownIndex.current = index;
    if (!placed.current) return;
    const next = revealedOffset(index, offset.current, viewport, size, stride);
    if (Math.abs(next - offset.current) >= 0.5) scrollTo(next, moved);
  }, [index, viewport, size, stride]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = horizontal ? e.nativeEvent.contentOffset.x : e.nativeEvent.contentOffset.y;
    if (!visible || wheeled.current || performance.now() < ownScrollUntil.current) return;
    wheeled.current = true;
    noteTabSwitcherWheelScrolled();
  };

  const onContentSizeChange = () => {
    if (placed.current) return void (ownScrollUntil.current = performance.now() + OWN_SCROLL_MS);
    placed.current = true;
    scrollTo(revealedOffset(shownIndex.current, offset.current, viewport, size, stride), false);
  };

  return { scroll, opening, onScroll, onContentSizeChange };
}

function useOverflowNoted(visible: boolean, overflows: boolean) {
  const noted = useRef(false);
  useEffect(() => {
    if (!visible || !overflows || noted.current) return;
    noted.current = true;
    noteTabSwitcherOverflowOpened();
  }, [visible, overflows]);
}

function SwitcherRow({ ids, index, viewport, overflows, accent, pictureWidth, pictureHeight, columnWidth, rowHeight, visible }: { ids: string[]; index: number; viewport: number; overflows: boolean; accent: string; pictureWidth: number; pictureHeight: number; columnWidth: number; rowHeight: number; visible: boolean }) {
  const { scroll, opening, onScroll, onContentSizeChange } = useRevealedScroll(index, viewport, columnWidth, columnWidth, true, visible);
  useOverflowNoted(visible, overflows);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      testID={TAB_SWITCHER_SCROLL_ID}
      showsHorizontalScrollIndicator={false}
      scrollEnabled={overflows}
      scrollEventThrottle={16}
      contentOffset={opening}
      onContentSizeChange={onContentSizeChange}
      onScroll={onScroll}
      style={{ marginHorizontal: panelSide, marginTop: panelTop + cardTopOffset, width: viewport, height: rowHeight }}
    >
      {ids.map((id, i) => (
        <SwitcherCard key={id} tabId={id} index={i} focused={i === index} accent={accent} overflows={overflows} pictureWidth={pictureWidth} pictureHeight={pictureHeight} columnWidth={columnWidth} visible={visible} />
      ))}
    </ScrollView>
  );
}

const SwitcherCard = memo(function SwitcherCard({ tabId, index, focused, accent, pictureWidth, pictureHeight, columnWidth, overflows, visible }: { tabId: string; index: number; focused: boolean; accent: string; pictureWidth: number; pictureHeight: number; columnWidth: number; overflows: boolean; visible: boolean }) {
  const theme = useTheme();
  const tab = useTab(tabId);
  const themeColor = useTabLive(tabId, (live) => live.themeColor);
  const picture = useSyncExternalStore(onPicturesChanged, () => lastPicture(tabId));
  const pictureData = picture?.data;
  const source = useMemo(() => (pictureData ? { uri: `data:image/jpeg;base64,${pictureData}` } : null), [pictureData]);
  const [decoded, setDecoded] = useState<object | null>(null);
  const lateNoted = useRef(false);
  const late = visible && !!source && decoded !== source;
  useEffect(() => {
    if (!late || lateNoted.current) return;
    lateNoted.current = true;
    noteTabSwitcherPictureLate();
  }, [late]);
  useEffect(() => () => leaveSwitcherRow(index), [index]);
  if (!tab) return null;
  const url = tab.url || tab.pinnedUrl || "";
  const backdrop = previewBackdrop(url ? themeColor : null, { blankFill: T.blankFill, onPage: T.onPage, onDark: T.onPanel });
  const shown = !!source && decoded === source;

  return (
    <Pressable onPressIn={() => {
      if (overflows) noteTabSwitcherOverflowClick();
      commitSwitcher(index);
    }} style={{ width: columnWidth, alignItems: "center" }}>
      <View
        onMouseEnter={() => hoverSwitcherRow(index)}
        onMouseLeave={() => leaveSwitcherRow(index)}
        style={{ width: pictureWidth + 2 * cardInset, padding: cardPadding, borderWidth: cardBorder, borderColor: focused ? accent : T.restRing, borderRadius: T.cardRadius, backgroundColor: focused ? T.focusFill : undefined }}
      >
        <View
          style={{
            width: pictureWidth,
            height: pictureHeight,
            borderRadius: T.shotRadius,
            overflow: "hidden",
            backgroundColor: backdrop.fill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!shown && <TabIcon tabId={tab.id} url={url} favicon={tab.favicon} icon={tab.customIcon} profileId={tab.profileId} size={30} color={backdrop.icon} />}
          {source && (
            <Image
              source={source}
              resizeMode="cover"
              onLoad={() => setDecoded(source)}
              style={[StyleSheet.absoluteFill, { opacity: shown ? 1 : 0 }]}
            />
          )}
        </View>
        {url || tab.customIcon ? (
          <View pointerEvents="none" style={{ position: "absolute", top: cardPadding + pictureHeight + T.badgeBottom - T.badgeSize, right: cardPadding + T.badgeRight, width: T.badgeSize, height: T.badgeSize, padding: T.badgePadding, borderWidth: T.badgeBorder, borderColor: theme.divider, borderRadius: T.badgeRadius, backgroundColor: theme.panel, alignItems: "center", justifyContent: "center" }}>
            <TabIcon tabId={tab.id} url={url} favicon={tab.favicon} icon={tab.customIcon} profileId={tab.profileId} size={T.badgeSize - 2 * (T.badgePadding + T.badgeBorder)} />
          </View>
        ) : null}
        <Text lines={1} size="body" weight="regular" color={T.pageFill} style={{ width: pictureWidth, marginTop: labelGap, height: labelHeight, lineHeight: labelHeight, textAlign: "center" }}>
          {tabTitle(tab)}
        </Text>
      </View>
    </Pressable>
  );
});

function SwitcherList({ ids, index, viewport, width, overflows, visible }: { ids: string[]; index: number; viewport: number; width: number; overflows: boolean; visible: boolean }) {
  const { scroll, opening, onScroll, onContentSizeChange } = useRevealedScroll(index, viewport, T.list.row, T.list.row, false, visible);
  useOverflowNoted(visible, overflows);
  return (
    <ScrollView
      ref={scroll}
      testID={TAB_SWITCHER_LIST_ID}
      showsVerticalScrollIndicator={false}
      scrollEnabled={overflows}
      scrollEventThrottle={16}
      contentOffset={opening}
      onContentSizeChange={onContentSizeChange}
      onScroll={onScroll}
      style={{ margin: T.list.pad, width, height: viewport }}
    >
      {ids.map((id, i) => (
        <SwitcherListRow key={id} tabId={id} index={i} focused={i === index} overflows={overflows} />
      ))}
    </ScrollView>
  );
}

const SwitcherListRow = memo(function SwitcherListRow({ tabId, index, focused, overflows }: { tabId: string; index: number; focused: boolean; overflows: boolean }) {
  const tab = useTab(tabId);
  const colors = tabSwitcherColors(useTheme().dark);
  useEffect(() => () => leaveSwitcherRow(index), [index]);
  if (!tab) return null;
  const url = tab.url || tab.pinnedUrl || "";
  const site = url ? displayHost(hostOf(url)) || displayUrl(url) : "";
  return (
    <Pressable
      onPressIn={() => {
        if (overflows) noteTabSwitcherOverflowClick();
        commitSwitcher(index);
      }}
    >
      <View
        onMouseEnter={() => hoverSwitcherRow(index)}
        onMouseLeave={() => leaveSwitcherRow(index)}
        style={{
          height: T.list.row,
          flexDirection: "row",
          alignItems: "center",
          gap: T.list.gap,
          paddingHorizontal: T.list.inset,
          ...continuousCorners(T.list.cardRadius),
          backgroundColor: focused ? colors.focusFill : undefined,
        }}
      >
        {url || tab.customIcon ? (
          <TabIcon tabId={tab.id} url={url} favicon={tab.favicon} icon={tab.customIcon} profileId={tab.profileId} size={T.list.icon} color={colors.onPanel} />
        ) : (
          <Symbol name="globe" size={T.list.iconGlobe} color={colors.onPanel} style={{ width: T.list.icon, height: T.list.icon }} />
        )}
        <View style={{ flex: 1, gap: T.list.lineGap }}>
          <Text lines={1} weight={focused ? "semibold" : "medium"} color={colors.title} style={{ fontSize: T.list.titleSize }}>
            {tabTitle(tab)}
          </Text>
          {site ? (
            <Text lines={1} size="caption" color={colors.onPanel}>
              {site}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
