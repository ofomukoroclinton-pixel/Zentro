import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "../src/supabase";
import { useSession } from "../src/session";
type Notice = {
  id: string;
  user_id: string;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  data?: Record<string, any> | null;
  created_at: string;
  read_at?: string | null;
};

export default function Notifications() {
  const { user } = useSession();
  const [items, setItems] = useState<Notice[]>([]);

  async function load() {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error) setItems((data || []) as Notice[]);
  }

  async function markRead(id: string) {
    setItems(prev => prev.map(x => x.id === id ? { ...x, read_at: new Date().toISOString() } : x));
    await supabase.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user?.id);
  }

  useEffect(() => {
    load();
    if (!user) return;

    const channel = supabase.channel(`zentro-notifications:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`
      }, payload => {
        setItems(prev => [payload.new as Notice, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Your Zentro activity</Text>

      <FlatList
        data={items}
        keyExtractor={x => x.id}
        contentContainerStyle={styles.list}
        onRefresh={load}
        refreshing={false}
        ListEmptyComponent={<Text style={styles.empty}>You're all caught up.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markRead(item.id)}
            style={[styles.card, !item.read_at && styles.unread]}
          >
            <View style={styles.icon}><Text>🔔</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>{item.title || "Zentro"}</Text>
              <Text style={styles.message}>{item.message || "You have new activity on Zentro."}</Text>
              <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            {!item.read_at && <View style={styles.unreadDot} />}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,paddingTop:18,paddingHorizontal:14},
  title:{fontSize:28,fontWeight:"900"},
  subtitle:{color:"#777",marginTop:3,marginBottom:8},
  list:{paddingBottom:30},
  card:{flexDirection:"row",alignItems:"flex-start",gap:12,padding:14,borderRadius:16,borderWidth:1,borderColor:"#eee",marginBottom:9,backgroundColor:"#fff"},
  unread:{backgroundColor:"#f7f8ff",borderColor:"#dfe4ff"},
  icon:{width:42,height:42,borderRadius:21,backgroundColor:"#ececf2",alignItems:"center",justifyContent:"center"},
  noticeTitle:{fontWeight:"900",fontSize:15},
  message:{fontSize:14,lineHeight:20,marginTop:2},
  time:{fontSize:11,color:"#888",marginTop:5},
  unreadDot:{width:9,height:9,borderRadius:5,backgroundColor:"#111827",marginTop:5},
  empty:{color:"#777",padding:30,textAlign:"center"}
});
