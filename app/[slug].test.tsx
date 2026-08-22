import type { PropsWithChildren } from "react"

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"

import type { LiveKitRoomProps } from "@livekit/react-native"

import RoomScreen from "./[slug]"

type LiveKitRoomBoundaryProps = PropsWithChildren<LiveKitRoomProps>

let mockLatestLiveKitProps: LiveKitRoomBoundaryProps | undefined
const mockBack = jest.fn()
const mockReplace = jest.fn()
let mockCanGoBack = true

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ slug: "quiet-tiger-42" }),
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => mockCanGoBack,
  }),
}))

jest.mock("@/services/livekitToken", () => ({
  fetchParticipantToken: jest.fn(),
}))

jest.mock("@/constants/env", () => ({
  env: {
    serverUrl: "wss://integration.livekit.cloud",
    sandboxId: "integration-sandbox",
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
      )
    },
  }
})

const { fetchParticipantToken: mockFetchParticipantToken } = jest.requireMock(
  "@/services/livekitToken",
) as { fetchParticipantToken: jest.Mock<Promise<string>, [string, string]> }

const joinRoom = async () => {
  await render(<RoomScreen />)

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
  mockBack.mockReset()
  mockReplace.mockReset()
  mockCanGoBack = true
})

afterEach(() => {
  jest.restoreAllMocks()
})

test("shows the slug from the route and joins with it", async () => {
  await render(<RoomScreen />)

  expect(screen.getByText(/quiet-tiger-42/)).toBeVisible()
})

test("joins the room identified by the route slug", async () => {
  mockFetchParticipantToken.mockResolvedValue("token-abc")

  await joinRoom()

  expect(mockFetchParticipantToken).toHaveBeenCalledWith(
    "Ada",
    "quiet-tiger-42",
  )
  expect(mockLatestLiveKitProps).toMatchObject({
    serverUrl: "wss://integration.livekit.cloud",
    token: "token-abc",
    connect: true,
  })
})

test("navigates back after disconnecting when history allows it", async () => {
  mockFetchParticipantToken.mockResolvedValue("token-abc")
  mockCanGoBack = true

  await joinRoom()
  await fireEvent.press(screen.getByLabelText("Disconnect room"))

  await waitFor(() => {
    expect(mockBack).toHaveBeenCalledTimes(1)
  })
  expect(mockReplace).not.toHaveBeenCalled()
})

test("replaces with the home screen after disconnecting with no history", async () => {
  mockFetchParticipantToken.mockResolvedValue("token-abc")
  mockCanGoBack = false

  await joinRoom()
  await fireEvent.press(screen.getByLabelText("Disconnect room"))

  await waitFor(() => {
    expect(mockReplace).toHaveBeenCalledWith("/")
  })
  expect(mockBack).not.toHaveBeenCalled()
})

test("shows a room connection error and returns to the join form", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation()
  mockFetchParticipantToken.mockResolvedValue("token-abc")

  await joinRoom()
  await fireEvent.press(screen.getByLabelText("Trigger room error"))

  await waitFor(() => {
    expect(screen.getByLabelText("Participant name")).toBeVisible()
  })
  expect(await screen.findByText("room unavailable")).toBeVisible()
  expect(consoleError).toHaveBeenCalledWith(
    "Connection error: ",
    expect.any(Error),
  )
})
