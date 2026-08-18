import { generateRoomSlug, slugify } from "./roomSlug"

describe("slugify", () => {
  test("lowercases and trims the input", () => {
    expect(slugify("  Ada Lovelace  ")).toBe("ada-lovelace")
  })

  test("collapses invalid characters into a single dash", () => {
    expect(slugify("Team!!Sync??2024")).toBe("team-sync-2024")
  })

  test("strips leading and trailing dashes", () => {
    expect(slugify("--hello--")).toBe("hello")
  })

  test("returns an empty string for input with no valid characters", () => {
    expect(slugify("!!!")).toBe("")
  })
})

describe("generateRoomSlug", () => {
  test("produces a lowercase word-word-number slug", () => {
    const slug = generateRoomSlug()
    expect(slug).toMatch(/^[a-z]+-[a-z]+-\d{2}$/)
  })

  test("is deterministic for a fixed random source", () => {
    const randomSpy = jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)

    expect(generateRoomSlug()).toBe("quiet-tiger-00")

    randomSpy.mockRestore()
  })
})
