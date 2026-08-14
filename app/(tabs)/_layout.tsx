import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useApp } from '@/store';

export default function TabLayout() {
  const { tema } = useApp();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[tema].primary,
        tabBarStyle: {
          backgroundColor: Colors[tema].card,
          borderTopColor: Colors[tema].border,
          borderTopWidth: 1,
          height: 70,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarInactiveTintColor: Colors[tema].textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Paquetes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="car.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mis Citas',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
