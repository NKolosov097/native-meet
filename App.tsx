import { useCallback, useEffect, useState } from "react"
import {
  Alert,
  LogBox,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import { StatusBar } from "expo-status-bar"

import { LiveKitRoom } from "@livekit/react-native"

import { ActiveRoom } from "./components/room/ActiveRoom"

import type { AppConfig, ConnectionState } from "./types"

const initialConfig: AppConfig = {
  url: "",
  token: "",
}

const initialConnectionState: ConnectionState = {
  connected: false,
  connecting: false,
}

// Главный компонент приложения
export default () => {
  const [config, setConfig] = useState<AppConfig>(() => initialConfig)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    () => initialConnectionState,
  )

  // Подавляем некритичные предупреждения
  useEffect(() => {
    LogBox.ignoreLogs([
      "An event listener wasn't added because it has been added already",
      "Warning: WebRTC",
    ])
  }, [])

  const updateUrl = useCallback((url: string): void => {
    setConfig(prev => ({ ...prev, url }))
  }, [])

  const updateToken = useCallback((token: string): void => {
    setConfig(prev => ({ ...prev, token }))
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

    setConnectionState(prev => ({ ...prev, connected: true }))
  }, [config])

  const onDisconnect = useCallback((): void => {
    setConnectionState(prev => ({ ...prev, connected: false }))
  }, [])

  const onConnectionError = useCallback((error?: Error): void => {
    console.error("Connection error: ", error)
    setConnectionState(prev => ({
      ...prev,
      connected: false,
      error: error?.message || "Connection failed",
    }))
    Alert.alert(
      "Connection Error",
      error?.message || "Failed to connect to the room",
    )
  }, [])

  if (connectionState.connected) {
    return (
      <LiveKitRoom
        serverUrl={config.url}
        token={config.token}
        connect
        onDisconnected={onDisconnect}
        onError={onConnectionError}
        options={{}}
      >
        <ActiveRoom />
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
})
