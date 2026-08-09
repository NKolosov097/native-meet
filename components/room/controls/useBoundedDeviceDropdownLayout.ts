import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  type LayoutChangeEvent,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native"

import { calculateBoundedDropdownLayout } from "./deviceDropdownLayout"

export const useBoundedDeviceDropdownLayout = (isDropdownVisible: boolean) => {
  const { width: viewportWidth } = useWindowDimensions()
  const containerRef = useRef<View>(null)
  const [containerX, setContainerX] = useState(0)

  const measureContainer = useCallback((): void => {
    containerRef.current?.measureInWindow(x => {
      setContainerX(x)
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
  }, [isDropdownVisible, measureContainer, viewportWidth])

  const dropdownPositionStyle = useMemo<ViewStyle>(
    () => calculateBoundedDropdownLayout(viewportWidth, containerX),
    [containerX, viewportWidth],
  )

  return {
    containerRef,
    onContainerLayout,
    dropdownPositionStyle,
  }
}
