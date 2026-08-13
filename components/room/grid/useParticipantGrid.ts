import { useCallback, useEffect, useMemo, useState } from "react"
import type { LayoutChangeEvent } from "react-native"

import {
  getGridDimensions,
  getPageSlice,
  getTileSize,
  getTotalPages,
} from "./gridLayout"

export interface UseParticipantGridResult<T> {
  // Attach to the grid container's `onLayout` to measure it.
  onContainerLayout: (event: LayoutChangeEvent) => void
  // The current page's slice of items.
  visibleItems: T[]
  // Computed width of one tile, in pixels.
  tileWidth: number
  // Computed height of one tile, in pixels.
  tileHeight: number
  // 0-indexed current page.
  currentPage: number
  // Total number of pages, always at least 1.
  totalPages: number
  // Advances to the next page, clamped to the last page.
  goToNextPage: VoidFunction
  // Goes back to the previous page, clamped to the first page.
  goToPreviousPage: VoidFunction
  // True unless already on the last page.
  canGoNext: boolean
  // True unless already on the first page.
  canGoPrevious: boolean
}

interface ContainerSize {
  // Measured width of the grid container, in pixels.
  width: number
  // Measured height of the grid container, in pixels.
  height: number
}

const INITIAL_CONTAINER_SIZE: ContainerSize = { width: 0, height: 0 }

export const useParticipantGrid = <T>(
  items: T[],
): UseParticipantGridResult<T> => {
  const [containerSize, setContainerSize] = useState<ContainerSize>(
    INITIAL_CONTAINER_SIZE,
  )
  const [currentPage, setCurrentPage] = useState(0)

  const onContainerLayout = useCallback((event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout
    setContainerSize({ width, height })
  }, [])

  const grid = useMemo(() => getGridDimensions(items.length), [items.length])
  const totalPages = useMemo(
    () => getTotalPages(items.length, grid.pageSize),
    [items.length, grid.pageSize],
  )

  useEffect(() => {
    setCurrentPage(page => Math.min(page, totalPages - 1))
  }, [totalPages])

  // Clamp currentPage synchronously during render to prevent stale page index
  // when totalPages shrinks. The effect above persists the clamped value to state
  // for navigation functions; this ensures pageSlice/visibleItems use the
  // current (post-clamp) page even before the effect runs.
  const clampedPage = Math.min(currentPage, totalPages - 1)

  const pageSlice = useMemo(
    () => getPageSlice(clampedPage, grid.pageSize),
    [clampedPage, grid.pageSize],
  )

  const visibleItems = useMemo(
    () => items.slice(pageSlice.start, pageSlice.end),
    [items, pageSlice],
  )

  const tileSize = useMemo(
    () =>
      getTileSize(
        containerSize.width,
        containerSize.height,
        grid.columns,
        grid.rows,
      ),
    [containerSize, grid],
  )

  const goToNextPage = useCallback((): void => {
    setCurrentPage(page => Math.min(page + 1, totalPages - 1))
  }, [totalPages])

  const goToPreviousPage = useCallback((): void => {
    setCurrentPage(page => Math.max(page - 1, 0))
  }, [])

  return {
    onContainerLayout,
    visibleItems,
    tileWidth: tileSize.width,
    tileHeight: tileSize.height,
    currentPage: clampedPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    canGoNext: clampedPage < totalPages - 1,
    canGoPrevious: clampedPage > 0,
  }
}
