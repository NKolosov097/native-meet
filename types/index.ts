// Types for the LiveKit React Native application

export interface AppConfig {
  url: string
  token: string
}

export interface ConnectionState {
  connected: boolean
  connecting: boolean
  error?: string
}

export interface VideoControlsState {
  isMuted: boolean
  isVideoEnabled: boolean
  isSpeaking: boolean
}
