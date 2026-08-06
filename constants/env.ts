// Environment configuration for the LiveKit connection.
// Expo inlines EXPO_PUBLIC_* variables at build time, so each one has to be
// referenced by its literal name — a computed lookup resolves to undefined.

export interface Env {
  serverUrl: string
  sandboxId: string
  roomName: string
}

const VARIABLE_NAMES: Record<keyof Env, string> = {
  serverUrl: "EXPO_PUBLIC_LIVEKIT_URL",
  sandboxId: "EXPO_PUBLIC_LIVEKIT_SANDBOX_ID",
  roomName: "EXPO_PUBLIC_LIVEKIT_ROOM",
}

const rawEnv: Record<keyof Env, string | undefined> = {
  serverUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL,
  sandboxId: process.env.EXPO_PUBLIC_LIVEKIT_SANDBOX_ID,
  roomName: process.env.EXPO_PUBLIC_LIVEKIT_ROOM,
}

const missingNames = (Object.keys(VARIABLE_NAMES) as (keyof Env)[])
  .filter(key => !rawEnv[key]?.trim())
  .map(key => VARIABLE_NAMES[key])

// Message naming the variables that still need a value, or null when ready
export const configError: string | null =
  missingNames.length > 0
    ? `Missing environment variables: ${missingNames.join(", ")}`
    : null

export const env: Env = {
  serverUrl: rawEnv.serverUrl?.trim() ?? "",
  sandboxId: rawEnv.sandboxId?.trim() ?? "",
  roomName: rawEnv.roomName?.trim() ?? "",
}
