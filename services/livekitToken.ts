import { TokenSource } from "livekit-client"

import { env } from "@/constants/env"
import { getDeviceIdentity } from "@/services/deviceIdentity"

const tokenSource = TokenSource.sandboxTokenServer(env.sandboxId)

export const fetchParticipantToken = async (
  participantName: string,
): Promise<string> => {
  const participantIdentity = await getDeviceIdentity()

  const response = await tokenSource.fetch(
    {
      roomName: env.roomName,
      participantName,
      participantIdentity,
    },
    true,
  )

  if (!response.participantToken) {
    throw new Error("Token server returned an empty access token")
  }

  return response.participantToken
}
