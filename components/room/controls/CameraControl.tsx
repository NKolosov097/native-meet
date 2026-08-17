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

import { CameraDisabledIcon, CameraIcon } from "@/components/icons"
import {
  initializeActiveMediaDevice,
  subscribeToMediaDevicesChanged,
  useActiveMediaDevice,
} from "@/components/room/controls/useActiveMediaDevice"
import { useBoundedDeviceDropdownLayout } from "@/components/room/controls/useBoundedDeviceDropdownLayout"
import { BORDER_RADIUSES } from "@/constants/borderRadiuses"
import {
  BACKGROUND_COLORS,
  TEXT_COLORS,
  SHADOW_COLORS,
} from "@/constants/colors"

interface VideoDevice {
  deviceId: string
  label: string
  kind: "videoinput"
}

interface CameraControlProps {
  isVideoEnabled: boolean
  onToggleVideo: VoidFunction
  isDropdownVisible: boolean
  onToggleDropdown: VoidFunction
  onCloseDropdown: VoidFunction
}

export const CameraControl = ({
  isVideoEnabled,
  onToggleVideo,
  isDropdownVisible,
  onToggleDropdown,
  onCloseDropdown,
}: CameraControlProps) => {
  const room = useRoomContext()
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([])
  const selectedVideoDevice = useActiveMediaDevice(room, Track.Source.Camera)
  const { containerRef, onContainerLayout, dropdownPositionStyle, overlayStyle } =
    useBoundedDeviceDropdownLayout(isDropdownVisible)

  // Close the dropdown list on a click outside its area
  const handleOutsidePress = useCallback(() => {
    onCloseDropdown()
  }, [onCloseDropdown])

  // Get the list of video devices
  const loadVideoDevices = useCallback(async () => {
    try {
      if (navigator?.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const deviceList = devices
          .filter(device => device.kind === "videoinput")
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
            kind: device.kind as "videoinput",
          }))

        setVideoDevices(deviceList)
        await initializeActiveMediaDevice(room, Track.Source.Camera, deviceList)
      }
    } catch (error) {
      console.error("Error loading video devices: ", error)
    }
  }, [room])

  useEffect(() => {
    loadVideoDevices()

    return subscribeToMediaDevicesChanged(room, loadVideoDevices)
  }, [room, loadVideoDevices])

  const handleDeviceSelect = useCallback(
    async (deviceId: string) => {
      try {
        if (!room) return

        // Switch the camera
        await room.switchActiveDevice("videoinput", deviceId)
        onCloseDropdown()
      } catch (error) {
        console.error("Error switching camera: ", error)
        Alert.alert("Error", "Failed to switch camera")
      }
    },
    [room, onCloseDropdown],
  )

  return (
    <>
      <View
        ref={containerRef}
        style={styles.container}
        onLayout={onContainerLayout}
      >
        {/* Camera button */}
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={onToggleVideo}
          accessibilityLabel={
            isVideoEnabled ? "Turn off camera" : "Turn on camera"
          }
        >
          {isVideoEnabled ? <CameraIcon /> : <CameraDisabledIcon />}
        </TouchableOpacity>

        {/* Dropdown list button */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={onToggleDropdown}
          accessibilityLabel="Select camera"
        >
          <Text
            style={[
              styles.dropdownArrow,
              isDropdownVisible ? styles.dropdownArrowUp : undefined,
            ]}
          >
            ▼
          </Text>
        </TouchableOpacity>

        {/* Camera dropdown list */}
        {isDropdownVisible && (
          <View style={[styles.dropdownContainer, dropdownPositionStyle]}>
            <ScrollView style={styles.deviceList}>
              <Text style={styles.sectionTitle}>Select camera</Text>

              {videoDevices.map(device => (
                <TouchableOpacity
                  key={device.deviceId}
                  style={[
                    styles.deviceItem,
                    selectedVideoDevice === device.deviceId
                      ? styles.selectedDevice
                      : undefined,
                  ]}
                  onPress={() => handleDeviceSelect(device.deviceId)}
                >
                  <Text style={styles.deviceLabel}>{device.label}</Text>
                </TouchableOpacity>
              ))}

              {videoDevices.length === 0 && (
                <Text style={styles.noDevicesText}>No cameras found</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Overlay to close the list on a click outside its area */}
      {isDropdownVisible && (
        <Pressable
          style={[styles.overlay, overlayStyle]}
          onPress={handleOutsidePress}
          accessibilityLabel="Close camera list"
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
    zIndex: 999,
  },
  cameraButton: {
    backgroundColor: BACKGROUND_COLORS.secondary,
    width: 50,
    height: 50,
    borderTopLeftRadius: BORDER_RADIUSES.pill,
    borderBottomLeftRadius: BORDER_RADIUSES.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownButton: {
    backgroundColor: BACKGROUND_COLORS.secondary,
    width: 30,
    height: 50,
    borderTopRightRadius: BORDER_RADIUSES.pill,
    borderBottomRightRadius: BORDER_RADIUSES.pill,
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
    backgroundColor: BACKGROUND_COLORS.lightBackground,
    borderRadius: BORDER_RADIUSES.large,
    maxHeight: 400,
    shadowColor: SHADOW_COLORS.black,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  deviceList: {
    maxHeight: 350,
    borderRadius: BORDER_RADIUSES.large,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_COLORS.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BACKGROUND_COLORS.lightBackground,
  },
  deviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BACKGROUND_COLORS.tertiary,
  },
  overlay: {
    position: "absolute",
    backgroundColor: BACKGROUND_COLORS.transparent,
    zIndex: 998,
  },
  selectedDevice: {
    backgroundColor: BACKGROUND_COLORS.primary,
  },
  deviceLabel: {
    fontSize: 14,
    color: TEXT_COLORS.light,
    flex: 1,
  },
  noDevicesText: {
    fontSize: 14,
    color: TEXT_COLORS.light,
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
})
