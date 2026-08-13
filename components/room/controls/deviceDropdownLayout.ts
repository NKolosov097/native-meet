export const DEVICE_DROPDOWN_MAX_WIDTH = 300
export const DEVICE_DROPDOWN_VIEWPORT_MARGIN = 16

interface BoundedDropdownLayout {
  // Dropdown width, in pixels
  width: number
  // Dropdown's horizontal offset from its anchor, in pixels
  left: number
}

export const calculateBoundedDropdownLayout = (
  viewportWidth: number,
  anchorX: number,
): BoundedDropdownLayout => {
  const safeViewportWidth = Math.max(0, viewportWidth)
  const viewportMargin = Math.min(
    DEVICE_DROPDOWN_VIEWPORT_MARGIN,
    safeViewportWidth / 2,
  )
  const width = Math.min(
    DEVICE_DROPDOWN_MAX_WIDTH,
    safeViewportWidth - viewportMargin * 2,
  )
  const minimumLeft = viewportMargin - anchorX
  const maximumLeft = safeViewportWidth - viewportMargin - width - anchorX

  return {
    width,
    left: Math.min(Math.max(0, minimumLeft), maximumLeft),
  }
}
