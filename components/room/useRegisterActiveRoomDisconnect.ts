import { useEffect } from "react"

import { useRoomContext } from "@livekit/react-native"

import {
  registerActiveRoom,
  unregisterActiveRoom,
  type ActiveRoomRegistration,
} from "@/services/activeRoomConnection"

// Lets app/_layout.tsx disconnect this room from outside the LiveKit
// context tree — needed when a new deep link arrives for a different room
// while this one is still connected in the background. The registry keeps the
// room's slug so a link to the room already on screen is left alone, and calls
// `onForcedDisconnect` when it is the app (not the user) ending the call.
export const useRegisterActiveRoomDisconnect = (
  slug: string,
  onForcedDisconnect: VoidFunction,
): void => {
  const room = useRoomContext()

  useEffect(() => {
    const registration: ActiveRoomRegistration = {
      slug,
      disconnect: () => room.disconnect(),
      onForcedDisconnect,
    }

    registerActiveRoom(registration)

    return () => unregisterActiveRoom(registration)
  }, [room, slug, onForcedDisconnect])
}
