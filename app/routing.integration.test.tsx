import {
  fireEvent,
  renderRouter,
  screen,
  waitFor,
} from "expo-router/testing-library"

import { saveRecentRoom } from "@/services/recentRooms"

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
)

jest.mock("@/constants/env", () => ({
  env: {},
  configError: null,
}))

jest.mock("@/services/livekitToken", () => ({
  fetchParticipantToken: jest.fn(),
}))

jest.mock("@/services/roomSlug", () => {
  const actual = jest.requireActual("@/services/roomSlug")

  return {
    ...actual,
    generateRoomSlug: jest.fn(() => "quiet-tiger-42"),
  }
})

jest.mock("@livekit/react-native", () => ({
  LiveKitRoom: () => null,
}))

test("navigates from the home screen to the room identified by its slug", async () => {
  await renderRouter(
    {
      index: require("./index"),
      "[slug]": require("./[slug]"),
    },
    { initialUrl: "/" },
  )

  await fireEvent.press(screen.getByLabelText("Create room"))

  expect(await screen.findByText(/quiet-tiger-42/)).toBeVisible()
  expect(screen.getByLabelText("Participant name")).toBeVisible()
})

test("joins an existing room by its typed code", async () => {
  await renderRouter(
    {
      index: require("./index"),
      "[slug]": require("./[slug]"),
    },
    { initialUrl: "/" },
  )

  await fireEvent.changeText(screen.getByLabelText("Room code"), "Team Sync")
  await fireEvent.press(screen.getByLabelText("Join room"))

  expect(await screen.findByText(/team-sync/)).toBeVisible()
})

test("refreshes the recent-rooms list when the home screen regains focus", async () => {
  await renderRouter(
    { index: require("./index"), "[slug]": require("./[slug]") },
    { initialUrl: "/" },
  )

  expect(screen.queryByText("Recent meetings")).not.toBeOnTheScreen()

  await saveRecentRoom("room-a", "Ada")

  await fireEvent.press(screen.getByLabelText("Create room"))
  await fireEvent.press(screen.getByLabelText("Back to room selection"))

  await waitFor(() => {
    expect(screen.getByText("Recent meetings")).toBeVisible()
  })
  expect(screen.getByLabelText(/^Rejoin room-a/)).toBeVisible()
})
