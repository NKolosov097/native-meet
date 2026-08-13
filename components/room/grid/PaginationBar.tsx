import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons"
import { BORDER_RADIUSES } from "@/constants/borderRadiuses"
import { BACKGROUND_COLORS, TEXT_COLORS } from "@/constants/colors"

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
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isFirstPage && styles.buttonDisabled]}
        onPress={onPrevious}
        disabled={isFirstPage}
        accessibilityLabel="Previous page"
      >
        <ChevronLeftIcon
          color={isFirstPage ? TEXT_COLORS.placeholder : TEXT_COLORS.light}
        />
      </TouchableOpacity>

      <Text style={styles.pageText}>{`${currentPage + 1} / ${totalPages}`}</Text>

      <TouchableOpacity
        style={[styles.button, isLastPage && styles.buttonDisabled]}
        onPress={onNext}
        disabled={isLastPage}
        accessibilityLabel="Next page"
      >
        <ChevronRightIcon
          color={isLastPage ? TEXT_COLORS.placeholder : TEXT_COLORS.light}
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: BACKGROUND_COLORS.secondary,
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUSES.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  pageText: {
    color: TEXT_COLORS.light,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 48,
    textAlign: "center",
  },
})
