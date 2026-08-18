export interface Env {
  // LiveKit server URL to connect to
  serverUrl: string
  // LiveKit Cloud sandbox identifier used to mint a token
  sandboxId: string
}

const VARIABLE_NAMES: Record<keyof Env, string> = {
  serverUrl: "EXPO_PUBLIC_LIVEKIT_URL",
  sandboxId: "EXPO_PUBLIC_LIVEKIT_SANDBOX_ID",
}

const rawEnv: Record<keyof Env, string | undefined> = {
  serverUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL,
  sandboxId: process.env.EXPO_PUBLIC_LIVEKIT_SANDBOX_ID,
}

const missingNames = (Object.keys(VARIABLE_NAMES) as (keyof Env)[])
  .filter(key => !rawEnv[key]?.trim())
  .map(key => VARIABLE_NAMES[key])

export const configError: string | null =
  missingNames.length > 0
    ? `Missing environment variables: ${missingNames.join(", ")}`
    : null

export const env: Env = {
  serverUrl: rawEnv.serverUrl?.trim() ?? "",
  sandboxId: rawEnv.sandboxId?.trim() ?? "",
}
