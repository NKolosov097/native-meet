import { useEffect } from "react"

import { useRoomContext } from "@livekit/react-native"

import { registerActiveRoomDisconnect } from "@/services/activeRoomConnection"

// Lets app/_layout.tsx disconnect this room from outside the LiveKit
// context tree — needed when a new deep link arrives for a different room
// while this one is still connected in the background.
export const useRegisterActiveRoomDisconnect = (): void => {
  const room = useRoomContext()

  useEffect(() => {
    registerActiveRoomDisconnect(() => room.disconnect())

    return () => registerActiveRoomDisconnect(null)
  }, [room])
}
