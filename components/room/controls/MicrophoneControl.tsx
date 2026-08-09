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
import { Track } from "livekit-client"

import { MicDisabledIcon, MicIcon } from "@/components/icons"
import {
  subscribeToMediaDevicesChanged,
  useActiveMediaDevice,
} from "@/components/room/controls/useActiveMediaDevice"
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
  onToggleMute: VoidFunction
  isDropdownVisible: boolean
  onToggleDropdown: VoidFunction
  onCloseDropdown: VoidFunction
}

export const MicrophoneControl = ({
  isMuted,
  onToggleMute,
  isDropdownVisible,
  onToggleDropdown,
  onCloseDropdown,
}: MicrophoneControlProps) => {
  const room = useRoomContext()
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const selectedInputDevice = useActiveMediaDevice(
    room,
    Track.Source.Microphone,
  )
  const selectedOutputDevice = useActiveMediaDevice(room, "audiooutput")

  // Close the dropdown list on a click outside its area
  const handleOutsidePress = useCallback(() => {
    onCloseDropdown()
  }, [onCloseDropdown])

  // Get the list of audio devices
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
              `${device.kind === "audioinput" ? "Microphone" : "Speaker"} ${device.deviceId.slice(0, 8)}`,
            kind: device.kind as "audioinput" | "audiooutput",
          }))

        setAudioDevices(deviceList)
      }
    } catch (error) {
      console.error("Error loading audio devices: ", error)
    }
  }, [])

  useEffect(() => {
    loadAudioDevices()

    return subscribeToMediaDevicesChanged(room, loadAudioDevices)
  }, [room, loadAudioDevices])

  const handleDeviceSelect = useCallback(
    async (deviceId: string, kind: "audioinput" | "audiooutput") => {
      try {
        if (!room) return

        if (kind === "audioinput") {
          // Switch the microphone
          await room.switchActiveDevice("audioinput", deviceId)
        } else {
          // Switch the speakers
          await room.switchActiveDevice("audiooutput", deviceId)
        }

        onCloseDropdown()
      } catch (error) {
        console.error("Error switching audio device: ", error)
        Alert.alert("Error", "Failed to switch audio device")
      }
    },
    [room, onCloseDropdown],
  )

  const inputDevices = audioDevices.filter(
    device => device.kind === "audioinput",
  )
  const outputDevices = audioDevices.filter(
    device => device.kind === "audiooutput",
  )

  return (
    <>
      <View style={styles.container}>
        {/* Microphone button */}
        <TouchableOpacity
          style={styles.micButton}
          onPress={onToggleMute}
          accessibilityLabel={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <MicDisabledIcon /> : <MicIcon />}
        </TouchableOpacity>

        {/* Dropdown list button */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={onToggleDropdown}
          accessibilityLabel="Select audio device"
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

        {/* Device dropdown list */}
        {isDropdownVisible && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={styles.deviceList}>
              {inputDevices.length > 0 && (
                <>
                  {/* Input devices section */}
                  <Text style={styles.sectionTitle}>Select microphone</Text>
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
              )}

              {outputDevices.length > 0 && (
                <>
                  <Text
                    style={[styles.sectionTitle, styles.sectionTitleSecond]}
                  >
                    Select speakers
                  </Text>
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
                </>
              )}

              {audioDevices.length === 0 && (
                <Text style={styles.noDevicesText}>No audio devices found</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Overlay to close the list on a click outside its area */}
      {isDropdownVisible && (
        <Pressable
          style={styles.overlay}
          onPress={handleOutsidePress}
          accessibilityLabel="Close device list"
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
