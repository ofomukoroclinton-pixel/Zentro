import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import type { Post } from "../lib/zentro";
import { displayName, initials, timeAgo, toggleLike, addComment } from "../lib/zentro";
import { supabase } from "../lib/supabase";

function Video({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => { p.loop = true; });
  return <VideoView player={player} style={styles.media} contentFit="cover" nativeControls />;
}

export default function PostCard({ post, userId, onChanged, compact = false }: {
  post: Post; userId?: string; onChanged?: () => void; compact?: boolean;
}) {
  const [liked, setLiked] = useState(!!post.liked);
  const [busy, setBusy] = useState(false);

  async function like() {
    if (!userId || busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next); // optimistic UI: only this card changes
    try { await toggleLike(userId, post.id, liked); onChanged?.(); }
    catch (e: any) { setLiked(!next); Alert.alert("Like failed", e.message ?? "Please try again."); }
    finally { setBusy(false); }
  }

  async function comment() {
    if (!userId) return Alert.alert("Sign in required");
    Alert.prompt?.("Comment", "Write a comment", async text => {
      const value = (text ?? "").trim();
      if (!value) return;
      try { await addComment(userId, post.id, value); onChanged?.(); }
      catch (e: any) { Alert.alert("Comment failed", e.message ?? "Please try again."); }
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {post.author?.avatar_url
          ? <Image source={post.author.avatar_url} style={styles.avatar} contentFit="cover" />
          : <View style={styles.avatarFallback}><Text style={styles.initials}>{initials(post.author)}</Text></View>}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName(post.author)}</Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>
      {!!post.content && <Text style={styles.content}>{post.content}</Text>}
      {!!post.image_url && (post.media_type === "video"
        ? <Video uri={post.image_url} />
        : <Image source={post.image_url} style={styles.media} contentFit="cover" transition={120} />)}
      {!compact && <View style={styles.actions}>
        <Pressable onPress={like} style={styles.action}><Text>{liked ? "♥" : "♡"} Like</Text></Pressable>
        <Pressable onPress={comment} style={styles.action}><Text>Comment</Text></Pressable>
        <Pressable onPress={() => Alert.alert("Share", "Native share integration will use the post deep link.")} style={styles.action}><Text>Share</Text></Pressable>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:"#fff",borderRadius:18,marginBottom:12,padding:14,borderWidth:1,borderColor:"#eee"},
  header:{flexDirection:"row",alignItems:"center",gap:10},
  avatar:{width:42,height:42,borderRadius:21},
  avatarFallback:{width:42,height:42,borderRadius:21,backgroundColor:"#e8e8ef",alignItems:"center",justifyContent:"center"},
  initials:{fontWeight:"800"},
  name:{fontWeight:"800",fontSize:15},
  time:{fontSize:12,color:"#777",marginTop:2},
  content:{fontSize:15,lineHeight:21,marginTop:12},
  media:{width:"100%",height:330,borderRadius:14,marginTop:12,backgroundColor:"#eee"},
  actions:{flexDirection:"row",borderTopWidth:1,borderTopColor:"#eee",marginTop:12,paddingTop:8},
  action:{flex:1,alignItems:"center",paddingVertical:7}
});
