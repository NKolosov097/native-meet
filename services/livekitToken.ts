import { TokenSource } from "livekit-client"

import { env } from "@/constants/env"

const tokenSource = TokenSource.sandboxTokenServer(env.sandboxId)

const createIdentity = (participantName: string): string =>
  `${participantName}-${Math.random().toString(36).slice(2, 8)}`

export const fetchParticipantToken = async (
  participantName: string,
): Promise<string> => {
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
