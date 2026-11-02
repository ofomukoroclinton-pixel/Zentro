# Zentro notification sender

Deploy this function with the Supabase CLI and set these server-only secrets:

- `RESEND_API_KEY`
- `ZENTRO_EMAIL_FROM`

The function also uses the platform-provided:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Configure a **Supabase Database Webhook** for:
- Table: `public.notifications`
- Event: `INSERT`
- Target: Edge Function `send-notification`

The webhook sends the inserted notification record to this function.

Result:
1. Zentro inserts one server-authorized notification row.
2. The function finds all registered Expo device tokens for that account.
3. Expo sends the phone notification, which appears in Android/iOS notification shade like the screenshot.
4. The function looks up the email attached to the authenticated Zentro account and sends the same activity by email when email notifications are enabled.

Never put the Resend API key or Supabase service-role key inside the mobile app.
