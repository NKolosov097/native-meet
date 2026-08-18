import { StyleSheet } from "react-native"

import { StatusBar } from "expo-status-bar"

import { SafeAreaView } from "react-native-safe-area-context"

import { BACKGROUND_COLORS } from "@/constants/colors"

import { ControlBar } from "./ControlBar"
import { VideoConference } from "./VideoConference"

export const ActiveRoom = () => {
  return (
    <SafeAreaView style={styles.roomContainer}>
      <VideoConference />
      <ControlBar />
      <StatusBar style="light" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  roomContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.black,
  },
})
