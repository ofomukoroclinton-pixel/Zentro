# Zentro mobile — feature pass v4

## Notification system now works as a real product architecture

The supplied screenshot is an Android notification shade. Zentro cannot control the exact Android shade design (the OS controls that), but Zentro now provides the pieces needed to produce the same kind of notification:

- Android notification channel: `zentro-social`
- High-importance push notifications with sound/vibration
- App icon for the notification
- Persistent Expo push-token registration per account/device
- In-app notification center with realtime inserts
- Read/unread state
- Notification preferences for push and email
- Server-side Edge Function that sends both:
  - phone push notification
  - email to the exact email address used for the Zentro account
- Secure separation: Resend/service-role secrets never ship in the app
- Server-authoritative notification creation; normal users cannot create arbitrary notifications for other users

## How a real event becomes a notification

Example: someone comments on a user's post.

1. Trusted server logic creates:
   `notifications(user_id=POST_OWNER, type='comment', title='New comment', message='John commented on your post', data=...)`
2. Supabase Database Webhook invokes `send-notification`.
3. Edge Function looks up the user's registered devices and account email.
4. Expo Push sends the phone alert.
5. Resend sends the email if enabled.
6. The in-app Notifications screen receives the INSERT through Supabase Realtime without reloading the entire feed.

## Required one-time production setup

1. Run `supabase/notification_and_security.sql`.
2. Deploy `supabase/functions/send-notification`.
3. Set Edge Function secrets:
   - `RESEND_API_KEY`
   - `ZENTRO_EMAIL_FROM`
4. Configure the Supabase Database Webhook described in the function README.
5. Create/configure an Expo EAS project and set `EXPO_PUBLIC_EAS_PROJECT_ID`.
6. Build a real Android/iOS binary. Push notification behavior must be tested on physical devices.
7. Configure and verify the sender domain with the email provider.

## Important

The mobile app itself does not send account emails directly. That would expose credentials and allow abuse. Email delivery is server-side.

The Android/iOS notification shade is rendered by the operating system, so its exact visual layout will vary by phone/OS. Zentro controls the app name, title, body, icon, sound, vibration, channel, and deep-link payload.

The remaining production work is the secure WebRTC/TURN calling implementation, liveness/document verification pipeline, exact screenshot-level styling, and end-to-end tests.
