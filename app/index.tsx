import { useCallback, useState } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { SafeAreaView } from "react-native-safe-area-context"

import { BORDER_RADIUSES } from "@/constants/borderRadiuses"
import {
  BACKGROUND_COLORS,
  BORDER_COLORS,
  TEXT_COLORS,
} from "@/constants/colors"
import { configError } from "@/constants/env"
import { generateRoomSlug, slugify } from "@/services/roomSlug"

export default function HomeScreen() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string>("")

  const joinRoom = useCallback(
    (slug: string): void => {
      router.push(`/${slug}`)
    },
    [router],
  )

  const onJoinByCode = useCallback((): void => {
    const slug = slugify(roomCode)
    if (!slug) return
    joinRoom(slug)
  }, [roomCode, joinRoom])

  const onCreateRoom = useCallback((): void => {
    joinRoom(generateRoomSlug())
  }, [joinRoom])

  const isDisabled = configError !== null
  const isJoinDisabled = isDisabled || slugify(roomCode) === ""

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Native Meet</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Room code:</Text>
          <TextInput
            style={styles.input}
            value={roomCode}
            onChangeText={setRoomCode}
            placeholder="Enter a room code"
            placeholderTextColor={TEXT_COLORS.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isDisabled}
            returnKeyType="go"
            onSubmitEditing={onJoinByCode}
            accessibilityLabel="Room code"
          />
        </View>

        {configError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{configError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.joinButton,
            isJoinDisabled ? styles.joinButtonDisabled : undefined,
          ]}
          onPress={onJoinByCode}
          disabled={isJoinDisabled}
          accessibilityLabel="Join room"
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createButton,
            isDisabled ? styles.joinButtonDisabled : undefined,
          ]}
          onPress={onCreateRoom}
          disabled={isDisabled}
          accessibilityLabel="Create room"
        >
          <Text style={styles.joinButtonText}>Create a new room</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: TEXT_COLORS.light,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: TEXT_COLORS.light,
  },
  input: {
    backgroundColor: TEXT_COLORS.light,
    borderWidth: 1,
    borderColor: BORDER_COLORS.lightBorder,
    borderRadius: BORDER_RADIUSES.medium,
    padding: 15,
    fontSize: 16,
    color: TEXT_COLORS.secondary,
    minHeight: 50,
  },
  errorContainer: {
    backgroundColor: BACKGROUND_COLORS.tertiary,
    borderRadius: BORDER_RADIUSES.medium,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: BORDER_COLORS.danger,
  },
  errorText: {
    color: TEXT_COLORS.danger,
    fontSize: 14,
    fontWeight: "500",
  },
  joinButton: {
    backgroundColor: BACKGROUND_COLORS.primary,
    borderRadius: BORDER_RADIUSES.medium,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    minHeight: 56,
    justifyContent: "center",
  },
  createButton: {
    backgroundColor: BACKGROUND_COLORS.secondary,
    borderRadius: BORDER_RADIUSES.medium,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    minHeight: 56,
    justifyContent: "center",
  },
  joinButtonDisabled: {
    backgroundColor: BACKGROUND_COLORS.disabled,
  },
  joinButtonText: {
    color: TEXT_COLORS.light,
    fontSize: 18,
    fontWeight: "600",
  },
})
