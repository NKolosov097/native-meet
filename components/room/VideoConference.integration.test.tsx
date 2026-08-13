import { fireEvent, render } from "@testing-library/react-native"

import { ParticipantKind, Track } from "livekit-client"

import { VideoConference } from "./VideoConference"

jest.mock("@livekit/react-native", () => ({
  useTracks: jest.fn(),
  isTrackReference: jest.fn(() => false),
  useTrackMutedIndicator: jest.fn(() => ({ isMuted: false })),
  VideoTrack: () => null,
}))

const { useTracks: mockUseTracks } = jest.requireMock(
  "@livekit/react-native",
) as { useTracks: jest.Mock }

const createTracks = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    participant: {
      identity: `participant-${index}`,
      name: `Participant ${index}`,
      kind: ParticipantKind.STANDARD,
      isLocal: index === 0,
    },
    source: Track.Source.Camera,
    publication: undefined,
  }))

beforeEach(() => {
  jest.clearAllMocks()
})

test("shows a message when the room is empty", async () => {
  mockUseTracks.mockReturnValue([])

  const view = await render(<VideoConference />)

  expect(view.getByText("No participants in the room")).toBeVisible()
})

test("renders every participant without pagination up to eight", async () => {
  mockUseTracks.mockReturnValue(createTracks(8))

  const view = await render(<VideoConference />)

  expect(view.getAllByText(/^Participant \d/)).toHaveLength(8)
  expect(view.queryByLabelText("Next page")).not.toBeOnTheScreen()
})

test("paginates a nine-person room across two pages", async () => {
  mockUseTracks.mockReturnValue(createTracks(9))

  const view = await render(<VideoConference />)

  expect(view.getAllByText(/^Participant \d/)).toHaveLength(8)
  expect(view.getByText("1 / 2")).toBeVisible()
  expect(view.getByLabelText("Previous page")).toBeDisabled()
  expect(view.getByLabelText("Next page")).not.toBeDisabled()

  await fireEvent.press(view.getByLabelText("Next page"))

  expect(view.getAllByText(/^Participant \d/)).toHaveLength(1)
  expect(view.getByText("2 / 2")).toBeVisible()
  expect(view.getByLabelText("Next page")).toBeDisabled()
  expect(view.getByLabelText("Previous page")).not.toBeDisabled()

  await fireEvent.press(view.getByLabelText("Previous page"))

  expect(view.getByText("1 / 2")).toBeVisible()
})
