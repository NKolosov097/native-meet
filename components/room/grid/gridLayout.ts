export const GRID_GAP = 10
export const GRID_PADDING = 10

export interface GridDimensions {
  columns: number
  rows: number
  pageSize: number
}

export const getGridDimensions = (
  participantCount: number,
): GridDimensions => {
  if (participantCount <= 1) {
    return { columns: 1, rows: 1, pageSize: 1 }
  }

  if (participantCount === 2) {
    return { columns: 1, rows: 2, pageSize: 2 }
  }

  if (participantCount <= 4) {
    return { columns: 2, rows: 2, pageSize: 4 }
  }

  if (participantCount <= 6) {
    return { columns: 2, rows: 3, pageSize: 6 }
  }

  return { columns: 2, rows: 4, pageSize: 8 }
}

export const getTotalPages = (
  participantCount: number,
  pageSize: number,
): number => Math.max(1, Math.ceil(participantCount / pageSize))

export interface PageSlice {
  start: number
  end: number
}

export const getPageSlice = (
  currentPage: number,
  pageSize: number,
): PageSlice => ({
  start: currentPage * pageSize,
  end: currentPage * pageSize + pageSize,
})

export interface TileSize {
  width: number
  height: number
}

export const getTileSize = (
  containerWidth: number,
  containerHeight: number,
  columns: number,
  rows: number,
): TileSize => {
  const availableWidth = Math.max(
    0,
    containerWidth - GRID_PADDING * 2 - GRID_GAP * (columns - 1),
  )
  const availableHeight = Math.max(
    0,
    containerHeight - GRID_PADDING * 2 - GRID_GAP * (rows - 1),
  )

  return {
    width: columns > 0 ? availableWidth / columns : 0,
    height: rows > 0 ? availableHeight / rows : 0,
  }
}
