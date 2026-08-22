import { useEffect } from "react"
import { LogBox } from "react-native"

import * as Linking from "expo-linking"
import { Stack } from "expo-router"

import { SafeAreaProvider } from "react-native-safe-area-context"

import { GridPreview } from "@/components/room/grid/GridPreview"
import { disconnectActiveRoom } from "@/services/activeRoomConnection"
import { roomSlugFromUrl } from "@/services/roomSlug"

export default function RootLayout() {
  const isGridPreview = process.env.EXPO_PUBLIC_GRID_PREVIEW === "1"

  useEffect(() => {
    LogBox.ignoreLogs([
      "An event listener wasn't added because it has been added already",
      "Warning: WebRTC",
    ])
  }, [])

  useEffect(() => {
    // expo-router navigates to the linked route on its own; this only tears
    // down a call the link is taking the user away from, so no WebRTC
    // connection is left running in the background. A link to the room that
    // is already on screen is left alone by the registry.
    const subscription = Linking.addEventListener("url", ({ url }) => {
      disconnectActiveRoom(roomSlugFromUrl(url)).catch(error => {
        console.error("Failed to disconnect the active room: ", error)
      })
    })

    return () => subscription.remove()
  }, [])

  if (isGridPreview) {
    return (
      <SafeAreaProvider>
        <GridPreview />
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
