import React from 'react';
import { Tabs } from 'expo-router';
import { theme } from '../../src/theme';
import { IconPortfolio, IconMarket, IconNews, IconGroups, IconTrophy } from '../../src/components/icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.lime,
        tabBarInactiveTintColor: theme.colors.faint,
        tabBarStyle: { backgroundColor: theme.colors.bg, borderTopColor: theme.colors.hair, height: 76, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="portfolio"
        options={{ title: 'Portfolio', tabBarIcon: ({ color }) => <IconPortfolio color={color} /> }}
      />
      <Tabs.Screen name="market" options={{ title: 'Market', tabBarIcon: ({ color }) => <IconMarket color={color} /> }} />
      <Tabs.Screen name="news" options={{ title: 'News', tabBarIcon: ({ color }) => <IconNews color={color} /> }} />
      <Tabs.Screen name="groups" options={{ title: 'Groups', tabBarIcon: ({ color }) => <IconGroups color={color} /> }} />
      <Tabs.Screen
        name="provocari"
        options={{ title: 'Challenges', tabBarIcon: ({ color }) => <IconTrophy color={color} /> }}
      />
    </Tabs>
  );
}
