const mockFetch = jest.fn()
const mockSandboxTokenServer = jest.fn(() => ({ fetch: mockFetch }))
const mockGetDeviceIdentity = jest.fn()

jest.mock("livekit-client", () => ({
  TokenSource: {
    sandboxTokenServer: mockSandboxTokenServer,
  },
}))

jest.mock("@/constants/env", () => ({
  env: {
    serverUrl: "wss://critical.livekit.cloud",
    sandboxId: "sandbox-critical",
  },
  configError: null,
}))

jest.mock("@/services/deviceIdentity", () => ({
  getDeviceIdentity: mockGetDeviceIdentity,
}))

const { fetchParticipantToken } =
  require("./livekitToken") as typeof import("./livekitToken")

beforeEach(() => {
  mockFetch.mockReset()
  mockGetDeviceIdentity.mockReset()
})

test("requests and returns a token for the given room and stable identity", async () => {
  mockGetDeviceIdentity.mockResolvedValue("device-123")
  mockFetch.mockResolvedValue({ participantToken: "token-abc" })

  await expect(fetchParticipantToken("Ada", "critical-room")).resolves.toBe(
    "token-abc",
  )
  expect(mockSandboxTokenServer).toHaveBeenCalledWith("sandbox-critical")
  expect(mockFetch).toHaveBeenCalledWith(
    {
      roomName: "critical-room",
      participantName: "Ada",
      participantIdentity: "device-123",
    },
    true,
  )
})

test("rejects an empty token returned by the token server", async () => {
  jest.spyOn(console, "error").mockImplementation()
  mockGetDeviceIdentity.mockResolvedValue("device-123")
  mockFetch.mockResolvedValue({ participantToken: "" })

  await expect(fetchParticipantToken("Ada", "critical-room")).rejects.toThrow(
    "Token server returned an empty access token",
  )
})

test("preserves token server failures", async () => {
  jest.spyOn(console, "error").mockImplementation()
  const serverFailure = new Error("token server offline")
  mockGetDeviceIdentity.mockResolvedValue("device-123")
  mockFetch.mockRejectedValue(serverFailure)

  await expect(fetchParticipantToken("Ada", "critical-room")).rejects.toBe(
    serverFailure,
  )
})
