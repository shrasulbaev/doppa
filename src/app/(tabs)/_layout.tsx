import { Tabs } from 'expo-router/tabs';
import { Text } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { BookIcon, ChatIcon, PathIcon } from '@/components/icons';
import { colors, fonts } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.black, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.card, borderTopWidth: 2, borderTopColor: colors.line, height: 64 },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Уроки', tabBarIcon: ({ color }) => <PathIcon color={String(color)} /> }} />
      <Tabs.Screen
        name="alphabet"
        options={{
          title: 'Письмо',
          tabBarIcon: ({ color }) => <Text style={{ color, fontFamily: fonts.arabic, fontSize: 20, lineHeight: 28 }}>ئە</Text>,
        }}
      />
      <Tabs.Screen name="history" options={{ title: 'История', tabBarIcon: ({ color }) => <BookIcon color={String(color)} /> }} />
      <Tabs.Screen name="phrasebook" options={{ title: 'Разговорник', tabBarIcon: ({ color }) => <ChatIcon color={String(color)} /> }} />
    </Tabs>
  );
}
