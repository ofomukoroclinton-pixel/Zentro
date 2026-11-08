import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);

  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!userId || !id) return;

    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,receiver_id,content,created_at")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Unable to load messages:", error.message);
      return;
    }

    setMessages((data ?? []) as Message[]);
  }, [userId, id]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data } = await supabase.auth.getUser();

      if (!active) return;

      if (!data.user) {
        setLoading(false);
        return;
      }

      setUserId(data.user.id);
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userId || !id) return;

    loadMessages().finally(() => setLoading(false));

    const channel = supabase
      .channel(`chat-${userId}-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => loadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, id, loadMessages]);

  async function sendMessage() {
    const content = text.trim();

    if (!content || !userId || !id || sending) return;

    setSending(true);
    setText("");

    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: id,
      content,
    });

    if (error) {
      setText(content);
      console.error("Message failed:", error.message);
    } else {
      await loadMessages();
    }

    setSending(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C4DFF" />
        <Text style={styles.muted}>Opening conversation...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text>Please sign in to use messages.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Zentro Chat</Text>
          <Text style={styles.subtitle}>Private conversation</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No messages yet. Start the conversation!
          </Text>
        }
        renderItem={({ item }) => {
          const mine = item.sender_id === userId;

          return (
            <View
              style={[
                styles.messageBubble,
                mine ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={mine ? styles.myText : styles.theirText}>
                {item.content}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputArea}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a message..."
          multiline
          style={styles.input}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!text.trim() || sending}
          style={styles.sendButton}
        >
          <Text style={styles.sendText}>
            {sending ? "..." : "Send"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8FC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "#777", marginTop: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 18,
    paddingTop: 55,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { fontSize: 35, color: "#6C4DFF" },
  title: { fontSize: 20, fontWeight: "900", color: "#171323" },
  subtitle: { color: "#888", fontSize: 12, marginTop: 3 },
  messageList: { padding: 15, flexGrow: 1, justifyContent: "flex-end" },
  empty: { textAlign: "center", color: "#888", marginVertical: 30 },
  messageBubble: {
    maxWidth: "82%",
    padding: 12,
    borderRadius: 17,
    marginVertical: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6C4DFF",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  myText: { color: "#fff", fontSize: 15 },
  theirText: { color: "#222", fontSize: 15 },
  timestamp: {
    fontSize: 10,
    color: "#aaa",
    textAlign: "right",
    marginTop: 5,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F2F8",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#6C4DFF",
    paddingHorizontal: 19,
    paddingVertical: 13,
    borderRadius: 22,
  },
  sendText: { color: "#fff", fontWeight: "800" },
});
