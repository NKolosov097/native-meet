import { useState, useCallback, useContext, useEffect, useMemo } from "react"
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  LogBox,
} from "react-native"

import { StatusBar } from "expo-status-bar"

import {
  LiveKitRoom,
  useTracks,
  useParticipants,
  RoomContext,
  VideoTrack,
} from "@livekit/react-native"
import { Track } from "livekit-client"

import type { AppConfig, ConnectionState, VideoControlsState } from "./types"

const { width, height } = Dimensions.get("window")

const tracksOption: Track.Source[] = [
  Track.Source.Camera,
  Track.Source.ScreenShare,
  Track.Source.Microphone,
]

// Компонент для отображения участников (Participant)
function VideoConference() {
  const participants = useParticipants()
  const tracks = useTracks(tracksOption)

  if (tracks.length === 0) {
    return (
      <View style={styles.noVideo}>
        <Text style={styles.noVideoText}>No video streams available</Text>
      </View>
    )
  }

  return (
    <View style={styles.participantsContainer}>
      {tracks.map((track) => (
        <View key={track.participant.sid} style={styles.participantContainer}>
          <VideoTrack
            style={styles.videoView}
            trackRef={track}
            mirror={track.participant.isLocal}
          />

          <Text style={styles.participantName}>
            {track.participant.name || track.participant.identity}
            {track.participant.isLocal ? " (You)" : ""}
          </Text>
        </View>
      ))}
    </View>
  )
}

const initialVideoControlsState: VideoControlsState = {
  isMuted: false,
  isVideoEnabled: true,
  isSpeaking: false,
}

// Компонент панели управления (ControlBar)
function ControlBar() {
  const room = useContext(RoomContext)
  const [controlsState, setControlsState] = useState<VideoControlsState>(
    () => initialVideoControlsState
  )

  const toggleMute = useCallback(async (): Promise<void> => {
    if (!room) return

    try {
      await room.localParticipant.setMicrophoneEnabled(!controlsState.isMuted)
      setControlsState((prev) => ({ ...prev, isMuted: !prev.isMuted }))
    } catch (error) {
      console.error("Error toggling microphone: ", error)
      Alert.alert("Error", "Failed to toggle microphone")
    }
  }, [room, controlsState.isMuted])

  const toggleVideo = useCallback(async (): Promise<void> => {
    if (!room) return

    try {
      await room.localParticipant.setCameraEnabled(
        !controlsState.isVideoEnabled
      )
      setControlsState((prev) => ({
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

// Главный компонент комнаты (ActiveRoom)
function RoomView() {
  return (
    <SafeAreaView style={styles.roomContainer}>
      <VideoConference />
      <ControlBar />
      <StatusBar style="light" />
    </SafeAreaView>
  )
}

const initialConfig: AppConfig = {
  url: "",
  token: "",
}

const initialConnectionState: ConnectionState = {
  connected: false,
  connecting: false,
}

// Главный компонент приложения
export default function App() {
  const [config, setConfig] = useState<AppConfig>(() => initialConfig)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    () => initialConnectionState
  )

  // Подавляем некритичные предупреждения
  useEffect(() => {
    LogBox.ignoreLogs([
      "An event listener wasn't added because it has been added already",
      "Warning: WebRTC",
    ])
  }, [])

  const updateUrl = useCallback((url: string): void => {
    setConfig((prev) => ({ ...prev, url }))
  }, [])

  const updateToken = useCallback((token: string): void => {
    setConfig((prev) => ({ ...prev, token }))
  }, [])

  const connect = useCallback((): void => {
    if (!config.url.trim() || !config.token.trim()) {
      Alert.alert("Error", "Please enter both URL and token")
      return
    }

    // Базовая валидация URL
    try {
      const urlObj = new URL(config.url)
      if (!["ws:", "wss:"].includes(urlObj.protocol)) {
        Alert.alert("Error", "URL must use ws:// or wss:// protocol")
        return
      }
    } catch {
      Alert.alert("Error", "Please enter a valid WebSocket URL")
      return
    }

    setConnectionState((prev) => ({ ...prev, connected: true }))
  }, [config])

  const onDisconnect = useCallback((): void => {
    setConnectionState((prev) => ({ ...prev, connected: false }))
  }, [])

  const onConnectionError = useCallback((error?: Error): void => {
    console.error("Connection error: ", error)
    setConnectionState((prev) => ({
      ...prev,
      connected: false,
      error: error?.message || "Connection failed",
    }))
    Alert.alert(
      "Connection Error",
      error?.message || "Failed to connect to the room"
    )
  }, [])

  if (connectionState.connected) {
    return (
      <LiveKitRoom
        serverUrl={config.url}
        token={config.token}
        connect={true}
        onDisconnected={onDisconnect}
        onError={onConnectionError}
        options={{}}
      >
        <RoomView />
      </LiveKitRoom>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.connectContainer}>
        <Text style={styles.title}>Native Meet</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Server URL:</Text>
          <TextInput
            style={styles.input}
            value={config.url}
            onChangeText={updateUrl}
            placeholder="wss://your-livekit-server.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="LiveKit server URL"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Token:</Text>
          <TextInput
            style={styles.input}
            value={config.token}
            onChangeText={updateToken}
            placeholder="Enter your access token"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            multiline={true}
            numberOfLines={3}
            secureTextEntry={false}
            accessibilityLabel="Access token"
          />
        </View>

        {connectionState.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{connectionState.error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.connectButton,
            connectionState.connecting && styles.connectButtonDisabled,
          ]}
          onPress={connect}
          disabled={connectionState.connecting}
          accessibilityLabel="Connect to room"
        >
          <Text style={styles.connectButtonText}>
            {connectionState.connecting ? "Connecting..." : "Connect"}
          </Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  connectContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#fff",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#333",
    minHeight: 50,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    fontWeight: "500",
  },
  connectButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  connectButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  helpContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  roomContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 15,
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  participantsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
  participantContainer: {
    width: width / 2 - 15,
    height: height / 3,
    margin: 5,
    backgroundColor: "#333",
    borderRadius: 8,
    overflow: "hidden",
  },
  videoView: {
    flex: 1,
  },
  participantName: {
    position: "absolute",
    bottom: 10,
    left: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  noVideo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noVideoText: {
    color: "#fff",
    fontSize: 16,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  controlButton: {
    backgroundColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 80,
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: "#FF3B30",
  },
  disconnectButton: {
    backgroundColor: "#FF3B30",
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
})
