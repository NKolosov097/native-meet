import { act, renderHook } from "@testing-library/react-native"

const mockDisconnect = jest.fn()
const mockRegister = jest.fn()

jest.mock("@livekit/react-native", () => ({
  useRoomContext: () => ({ disconnect: mockDisconnect }),
}))

jest.mock("@/services/activeRoomConnection", () => ({
  registerActiveRoomDisconnect: (...args: unknown[]) => mockRegister(...args),
}))

import { useRegisterActiveRoomDisconnect } from "./useRegisterActiveRoomDisconnect"

beforeEach(() => {
  mockRegister.mockReset()
  mockDisconnect.mockReset()
})

test("registers a disconnect handler bound to the current room on mount", async () => {
  await renderHook(() => useRegisterActiveRoomDisconnect())

  expect(mockRegister).toHaveBeenCalledTimes(1)
  const registeredHandler = mockRegister.mock.calls[0][0] as () => void
  registeredHandler()
  expect(mockDisconnect).toHaveBeenCalledTimes(1)
})

test("clears the handler on unmount", async () => {
  const { unmount } = await renderHook(() => useRegisterActiveRoomDisconnect())
  await act(() => unmount())

  expect(mockRegister).toHaveBeenLastCalledWith(null)
})
