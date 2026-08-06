// Types for the LiveKit React Native application

export interface ConnectionState {
  // Access token of the current session; null means "not in a room"
  token: string | null
  error?: string
}

export interface VideoControlsState {
  isMuted: boolean
  isVideoEnabled: boolean
  isSpeaking: boolean
}
