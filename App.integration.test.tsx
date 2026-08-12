import type { ReactNode } from "react"

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"

import type { RoomConnectOptions, RoomOptions } from "livekit-client"

import App from "./App"

type LiveKitRoomBoundaryProps = {
  children?: ReactNode
  connect?: boolean
  connectOptions?: RoomConnectOptions
  onDisconnected?: () => void
  onError?: (error?: Error) => void
  options?: RoomOptions
  serverUrl?: string
  token?: string
}

let mockLatestLiveKitProps: LiveKitRoomBoundaryProps | undefined

jest.mock("@/services/livekitToken", () => ({
  fetchParticipantToken: jest.fn(),
}))

jest.mock("@/constants/env", () => ({
  env: {
    serverUrl: "wss://integration.livekit.cloud",
    sandboxId: "integration-sandbox",
    roomName: "integration-room",
  },
  configError: null,
}))

jest.mock("@/components/room/ActiveRoom", () => ({
  ActiveRoom: () => {
    const React = jest.requireActual("react")
    const { Text } = jest.requireActual("react-native")

    return React.createElement(Text, null, "Active room")
  },
}))

jest.mock("@livekit/react-native", () => {
  const React = jest.requireActual("react")
  const { Button, View } = jest.requireActual("react-native")

  return {
    LiveKitRoom: (props: LiveKitRoomBoundaryProps) => {
      mockLatestLiveKitProps = props

      return React.createElement(
        View,
        null,
        props.children,
        React.createElement(Button, {
          title: "Disconnect room",
          accessibilityLabel: "Disconnect room",
          onPress: () => props.onDisconnected?.(),
        }),
        React.createElement(Button, {
          title: "Trigger room error",
          accessibilityLabel: "Trigger room error",
          onPress: () => props.onError?.(new Error("room unavailable")),
        }),
        React.createElement(Button, {
          title: "Trigger fallback room error",
          accessibilityLabel: "Trigger fallback room error",
          onPress: () => props.onError?.(),
        }),
      )
    },
  }
})

const { fetchParticipantToken: mockFetchParticipantToken } = jest.requireMock(
  "@/services/livekitToken",
) as { fetchParticipantToken: jest.Mock<Promise<string>, [string]> }

const joinRoom = async () => {
  await render(<App />)

  expect(screen.getByLabelText("Participant name")).toBeVisible()
  expect(screen.getByLabelText("Join room")).toBeVisible()

  await fireEvent.changeText(
    screen.getByLabelText("Participant name"),
    "  Ada  ",
  )
  await fireEvent.press(screen.getByLabelText("Join room"))

  await waitFor(() => {
    expect(screen.getByText("Active room")).toBeVisible()
  })
}

beforeEach(() => {
  mockFetchParticipantToken.mockReset()
  mockLatestLiveKitProps = undefined
})

afterEach(() => {
  jest.restoreAllMocks()
})

test("joins a room with a trimmed name and configured LiveKit connection", async () => {
  mockFetchParticipantToken.mockResolvedValue("token-abc")

  await joinRoom()

  expect(mockFetchParticipantToken).toHaveBeenCalledWith("Ada")
  expect(mockLatestLiveKitProps).toMatchObject({
    serverUrl: "wss://integration.livekit.cloud",
    token: "token-abc",
    connect: true,
    connectOptions: { maxRetries: 5 },
    options: {
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: { simulcast: false },
    },
  })
})

test("returns to joining without an error after disconnecting", async () => {
  mockFetchParticipantToken.mockResolvedValue("token-abc")

  await joinRoom()
  await fireEvent.press(screen.getByLabelText("Disconnect room"))

  await waitFor(() => {
    expect(screen.getByLabelText("Participant name")).toBeVisible()
  })
  expect(screen.queryByText("room unavailable")).not.toBeOnTheScreen()
})

test("shows a room connection error after LiveKit reports one", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation()
  mockFetchParticipantToken.mockResolvedValue("token-abc")

  await joinRoom()
  await fireEvent.press(screen.getByLabelText("Trigger room error"))

  expect(await screen.findByText("room unavailable")).toBeVisible()
  expect(consoleError).toHaveBeenCalledWith(
    "Connection error: ",
    expect.any(Error),
  )
  consoleError.mockRestore()
})

test("shows a fallback error when LiveKit reports no error details", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation()
  mockFetchParticipantToken.mockResolvedValue("token-abc")

  await joinRoom()
  await fireEvent.press(screen.getByLabelText("Trigger fallback room error"))

  expect(await screen.findByText("Failed to connect to the room")).toBeVisible()
  expect(consoleError).toHaveBeenCalledWith("Connection error: ", undefined)
  consoleError.mockRestore()
})

test("clears a connection error when a later room join succeeds", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation()
  mockFetchParticipantToken
    .mockResolvedValueOnce("token-abc")
    .mockResolvedValueOnce("token-def")

  await joinRoom()
  await fireEvent.press(screen.getByLabelText("Trigger room error"))
  expect(await screen.findByText("room unavailable")).toBeVisible()
  expect(consoleError).toHaveBeenCalledWith(
    "Connection error: ",
    expect.any(Error),
  )

  await fireEvent.changeText(
    screen.getByLabelText("Participant name"),
    "  Ada  ",
  )
  await fireEvent.press(screen.getByLabelText("Join room"))

  await waitFor(() => {
    expect(screen.getByText("Active room")).toBeVisible()
  })
  expect(screen.queryByText("room unavailable")).not.toBeOnTheScreen()
})
