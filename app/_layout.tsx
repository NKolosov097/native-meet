import { useEffect } from "react"
import { LogBox } from "react-native"

import * as Linking from "expo-linking"
import { Stack } from "expo-router"

import { SafeAreaProvider } from "react-native-safe-area-context"

import { GridPreview } from "@/components/room/grid/GridPreview"
import { disconnectActiveRoom } from "@/services/activeRoomConnection"

export default function RootLayout() {
  const isGridPreview = process.env.EXPO_PUBLIC_GRID_PREVIEW === "1"

  useEffect(() => {
    LogBox.ignoreLogs([
      "An event listener wasn't added because it has been added already",
      "Warning: WebRTC",
    ])
  }, [])

  useEffect(() => {
    const subscription = Linking.addEventListener("url", () => {
      disconnectActiveRoom().catch(error => {
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
