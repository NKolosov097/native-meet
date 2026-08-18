const ROOM_SLUG_ADJECTIVES = [
  "quiet",
  "brave",
  "amber",
  "swift",
  "calm",
  "bold",
  "lucky",
  "gentle",
]

const ROOM_SLUG_NOUNS = [
  "tiger",
  "river",
  "comet",
  "maple",
  "harbor",
  "falcon",
  "meadow",
  "otter",
]

// Collapses anything that isn't a lowercase letter or digit into a single
// "-" and trims leading/trailing dashes, so both typed codes and generated
// slugs always match the format LiveKit room names accept.
export const slugify = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const generateRoomSlug = (): string => {
  const adjective =
    ROOM_SLUG_ADJECTIVES[
      Math.floor(Math.random() * ROOM_SLUG_ADJECTIVES.length)
    ]
  const noun =
    ROOM_SLUG_NOUNS[Math.floor(Math.random() * ROOM_SLUG_NOUNS.length)]
  const suffix = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0")

  return `${adjective}-${noun}-${suffix}`
}
