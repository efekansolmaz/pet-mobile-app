import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { theme } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: theme.colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Pets',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'pawprint.fill', android: 'pets', web: 'pets' }} tintColor={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} tintColor={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} tintColor={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'sparkles', android: 'auto-awesome', web: 'auto-awesome' }} tintColor={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
