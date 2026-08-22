export interface ActiveRoomRegistration {
  // Slug of the room this registration belongs to
  slug: string
  // Disconnects this room's LiveKit connection
  disconnect: () => Promise<void>
  // Called synchronously before a disconnect the app forced (a deep link to
  // another room arrived), so the room's screen can skip its own navigation
  onForcedDisconnect: VoidFunction
}

// Set by the currently connected room so app/_layout.tsx can disconnect it
// from outside the LiveKit context tree when a new deep link arrives.
let activeRegistration: ActiveRoomRegistration | null = null

export const registerActiveRoom = (
  registration: ActiveRoomRegistration,
): void => {
  activeRegistration = registration
}

// Slug of the currently active room, if any. Lets a freshly pushed [slug]
// screen for a non-canonical link recognize it duplicates the room already
// open elsewhere in the stack, instead of presenting its own join form.
export const getActiveRoomSlug = (): string | null =>
  activeRegistration?.slug ?? null

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

// Disconnects the active room before the router navigates to `nextSlug`. A
// link to the already-active room is a no-op; otherwise the room is told the
// disconnect was forced, and the slot released, before awaiting.
export const disconnectActiveRoom = async (nextSlug: string): Promise<void> => {
  const registration = activeRegistration

  if (!registration || registration.slug === nextSlug) {
    return
  }

  activeRegistration = null
  registration.onForcedDisconnect()

  try {
    await registration.disconnect()
  } catch (error) {
    console.error("Error disconnecting the active room: ", error)
  }
}
