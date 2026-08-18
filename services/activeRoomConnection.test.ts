import {
  disconnectActiveRoom,
  registerActiveRoomDisconnect,
} from "./activeRoomConnection"

afterEach(() => {
  registerActiveRoomDisconnect(null)
})

test("does nothing when no room is registered", async () => {
  await expect(disconnectActiveRoom()).resolves.toBeUndefined()
})

test("calls the registered handler", async () => {
  const handler = jest.fn().mockResolvedValue(undefined)
  registerActiveRoomDisconnect(handler)

  await disconnectActiveRoom()

  expect(handler).toHaveBeenCalledTimes(1)
})

test("stops calling a handler after it is cleared", async () => {
  const handler = jest.fn().mockResolvedValue(undefined)
  registerActiveRoomDisconnect(handler)
  registerActiveRoomDisconnect(null)

  await disconnectActiveRoom()

  expect(handler).not.toHaveBeenCalled()
})
