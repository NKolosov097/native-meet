import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"

import { JoinScreen } from "./JoinScreen"

let mockConfigError: string | null = null

jest.mock("@/services/livekitToken", () => ({
  fetchParticipantToken: jest.fn(),
}))

jest.mock("@/constants/env", () => ({
  get configError() {
    return mockConfigError
  },
}))

const { fetchParticipantToken: mockFetchParticipantToken } = jest.requireMock(
  "@/services/livekitToken",
) as { fetchParticipantToken: jest.Mock }

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

beforeEach(() => {
  mockConfigError = null
  mockFetchParticipantToken.mockReset()
  jest.spyOn(console, "error").mockImplementation()
})

afterEach(() => {
  jest.restoreAllMocks()
})

test("rejects an empty name without requesting a token", async () => {
  await render(<JoinScreen onJoined={jest.fn()} />)

  await fireEvent.press(screen.getByLabelText("Join room"))

  expect(screen.getByText("Please enter your name")).toBeVisible()
  expect(mockFetchParticipantToken).not.toHaveBeenCalled()
})

test("trims the participant name and reports a successful join", async () => {
  const onJoined = jest.fn()
  mockFetchParticipantToken.mockResolvedValue("token-abc")
  await render(<JoinScreen onJoined={onJoined} />)

  await fireEvent.changeText(
    screen.getByLabelText("Participant name"),
    "  Ada  ",
  )
  await fireEvent.press(screen.getByLabelText("Join room"))

  expect(mockFetchParticipantToken).toHaveBeenCalledWith("Ada")
  expect(onJoined).toHaveBeenCalledWith("token-abc")
})

test("disables controls while a join request is pending", async () => {
  const request = deferred<string>()
  mockFetchParticipantToken.mockReturnValue(request.promise)
  await render(<JoinScreen onJoined={jest.fn()} />)
  await fireEvent.changeText(screen.getByLabelText("Participant name"), "Ada")

  const pressPromise = fireEvent.press(screen.getByLabelText("Join room"))

  await waitFor(() => {
    expect(screen.getByLabelText("Join room")).toBeDisabled()
    expect(screen.getByLabelText("Participant name")).toBeDisabled()
  })

  request.resolve("token-abc")
  await pressPromise
  await waitFor(() => expect(screen.getByLabelText("Join room")).toBeEnabled())
})

test("ignores a duplicate submit while the first request is pending", async () => {
  const request = deferred<string>()
  mockFetchParticipantToken.mockReturnValue(request.promise)
  await render(<JoinScreen onJoined={jest.fn()} />)
  const nameInput = screen.getByLabelText("Participant name")
  await fireEvent.changeText(nameInput, "Ada")
  const submit = nameInput.props.onSubmitEditing as () => Promise<void>

  await act(async () => {
    const firstSubmit = submit()
    const duplicateSubmit = submit()

    expect(mockFetchParticipantToken).toHaveBeenCalledTimes(1)
    request.resolve("token-abc")
    await Promise.all([firstSubmit, duplicateSubmit])
  })
})

test("shows the token service error from the current attempt", async () => {
  mockFetchParticipantToken.mockRejectedValue(new Error("token denied"))
  await render(<JoinScreen error="connection lost" onJoined={jest.fn()} />)

  expect(screen.getByText("connection lost")).toBeVisible()
  await fireEvent.changeText(screen.getByLabelText("Participant name"), "Ada")
  await fireEvent.press(screen.getByLabelText("Join room"))

  expect(await screen.findByText("token denied")).toBeVisible()
  expect(screen.queryByText("connection lost")).not.toBeOnTheScreen()
})

test("shows a generic error for a non-Error rejection", async () => {
  mockFetchParticipantToken.mockRejectedValue("token denied")
  await render(<JoinScreen onJoined={jest.fn()} />)

  await fireEvent.changeText(screen.getByLabelText("Participant name"), "Ada")
  await fireEvent.press(screen.getByLabelText("Join room"))

  expect(await screen.findByText("Failed to get an access token")).toBeVisible()
})

test("disables joining and shows an environment configuration error", async () => {
  mockConfigError = "Missing room configuration"
  await render(<JoinScreen onJoined={jest.fn()} />)

  expect(screen.getByText("Missing room configuration")).toBeVisible()
  expect(screen.getByLabelText("Join room")).toBeDisabled()
  expect(screen.getByLabelText("Participant name")).toBeDisabled()
  expect(mockFetchParticipantToken).not.toHaveBeenCalled()
})
