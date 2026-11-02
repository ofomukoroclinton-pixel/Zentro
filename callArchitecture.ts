/**
 * Production call architecture for Zentro.
 *
 * Client responsibilities:
 * - request microphone/camera permissions
 * - create RTCPeerConnection
 * - exchange SDP offer/answer and ICE candidates
 * - render local/remote MediaStream
 * - subscribe to call state changes
 *
 * Server responsibilities:
 * - authenticate both users
 * - authorize who can call whom
 * - relay signaling messages through a private realtime channel
 * - provide TURN credentials (short-lived)
 * - persist call lifecycle/audit events if required
 *
 * Do not ship calls with STUN-only connectivity. TURN is required for
 * reliable mobile networks. Signaling data must never be trusted from
 * unauthenticated clients.
 */
export const CALL_EVENTS = {
  OFFER: "offer",
  ANSWER: "answer",
  ICE: "ice-candidate",
  HANGUP: "hangup",
  REJECT: "reject",
} as const;
