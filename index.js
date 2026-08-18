const { registerGlobals } = require("@livekit/react-native")

// registerGlobals() must run before expo-router boots the first route, so
// this uses require() instead of import: ES import statements are hoisted
// above this file's own statements, which would run expo-router/entry (and
// start rendering) before LiveKit's WebRTC globals exist.
registerGlobals()

require("expo-router/entry")
