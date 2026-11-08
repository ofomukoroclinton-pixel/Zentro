import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";

import type { Post } from "../lib/zentro";
import {
  displayName,
  initials,
  timeAgo,
  toggleLike,
  addComment,
} from "../lib/zentro";

function Video({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="cover"
      nativeControls
    />
  );
}

export default function PostCard({
  post,
  userId,
  onChanged,
  compact = false,
}: {
  post: Post;
  userId?: string;
  onChanged?: () => void;
  compact?: boolean;
}) {
  const [liked, setLiked] = useState(!!post.liked);
  const [busy, setBusy] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  async function like() {
    if (!userId || busy) return;

    setBusy(true);
    const next = !liked;
    setLiked(next);

    try {
      await toggleLike(userId, post.id, liked);
      onChanged?.();
    } catch (e: any) {
      setLiked(!next);
      Alert.alert("Like failed", e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    const value = commentText.trim();

    if (!userId) {
      Alert.alert("Sign in required");
      return;
    }

    if (!value || busy) return;

    setBusy(true);

    try {
      await addComment(userId, post.id, value);
      setCommentText("");
      setCommentOpen(false);
      onChanged?.();
      Alert.alert("Success", "Your comment has been posted.");
    } catch (e: any) {
      Alert.alert("Comment failed", e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sharePost() {
    try {
      await Share.share({
        message: `Check out this post on Zentro!\n\n${post.content ?? ""}\n\nhttps://zentro.app`,
      });
    } catch {
      Alert.alert("Share failed", "Please try again.");
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {post.author?.avatar_url ? (
          <Image
            source={post.author.avatar_url}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initials}>{initials(post.author)}</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName(post.author)}</Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>

      {!!post.content && (
        <Text style={styles.content}>{post.content}</Text>
      )}

      {!!post.image_url &&
        (post.media_type === "video" ? (
          <Video uri={post.image_url} />
        ) : (
          <Image
            source={post.image_url}
            style={styles.media}
            contentFit="cover"
            transition={120}
          />
        ))}

      {!compact && (
        <View style={styles.actions}>
          <Pressable onPress={like} style={styles.action}>
            <Text style={[styles.actionText, liked && styles.liked]}>
              {liked ? "♥ Liked" : "♡ Like"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCommentOpen(true)}
            style={styles.action}
          >
            <Text style={styles.actionText}>Comment</Text>
          </Pressable>

          <Pressable onPress={sharePost} style={styles.action}>
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={commentOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentOpen(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Write a comment</Text>

            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Say something..."
              multiline
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setCommentOpen(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={submitComment}
                disabled={busy || !commentText.trim()}
                style={styles.postButton}
              >
                <Text style={styles.postButtonText}>
                  {busy ? "Posting..." : "Post comment"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e8e8ef",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "800",
  },
  name: {
    fontWeight: "800",
    fontSize: 15,
  },
  time: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 12,
  },
  media: {
    width: "100%",
    height: 330,
    borderRadius: 14,
    marginTop: 12,
    backgroundColor: "#eee",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 12,
    paddingTop: 8,
  },
  action: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
  },
  actionText: {
    fontWeight: "600",
    color: "#444",
  },
  liked: {
    color: "#E53965",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 14,
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  cancel: {
    color: "#777",
    fontWeight: "700",
  },
  postButton: {
    backgroundColor: "#6C4DFF",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});
