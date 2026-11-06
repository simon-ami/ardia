import { Panel, Symbol, Text, curve, space } from "../ui";
import { memo, useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { useTabPicture } from "../../state/tabs/tabPictures";
import { useTheme } from "../ui/theme";
import { useTab } from "../../state/browser/hooks";
import { TabIcon } from "./TabIcon";
import { tabTitle } from "../../state/browser/model";
import { useSidebarUi } from "../../state/sidebar/sidebarUi";
import { commitSwitcher, hoverSwitcherRow, leaveSwitcherRow } from "../../state/sidebar/switcher";
import { SWITCHER, SWITCHER_COLORS, SIDEBAR_SHADOW } from "./tokens";

const { card: CARD, shot: SHOT, gap: GAP, pad: PAD, label: LABEL } = SWITCHER;

export function TabSwitcher({ windowId, windowWidth, windowHeight }: { windowId: string; windowWidth: number; windowHeight: number }) {
  const theme = useTheme();
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
  const fits = Math.max(1, Math.floor((windowWidth - 80 - 2 * PAD + GAP) / (CARD + GAP)));
  const count = Math.min(fits, switcher.ids.length);
  const start = Math.max(0, Math.min(switcher.index - Math.floor(count / 2), switcher.ids.length - count));
  const ids = switcher.ids.slice(start, start + count);
  const width = 2 * PAD + count * CARD + (count - 1) * GAP;
  const height = 2 * PAD + SHOT + LABEL + 8;
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
      <View style={{ flexDirection: "row", gap: GAP, padding: PAD }}>
        {ids.map((id, i) => (
          <SwitcherCard key={id} tabId={id} index={start + i} focused={start + i === switcher.index} accent={theme.accent} />
        ))}
      </View>
    </Animated.View>
  );
}

const SwitcherCard = memo(function SwitcherCard({ tabId, index, focused, accent }: { tabId: string; index: number; focused: boolean; accent: string }) {
  const tab = useTab(tabId);
  const picture = useTabPicture(tabId);
  useEffect(() => () => leaveSwitcherRow(index), [index]);
  if (!tab) return null;
  const url = tab.url || tab.pinnedUrl || "";
  return (
    <Pressable onPressIn={() => commitSwitcher(index)}>
      <View
        onMouseEnter={() => hoverSwitcherRow(index)}
        onMouseLeave={() => leaveSwitcherRow(index)}
        style={{ width: CARD, padding: space.xs, borderRadius: SWITCHER.cardRadius, backgroundColor: focused ? SWITCHER_COLORS.focus : undefined }}
      >
        <View
          style={{
            width: CARD - 8,
            height: SHOT,
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
          {focused ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: SWITCHER.shotRadius, borderWidth: 2, borderColor: accent }]} />
          ) : null}
        </View>
        <View style={{ height: LABEL, flexDirection: "row", alignItems: "center", gap: space.s, paddingHorizontal: space.xxs }}>
          {url || tab.customIcon ? (
            <TabIcon tabId={tab.id} url={url} favicon={tab.favicon} icon={tab.customIcon} profileId={tab.profileId} size={13} color={SWITCHER_COLORS.onPanel} />
          ) : (
            <Symbol name="globe" size={12} color={SWITCHER_COLORS.onPanel} style={{ width: 13, height: 13 }} />
          )}
          <Text lines={1} size="small" weight="semibold" color={SWITCHER_COLORS.page} style={{ flex: 1 }}>
            {tabTitle(tab)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
