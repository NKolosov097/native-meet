import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons"
import { BORDER_RADIUSES } from "@/constants/borderRadiuses"
import {
  BACKGROUND_COLORS,
  BORDER_COLORS,
  TEXT_COLORS,
} from "@/constants/colors"

import { GRID_PADDING } from "./gridLayout"

interface PaginationBarProps {
  // Zero-indexed current page number
  currentPage: number
  // Total number of pages
  totalPages: number
  // Callback function to navigate to the previous page
  onPrevious: VoidFunction
  // Callback function to navigate to the next page
  onNext: VoidFunction
}

export const PaginationBar = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: PaginationBarProps) => {
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage === totalPages - 1

  return (
    <View
      testID="pagination-bar"
      style={styles.overlay}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonLeft,
            isFirstPage ? styles.buttonDisabled : undefined,
          ]}
          onPress={onPrevious}
          disabled={isFirstPage}
          accessibilityLabel="Previous page"
        >
          <ChevronLeftIcon color={BACKGROUND_COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <Text
            style={styles.pageText}
          >{`${currentPage + 1} / ${totalPages}`}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonRight,
            isLastPage ? styles.buttonDisabled : undefined,
          ]}
          onPress={onNext}
          disabled={isLastPage}
          accessibilityLabel="Next page"
        >
          <ChevronRightIcon color={BACKGROUND_COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: GRID_PADDING,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BACKGROUND_COLORS.secondary,
    borderRadius: BORDER_RADIUSES.medium,
    overflow: "hidden",
  },
  button: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLeft: {
    borderTopLeftRadius: BORDER_RADIUSES.medium,
    borderBottomLeftRadius: BORDER_RADIUSES.medium,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLORS.divider,
  },
  buttonRight: {
    borderTopRightRadius: BORDER_RADIUSES.medium,
    borderBottomRightRadius: BORDER_RADIUSES.medium,
    borderLeftWidth: 1,
    borderLeftColor: BORDER_COLORS.divider,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  textContainer: {
    height: 36,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  pageText: {
    color: TEXT_COLORS.light,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "center",
  },
})
