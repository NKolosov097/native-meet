import { useCallback, useEffect, useRef, useState } from "react"

import { useLocalSearchParams, useRouter } from "expo-router"

import { LiveKitRoom } from "@livekit/react-native"
import {
  VideoPresets,
  type RoomConnectOptions,
  type RoomOptions,
} from "livekit-client"

import { ActiveRoom } from "@/components/room/ActiveRoom"
import { env } from "@/constants/env"
import { JoinScreen } from "@/screens/JoinScreen"
import { getActiveRoomSlug } from "@/services/activeRoomConnection"
import { slugify } from "@/services/roomSlug"

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

interface RoomProps {
  // Canonical slug of the room to join, already slugified by the route
  slug: string
}

const Room = ({ slug }: RoomProps) => {
  const router = useRouter()
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    () => initialConnectionState,
  )
  // Set while the app itself is ending this call because a link to another
  // room arrived. Read by onDisconnect to tell that case apart from the user
  // pressing "leave": the router is already navigating to the linked room, so
  // navigating again here would bounce the user straight back out of it.
  const isDisconnectForcedRef = useRef<boolean>(false)

  const onJoined = useCallback((token: string): void => {
    isDisconnectForcedRef.current = false
    setConnectionState({ token })
  }, [])

  // The call is being torn down for the room the router is already navigating
  // to, so drop the token right away instead of waiting for LiveKit's
  // Disconnected event — a room that was never connected never sends one.
  const onForcedDisconnect = useCallback((): void => {
    isDisconnectForcedRef.current = true
    setConnectionState(initialConnectionState)
  }, [])

  const onDisconnect = useCallback((): void => {
    setConnectionState(initialConnectionState)

    if (isDisconnectForcedRef.current) {
      isDisconnectForcedRef.current = false
      return
    }

    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/")
    }
  }, [router])

  const onConnectionError = useCallback((error?: Error): void => {
    console.error("Connection error: ", error)
    setConnectionState({
      token: null,
      error: error?.message || "Failed to connect to the room",
    })
  }, [])

  if (connectionState.token === null) {
    return (
      <JoinScreen
        roomSlug={slug}
        error={connectionState.error}
        onJoined={onJoined}
      />
    )
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
      <ActiveRoom roomSlug={slug} onForcedDisconnect={onForcedDisconnect} />
    </LiveKitRoom>
  )
}

export default function RoomScreen() {
  const { slug: rawSlug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  // Deep-link params are untrusted input and reach the LiveKit room name
  // directly, so "Team%20Sync", "Team-Sync" and "team-sync" must all resolve
  // to the one room a home-screen user reaches by typing the same text.
  const slug = slugify(rawSlug ?? "")
  const isCanonical = slug === rawSlug
  // Defense-in-depth, not the primary guard: app/+native-intent.ts already
  // canonicalizes every incoming system link before the router ever sees it,
  // so in practice this screen never receives a non-canonical param that way.
  // It still matters for any other route to this screen with a raw param —
  // if one ever did produce a non-canonical duplicate of the room already
  // open elsewhere in the stack, this instance is a duplicate to dismiss, not
  // a fresh room to join.
  const isDuplicateOfActiveRoom =
    !isCanonical && slug !== "" && slug === getActiveRoomSlug()

  useEffect(() => {
    if (isCanonical) {
      return
    }

    if (isDuplicateOfActiveRoom && router.canGoBack()) {
      // Dismiss this duplicate rather than joining afresh — the existing
      // screen underneath is already connected to this room.
      router.back()
      return
    }

    // Fix the URL/history entry to the canonical form.
    router.replace(slug ? `/${slug}` : "/")
  }, [isCanonical, isDuplicateOfActiveRoom, slug, router])

  if (!slug || isDuplicateOfActiveRoom) {
    return null
  }

  // Keyed by the canonical slug so every piece of per-room state (token, join
  // form, active room registration) is rebuilt from scratch when the room
  // actually changes, even when expo-router reuses this screen instance
  // instead of remounting it — but stays mounted across a non-canonical link
  // to this same room, since the key does not change.
  return <Room key={slug} slug={slug} />
}
