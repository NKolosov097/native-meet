import { TokenSource } from "livekit-client"

import { env } from "@/constants/env"

// Requests tokens from the LiveKit Cloud token server:
// POST https://cloud-api.livekit.io/api/v2/sandbox/connection-details
const tokenSource = TokenSource.sandboxTokenServer(env.sandboxId)

// LiveKit disconnects the existing participant when someone joins with the
// same identity, so a random suffix keeps same-named participants apart.
// The name other participants see is passed separately as participantName.
const createIdentity = (participantName: string): string =>
  `${participantName}-${Math.random().toString(36).slice(2, 8)}`

export const fetchParticipantToken = async (
  participantName: string,
): Promise<string> => {
  // Force a fresh fetch: every join mints a new participant identity, so a
  // cached response is never valid to reuse. This also avoids the cached
  // response's validity check, which decodes the cached JWT via jose's atob
  // step — a global that this React Native runtime may not provide.
  const response = await tokenSource.fetch(
    {
      roomName: env.roomName,
      participantName,
      participantIdentity: createIdentity(participantName),
    },
    true,
  )

  if (!response.participantToken) {
    throw new Error("Token server returned an empty access token")
  }

  return response.participantToken
}
