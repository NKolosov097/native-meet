import { fireEvent, render, screen } from "@testing-library/react-native"

import type { RecentRoom } from "@/services/recentRooms"

import HomeScreen from "./index"

const mockPush = jest.fn()
let mockConfigError: string | null = null
let mockRecentRooms: RecentRoom[] = []

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/constants/env", () => ({
  get configError() {
    return mockConfigError
  },
}))

jest.mock("@/services/roomSlug", () => {
  const actual = jest.requireActual("@/services/roomSlug")

  return {
    ...actual,
    generateRoomSlug: jest.fn(() => "quiet-tiger-42"),
  }
})

jest.mock("@/services/recentRooms", () => ({
  getRecentRooms: () => Promise.resolve(mockRecentRooms),
}))

beforeEach(() => {
  mockConfigError = null
  mockRecentRooms = []
  mockPush.mockReset()
})

test("joins a room by typed code, slugified", async () => {
  await render(<HomeScreen />)

  await fireEvent.changeText(
    screen.getByLabelText("Room code"),
    "  Team Sync 2024  ",
  )
  await fireEvent.press(screen.getByLabelText("Join room"))

  expect(mockPush).toHaveBeenCalledWith("/team-sync-2024")
})

test("disables joining an empty or invalid code", async () => {
  await render(<HomeScreen />)

  expect(screen.getByLabelText("Join room")).toBeDisabled()

  await fireEvent.changeText(screen.getByLabelText("Room code"), "!!!")

  expect(screen.getByLabelText("Join room")).toBeDisabled()
  expect(mockPush).not.toHaveBeenCalled()
})

test("creates a new room with a generated slug", async () => {
  await render(<HomeScreen />)

  await fireEvent.press(screen.getByLabelText("Create room"))

  expect(mockPush).toHaveBeenCalledWith("/quiet-tiger-42")
})

test("disables both actions and shows a configuration error", async () => {
  mockConfigError = "Missing environment variables: EXPO_PUBLIC_LIVEKIT_URL"
  await render(<HomeScreen />)

  expect(screen.getByText(mockConfigError)).toBeVisible()
  expect(screen.getByLabelText("Room code")).toBeDisabled()
  expect(screen.getByLabelText("Join room")).toBeDisabled()
  expect(screen.getByLabelText("Create room")).toBeDisabled()
})

test("renders no recent-rooms section when there is no history", async () => {
  await render(<HomeScreen />)

  expect(screen.queryByText("Recent meetings")).not.toBeOnTheScreen()
})

test("lists recent rooms most-recently-joined first", async () => {
  mockRecentRooms = [
    { slug: "room-b", participantName: "Grace", joinedAt: 200 },
    { slug: "room-a", participantName: "Ada", joinedAt: 100 },
  ]
  await render(<HomeScreen />)

  const rows = await screen.findAllByLabelText(/^Rejoin /)
  expect(rows.map(row => row.props.accessibilityLabel)).toEqual([
    "Rejoin room-b",
    "Rejoin room-a",
  ])
  expect(screen.getByText("Grace")).toBeVisible()
  expect(screen.getByText("Ada")).toBeVisible()
})

test("rejoins a recent room by tapping its card", async () => {
  mockRecentRooms = [{ slug: "room-a", participantName: "Ada", joinedAt: 100 }]
  await render(<HomeScreen />)

  await fireEvent.press(await screen.findByLabelText("Rejoin room-a"))

  expect(mockPush).toHaveBeenCalledWith("/room-a")
})
