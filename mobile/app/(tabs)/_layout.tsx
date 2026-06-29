import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { withLayoutContext } from 'expo-router';
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';
import { IconPortfolio, IconMarket, IconNews, IconGroups, IconTrophy } from '../../src/components/icons';

const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext(Navigator);

type Name = 'portfolio' | 'market' | 'news' | 'groups' | 'provocari';

const ICON: Record<string, (color: string) => React.ReactNode> = {
  portfolio: (c) => <IconPortfolio color={c} />,
  market: (c) => <IconMarket color={c} />,
  news: (c) => <IconNews color={c} />,
  groups: (c) => <IconGroups color={c} />,
  provocari: (c) => <IconTrophy color={c} />,
};
const LABEL: Record<string, string> = {
  portfolio: 'Portfolio',
  market: 'Market',
  news: 'News',
  groups: 'Groups',
  provocari: 'Challenges',
};

/** Custom bottom bar (matches the previous tab bar) for the swipeable pager. */
function BottomBar({ state, navigation }: MaterialTopTabBarProps) {
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.bg,
        borderTopWidth: 1,
        borderTopColor: c.hair,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? c.lime : c.faint;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 6, paddingTop: 2 }}>
            {(ICON[route.name] ?? ICON.portfolio)!(color)}
            <Text style={{ color, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' }}>
              {LABEL[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <SwipeTabs
      tabBarPosition="bottom"
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{ swipeEnabled: true, lazy: true }}
    >
      <SwipeTabs.Screen name="portfolio" />
      <SwipeTabs.Screen name="market" />
      <SwipeTabs.Screen name="news" />
      <SwipeTabs.Screen name="groups" />
      <SwipeTabs.Screen name="provocari" />
    </SwipeTabs>
  );
}
