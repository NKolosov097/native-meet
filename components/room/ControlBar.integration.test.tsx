import { Alert } from "react-native"

import { act, fireEvent, render, waitFor } from "@testing-library/react-native"

import { ControlBar } from "./ControlBar"

const ControlBarFixture = ({ revision }: { revision: number }) => (
  <ControlBar key={revision} />
)

jest.mock("@livekit/react-native", () => ({
  useLocalParticipant: jest.fn(),
  useRoomContext: jest.fn(),
}))

const {
  useLocalParticipant: mockUseLocalParticipant,
  useRoomContext: mockUseRoomContext,
} = jest.requireMock("@livekit/react-native") as {
  useLocalParticipant: jest.Mock
  useRoomContext: jest.Mock
}

type Deferred = {
  promise: Promise<void>
  resolve: () => void
}

type PressTarget = {
  props: {
    onClick?: () => unknown
  }
}

const pressTwice = async (target: PressTarget): Promise<void> => {
  await act(async () => {
    if (!target.props.onClick) {
      throw new Error("Accessible control has no onClick handler")
    }

    target.props.onClick()
    target.props.onClick()
  })
}

const createDeferred = (): Deferred => {
  let resolve = (): void => undefined
  const promise = new Promise<void>(complete => {
    resolve = complete
  })

  return { promise, resolve }
}

const mockRoom = {
  disconnect: jest.fn<Promise<void>, []>(),
  getActiveDevice: jest.fn<string | undefined, [MediaDeviceKind]>(),
  switchActiveDevice: jest.fn<Promise<void>, [MediaDeviceKind, string]>(),
  on: jest.fn(),
  off: jest.fn(),
}

const mockLocalParticipant = {
  setCameraEnabled: jest.fn<Promise<void>, [boolean]>(),
  setMicrophoneEnabled: jest.fn<Promise<void>, [boolean]>(),
}

let mockCameraEnabled = false
let mockMicrophoneEnabled = true

beforeAll(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { enumerateDevices: jest.fn() },
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  mockCameraEnabled = false
  mockMicrophoneEnabled = true
  mockRoom.disconnect.mockResolvedValue(undefined)
  mockRoom.getActiveDevice.mockReturnValue(undefined)
  mockRoom.switchActiveDevice.mockResolvedValue(undefined)
  mockLocalParticipant.setCameraEnabled.mockResolvedValue(undefined)
  mockLocalParticipant.setMicrophoneEnabled.mockResolvedValue(undefined)
  mockUseRoomContext.mockReturnValue(mockRoom)
  mockUseLocalParticipant.mockImplementation(() => ({
    isCameraEnabled: mockCameraEnabled,
    isMicrophoneEnabled: mockMicrophoneEnabled,
    localParticipant: mockLocalParticipant,
  }))
  ;(navigator.mediaDevices.enumerateDevices as jest.Mock).mockResolvedValue([])
})

afterEach(() => {
  jest.restoreAllMocks()
})

test("passes the opposite microphone and camera states to LiveKit", async () => {
  const view = await render(<ControlBarFixture revision={1} />)

  await fireEvent.press(view.getByLabelText("Mute microphone"))
  await fireEvent.press(view.getByLabelText("Turn on camera"))

  await waitFor(() => {
    expect(mockLocalParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(
      false,
    )
    expect(mockLocalParticipant.setCameraEnabled).toHaveBeenCalledWith(true)
  })

  mockMicrophoneEnabled = false
  mockCameraEnabled = true
  mockUseLocalParticipant.mockReturnValue({
    isCameraEnabled: mockCameraEnabled,
    isMicrophoneEnabled: mockMicrophoneEnabled,
    localParticipant: mockLocalParticipant,
  })
  await view.rerender(<ControlBarFixture revision={2} />)
  expect(mockUseLocalParticipant).toHaveBeenCalledTimes(2)

  await fireEvent.press(view.getByLabelText("Unmute microphone"))
  await fireEvent.press(view.getByLabelText("Turn off camera"))

  await waitFor(() => {
    expect(mockLocalParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(
      true,
    )
    expect(mockLocalParticipant.setCameraEnabled).toHaveBeenLastCalledWith(
      false,
    )
  })
})

test("ignores concurrent microphone toggles until the current toggle finishes", async () => {
  const pendingToggle = createDeferred()
  mockLocalParticipant.setMicrophoneEnabled.mockReturnValue(
    pendingToggle.promise,
  )
  const view = await render(<ControlBar />)

  await pressTwice(view.getByLabelText("Mute microphone"))

  expect(mockLocalParticipant.setMicrophoneEnabled).toHaveBeenCalledTimes(1)

  await act(async () => {
    pendingToggle.resolve()
    await pendingToggle.promise
  })
})

test("ignores concurrent camera toggles until the current toggle finishes", async () => {
  const pendingToggle = createDeferred()
  mockLocalParticipant.setCameraEnabled.mockReturnValue(pendingToggle.promise)
  const view = await render(<ControlBar />)

  await pressTwice(view.getByLabelText("Turn on camera"))

  expect(mockLocalParticipant.setCameraEnabled).toHaveBeenCalledTimes(1)

  await act(async () => {
    pendingToggle.resolve()
    await pendingToggle.promise
  })
})

test("alerts when the microphone toggle fails", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation()
  const consoleError = jest.spyOn(console, "error").mockImplementation()
  mockLocalParticipant.setMicrophoneEnabled.mockRejectedValue(
    new Error("microphone failed"),
  )
  const view = await render(<ControlBar />)

  await fireEvent.press(view.getByLabelText("Mute microphone"))

  await waitFor(() => {
    expect(alert).toHaveBeenCalledWith("Error", "Failed to toggle microphone")
    expect(consoleError).toHaveBeenCalledWith(
      "Error toggling microphone: ",
      expect.any(Error),
    )
  })
})

test("alerts when the camera toggle fails", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation()
  const consoleError = jest.spyOn(console, "error").mockImplementation()
  mockLocalParticipant.setCameraEnabled.mockRejectedValue(
    new Error("camera failed"),
  )
  const view = await render(<ControlBar />)

  await fireEvent.press(view.getByLabelText("Turn on camera"))

  await waitFor(() => {
    expect(alert).toHaveBeenCalledWith("Error", "Failed to toggle camera")
    expect(consoleError).toHaveBeenCalledWith(
      "Error toggling camera: ",
      expect.any(Error),
    )
  })
})

test("disconnects the room", async () => {
  const view = await render(<ControlBar />)

  await fireEvent.press(view.getByLabelText("Disconnect from room"))

  await waitFor(() => {
    expect(mockRoom.disconnect).toHaveBeenCalledTimes(1)
  })
})

test("keeps controls available after a disconnect failure", async () => {
  const error = new Error("disconnect failed")
  const consoleError = jest.spyOn(console, "error").mockImplementation()
  mockRoom.disconnect.mockRejectedValue(error)
  const view = await render(<ControlBar />)

  await fireEvent.press(view.getByLabelText("Disconnect from room"))

  await waitFor(() => {
    expect(consoleError).toHaveBeenCalledWith("Error disconnecting: ", error)
  })
  expect(view.getByLabelText("Mute microphone")).toBeVisible()
  expect(view.getByLabelText("Turn on camera")).toBeVisible()
  expect(view.getByLabelText("Disconnect from room")).toBeVisible()
})

test("coordinates audio and camera device dropdowns", async () => {
  const view = await render(<ControlBar />)

  await fireEvent.press(view.getByLabelText("Select audio device"))

  expect(view.getByLabelText("Close device list")).toBeVisible()
  expect(view.getByText("No audio devices found")).toBeVisible()

  await fireEvent.press(view.getByLabelText("Select camera"))

  expect(view.queryByLabelText("Close device list")).not.toBeOnTheScreen()
  expect(view.getByLabelText("Close camera list")).toBeVisible()
  expect(view.getByText("No cameras found")).toBeVisible()

  await fireEvent.press(view.getByLabelText("Close camera list"))

  expect(view.queryByLabelText("Close camera list")).not.toBeOnTheScreen()
  expect(view.queryByText("No cameras found")).not.toBeOnTheScreen()
})
