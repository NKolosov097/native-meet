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
  const response = await tokenSource.fetch({
    roomName: env.roomName,
    participantName,
    participantIdentity: createIdentity(participantName),
  })

  return response.participantToken
}
