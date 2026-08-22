import { render, screen } from "@testing-library/react-native"

import RootLayout from "./_layout"

const mockAddEventListener = jest.fn()
const mockRemove = jest.fn()
const mockDisconnectActiveRoom = jest.fn()

jest.mock("expo-linking", () => ({
  addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
}))

jest.mock("expo-router", () => ({
  Stack: () => null,
}))

jest.mock("@/services/activeRoomConnection", () => ({
  disconnectActiveRoom: (...args: unknown[]) =>
    mockDisconnectActiveRoom(...args),
}))

jest.mock("@/components/room/grid/GridPreview", () => ({
  GridPreview: () => {
    const React = jest.requireActual("react")
    const { Text } = jest.requireActual("react-native")

    return React.createElement(Text, null, "Grid preview")
  },
}))

const originalGridPreviewFlag = process.env.EXPO_PUBLIC_GRID_PREVIEW

beforeEach(() => {
  mockAddEventListener.mockReset().mockReturnValue({ remove: mockRemove })
  mockRemove.mockReset()
  mockDisconnectActiveRoom.mockReset().mockResolvedValue(undefined)
  process.env.EXPO_PUBLIC_GRID_PREVIEW = originalGridPreviewFlag
})

afterAll(() => {
  process.env.EXPO_PUBLIC_GRID_PREVIEW = originalGridPreviewFlag
})

test("subscribes to incoming links and disconnects the active room", async () => {
  await render(<RootLayout />)

  expect(mockAddEventListener).toHaveBeenCalledWith("url", expect.any(Function))

  const handler = mockAddEventListener.mock.calls[0][1] as VoidFunction
  handler()

  expect(mockDisconnectActiveRoom).toHaveBeenCalledTimes(1)
})

test("unsubscribes on unmount", async () => {
  const view = await render(<RootLayout />)
  await view.unmount()

  expect(mockRemove).toHaveBeenCalledTimes(1)
})

test("renders the grid preview when the env flag is set", async () => {
  process.env.EXPO_PUBLIC_GRID_PREVIEW = "1"

  await render(<RootLayout />)

  expect(screen.getByText("Grid preview")).toBeVisible()
})
