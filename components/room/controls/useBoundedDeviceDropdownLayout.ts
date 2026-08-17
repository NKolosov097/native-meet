import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  type LayoutChangeEvent,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native"

import {
  calculateBoundedDropdownLayout,
  calculateOverlayCoverStyle,
} from "./deviceDropdownLayout"

export const useBoundedDeviceDropdownLayout = (isDropdownVisible: boolean) => {
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions()
  const containerRef = useRef<View>(null)
  const [containerX, setContainerX] = useState(0)
  const [containerY, setContainerY] = useState(0)

  const measureContainer = useCallback((): void => {
    containerRef.current?.measureInWindow((x, y) => {
      setContainerX(x)
      setContainerY(y)
    })
  }, [])

  const onContainerLayout = useCallback(
    (_event: LayoutChangeEvent): void => {
      measureContainer()
    },
    [measureContainer],
  )

  useEffect(() => {
    if (isDropdownVisible) {
      measureContainer()
    }
  }, [isDropdownVisible, measureContainer, viewportWidth, viewportHeight])

  const dropdownPositionStyle = useMemo<ViewStyle>(
    () => calculateBoundedDropdownLayout(viewportWidth, containerX),
    [containerX, viewportWidth],
  )

  const overlayStyle = useMemo<ViewStyle>(
    () =>
      calculateOverlayCoverStyle(
        viewportWidth,
        viewportHeight,
        containerX,
        containerY,
      ),
    [viewportWidth, viewportHeight, containerX, containerY],
  )

  return {
    containerRef,
    onContainerLayout,
    dropdownPositionStyle,
    overlayStyle,
  }
}
