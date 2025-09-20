import { useCallback, useState } from "react"
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { useRoomContext } from "@livekit/react-native"

import { BACKGROUND_COLORS, TEXT_COLORS } from "../../constants/colors"

import type { VideoControlsState } from "../../types"

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
      <TouchableOpacity
        style={[
          styles.controlButton,
          controlsState.isMuted && styles.controlButtonActive,
        ]}
        onPress={toggleMute}
        accessibilityLabel={
          controlsState.isMuted ? "Unmute microphone" : "Mute microphone"
        }
      >
        <Text style={styles.controlButtonText}>
          {controlsState.isMuted ? "Unmute" : "Mute"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.controlButton,
          !controlsState.isVideoEnabled && styles.controlButtonActive,
        ]}
        onPress={toggleVideo}
        accessibilityLabel={
          controlsState.isVideoEnabled ? "Stop video" : "Start video"
        }
      >
        <Text style={styles.controlButtonText}>
          {controlsState.isVideoEnabled ? "Stop Video" : "Start Video"}
        </Text>
      </TouchableOpacity>

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
    justifyContent: "space-around",
    alignItems: "center",
    padding: 20,
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
  controlButtonActive: {
    backgroundColor: TEXT_COLORS.danger,
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
