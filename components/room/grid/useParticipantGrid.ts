import { useCallback, useEffect, useMemo, useState } from "react"
import type { LayoutChangeEvent } from "react-native"

import {
  getGridDimensions,
  getPageSlice,
  getTileSize,
  getTotalPages,
} from "./gridLayout"

export interface UseParticipantGridResult<T> {
  onContainerLayout: (event: LayoutChangeEvent) => void
  visibleItems: T[]
  tileWidth: number
  tileHeight: number
  currentPage: number
  totalPages: number
  goToNextPage: () => void
  goToPreviousPage: () => void
  canGoNext: boolean
  canGoPrevious: boolean
}

export const useParticipantGrid = <T,>(
  items: T[],
): UseParticipantGridResult<T> => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
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

  const pageSlice = useMemo(
    () => getPageSlice(currentPage, grid.pageSize),
    [currentPage, grid.pageSize],
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
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    canGoNext: currentPage < totalPages - 1,
    canGoPrevious: currentPage > 0,
  }
}
