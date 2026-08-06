import React, { useCallback, useState } from "react"
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native"

import { BACKGROUND_COLORS, TEXT_COLORS } from "@/constants/colors"

interface ScreenModeControlProps {
  onToggleFullscreen?: () => void
}

export const ScreenModeControl: React.FC<ScreenModeControlProps> = ({
  onToggleFullscreen,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleToggleFullscreen = useCallback(() => {
    try {
      setIsFullscreen(prev => !prev)
      onToggleFullscreen?.()
    } catch (error) {
      console.error("Ошибка при переключении полноэкранного режима:", error)
      Alert.alert("Ошибка", "Не удалось переключить режим экрана")
    }
  }, [onToggleFullscreen])

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.screenButton, isFullscreen && styles.screenButtonActive]}
        onPress={handleToggleFullscreen}
        accessibilityLabel={
          isFullscreen
            ? "Выйти из полноэкранного режима"
            : "Включить полноэкранный режим"
        }
      >
        <Text style={styles.screenIcon}>{isFullscreen ? "🔲" : "⛶"}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  screenButton: {
    backgroundColor: BACKGROUND_COLORS.secondary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  screenButtonActive: {
    backgroundColor: BACKGROUND_COLORS.primary,
  },
  screenIcon: {
    fontSize: 20,
  },
})
