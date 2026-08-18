type DisconnectHandler = () => Promise<void>

// Set by the currently connected room (see
// components/room/useRegisterActiveRoomDisconnect.ts) so app/_layout.tsx can
// disconnect it from outside the LiveKit context tree when a new deep link
// arrives for a different room.
let activeDisconnect: DisconnectHandler | null = null

export const registerActiveRoomDisconnect = (
  disconnect: DisconnectHandler | null,
): void => {
  activeDisconnect = disconnect
}

export const disconnectActiveRoom = async (): Promise<void> => {
  if (activeDisconnect) {
    await activeDisconnect()
  }
}
