import { useCallback, useEffect, useState } from "react"
import { LogBox } from "react-native"

import { LiveKitRoom } from "@livekit/react-native"
import {
  VideoPresets,
  type RoomConnectOptions,
  type RoomOptions,
} from "livekit-client"

import { ActiveRoom } from "@/components/room/ActiveRoom"
import { env } from "@/constants/env"
import { JoinScreen } from "@/screens/JoinScreen"

import type { ConnectionState } from "@/types"

const initialConnectionState: ConnectionState = {
  token: null,
}

const roomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h360.resolution,
  },
  publishDefaults: {
    simulcast: false,
    videoEncoding: VideoPresets.h360.encoding,
  },
}

const connectOptions: RoomConnectOptions = {
  maxRetries: 5,
}

// Main application component
export default () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    () => initialConnectionState,
  )

  // Suppress non-critical warnings
  useEffect(() => {
    LogBox.ignoreLogs([
      "An event listener wasn't added because it has been added already",
      "Warning: WebRTC",
    ])
  }, [])

  const onJoined = useCallback((token: string): void => {
    setConnectionState({ token })
  }, [])

  const onDisconnect = useCallback((): void => {
    setConnectionState({ token: null })
  }, [])

  const onConnectionError = useCallback((error?: Error): void => {
    console.error("Connection error: ", error)
    setConnectionState({
      token: null,
      error: error?.message || "Failed to connect to the room",
    })
  }, [])

  if (connectionState.token === null) {
    return <JoinScreen error={connectionState.error} onJoined={onJoined} />
  }

  return (
    <LiveKitRoom
      serverUrl={env.serverUrl}
      token={connectionState.token}
      connect
      onDisconnected={onDisconnect}
      onError={onConnectionError}
      options={roomOptions}
      connectOptions={connectOptions}
    >
      <ActiveRoom />
    </LiveKitRoom>
  )
}
