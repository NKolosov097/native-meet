import type { EmitterSubscription } from "react-native"

import { router } from "expo-router"

import {
  act,
  fireEvent,
  renderRouter,
  screen,
  waitFor,
} from "expo-router/testing-library"

// A stand-in for livekit-client's Room: the only behavior the deep-link flow
// needs is that disconnect() eventually makes LiveKitRoom report a disconnect.
interface FakeRoom {
  // Whether the fake room still considers itself connected
  isConnected: boolean
  // Tears the fake connection down and reports it, like RoomEvent.Disconnected
  disconnect: jest.Mock<Promise<void>, []>
}

const mockRooms: FakeRoom[] = []

jest.mock("@/constants/env", () => ({
  env: { serverUrl: "wss://integration.livekit.cloud" },
  configError: null,
}))

jest.mock("@/services/livekitToken", () => ({
  fetchParticipantToken: jest.fn(),
}))

jest.mock("@/components/room/grid/GridPreview", () => ({
  GridPreview: () => null,
}))

// ActiveRoom itself is real — it owns the registration this test exercises —
// but its video/controls subtrees need native LiveKit hooks, so they are not.
jest.mock("@/components/room/VideoConference", () => ({
  VideoConference: () => null,
}))

jest.mock("@/components/room/ControlBar", () => ({
  ControlBar: () => {
    const React = jest.requireActual("react")
    const { Text } = jest.requireActual("react-native")

    return React.createElement(Text, null, "In call")
  },
}))

jest.mock("@livekit/react-native", () => {
  const React = jest.requireActual("react")
  const { View } = jest.requireActual("react-native")
  const RoomContext = React.createContext(null)

  return {
    LiveKitRoom: ({
      children,
      onDisconnected,
    }: {
      children?: React.ReactNode
      onDisconnected?: VoidFunction
    }) => {
      const onDisconnectedRef = React.useRef(onDisconnected)
      onDisconnectedRef.current = onDisconnected

      const room = React.useMemo(() => {
        const fake: FakeRoom = {
          isConnected: true,
          disconnect: jest.fn<Promise<void>, []>(async () => {
            // A real disconnect is several awaits deep before the room reports
            // it, so the event always lands after the router has navigated.
            await Promise.resolve()
            fake.isConnected = false
            onDisconnectedRef.current?.()
          }),
        }
        mockRooms.push(fake)

        return fake
      }, [])

      return React.createElement(
        RoomContext.Provider,
        { value: room },
        React.createElement(View, null, children),
      )
    },
    useRoomContext: () => React.useContext(RoomContext),
  }
})

const { fetchParticipantToken: mockFetchParticipantToken } = jest.requireMock(
  "@/services/livekitToken",
) as { fetchParticipantToken: jest.Mock<Promise<string>, [string, string]> }

// expo-router/testing-library installs its own expo-linking mock whose
// addEventListener never fires, and it does so when this file imports it — too
// late for a hoisted jest.mock of our own to survive. Spying on the mocked
// module instance the router and app/_layout.tsx both import works regardless
// of that ordering.
const mockLinking = jest.requireMock(
  "expo-linking",
) as typeof import("expo-linking")

let linkListeners: ((event: { url: string }) => void)[] = []
let app: ReturnType<typeof renderRouter>

// renderRouter's result is thenable: awaiting it flushes the first render (and
// publishes `screen`), while the variable keeps the router-specific helpers
// that awaiting the call directly would strip off.
const renderApp = async (): Promise<void> => {
  app = renderRouter(
    {
      _layout: require("./_layout"),
      index: require("./index"),
      "[slug]": require("./[slug]"),
    },
    { initialUrl: "/" },
  )

  await app
}

const joinRoom = async (slug: string) => {
  await fireEvent.changeText(screen.getByLabelText("Room code"), slug)
  await fireEvent.press(screen.getByLabelText("Join room"))

  await waitFor(() => {
    expect(screen.getByLabelText("Participant name")).toBeVisible()
  })
  await fireEvent.changeText(screen.getByLabelText("Participant name"), "Ada")
  await fireEvent.press(screen.getByLabelText("Join room"))

  await waitFor(() => {
    expect(screen.getByText("In call")).toBeVisible()
  })
}

// Delivers an incoming link the way the OS does: every "url" subscriber sees
// it, and expo-router's own subscription navigates to the linked route.
const openLink = async (url: string, pathname: string) => {
  await act(async () => {
    linkListeners.forEach(listener => listener({ url }))
    router.navigate(pathname)
  })
}

beforeEach(() => {
  mockRooms.length = 0
  linkListeners = []
  mockFetchParticipantToken.mockReset().mockResolvedValue("token-abc")
  jest
    .spyOn(mockLinking, "addEventListener")
    .mockImplementation((_type, listener) => {
      linkListeners.push(listener)

      return {
        remove: () => {
          linkListeners = linkListeners.filter(item => item !== listener)
        },
      } as EmitterSubscription
    })
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

test("stays on the room a mid-call link navigated to", async () => {
  await renderApp()
  await joinRoom("room-a")
  expect(mockRooms).toHaveLength(1)

  await openLink("nativemeet://room-b", "/room-b")

  // The old call is gone, and the screen the link opened is still the one in
  // front of the user: the disconnect must not drag them back out of room B.
  await waitFor(() => {
    expect(mockRooms[0].disconnect).toHaveBeenCalledTimes(1)
  })
  expect(app.getPathname()).toBe("/room-b")
  expect(screen.getByText("Room: room-b")).toBeVisible()
  expect(screen.queryByText("In call")).not.toBeOnTheScreen()
})

test("keeps the call alive when the link targets the room already open", async () => {
  await renderApp()
  await joinRoom("room-a")

  await openLink("nativemeet://room-a", "/room-a")

  expect(mockRooms[0].disconnect).not.toHaveBeenCalled()
  expect(app.getPathname()).toBe("/room-a")
  expect(screen.getByText("In call")).toBeVisible()
})

test("keeps the same call alive when a non-canonical link to the room already open arrives", async () => {
  await renderApp()
  await joinRoom("room-a")

  // "Room-A" canonicalizes to the same "room-a" that's already active, but
  // expo-router still updates this screen's params in place for it, since
  // "[slug]" matches either spelling — the room must not be torn down and
  // rejoined just because the link's casing didn't match the URL bar.
  await openLink("nativemeet://Room-A", "/Room-A")

  await waitFor(() => {
    expect(app.getPathname()).toBe("/room-a")
  })
  expect(mockRooms[0].disconnect).not.toHaveBeenCalled()
  expect(mockRooms[0].isConnected).toBe(true)
  // A second LiveKitRoom mount would have pushed a second fake room here —
  // this is what actually proves the call was never unmounted, not just that
  // no code path happened to call disconnect().
  expect(mockRooms).toHaveLength(1)
  expect(screen.getByText("In call")).toBeVisible()
  expect(screen.queryByLabelText("Participant name")).not.toBeOnTheScreen()
})

test("canonicalizes the slug a link points at before joining", async () => {
  await renderApp()

  await openLink("nativemeet://Room%20B", "/Room B")

  await waitFor(() => {
    expect(app.getPathname()).toBe("/room-b")
  })
  expect(screen.getByText("Room: room-b")).toBeVisible()
})
