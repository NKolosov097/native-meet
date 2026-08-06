import { useCallback, useRef } from "react"
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { useLocalParticipant, useRoomContext } from "@livekit/react-native"

import { BACKGROUND_COLORS, TEXT_COLORS } from "@/constants/colors"

import { CameraControl } from "./controls/CameraControl"
import { MicrophoneControl } from "./controls/MicrophoneControl"
import { ScreenModeControl } from "./controls/ScreenModeControl"

export const ControlBar = () => {
  const room = useRoomContext()
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } =
    useLocalParticipant()
  const isTogglingMicrophone = useRef<boolean>(false)
  const isTogglingCamera = useRef<boolean>(false)

  const toggleMute = useCallback(async (): Promise<void> => {
    if (isTogglingMicrophone.current) return

    isTogglingMicrophone.current = true

    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
    } catch (error) {
      console.error("Error toggling microphone: ", error)
      Alert.alert("Error", "Failed to toggle microphone")
    } finally {
      isTogglingMicrophone.current = false
    }
  }, [localParticipant, isMicrophoneEnabled])

  const toggleVideo = useCallback(async (): Promise<void> => {
    if (isTogglingCamera.current) return

    isTogglingCamera.current = true

    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled)
    } catch (error) {
      console.error("Error toggling camera: ", error)
      Alert.alert("Error", "Failed to toggle camera")
    } finally {
      isTogglingCamera.current = false
    }
  }, [localParticipant, isCameraEnabled])

  const disconnect = useCallback(async (): Promise<void> => {
    if (!room) return

    try {
      await room.disconnect()
    } catch (error) {
      console.error("Error disconnecting: ", error)
    }
  }, [room])

  return (
    <View style={styles.controlsContainer}>
      {/* Microphone control component with a dropdown list */}
      <MicrophoneControl
        isMuted={!isMicrophoneEnabled}
        onToggleMute={toggleMute}
      />

      {/* Camera control component with a dropdown list */}
      <CameraControl
        isVideoEnabled={isCameraEnabled}
        onToggleVideo={toggleVideo}
      />

      {/* Screen mode control component */}
      <ScreenModeControl />

      {/* Disconnect button */}
      <TouchableOpacity
        style={[styles.controlButton, styles.disconnectButton]}
        onPress={disconnect}
        accessibilityLabel="Disconnect from room"
      >
        <Text style={styles.controlButtonText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: BACKGROUND_COLORS.tertiary,
  },
  controlButton: {
    backgroundColor: BACKGROUND_COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 80,
    alignItems: "center",
  },
  controlButtonText: {
    color: TEXT_COLORS.light,
    fontSize: 14,
    fontWeight: "600",
  },
  disconnectButton: {
    backgroundColor: TEXT_COLORS.danger,
  },
})
