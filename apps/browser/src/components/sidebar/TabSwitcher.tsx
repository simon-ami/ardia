import { Panel, Text } from "../ui";
import { memo, useEffect, useSyncExternalStore } from "react";
import { Dimensions, Image, Pressable, StyleSheet, View } from "react-native";
import { lastPicture, onPicturesChanged } from "../../state/tabs/tabPictures";
import { useTheme } from "../ui/theme";
import { useTab } from "../../state/browser/hooks";
import { TabIcon } from "./TabIcon";
import { tabTitle } from "../../state/browser/model";
import { useSidebarUi } from "../../state/sidebar/sidebarUi";
import { commitSwitcher, hoverSwitcherRow, leaveSwitcherRow, subscribeSwitcherTabChanges } from "../../state/sidebar/switcher";
import { TAB_SWITCHER as T, SIDEBAR_SHADOW } from "./tokens";

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
  const switcher = pendingSwitcher?.visible ? pendingSwitcher : null;
  useEffect(() => {
    if (!pendingSwitcher) return;
    return subscribeSwitcherTabChanges(windowId);
  }, [pendingSwitcher?.windowId, windowId]);
  if (!switcher) return null;
  const aspect = screen.height / screen.width;
  const roomWidth = Math.max(1, windowWidth - 2 * T.windowMargin - 2 * panelSide);
  const availableWidth = Math.min(roomWidth - 2 * cardInset, roomWidth / T.columnScale);
  const availableHeight = Math.max(1, windowHeight - 2 * T.windowMargin - panelTop - cardTopOffset - panelBottom - labelGap - labelHeight - 2 * cardInset);
  const pictureWidth = Math.max(1, Math.min(Math.ceil(screen.width * T.screenFraction / T.referenceColumns), availableWidth, Math.floor(availableHeight / aspect)));
  const pictureHeight = Math.max(1, Math.round(pictureWidth * aspect));
  const targetColumnWidth = Math.max(pictureWidth + 2 * cardInset, pictureWidth * T.columnScale);
  const fits = Math.max(1, Math.floor(roomWidth / targetColumnWidth));
  const count = Math.min(fits, switcher.ids.length);
  const start = Math.max(0, Math.min(switcher.index - Math.floor(count / 2), switcher.ids.length - count));
  const ids = switcher.ids.slice(start, start + count);
  const width = Math.max(2 * panelSide + count * (pictureWidth + 2 * cardInset), count * targetColumnWidth);
  const columnWidth = (width - 2 * panelSide) / count;
  const height = panelTop + cardTopOffset + pictureHeight + labelGap + labelHeight + 2 * cardInset + panelBottom;
  return (
    <View
      style={{
        position: "absolute",
        left: (windowWidth - width) / 2,
        top: (windowHeight - height) / 2,
        width,
        height,
      }}
    >
      <Panel
        fill={theme.dark ? T.fill.dark : T.fill.light}
        radius={T.panelRadius}
        border={theme.panelBorder}
        shadow={SIDEBAR_SHADOW.tabSwitcher}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: "row", paddingHorizontal: panelSide, paddingTop: panelTop + cardTopOffset, paddingBottom: panelBottom }}>
        {ids.map((id, i) => (
          <SwitcherCard key={id} tabId={id} index={start + i} focused={start + i === switcher.index} accent={theme.accent} pictureWidth={pictureWidth} pictureHeight={pictureHeight} columnWidth={columnWidth} />
        ))}
      </View>
    </View>
  );
}

const SwitcherCard = memo(function SwitcherCard({ tabId, index, focused, accent, pictureWidth, pictureHeight, columnWidth }: { tabId: string; index: number; focused: boolean; accent: string; pictureWidth: number; pictureHeight: number; columnWidth: number }) {
  const theme = useTheme();
  const tab = useTab(tabId);
  const picture = useSyncExternalStore(onPicturesChanged, () => lastPicture(tabId));
  useEffect(() => () => leaveSwitcherRow(index), [index]);
  if (!tab) return null;
  const url = tab.url || tab.pinnedUrl || "";
  return (
    <Pressable onPressIn={() => commitSwitcher(index)} style={{ width: columnWidth, alignItems: "center" }}>
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
            backgroundColor: picture ? undefined : url ? T.pageFill : T.blankFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {picture ? (
            <Image source={{ uri: `data:image/jpeg;base64,${picture.data}` }} resizeMode="cover" style={StyleSheet.absoluteFill} />
          ) : (
            <TabIcon tabId={tab.id} url={url} favicon={tab.favicon} icon={tab.customIcon} profileId={tab.profileId} size={30} color={url ? T.onPage : T.onPanel} />
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
