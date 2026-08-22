jest.mock("expo-status-bar", () => ({ StatusBar: () => null }))

// The official RN safe-area-context Jest mock renders children synchronously
// with all-zero insets and shares its real context with expo-router's
// SafeAreaProviderCompat, instead of waiting on a native event that never fires.
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
)
