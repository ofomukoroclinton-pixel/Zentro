import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("zentro-social", {
      name: "Zentro notifications",
      description: "Messages, likes, comments, follows and other Zentro activity.",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 100, 180],
      lightColor: "#ffffff",
      sound: "default",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;

  if (status !== Notifications.PermissionStatus.GRANTED) {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== Notifications.PermissionStatus.GRANTED) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  if (!projectId) {
    console.warn("Set EXPO_PUBLIC_EAS_PROJECT_ID for production Expo push notifications.");
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function savePushToken(userId: string, expoPushToken: string) {
  const { error } = await supabase.from("push_tokens").upsert({
    user_id: userId,
    expo_push_token: expoPushToken,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
  }, { onConflict: "expo_push_token" });

  if (error) throw error;
}

export async function removeCurrentPushToken(userId: string) {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) return;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await supabase.from("push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("expo_push_token", token.data);
}
