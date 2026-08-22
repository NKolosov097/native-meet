import { roomSlugFromUrl } from "@/services/roomSlug"

// Expo Router runs every incoming link — the app's launch URL and every
// runtime deep link alike — through this hook before routing it. Collapsing
// each one to the one slug app/_layout.tsx derives from it keeps the router
// and the active-room registry from ever disagreeing about which room a
// link targets, and keeps an unroutable shape (e.g. an extra path segment)
// from resolving to "+not-found" — which would unmount the whole navigation
// stack, and any live call in it, outside the disconnect registry's reach.
export const redirectSystemPath = ({ path }: { path: string }): string => {
  const slug = roomSlugFromUrl(path)

  return slug ? `/${slug}` : "/"
}
