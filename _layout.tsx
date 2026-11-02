import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="index" options={{ title: "Home" }} />
    <Tabs.Screen name="video" options={{ title: "Video" }} />
    <Tabs.Screen name="community" options={{ title: "Community" }} />
    <Tabs.Screen name="romance" options={{ title: "Romance" }} />
    <Tabs.Screen name="messages" options={{ title: "Messages" }} />
    <Tabs.Screen name="profile" options={{ title: "Profile" }} />
  </Tabs>;
}
