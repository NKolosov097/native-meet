// Types for the LiveKit React Native application

export interface ConnectionState {
  // Access token of the current session; null means "not in a room"
  token: string | null
  // Message from the most recent failed connection attempt, if any
  error?: string
}
