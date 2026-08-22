import { TokenSource } from "livekit-client"

import { env } from "@/constants/env"
import { getDeviceIdentity } from "@/services/deviceIdentity"

const tokenSource = TokenSource.sandboxTokenServer(env.sandboxId)

export const fetchParticipantToken = async (
  participantName: string,
  roomName: string,
): Promise<string> => {
  try {
    const participantIdentity = await getDeviceIdentity()

    const response = await tokenSource.fetch(
      {
        roomName,
        participantName,
        participantIdentity,
      },
      true,
    )

    if (!response.participantToken) {
      throw new Error("Token server returned an empty access token")
    }

    return response.participantToken
  } catch (error) {
    console.error("Error fetching participant token: ", error)
    throw error
  }
}
