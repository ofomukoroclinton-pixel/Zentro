import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import PostCard from "./PostCard";
import { getFeed, getLikedPostIds, type Post } from "../lib/zentro";
import { FEEDS, type FeedKind } from "../features/feed";
import { useSession } from "../store/session";

export default function FeedScreen({ kind }: { kind: FeedKind }) {
  const { user } = useSession();
  const config = FEEDS[kind];
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const rows = await getFeed({ videoOnly: config.videoOnly });
    const liked = await getLikedPostIds(user.id, rows.map(x => x.id));
    setPosts(rows.map(p => ({ ...p, liked: liked.has(p.id) })));
  }, [user, config.videoOnly]);

  useEffect(() => { load().catch(console.error); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={p => p.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{config.empty}</Text>
          <Text style={styles.emptyText}>Pull to refresh when you’re ready.</Text>
        </View>
      }
      renderItem={({ item }) => <PostCard post={item} userId={user?.id} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, paddingBottom: 30 },
  header: { padding: 8, marginBottom: 8 },
  title: { fontSize: 27, fontWeight: "900" },
  subtitle: { color: "#707070", marginTop: 4, lineHeight: 20 },
  empty: { padding: 24, alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptyText: { color: "#777", marginTop: 6 },
});
