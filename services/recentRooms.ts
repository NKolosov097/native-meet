import AsyncStorage from "@react-native-async-storage/async-storage"

const RECENT_ROOMS_KEY = "native-meet.recent-rooms"
const MAX_RECENT_ROOMS = 20

export interface RecentRoom {
  // Canonical slug of the room, used to navigate back into it
  slug: string
  // Participant name last used when joining this room
  participantName: string
  // Epoch ms of the most recent successful join — determines sort order
  joinedAt: number
}

// Returns [] on any storage or parse failure — a corrupt/missing cache must
// never block the home screen from rendering.
export const getRecentRooms = async (): Promise<RecentRoom[]> => {
  try {
    const stored = await AsyncStorage.getItem(RECENT_ROOMS_KEY)

    return stored ? (JSON.parse(stored) as RecentRoom[]) : []
  } catch (error) {
    console.error("Error reading recent rooms: ", error)
    return []
  }
}

// Upserts by slug (rejoining under a new name replaces the old entry rather
// than duplicating it), most-recent-first, capped at MAX_RECENT_ROOMS.
export const saveRecentRoom = async (
  slug: string,
  participantName: string,
): Promise<void> => {
  try {
    const existing = await getRecentRooms()
    const withoutSlug = existing.filter(room => room.slug !== slug)
    const updated = [
      { slug, participantName, joinedAt: Date.now() },
      ...withoutSlug,
    ].slice(0, MAX_RECENT_ROOMS)

    await AsyncStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving a recent room: ", error)
  }
}
