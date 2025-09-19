import { SafeAreaView, StyleSheet } from "react-native"

import { StatusBar } from "expo-status-bar"

import { VideoConference } from "./VideoConference"
import { ControlBar } from "./ControlBar"

export const ActiveRoom = () => {
  return (
    <SafeAreaView style={styles.roomContainer}>
      <VideoConference />
      <ControlBar />
      <StatusBar style="dark" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  roomContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
})
