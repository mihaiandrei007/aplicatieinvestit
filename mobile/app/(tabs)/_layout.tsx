import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '../../src/theme';

/** Emoji-uri simple ca iconițe, ca să evităm dependențe suplimentare. */
function icon(emoji: string) {
  return ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
      }}
    >
      <Tabs.Screen name="portfolio" options={{ title: 'Portofoliu', tabBarIcon: icon('💼') }} />
      <Tabs.Screen name="market" options={{ title: 'Piață', tabBarIcon: icon('📈') }} />
      <Tabs.Screen name="groups" options={{ title: 'Grupuri', tabBarIcon: icon('👥') }} />
      <Tabs.Screen name="academy" options={{ title: 'Academie', tabBarIcon: icon('🎓') }} />
    </Tabs>
  );
}
