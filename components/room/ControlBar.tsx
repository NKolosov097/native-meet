import { useCallback, useState } from "react"
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { useRoomContext } from "@livekit/react-native"

import { BACKGROUND_COLORS, TEXT_COLORS } from "@/constants/colors"

import { CameraControl } from "./controls/CameraControl"
import { MicrophoneControl } from "./controls/MicrophoneControl"
import { ScreenModeControl } from "./controls/ScreenModeControl"

import type { VideoControlsState } from "@/types"

const initialVideoControlsState: VideoControlsState = {
  isMuted: false,
  isVideoEnabled: true,
  isSpeaking: false,
}

export const ControlBar = () => {
  const room = useRoomContext()
  const [controlsState, setControlsState] = useState<VideoControlsState>(
    () => initialVideoControlsState,
  )

  const toggleMute = useCallback(async (): Promise<void> => {
    if (!room) return

    try {
      await room.localParticipant.setMicrophoneEnabled(!controlsState.isMuted)
      setControlsState(prev => ({ ...prev, isMuted: !prev.isMuted }))
    } catch (error) {
      console.error("Error toggling microphone: ", error)
      Alert.alert("Error", "Failed to toggle microphone")
    }
  }, [room, controlsState.isMuted])

  const toggleVideo = useCallback(async (): Promise<void> => {
    if (!room) return

    try {
      await room.localParticipant.setCameraEnabled(
        !controlsState.isVideoEnabled,
      )
      setControlsState(prev => ({
        ...prev,
        isVideoEnabled: !prev.isVideoEnabled,
      }))
    } catch (error) {
      console.error("Error toggling camera: ", error)
      Alert.alert("Error", "Failed to toggle camera")
    }
  }, [room, controlsState.isVideoEnabled])

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
      {/* Компонент управления микрофоном с выпадающим списком */}
      <MicrophoneControl
        isMuted={controlsState.isMuted}
        onToggleMute={toggleMute}
      />

      {/* Компонент управления камерой с выпадающим списком */}
      <CameraControl
        isVideoEnabled={controlsState.isVideoEnabled}
        onToggleVideo={toggleVideo}
      />

      {/* Компонент управления режимом экрана */}
      <ScreenModeControl />

      {/* Кнопка отключения */}
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
