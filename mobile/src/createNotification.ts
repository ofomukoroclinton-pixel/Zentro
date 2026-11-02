import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function createNotification(
  admin: SupabaseClient,
  input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  const { data, error } = await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    data: input.data || {},
  }).select("id").single();

  if (error) throw error;
  return data.id;
}
