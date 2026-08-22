jest.mock("expo-status-bar", () => ({ StatusBar: () => null }))

// react-native-safe-area-context ships an official Jest mock that reuses the
// package's real SafeAreaInsetsContext/SafeAreaFrameContext (so consumers
// like expo-router's SafeAreaProviderCompat, which reads the context via
// React's `use()`, get a context object that matches the one the mocked
// SafeAreaProvider writes to) while rendering children synchronously with
// default (all-zero) insets instead of waiting on a native `onInsetsChange`
// event that never fires in tests.
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
)
