import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  record: {
    id: string;
    user_id: string;
    type?: string | null;
    title?: string | null;
    message?: string | null;
    data?: Record<string, unknown> | null;
  };
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendKey = Deno.env.get("RESEND_API_KEY");
const emailFrom = Deno.env.get("ZENTRO_EMAIL_FROM") || "Zentro <notifications@zentro.app>";

const admin = createClient(supabaseUrl, serviceKey);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const body = await req.json() as Payload;
  const n = body.record;
  if (!n?.user_id || !n?.id) return json({ error: "Invalid notification record" }, 400);

  const [{ data: tokens }, { data: prefs }, { data: authUser }] = await Promise.all([
    admin.from("push_tokens").select("expo_push_token").eq("user_id", n.user_id),
    admin.from("notification_preferences").select("push_enabled,email_enabled").eq("user_id", n.user_id).maybeSingle(),
    admin.auth.admin.getUserById(n.user_id),
  ]);

  const pushEnabled = prefs?.push_enabled !== false;
  const emailEnabled = prefs?.email_enabled !== false;
  const title = n.title || "Zentro";
  const message = n.message || "You have new activity on Zentro.";

  let pushResult: unknown = null;
  if (pushEnabled && tokens?.length) {
    const messages = tokens.map((t: any) => ({
      to: t.expo_push_token,
      sound: "default",
      title,
      body: message,
      channelId: "zentro-social",
      data: { notificationId: n.id, type: n.type || "activity", ...(n.data || {}) },
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(messages),
    });
    pushResult = await response.json();
  }

  let emailResult: unknown = null;
  const email = authUser?.user?.email;
  if (emailEnabled && resendKey && email) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [email],
        subject: title,
        text: message,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(message)}</p>
          <p style="color:#777">Open Zentro to see the full activity.</p>
        </div>`,
      }),
    });
    emailResult = await response.json();
  }

  return json({ ok: true, push: pushResult, email: emailResult });
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]!));
}
