jest.mock("expo-status-bar", () => ({ StatusBar: () => null }))

jest.mock("react-native-safe-area-context", () => {
  const React = jest.requireActual("react")
  const { View } = jest.requireActual("react-native")

  // Create the insets context that SafeAreaProviderCompat expects
  const SafeAreaInsetsContext = React.createContext(null as {
    top: number
    bottom: number
    left: number
    right: number
  } | null)

  // Create the SafeAreaProvider that provides the insets context
  const SafeAreaProvider = ({
    children,
    initialMetrics,
  }: {
    children: React.ReactNode
    initialMetrics?: {
      insets: { top: number; bottom: number; left: number; right: number }
    }
  }) => {
    const insets = initialMetrics?.insets ?? {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }
    return React.createElement(
      SafeAreaInsetsContext.Provider,
      {
        value: insets,
      },
      children,
    )
  }

  // useSafeAreaInsets hook that uses the context
  const useSafeAreaInsets = () => {
    const insets = React.useContext(SafeAreaInsetsContext)
    return insets ?? { top: 0, bottom: 0, left: 0, right: 0 }
  }

  return {
    SafeAreaView: View,
    SafeAreaProvider,
    useSafeAreaInsets,
    SafeAreaInsetsContext,
    initialWindowMetrics: null,
  }
})
