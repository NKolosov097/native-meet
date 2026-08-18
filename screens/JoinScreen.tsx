import { useCallback, useRef, useState } from "react"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import { StatusBar } from "expo-status-bar"

import { SafeAreaView } from "react-native-safe-area-context"

import { BORDER_RADIUSES } from "@/constants/borderRadiuses"
import {
  BACKGROUND_COLORS,
  BORDER_COLORS,
  TEXT_COLORS,
} from "@/constants/colors"
import { configError } from "@/constants/env"
import { fetchParticipantToken } from "@/services/livekitToken"

interface JoinScreenProps {
  // Slug of the room being joined, shown to the participant
  roomSlug: string
  // Message from the most recent failed join/connection attempt, if any
  error?: string
  // Called with the acquired token once the user successfully joins
  onJoined: (token: string) => void
}

// Login screen: the participant enters a name, the token is requested for them
export const JoinScreen = ({ roomSlug, error, onJoined }: JoinScreenProps) => {
  const [name, setName] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [hasStartedJoin, setHasStartedJoin] = useState<boolean>(false)
  const isJoiningRef = useRef<boolean>(false)

  const join = useCallback(async (): Promise<void> => {
    if (isJoiningRef.current) {
      return
    }

    const participantName = name.trim()

    if (!participantName) {
      setTokenError("Please enter your name")
      return
    }

    isJoiningRef.current = true
    setHasStartedJoin(true)
    setIsLoading(true)
    setTokenError(null)

    try {
      const token = await fetchParticipantToken(participantName, roomSlug)
      onJoined(token)
    } catch (cause) {
      console.error("Failed to get an access token: ", cause)
      setTokenError(
        cause instanceof Error
          ? cause.message
          : "Failed to get an access token",
      )
    } finally {
      setIsLoading(false)
      isJoiningRef.current = false
    }
  }, [name, roomSlug, onJoined])

  const message =
    configError ?? tokenError ?? (hasStartedJoin ? undefined : error)
  const isDisabled = isLoading || configError !== null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Native Meet</Text>
        <Text style={styles.subtitle}>Room: {roomSlug}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={TEXT_COLORS.placeholder}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isDisabled}
            returnKeyType="go"
            onSubmitEditing={join}
            accessibilityLabel="Participant name"
          />
        </View>

        {message && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{message}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.joinButton,
            isDisabled ? styles.joinButtonDisabled : undefined,
          ]}
          onPress={join}
          disabled={isDisabled}
          accessibilityLabel="Join room"
        >
          {isLoading ? (
            <ActivityIndicator color={TEXT_COLORS.light} />
          ) : (
            <Text style={styles.joinButtonText}>Join</Text>
          )}
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
    marginBottom: 8,
    color: TEXT_COLORS.light,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: TEXT_COLORS.placeholder,
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
  joinButtonDisabled: {
    backgroundColor: BACKGROUND_COLORS.disabled,
  },
  joinButtonText: {
    color: TEXT_COLORS.light,
    fontSize: 18,
    fontWeight: "600",
  },
})
