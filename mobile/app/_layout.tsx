import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";

const icons: Record<string, string> = {
  index: "⌂",
  video: "▷",
  community: "◎",
  romance: "♡",
  messages: "✉",
  profile: "♙",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#6C4DFF",
        tabBarInactiveTintColor: "#888888",
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#EEEEF2",
          borderTopWidth: 1,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 23 }}>
            {icons[route.name] ?? "•"}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="video" options={{ title: "Video" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
      <Tabs.Screen name="romance" options={{ title: "Romance" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
            }
