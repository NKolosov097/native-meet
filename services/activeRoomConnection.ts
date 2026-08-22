export interface ActiveRoomRegistration {
  // Slug of the room this registration belongs to
  slug: string
  // Disconnects this room's LiveKit connection
  disconnect: () => Promise<void>
  // Called synchronously before a disconnect the app forced (a deep link to
  // another room arrived), so the room's screen can skip its own navigation
  onForcedDisconnect: VoidFunction
}

// Set by the currently connected room (see
// components/room/useRegisterActiveRoomDisconnect.ts) so app/_layout.tsx can
// disconnect it from outside the LiveKit context tree when a new deep link
// arrives for a different room.
let activeRegistration: ActiveRoomRegistration | null = null

export const registerActiveRoom = (
  registration: ActiveRoomRegistration,
): void => {
  activeRegistration = registration
}

// Clears the registry only when `registration` still owns the slot, so a room
// unmounting after its successor registered cannot wipe the successor out and
// leave the new call impossible to disconnect from outside its context.
export const unregisterActiveRoom = (
  registration: ActiveRoomRegistration,
): void => {
  if (activeRegistration === registration) {
    activeRegistration = null
  }
}

// Disconnects the active room before the router navigates to `nextSlug`.
// A link to the room that is already active is a no-op — there is nothing to
// tear down and killing the call would only interrupt it. Otherwise the room
// is told that this disconnect was forced (so its screen leaves navigation to
// the router) and the slot is released before awaiting, so the same stale
// handler can never be invoked twice.
export const disconnectActiveRoom = async (nextSlug: string): Promise<void> => {
  const registration = activeRegistration

  if (!registration || registration.slug === nextSlug) {
    return
  }

  activeRegistration = null
  registration.onForcedDisconnect()

  await registration.disconnect()
}
