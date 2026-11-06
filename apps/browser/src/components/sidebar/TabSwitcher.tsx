import { Panel, Text, curve } from "../ui";
import { memo, useEffect, useRef, useSyncExternalStore } from "react";
import { Animated, Dimensions, Image, Pressable, StyleSheet, View } from "react-native";
import { useTabPicture } from "../../state/tabs/tabPictures";
import { useTheme } from "../ui/theme";
import { useTab } from "../../state/browser/hooks";
import { TabIcon } from "./TabIcon";
import { tabTitle } from "../../state/browser/model";
import { useSidebarUi } from "../../state/sidebar/sidebarUi";
import { commitSwitcher, hoverSwitcherRow, leaveSwitcherRow } from "../../state/sidebar/switcher";
import { SWITCHER, SWITCHER_COLORS, SIDEBAR_SHADOW } from "./tokens";

const { cardPadding, cardBorder, panelSide, panelTop, panelBottom, cardTopOffset, labelGap, labelHeight } = SWITCHER;
const cardInset = cardPadding + cardBorder;
const subscribeScreen = (listener: () => void) => {
  const subscription = Dimensions.addEventListener("change", listener);
  return () => subscription.remove();
};
const screenSnapshot = () => Dimensions.get("screen");

export function TabSwitcher({ windowId, windowWidth, windowHeight }: { windowId: string; windowWidth: number; windowHeight: number }) {
  const theme = useTheme();
  const screen = useSyncExternalStore(subscribeScreen, screenSnapshot);
  const switcher = useSidebarUi((u) => (u.switcher?.windowId === windowId && u.switcher.visible ? u.switcher : null));
  const appear = useRef(new Animated.Value(0)).current;
  const shown = !!switcher;
  useEffect(() => {
    if (!shown) return appear.setValue(0);
    const animation = Animated.timing(appear, { toValue: 1, duration: SWITCHER.appearMs, easing: curve.enter, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [shown]);
  if (!switcher) return null;
  const aspect = screen.height / screen.width;
  const roomWidth = Math.max(1, windowWidth - 2 * SWITCHER.windowMargin - 2 * panelSide);
  const availableWidth = Math.min(roomWidth - 2 * cardInset, roomWidth / SWITCHER.columnScale);
  const availableHeight = Math.max(1, windowHeight - 2 * SWITCHER.windowMargin - panelTop - cardTopOffset - panelBottom - labelGap - labelHeight - 2 * cardInset);
  const pictureWidth = Math.max(1, Math.min(Math.ceil(screen.width * SWITCHER.screenFraction / SWITCHER.referenceColumns), availableWidth, Math.floor(availableHeight / aspect)));
  const pictureHeight = Math.max(1, Math.round(pictureWidth * aspect));
  const targetColumnWidth = Math.max(pictureWidth + 2 * cardInset, pictureWidth * SWITCHER.columnScale);
  const fits = Math.max(1, Math.floor(roomWidth / targetColumnWidth));
  const count = Math.min(fits, switcher.ids.length);
  const start = Math.max(0, Math.min(switcher.index - Math.floor(count / 2), switcher.ids.length - count));
  const ids = switcher.ids.slice(start, start + count);
  const width = Math.max(2 * panelSide + count * (pictureWidth + 2 * cardInset), count * targetColumnWidth);
  const columnWidth = (width - 2 * panelSide) / count;
  const height = panelTop + cardTopOffset + pictureHeight + labelGap + labelHeight + 2 * cardInset + panelBottom;
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: (windowWidth - width) / 2,
        top: (windowHeight - height) / 2,
        width,
        height,
        opacity: appear,
        transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
      }}
    >
      <Panel
        fill={theme.dark ? SWITCHER_COLORS.darkPanel : SWITCHER_COLORS.lightPanel}
        radius={SWITCHER.panelRadius}
        border={theme.panelBorder}
        shadow={SIDEBAR_SHADOW.previewSwitcher}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: "row", paddingHorizontal: panelSide, paddingTop: panelTop + cardTopOffset, paddingBottom: panelBottom }}>
        {ids.map((id, i) => (
          <SwitcherCard key={id} tabId={id} index={start + i} focused={start + i === switcher.index} accent={theme.accent} pictureWidth={pictureWidth} pictureHeight={pictureHeight} columnWidth={columnWidth} />
        ))}
      </View>
    </Animated.View>
  );
}

const SwitcherCard = memo(function SwitcherCard({ tabId, index, focused, accent, pictureWidth, pictureHeight, columnWidth }: { tabId: string; index: number; focused: boolean; accent: string; pictureWidth: number; pictureHeight: number; columnWidth: number }) {
  const theme = useTheme();
  const tab = useTab(tabId);
  const picture = useTabPicture(tabId);
  useEffect(() => () => leaveSwitcherRow(index), [index]);
  if (!tab) return null;
  const url = tab.url || tab.pinnedUrl || "";
  return (
    <Pressable onPressIn={() => commitSwitcher(index)} style={{ width: columnWidth, alignItems: "center" }}>
      <View
        onMouseEnter={() => hoverSwitcherRow(index)}
        onMouseLeave={() => leaveSwitcherRow(index)}
        style={{ width: pictureWidth + 2 * cardInset, padding: cardPadding, borderWidth: cardBorder, borderColor: focused ? accent : SWITCHER_COLORS.clear, borderRadius: SWITCHER.cardRadius, backgroundColor: focused ? SWITCHER_COLORS.focus : undefined }}
      >
        <View
          style={{
            width: pictureWidth,
            height: pictureHeight,
            borderRadius: SWITCHER.shotRadius,
            overflow: "hidden",
            backgroundColor: picture ? undefined : url ? SWITCHER_COLORS.page : SWITCHER_COLORS.empty,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {picture ? (
            <Image source={{ uri: `data:image/jpeg;base64,${picture.data}` }} resizeMode="cover" style={StyleSheet.absoluteFill} />
          ) : (
            <TabIcon tabId={tab.id} url={url} favicon={tab.favicon} icon={tab.customIcon} profileId={tab.profileId} size={30} color={url ? SWITCHER_COLORS.onPage : SWITCHER_COLORS.onPanel} />
          )}
        </View>
        {url || tab.customIcon ? (
          <View pointerEvents="none" style={{ position: "absolute", top: cardPadding + pictureHeight + SWITCHER.badgeBottom - SWITCHER.badgeSize, right: cardPadding + SWITCHER.badgeRight, width: SWITCHER.badgeSize, height: SWITCHER.badgeSize, padding: SWITCHER.badgePadding, borderWidth: SWITCHER.badgeBorder, borderColor: theme.divider, borderRadius: SWITCHER.badgeRadius, backgroundColor: theme.panel, alignItems: "center", justifyContent: "center" }}>
            <TabIcon tabId={tab.id} url={url} favicon={tab.favicon} icon={tab.customIcon} profileId={tab.profileId} size={SWITCHER.badgeSize - 2 * (SWITCHER.badgePadding + SWITCHER.badgeBorder)} />
          </View>
        ) : null}
        <Text lines={1} size="body" weight="regular" color={SWITCHER_COLORS.page} style={{ width: pictureWidth, marginTop: labelGap, height: labelHeight, lineHeight: labelHeight, textAlign: "center" }}>
          {tabTitle(tab)}
        </Text>
      </View>
    </Pressable>
  );
});
