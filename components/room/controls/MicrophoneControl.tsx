import React, { useCallback, useEffect, useState } from "react"
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Pressable,
} from "react-native"

import { useRoomContext } from "@livekit/react-native"

import {
  BACKGROUND_COLORS,
  TEXT_COLORS,
  SHADOW_COLORS,
} from "@/constants/colors"

interface AudioDevice {
  deviceId: string
  label: string
  kind: "audioinput" | "audiooutput"
}

interface MicrophoneControlProps {
  isMuted: boolean
  onToggleMute: () => void
}

export const MicrophoneControl = ({
  isMuted,
  onToggleMute,
}: MicrophoneControlProps) => {
  const room = useRoomContext()
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>("")
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>("")

  // Закрываем выпадающий список при клике вне области
  const handleOutsidePress = useCallback(() => {
    setIsDropdownVisible(false)
  }, [])

  // Получаем список аудио устройств
  const loadAudioDevices = useCallback(async () => {
    try {
      if (navigator?.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const deviceList = devices
          .filter(
            device =>
              device.kind === "audioinput" || device.kind === "audiooutput",
          )
          .map(device => ({
            deviceId: device.deviceId,
            label:
              device.label ||
              `${device.kind === "audioinput" ? "Микрофон" : "Динамик"} ${device.deviceId.slice(0, 8)}`,
            kind: device.kind as "audioinput" | "audiooutput",
          }))

        setAudioDevices(deviceList)
      }
    } catch (error) {
      console.error("Ошибка при получении списка аудио устройств:", error)
    }
  }, [])

  useEffect(() => {
    loadAudioDevices()
  }, [loadAudioDevices])

  const handleDeviceSelect = useCallback(
    async (deviceId: string, kind: "audioinput" | "audiooutput") => {
      try {
        if (!room) return

        if (kind === "audioinput") {
          // Переключаем микрофон
          await room.switchActiveDevice("audioinput", deviceId)
          setSelectedInputDevice(deviceId)
        } else {
          // Переключаем динамики
          await room.switchActiveDevice("audiooutput", deviceId)
          setSelectedOutputDevice(deviceId)
        }

        setIsDropdownVisible(false)
      } catch (error) {
        console.error("Ошибка при переключении аудио устройства:", error)
        Alert.alert("Ошибка", "Не удалось переключить аудио устройство")
      }
    },
    [room],
  )

  const inputDevices = audioDevices.filter(
    device => device.kind === "audioinput",
  )
  const outputDevices = audioDevices.filter(
    device => device.kind === "audiooutput",
  )
  const hasInputAndOutput = inputDevices.length > 0 && outputDevices.length > 0

  return (
    <>
      <View style={styles.container}>
        {/* Кнопка микрофона */}
        <TouchableOpacity
          style={[styles.micButton, isMuted && styles.micButtonMuted]}
          onPress={onToggleMute}
          accessibilityLabel={
            isMuted ? "Включить микрофон" : "Выключить микрофон"
          }
        >
          <Text style={styles.micIcon}>🎤</Text>
        </TouchableOpacity>

        {/* Кнопка выпадающего списка */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsDropdownVisible(!isDropdownVisible)}
          accessibilityLabel="Выбрать аудио устройство"
        >
          <Text
            style={[
              styles.dropdownArrow,
              isDropdownVisible && styles.dropdownArrowUp,
            ]}
          >
            ▼
          </Text>
        </TouchableOpacity>

        {/* Выпадающий список устройств */}
        {isDropdownVisible && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={styles.deviceList}>
              {hasInputAndOutput ? (
                <>
                  {/* Секция устройств вывода */}
                  <Text style={styles.sectionTitle}>Выберите динамики</Text>
                  {outputDevices.map(device => (
                    <TouchableOpacity
                      key={device.deviceId}
                      style={[
                        styles.deviceItem,
                        selectedOutputDevice === device.deviceId &&
                          styles.selectedDevice,
                      ]}
                      onPress={() =>
                        handleDeviceSelect(device.deviceId, "audiooutput")
                      }
                    >
                      <Text style={styles.deviceLabel}>{device.label}</Text>
                      {selectedOutputDevice === device.deviceId && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* Секция устройств ввода */}
                  <Text
                    style={[styles.sectionTitle, styles.sectionTitleSecond]}
                  >
                    Выберите микрофон
                  </Text>
                  {inputDevices.map(device => (
                    <TouchableOpacity
                      key={device.deviceId}
                      style={[
                        styles.deviceItem,
                        selectedInputDevice === device.deviceId &&
                          styles.selectedDevice,
                      ]}
                      onPress={() =>
                        handleDeviceSelect(device.deviceId, "audioinput")
                      }
                    >
                      <Text style={styles.deviceLabel}>{device.label}</Text>
                      {selectedInputDevice === device.deviceId && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  {/* Общий список всех аудио устройств */}
                  <Text style={styles.sectionTitle}>Выберите микрофон</Text>
                  {audioDevices.map(device => (
                    <TouchableOpacity
                      key={device.deviceId}
                      style={[
                        styles.deviceItem,
                        ((device.kind === "audioinput" &&
                          selectedInputDevice === device.deviceId) ||
                          (device.kind === "audiooutput" &&
                            selectedOutputDevice === device.deviceId)) &&
                          styles.selectedDevice,
                      ]}
                      onPress={() =>
                        handleDeviceSelect(device.deviceId, device.kind)
                      }
                    >
                      <Text style={styles.deviceLabel}>
                        {device.label} (
                        {device.kind === "audioinput" ? "Ввод" : "Вывод"})
                      </Text>
                      {((device.kind === "audioinput" &&
                        selectedInputDevice === device.deviceId) ||
                        (device.kind === "audiooutput" &&
                          selectedOutputDevice === device.deviceId)) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {audioDevices.length === 0 && (
                <Text style={styles.noDevicesText}>
                  Аудио устройства не найдены
                </Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Overlay для закрытия списка при клике вне области */}
      {isDropdownVisible && (
        <Pressable
          style={styles.overlay}
          onPress={handleOutsidePress}
          accessibilityLabel="Закрыть список устройств"
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 1000,
  },
  micButton: {
    backgroundColor: BACKGROUND_COLORS.secondary,
    width: 50,
    height: 50,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  micButtonMuted: {
    backgroundColor: TEXT_COLORS.danger,
  },
  micIcon: {
    fontSize: 20,
  },
  dropdownButton: {
    backgroundColor: BACKGROUND_COLORS.secondary,
    width: 30,
    height: 50,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    marginLeft: -5,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownArrow: {
    color: TEXT_COLORS.light,
    fontSize: 12,
    fontWeight: "bold",
  },
  dropdownArrowUp: {
    transform: [{ rotate: "180deg" }],
  },
  dropdownContainer: {
    position: "absolute",
    bottom: 55,
    left: 0,
    backgroundColor: BACKGROUND_COLORS.secondary,
    borderRadius: 12,
    minWidth: 300,
    maxHeight: 400,
    shadowColor: SHADOW_COLORS.black,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  deviceList: {
    maxHeight: 350,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_COLORS.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BACKGROUND_COLORS.lightBackground,
  },
  sectionTitleSecond: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: 0,
  },
  deviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BACKGROUND_COLORS.lightBackground,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BACKGROUND_COLORS.transparent,
    zIndex: 999,
  },
  selectedDevice: {
    backgroundColor: BACKGROUND_COLORS.primary,
  },
  deviceLabel: {
    fontSize: 14,
    color: TEXT_COLORS.light,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    color: TEXT_COLORS.light,
    fontWeight: "bold",
  },
  noDevicesText: {
    fontSize: 14,
    color: TEXT_COLORS.light,
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
})
