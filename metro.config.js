const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// expo-router's file-based routing treats every module under app/ as a route
// candidate via its require.context, with no built-in exclusion for test
// files (see node_modules/expo-router/_ctx-shared.js). Left unblocked, Metro
// bundles *.test.tsx straight into the native app -- including
// expo-router/testing-library, which imports Node's "path" and crashes the
// bundle. Jest resolves test files through its own module system, so
// blocking them from Metro here has no effect on `pnpm test`.
config.resolver.blockList = [
  ...config.resolver.blockList,
  /\.(test|spec)\.[jt]sx?$/,
]

module.exports = config
