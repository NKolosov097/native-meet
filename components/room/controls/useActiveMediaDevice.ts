import { useEffect, useState } from "react"

import { Room, RoomEvent, Track } from "livekit-client"

export type InputDeviceSource = Track.Source.Camera | Track.Source.Microphone

export type ActiveDeviceTarget = InputDeviceSource

type ActiveMediaDeviceKind = "audioinput" | "videoinput"

const getMediaDeviceKind = (
  target: ActiveDeviceTarget,
): ActiveMediaDeviceKind => {
  switch (target) {
    case Track.Source.Camera:
      return "videoinput"
    case Track.Source.Microphone:
      return "audioinput"
    default: {
      const exhaustiveTarget: never = target

      return exhaustiveTarget
    }
  }
}

export const useActiveMediaDevice = (
  room: Room,
  sourceOrKind: ActiveDeviceTarget,
): string | undefined => {
  const mediaDeviceKind = getMediaDeviceKind(sourceOrKind)
  const [activeDevice, setActiveDevice] = useState(() =>
    room.getActiveDevice(mediaDeviceKind),
  )

  useEffect(() => {
    const synchronizeActiveDevice = () => {
      setActiveDevice(room.getActiveDevice(mediaDeviceKind))
    }
    const handleActiveDeviceChanged = (changedKind: MediaDeviceKind) => {
      if (changedKind === mediaDeviceKind) {
        synchronizeActiveDevice()
      }
    }

    synchronizeActiveDevice()
    room.on(RoomEvent.ActiveDeviceChanged, handleActiveDeviceChanged)

    return () => {
      room.off(RoomEvent.ActiveDeviceChanged, handleActiveDeviceChanged)
    }
  }, [room, mediaDeviceKind])

  return activeDevice
}

export const subscribeToMediaDevicesChanged = (
  room: Room,
  onChange: VoidFunction,
): VoidFunction => {
  room.on(RoomEvent.MediaDevicesChanged, onChange)

  return () => {
    room.off(RoomEvent.MediaDevicesChanged, onChange)
  }
}
