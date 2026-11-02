import { supabase } from "./supabase";

export type Profile = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  city?: string | null;
  avatar_url?: string | null;
};

export type Post = {
  id: string;
  user_id: string;
  content?: string | null;
  image_url?: string | null;
  media_type?: "text" | "image" | "video" | null;
  created_at: string;
  author?: Profile;
  liked?: boolean;
};

export function displayName(p?: Profile) {
  return p?.display_name || p?.username || "Zentro User";
}

export function initials(p?: Profile) {
  return displayName(p).split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "Z";
}

export function timeAgo(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(value).toLocaleDateString();
}

export async function getFeed(opts: { videoOnly?: boolean; limit?: number } = {}) {
  const limit = opts.limit ?? 50;
  let query = supabase
    .from("posts")
    .select("id,user_id,content,image_url,media_type,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.videoOnly) query = query.eq("media_type", "video");

  const { data: posts, error } = await query;
  if (error) throw error;
  const rows = (posts ?? []) as Post[];
  const ids = [...new Set(rows.map(p => p.user_id).filter(Boolean))];

  let profiles: Profile[] = [];
  if (ids.length) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id,username,display_name,bio,city,avatar_url")
      .in("id", ids);
    if (profileError) throw profileError;
    profiles = (data ?? []) as Profile[];
  }

  const map = new Map(profiles.map(p => [p.id, p]));
  return rows.map(p => ({ ...p, author: map.get(p.user_id) }));
}

export async function getLikedPostIds(userId: string, postIds: string[]) {
  if (!postIds.length) return new Set<string>();
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  if (error) throw error;
  return new Set((data ?? []).map(x => x.post_id));
}

export async function toggleLike(userId: string, postId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from("post_likes")
      .delete().eq("user_id", userId).eq("post_id", postId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("post_likes")
    .insert({ user_id: userId, post_id: postId });
  if (error) throw error;
  return true;
}

export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id,post_id,user_id,content,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const ids = [...new Set(rows.map(x => x.user_id).filter(Boolean))];
  let profiles: Profile[] = [];
  if (ids.length) {
    const { data: p, error: pe } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url")
      .in("id", ids);
    if (pe) throw pe;
    profiles = (p ?? []) as Profile[];
  }
  const map = new Map(profiles.map(p => [p.id, p]));
  return rows.map(x => ({ ...x, author: map.get(x.user_id) }));
}

export async function addComment(userId: string, postId: string, content: string) {
  const { error } = await supabase.from("comments").insert({
    post_id: postId, user_id: userId, content
  });
  if (error) throw error;
}

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id,sender_id,receiver_id,content,created_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows = data ?? [];
  const ids = [...new Set(rows.map(m => m.sender_id === userId ? m.receiver_id : m.sender_id))]
    .filter(Boolean).filter(id => id !== userId);
  let profiles: Profile[] = [];
  if (ids.length) {
    const { data: p, error: pe } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url")
      .in("id", ids);
    if (pe) throw pe;
    profiles = (p ?? []) as Profile[];
  }
  const map = new Map(profiles.map(p => [p.id, p]));
  return ids.map(id => {
    const latest = rows.find(m => (m.sender_id === userId ? m.receiver_id : m.sender_id) === id);
    return { id, profile: map.get(id), latest };
  });
}

export async function getChat(userId: string, otherId: string) {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id,sender_id,receiver_id,content,created_at")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(userId: string, otherId: string, content: string) {
  const { error } = await supabase.from("direct_messages").insert({
    sender_id: userId, receiver_id: otherId, content
  });
  if (error) throw error;
}
