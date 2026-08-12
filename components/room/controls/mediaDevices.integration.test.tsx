import { Alert } from "react-native"

import { act, fireEvent, render, waitFor } from "@testing-library/react-native"

import { RoomEvent } from "livekit-client"

import { CameraControl } from "./CameraControl"
import { MicrophoneControl } from "./MicrophoneControl"

jest.mock("@livekit/react-native", () => ({
  useRoomContext: jest.fn(),
}))

const { useRoomContext: mockUseRoomContext } = jest.requireMock(
  "@livekit/react-native",
) as { useRoomContext: jest.Mock }

const devices: MediaDeviceInfo[] = [
  {
    deviceId: "mic-1",
    groupId: "audio",
    kind: "audioinput",
    label: "Desk microphone",
    toJSON: jest.fn(),
  },
  {
    deviceId: "speaker-1",
    groupId: "audio",
    kind: "audiooutput",
    label: "Desk speakers",
    toJSON: jest.fn(),
  },
  {
    deviceId: "camera-1",
    groupId: "video",
    kind: "videoinput",
    label: "Front camera",
    toJSON: jest.fn(),
  },
]

const microphoneProps = (onCloseDropdown = jest.fn()) => ({
  isMuted: false,
  onToggleMute: jest.fn(),
  isDropdownVisible: true,
  onToggleDropdown: jest.fn(),
  onCloseDropdown,
})

const cameraProps = (onCloseDropdown = jest.fn()) => ({
  isVideoEnabled: true,
  onToggleVideo: jest.fn(),
  isDropdownVisible: true,
  onToggleDropdown: jest.fn(),
  onCloseDropdown,
})

let enumeratedDevices: MediaDeviceInfo[]
let mediaDevicesChangedCallback: VoidFunction | undefined

const enumerateDevices = jest.fn<Promise<MediaDeviceInfo[]>, []>()
const addEventListener = jest.fn()
const removeEventListener = jest.fn()
const getActiveDevice = jest.fn<string | undefined, [MediaDeviceKind]>()
const switchActiveDevice = jest.fn<Promise<void>, [MediaDeviceKind, string]>()
const on = jest.fn()
const off = jest.fn()
const room = {
  getActiveDevice,
  switchActiveDevice,
  on,
  off,
}

const waitForText = async (
  view: Awaited<ReturnType<typeof render>>,
  text: string,
) => {
  await waitFor(() => {
    expect(view.getByText(text)).toBeVisible()
  })

  return view.getByText(text)
}

beforeAll(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      enumerateDevices,
      addEventListener,
      removeEventListener,
    },
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  enumeratedDevices = devices
  mediaDevicesChangedCallback = undefined
  enumerateDevices.mockImplementation(async () => enumeratedDevices)
  getActiveDevice.mockReturnValue(undefined)
  switchActiveDevice.mockResolvedValue(undefined)
  on.mockImplementation((event: RoomEvent, callback: VoidFunction) => {
    if (event === RoomEvent.MediaDevicesChanged) {
      mediaDevicesChangedCallback = callback
    }
  })
  mockUseRoomContext.mockReturnValue(room)
})

afterEach(() => {
  jest.restoreAllMocks()
})

test("discovers only audio devices in the microphone dropdown", async () => {
  const view = await render(<MicrophoneControl {...microphoneProps()} />)

  expect(await waitForText(view, "Desk microphone")).toBeVisible()
  expect(view.getByText("Desk speakers")).toBeVisible()
  expect(view.queryByText("Front camera")).not.toBeOnTheScreen()
})

test("discovers only cameras in the camera dropdown", async () => {
  const view = await render(<CameraControl {...cameraProps()} />)

  expect(await waitForText(view, "Front camera")).toBeVisible()
  expect(view.queryByText("Desk microphone")).not.toBeOnTheScreen()
  expect(view.queryByText("Desk speakers")).not.toBeOnTheScreen()
})

test("shows empty device states", async () => {
  enumeratedDevices = []
  const microphone = await render(<MicrophoneControl {...microphoneProps()} />)

  expect(await waitForText(microphone, "No audio devices found")).toBeVisible()
  const camera = await render(<CameraControl {...cameraProps()} />)
  expect(await waitForText(camera, "No cameras found")).toBeVisible()
})

test("uses fallback labels with combined audio device suffixes", async () => {
  enumeratedDevices = [
    {
      deviceId: "microphone-abcdef123",
      groupId: "audio",
      kind: "audioinput",
      label: "",
      toJSON: jest.fn(),
    },
  ]
  const microphone = await render(<MicrophoneControl {...microphoneProps()} />)

  expect(
    await waitForText(microphone, "Microphone micropho (Input)"),
  ).toBeVisible()

  await microphone.unmount()
  enumeratedDevices = [
    {
      deviceId: "speaker-abcdef123",
      groupId: "audio",
      kind: "audiooutput",
      label: "",
      toJSON: jest.fn(),
    },
  ]
  const speaker = await render(<MicrophoneControl {...microphoneProps()} />)

  expect(await waitForText(speaker, "Speaker speaker- (Output)")).toBeVisible()

  await speaker.unmount()
  enumeratedDevices = [
    {
      deviceId: "camera-abcdef123",
      groupId: "video",
      kind: "videoinput",
      label: "",
      toJSON: jest.fn(),
    },
  ]
  const camera = await render(<CameraControl {...cameraProps()} />)

  expect(await waitForText(camera, "Camera camera-a")).toBeVisible()
})

test("initializes missing audio and camera devices with the first matching device", async () => {
  const microphone = await render(<MicrophoneControl {...microphoneProps()} />)
  await waitForText(microphone, "Desk microphone")

  await waitFor(() => {
    expect(switchActiveDevice).toHaveBeenCalledWith("audioinput", "mic-1")
  })
  const camera = await render(<CameraControl {...cameraProps()} />)
  await waitForText(camera, "Front camera")
  await waitFor(() => {
    expect(switchActiveDevice).toHaveBeenCalledWith("videoinput", "camera-1")
  })
})

test("preserves audio and camera devices that are still available", async () => {
  getActiveDevice.mockImplementation(kind => {
    if (kind === "audioinput") return "mic-1"
    if (kind === "videoinput") return "camera-1"

    return undefined
  })
  const microphone = await render(<MicrophoneControl {...microphoneProps()} />)
  await waitForText(microphone, "Desk microphone")

  await waitFor(() => {
    expect(enumerateDevices).toHaveBeenCalledTimes(1)
  })
  const camera = await render(<CameraControl {...cameraProps()} />)
  await waitForText(camera, "Front camera")
  await waitFor(() => {
    expect(enumerateDevices).toHaveBeenCalledTimes(2)
  })
  expect(switchActiveDevice).not.toHaveBeenCalled()
})

test("switches selected input, output, and camera devices then closes each dropdown", async () => {
  getActiveDevice.mockImplementation(kind => {
    if (kind === "audioinput") return "mic-1"
    if (kind === "videoinput") return "camera-1"

    return undefined
  })
  const closeInput = jest.fn()
  const input = await render(
    <MicrophoneControl {...microphoneProps(closeInput)} />,
  )
  await fireEvent.press(await waitForText(input, "Desk microphone"))
  await waitFor(() => {
    expect(switchActiveDevice).toHaveBeenCalledWith("audioinput", "mic-1")
    expect(closeInput).toHaveBeenCalledTimes(1)
  })

  await input.unmount()
  const closeOutput = jest.fn()
  const output = await render(
    <MicrophoneControl {...microphoneProps(closeOutput)} />,
  )
  await fireEvent.press(await waitForText(output, "Desk speakers"))
  await waitFor(() => {
    expect(switchActiveDevice).toHaveBeenCalledWith("audiooutput", "speaker-1")
    expect(closeOutput).toHaveBeenCalledTimes(1)
  })

  await output.unmount()
  const closeCamera = jest.fn()
  const camera = await render(<CameraControl {...cameraProps(closeCamera)} />)
  await fireEvent.press(await waitForText(camera, "Front camera"))
  await waitFor(() => {
    expect(switchActiveDevice).toHaveBeenCalledWith("videoinput", "camera-1")
    expect(closeCamera).toHaveBeenCalledTimes(1)
  })
})

test("keeps the audio dropdown open and alerts when audio selection fails", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation()
  jest.spyOn(console, "error").mockImplementation()
  const closeDropdown = jest.fn()
  getActiveDevice.mockImplementation(kind =>
    kind === "audioinput" ? "mic-1" : undefined,
  )
  switchActiveDevice.mockRejectedValueOnce(new Error("audio failed"))
  const view = await render(
    <MicrophoneControl {...microphoneProps(closeDropdown)} />,
  )

  await fireEvent.press(await waitForText(view, "Desk microphone"))

  await waitFor(() => {
    expect(alert).toHaveBeenCalledWith("Error", "Failed to switch audio device")
  })
  expect(closeDropdown).not.toHaveBeenCalled()
  expect(view.getByText("Desk microphone")).toBeVisible()
})

test("keeps the camera dropdown open and alerts when camera selection fails", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation()
  jest.spyOn(console, "error").mockImplementation()
  const closeDropdown = jest.fn()
  getActiveDevice.mockImplementation(kind =>
    kind === "videoinput" ? "camera-1" : undefined,
  )
  switchActiveDevice.mockRejectedValueOnce(new Error("camera failed"))
  const view = await render(<CameraControl {...cameraProps(closeDropdown)} />)

  await fireEvent.press(await waitForText(view, "Front camera"))

  await waitFor(() => {
    expect(alert).toHaveBeenCalledWith("Error", "Failed to switch camera")
  })
  expect(closeDropdown).not.toHaveBeenCalled()
  expect(view.getByText("Front camera")).toBeVisible()
})

test("refreshes audio devices and removes the subscribed callback on unmount", async () => {
  const view = await render(<MicrophoneControl {...microphoneProps()} />)

  expect(await waitForText(view, "Desk microphone")).toBeVisible()
  await waitFor(() => {
    expect(mediaDevicesChangedCallback).toEqual(expect.any(Function))
  })
  const registeredCallback = mediaDevicesChangedCallback
  enumeratedDevices = [
    {
      deviceId: "usb-mic-1",
      groupId: "audio",
      kind: "audioinput",
      label: "USB microphone",
      toJSON: jest.fn(),
    },
  ]

  await act(async () => {
    await mediaDevicesChangedCallback?.()
  })

  expect(await waitForText(view, "USB microphone (Input)")).toBeVisible()
  expect(view.queryByText("Desk microphone")).not.toBeOnTheScreen()

  await view.unmount()

  expect(off).toHaveBeenCalledWith(
    RoomEvent.MediaDevicesChanged,
    registeredCallback,
  )
})
