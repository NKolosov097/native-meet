import { fireEvent, renderRouter, screen } from "expo-router/testing-library"

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

jest.mock("expo-linking", () => ({
  addEventListener: () => ({ remove: () => {} }),
}))

test("navigates from the home screen to the room identified by its slug", async () => {
  renderRouter(
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
  renderRouter(
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
