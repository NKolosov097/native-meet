import { roomSlugFromUrl } from "@/services/roomSlug"

interface RedirectSystemPathParams {
  // The raw incoming path from Expo Router (launch URL or runtime deep link)
  path: string
}

// Collapses every incoming link to one canonical room slug so the router
// and active-room registry never disagree about which room it targets.
export const redirectSystemPath = ({
  path,
}: RedirectSystemPathParams): string => {
  const slug = roomSlugFromUrl(path)

  return slug ? `/${slug}` : "/"
}
