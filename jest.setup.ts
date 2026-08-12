jest.mock("expo-status-bar", () => ({ StatusBar: () => null }))

jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native")

  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
  }
})
