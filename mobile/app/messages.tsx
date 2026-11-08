import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { supabase } from "../src/supabase";
import { useSession } from "../src/session";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

type Conversation = {
  userId: string;
  name: string;
  avatar: string | null;
  message: string;
  date: string;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useSession();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,receiver_id,content,created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Messages error:", error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Message[];
    const latest = new Map<string, Message>();

    rows.forEach((message) => {
      const otherUser =
        message.sender_id === user.id
          ? message.receiver_id
          : message.sender_id;

      if (!latest.has(otherUser)) {
        latest.set(otherUser, message);
      }
    });

    const ids = [...latest.keys()];

    if (ids.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name,username,avatar_url")
      .in("id", ids);

    if (profileError) {
      console.error("Profiles error:", profileError.message);
    }

    const result = ids.map((id) => {
      const message = latest.get(id)!;
      const profile = profiles?.find((p) => p.id === id);

      return {
        userId: id,
        name:
          profile?.full_name ||
          profile?.username ||
          "Zentro User",
        avatar: profile?.avatar_url ?? null,
        message: message.content,
        date: message.created_at,
      };
    });

    setConversations(result);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadMessages();

    if (!user?.id) return;

    const channel = supabase
      .channel("zentro-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => loadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages, user?.id]);

  async function refresh() {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C4DFF" />
        <Text style={styles.muted}>Loading your messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>
        Your private conversations on Zentro.
      </Text>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.userId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✉</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.muted}>
              When you exchange messages with someone, your conversations
              will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.conversation}
            onPress={() =>
              router.push({
                pathname: "/[id]",
                params: { id: item.userId },
              })
            }
          >
            {item.avatar ? (
              <Image
                source={item.avatar}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.message} numberOfLines={1}>
                {item.message}
              </Text>
            </View>

            <Text style={styles.time}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8FC",
    paddingTop: 55,
  },
  title: {
    fontSize: 29,
    fontWeight: "900",
    color: "#171323",
    paddingHorizontal: 20,
  },
  subtitle: {
    color: "#777",
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  conversation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 13,
    borderRadius: 17,
    marginBottom: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E9E3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#6C4DFF",
    fontSize: 20,
    fontWeight: "900",
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171323",
  },
  message: {
    color: "#777",
    marginTop: 5,
    fontSize: 13,
  },
  time: {
    fontSize: 10,
    color: "#999",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  empty: {
    alignItems: "center",
    padding: 35,
    marginTop: 50,
  },
  emptyIcon: {
    fontSize: 45,
    color: "#6C4DFF",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 15,
    marginBottom: 5,
  },
});
