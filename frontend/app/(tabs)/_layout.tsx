import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, Link } from "expo-router";
import { Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { AlarmsProvider } from "@/src/store/alarm.store";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AlarmsProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: useClientOnlyValue(false, true),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Tab One",
            tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
            headerRight: () => (
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={25}
                      color={Colors[colorScheme ?? "light"].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: "Tab Two",
            tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Pomodoro"
          options={{ title: "Pomodoro", headerShown: false }}
        />
        {/* Pestaña de Alarmas */}
        <Tabs.Screen
          name="alarms"
          options={{
            title: "Alarmas",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="bell" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AlarmsProvider>
  );
}
