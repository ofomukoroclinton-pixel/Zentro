ZENTRO WEB PUSH EDGE FUNCTION

Required Supabase Edge Function secrets:
- SUPABASE_URL (usually provided automatically)
- SUPABASE_SERVICE_ROLE_KEY (Supabase project service role key; keep secret)
- VAPID_PUBLIC_KEY (must match public key in index.html)
- VAPID_PRIVATE_KEY (private key; never put in website files)
- VAPID_SUBJECT (mailto: valid support email or https URL)
- PUSH_WEBHOOK_SECRET (random secret matching Supabase Vault zentro_push_webhook_secret)

Deploy function name: zentro-send-push
Then run database/zentro-push-trigger.sql after adding the two Vault secrets documented in that SQL.
The trigger sends push for every inserted row in public.zentro_notifications. Ensure the table's recipient_id identifies the receiving user.
